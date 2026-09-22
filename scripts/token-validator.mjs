import fs from "node:fs";
import path from "node:path";

const ALIAS_RE = /^\{([^{}]+)\}$/;
const RESERVED = new Set(["$value", "$type", "$description", "$extensions", "$deprecated", "$extends"]);
const SUPPORTED_TYPES = new Set([
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "duration",
  "cubicBezier",
  "number",
  "transition",
  "shadow",
  "typography",
]);

export function validateTokens({ root, errors }) {
  const tokenRoot = path.join(root, "tokens");
  const manifestPath = path.join(tokenRoot, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    errors.push("tokens/manifest.json: missing token manifest");
    return { tokenCount: 0, themeCount: 0 };
  }

  const manifest = readJson(manifestPath, root, errors);
  if (!manifest) return { tokenCount: 0, themeCount: 0 };

  if (manifest.format?.name !== "DTCG" || manifest.format?.version !== "2025.10") {
    errors.push("tokens/manifest.json: v0.2 must target DTCG 2025.10");
  }

  const baseRegistry = new Map();
  for (const relative of manifest.sources ?? []) {
    const file = path.join(tokenRoot, relative);
    const doc = readJson(file, root, errors);
    if (!doc) continue;
    collectTokens(doc, file, root, errors, baseRegistry);
  }

  validateRegistry(baseRegistry, root, errors);
  validateScales(manifest, baseRegistry, root, errors);

  const themeEntries = Object.entries(manifest.themes ?? {});
  let canonicalThemePaths = null;

  for (const [themeName, relative] of themeEntries) {
    const file = path.join(tokenRoot, relative);
    const doc = readJson(file, root, errors);
    if (!doc) continue;

    const themeRegistry = new Map();
    collectTokens(doc, file, root, errors, themeRegistry);

    const semanticColorPaths = [...themeRegistry.keys()]
      .filter((tokenPath) => tokenPath.startsWith("semantic.color."))
      .sort();

    if (canonicalThemePaths === null) {
      canonicalThemePaths = semanticColorPaths;
    } else {
      compareThemePaths(themeName, canonicalThemePaths, semanticColorPaths, file, root, errors);
    }

    const combined = new Map(baseRegistry);
    for (const [tokenPath, token] of themeRegistry) {
      if (combined.has(tokenPath)) {
        errors.push(rel(root, file) + ': theme token duplicates base token "' + tokenPath + '"');
      } else {
        combined.set(tokenPath, token);
      }
    }

    validateRegistry(themeRegistry, root, errors, combined);
    validateContrast(themeName, manifest, combined, file, root, errors);
  }

  if (themeEntries.length === 0) {
    errors.push("tokens/manifest.json: at least one theme is required");
  }

  return {
    tokenCount: baseRegistry.size + (canonicalThemePaths?.length ?? 0),
    themeCount: themeEntries.length,
  };
}

function readJson(file, root, errors) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(rel(root, file) + ": invalid JSON (" + error.message + ")");
    return null;
  }
}

function rel(root, file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function validName(name) {
  return name === "$root" || (
    !name.startsWith("$") &&
    !name.includes(".") &&
    !name.includes("{") &&
    !name.includes("}")
  );
}

function collectTokens(node, file, root, errors, registry, parts = [], inheritedType = null) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return;

  if ("$value" in node) {
    const tokenPath = parts.join(".");
    if (!tokenPath) {
      errors.push(rel(root, file) + ": token cannot exist at document root without a name");
      return;
    }

    if (registry.has(tokenPath)) {
      errors.push(rel(root, file) + ': duplicate token path "' + tokenPath + '"');
      return;
    }

    const explicitType = node.$type ?? null;
    if (explicitType && !SUPPORTED_TYPES.has(explicitType)) {
      errors.push(rel(root, file) + ': token "' + tokenPath + '" uses unsupported $type "' + explicitType + '"');
    }

    registry.set(tokenPath, {
      path: tokenPath,
      value: node.$value,
      type: explicitType ?? inheritedType,
      explicitType,
      file,
    });
    return;
  }

  const groupType = node.$type ?? inheritedType;
  if (node.$type && !SUPPORTED_TYPES.has(node.$type)) {
    errors.push(rel(root, file) + ': group "' + (parts.join(".") || "<root>") + '" uses unsupported $type "' + node.$type + '"');
  }

  for (const [key, child] of Object.entries(node)) {
    if (key === "$root") {
      collectTokens(child, file, root, errors, registry, [...parts, key], groupType);
      continue;
    }

    if (key.startsWith("$")) {
      if (!RESERVED.has(key)) {
        errors.push(rel(root, file) + ': unsupported reserved property "' + key + '" at "' + (parts.join(".") || "<root>") + '"');
      }
      continue;
    }

    if (!validName(key)) {
      errors.push(rel(root, file) + ': invalid DTCG token/group name "' + key + '"');
    }

    collectTokens(child, file, root, errors, registry, [...parts, key], groupType);
  }
}

function validateRegistry(registryToValidate, root, errors, lookupRegistry = registryToValidate) {
  for (const token of registryToValidate.values()) {
    const references = findAliases(token.value);

    for (const ref of references) {
      if (!lookupRegistry.has(ref)) {
        errors.push(rel(root, token.file) + ': token "' + token.path + '" references missing token "' + ref + '"');
      }
    }

    const cycle = findCycle(token.path, lookupRegistry);
    if (cycle) {
      errors.push(rel(root, token.file) + ': circular alias detected: ' + cycle.join(" -> "));
      continue;
    }

    let type = token.type;
    const fullAlias = aliasPath(token.value);

    if (!type && fullAlias) {
      type = inferAliasType(fullAlias, lookupRegistry, new Set());
    }

    if (!type) {
      errors.push(rel(root, token.file) + ': token "' + token.path + '" has no $type and cannot inherit/infer one');
      continue;
    }

    if (!SUPPORTED_TYPES.has(type)) continue;

    if (fullAlias && token.explicitType) {
      const targetType = inferAliasType(fullAlias, lookupRegistry, new Set());
      if (targetType && targetType !== token.explicitType) {
        errors.push(rel(root, token.file) + ': token "' + token.path + '" declares type "' + token.explicitType + '" but aliases "' + fullAlias + '" of type "' + targetType + '"');
      }
    }

    const resolved = resolveValue(token.value, lookupRegistry, []);
    if (resolved.ok) {
      validateValue(type, resolved.value, token, root, errors);
    }
  }
}
function aliasPath(value) {
  if (typeof value !== "string") return null;
  return value.match(ALIAS_RE)?.[1] ?? null;
}

function findAliases(value, found = []) {
  if (typeof value === "string") {
    const match = value.match(ALIAS_RE);
    if (match) found.push(match[1]);
    return found;
  }

  if (Array.isArray(value)) {
    for (const child of value) findAliases(child, found);
    return found;
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value)) findAliases(child, found);
  }

  return found;
}

function inferAliasType(tokenPath, registry, seen) {
  if (seen.has(tokenPath)) return null;
  seen.add(tokenPath);
  const token = registry.get(tokenPath);
  if (!token) return null;
  if (token.type) return token.type;
  const next = aliasPath(token.value);
  return next ? inferAliasType(next, registry, seen) : null;
}

function findCycle(start, registry) {
  const visiting = [];
  const visited = new Set();

  function visit(tokenPath) {
    const index = visiting.indexOf(tokenPath);
    if (index !== -1) return [...visiting.slice(index), tokenPath];
    if (visited.has(tokenPath)) return null;

    visited.add(tokenPath);
    visiting.push(tokenPath);
    const token = registry.get(tokenPath);

    if (token) {
      for (const ref of findAliases(token.value, [])) {
        if (!registry.has(ref)) continue;
        const cycle = visit(ref);
        if (cycle) return cycle;
      }
    }

    visiting.pop();
    return null;
  }

  return visit(start);
}

function resolveValue(value, registry, stack) {
  const direct = aliasPath(value);
  if (direct) {
    if (stack.includes(direct)) return { ok: false, value: null };
    const target = registry.get(direct);
    if (!target) return { ok: false, value: null };
    return resolveValue(target.value, registry, [...stack, direct]);
  }

  if (Array.isArray(value)) {
    const output = [];
    for (const child of value) {
      const resolved = resolveValue(child, registry, stack);
      if (!resolved.ok) return resolved;
      output.push(resolved.value);
    }
    return { ok: true, value: output };
  }

  if (value && typeof value === "object") {
    const output = {};
    for (const [key, child] of Object.entries(value)) {
      const resolved = resolveValue(child, registry, stack);
      if (!resolved.ok) return resolved;
      output[key] = resolved.value;
    }
    return { ok: true, value: output };
  }

  return { ok: true, value };
}

function validateValue(type, value, token, root, errors) {
  const at = rel(root, token.file) + ': token "' + token.path + '"';

  switch (type) {
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) errors.push(at + " must be a finite number");
      break;

    case "dimension":
      validateDimension(value, at, errors);
      break;

    case "duration":
      validateDuration(value, at, errors);
      break;

    case "fontFamily":
      if (!(typeof value === "string" || (Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string")))) {
        errors.push(at + " must be a font family string or non-empty string array");
      }
      break;

    case "fontWeight":
      if (!validFontWeight(value)) {
        errors.push(at + " font weight must be 1..1000 or a DTCG 2025.10 named weight");
      }
      break;

    case "cubicBezier":
      if (!(Array.isArray(value) && value.length === 4 && value.every((item) => typeof item === "number" && Number.isFinite(item)))) {
        errors.push(at + " cubicBezier must contain four finite numbers");
      } else if (value[0] < 0 || value[0] > 1 || value[2] < 0 || value[2] > 1) {
        errors.push(at + " cubicBezier x coordinates must be within 0..1");
      }
      break;

    case "color":
      validateColor(value, at, errors);
      break;

    case "transition":
      if (!plainObject(value)) {
        errors.push(at + " transition must be an object");
      } else {
        validateDuration(value.duration, at + ".duration", errors);
        validateDuration(value.delay, at + ".delay", errors);
        if (!(Array.isArray(value.timingFunction) && value.timingFunction.length === 4 && value.timingFunction.every((item) => typeof item === "number" && Number.isFinite(item)))) {
          errors.push(at + ".timingFunction must be a cubicBezier");
        } else if (value.timingFunction[0] < 0 || value.timingFunction[0] > 1 || value.timingFunction[2] < 0 || value.timingFunction[2] > 1) {
          errors.push(at + ".timingFunction x coordinates must be within 0..1");
        }
      }
      break;

    case "shadow":
      validateShadow(value, at, errors);
      break;

    case "typography":
      validateTypography(value, at, errors);
      break;
  }
}

function plainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateDimension(value, at, errors) {
  if (!plainObject(value) || typeof value.value !== "number" || !Number.isFinite(value.value) || !["px", "rem"].includes(value.unit)) {
    errors.push(at + " must be a DTCG dimension { value: number, unit: px|rem }");
  }
}

function validateDuration(value, at, errors) {
  if (!plainObject(value) || typeof value.value !== "number" || !Number.isFinite(value.value) || value.value < 0 || !["ms", "s"].includes(value.unit)) {
    errors.push(at + " must be a non-negative DTCG duration { value: number, unit: ms|s }");
  }
}

function validateColor(value, at, errors) {
  if (!plainObject(value) || typeof value.colorSpace !== "string" || !Array.isArray(value.components)) {
    errors.push(at + " must be a DTCG color object");
    return;
  }

  if (value.colorSpace === "oklch") {
    const [lightness, chroma, hue] = value.components;
    if (!(typeof lightness === "number" && lightness >= 0 && lightness <= 1)) errors.push(at + " OKLCH lightness must be within 0..1");
    if (!(typeof chroma === "number" && chroma >= 0)) errors.push(at + " OKLCH chroma must be >= 0");
    if (!(typeof hue === "number" && hue >= 0 && hue < 360)) errors.push(at + " OKLCH hue must be within 0..<360");
  } else if (value.colorSpace === "srgb") {
    if (!(value.components.length === 3 && value.components.every((component) => typeof component === "number" && component >= 0 && component <= 1))) {
      errors.push(at + " sRGB components must be three numbers within 0..1");
    }
  } else {
    errors.push(at + ' validator currently supports colorSpace "oklch" and "srgb"');
  }

  if (value.alpha !== undefined && !(typeof value.alpha === "number" && value.alpha >= 0 && value.alpha <= 1)) {
    errors.push(at + " alpha must be within 0..1");
  }

  if (value.hex !== undefined && !(typeof value.hex === "string" && /^#[0-9a-fA-F]{6}$/.test(value.hex))) {
    errors.push(at + " optional hex fallback must use #RRGGBB");
  }

  if (
    value.colorSpace === "oklch" &&
    Array.isArray(value.components) &&
    value.components.every((component) => typeof component === "number" && Number.isFinite(component)) &&
    typeof value.hex === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(value.hex)
  ) {
    const derivedHex = oklchToHex(value.components);
    if (derivedHex !== value.hex.toLowerCase()) {
      errors.push(at + " OKLCH components do not match hex fallback (derived " + derivedHex + ")");
    }
  }
}

function oklchToHex(components) {
  const [lightness, chroma, hue] = components;
  const radians = hue * Math.PI / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);

  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;

  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;

  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  const srgb = linear.map((channel) => {
    const encoded = channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
  });

  return "#" + srgb.map((channel) => channel.toString(16).padStart(2, "0")).join("");
}

function validateShadow(value, at, errors) {
  const layers = Array.isArray(value) ? value : [value];
  if (layers.length === 0) errors.push(at + " shadow array cannot be empty");

  for (const [index, layer] of layers.entries()) {
    const layerAt = at + "[" + index + "]";
    if (!plainObject(layer)) {
      errors.push(layerAt + " must be a shadow object");
      continue;
    }
    validateColor(layer.color, layerAt + ".color", errors);
    validateDimension(layer.offsetX, layerAt + ".offsetX", errors);
    validateDimension(layer.offsetY, layerAt + ".offsetY", errors);
    validateDimension(layer.blur, layerAt + ".blur", errors);
    validateDimension(layer.spread, layerAt + ".spread", errors);
    if (plainObject(layer.blur) && layer.blur.value < 0) errors.push(layerAt + ".blur cannot be negative");
    if (layer.inset !== undefined && typeof layer.inset !== "boolean") errors.push(layerAt + ".inset must be boolean");
  }
}

function validFontWeight(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 1 && value <= 1000;
  }

  const named = new Set([
    "thin", "hairline",
    "extra-light", "ultra-light",
    "light",
    "normal", "regular", "book",
    "medium",
    "semi-bold", "demi-bold",
    "bold",
    "extra-bold", "ultra-bold",
    "black", "heavy",
    "extra-black", "ultra-black",
  ]);
  return typeof value === "string" && named.has(value);
}
function validateTypography(value, at, errors) {
  const required = ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "lineHeight"];
  if (!plainObject(value)) {
    errors.push(at + " typography must be an object");
    return;
  }

  for (const field of required) if (!(field in value)) errors.push(at + " typography missing " + field);

  if ("fontFamily" in value && !(typeof value.fontFamily === "string" || (Array.isArray(value.fontFamily) && value.fontFamily.every((item) => typeof item === "string")))) {
    errors.push(at + ".fontFamily invalid");
  }
  if ("fontSize" in value) validateDimension(value.fontSize, at + ".fontSize", errors);
  if ("fontWeight" in value && !validFontWeight(value.fontWeight)) {
    errors.push(at + ".fontWeight invalid");
  }
  if ("letterSpacing" in value) validateDimension(value.letterSpacing, at + ".letterSpacing", errors);
  if ("lineHeight" in value && !(typeof value.lineHeight === "number" && Number.isFinite(value.lineHeight) && value.lineHeight > 0)) {
    errors.push(at + ".lineHeight must be a positive number");
  }
}

function getToken(registry, tokenPath) {
  return registry.get(tokenPath) ?? null;
}

function validateScales(manifest, registry, root, errors) {
  for (const check of manifest.scaleChecks ?? []) {
    if (check.rule !== "ascending-dimension") continue;
    let previous = -Infinity;

    for (const key of check.order ?? []) {
      const tokenPath = check.group + "." + key;
      const token = getToken(registry, tokenPath);
      if (!token) {
        errors.push("tokens/manifest.json: scale check references missing token " + tokenPath);
        continue;
      }
      const resolved = resolveValue(token.value, registry, []);
      const value = resolved.value;
      if (!resolved.ok || !plainObject(value) || typeof value.value !== "number") {
        errors.push(rel(root, token.file) + ': scale token "' + tokenPath + '" is not a dimension');
        continue;
      }
      if (value.value <= previous) {
        errors.push(rel(root, token.file) + ': scale "' + check.group + '" is not strictly ascending at "' + key + '"');
      }
      previous = value.value;
    }
  }
}

function compareThemePaths(themeName, expected, actual, file, root, errors) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = expected.filter((item) => !actualSet.has(item));
  const extra = actual.filter((item) => !expectedSet.has(item));

  if (missing.length) errors.push(rel(root, file) + ': theme "' + themeName + '" is missing semantic color tokens: ' + missing.join(", "));
  if (extra.length) errors.push(rel(root, file) + ': theme "' + themeName + '" has extra semantic color tokens: ' + extra.join(", "));
}

function validateContrast(themeName, manifest, registry, file, root, errors) {
  for (const pair of manifest.contrastPairs ?? []) {
    const foreground = resolveColorToken(pair.foreground, registry);
    const background = resolveColorToken(pair.background, registry);

    if (!foreground || !background) {
      errors.push(rel(root, file) + ': theme "' + themeName + '" cannot resolve contrast pair "' + pair.name + '"');
      continue;
    }

    const ratio = contrastRatio(foreground.hex, background.hex);
    if (ratio === null) {
      errors.push(rel(root, file) + ': theme "' + themeName + '" contrast pair "' + pair.name + '" needs #RRGGBB fallbacks for validation');
      continue;
    }

    if (ratio + 1e-9 < pair.minimum) {
      errors.push(
        rel(root, file) +
        ': theme "' + themeName + '" contrast pair "' + pair.name + '" is ' +
        ratio.toFixed(2) + ":1; requires " + pair.minimum + ":1"
      );
    }
  }
}

function resolveColorToken(tokenPath, registry) {
  const token = registry.get(tokenPath);
  if (!token) return null;
  const resolved = resolveValue(token.value, registry, []);
  if (!resolved.ok || !plainObject(resolved.value)) return null;
  return resolved.value;
}

function contrastRatio(foregroundHex, backgroundHex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(foregroundHex ?? "") || !/^#[0-9a-fA-F]{6}$/.test(backgroundHex ?? "")) return null;
  const light1 = relativeLuminance(foregroundHex);
  const light2 = relativeLuminance(backgroundHex);
  const lighter = Math.max(light1, light2);
  const darker = Math.min(light1, light2);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex) {
  const values = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = values.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
