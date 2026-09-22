import fs from "node:fs";
import path from "node:path";

export function validateRegistry({ root = process.cwd(), errors = [] } = {}) {
  const manifestPath = path.join(root, "registry", "manifest.json");
  const manifest = readJson(manifestPath, root, errors);
  const taxonomy = readJson(path.join(root, "taxonomy", "taxonomy.json"), root, errors);
  const tokenManifest = readJson(path.join(root, "tokens", "manifest.json"), root, errors);
  if (!manifest || !taxonomy || !tokenManifest) {
    return { entryCount: 0, componentCount: 0, compositionCount: 0, adapterCount: 0 };
  }

  if (manifest.version !== "0.6.0") errors.push("registry/manifest.json: version must be 0.6.0");
  if (manifest.entry_schema !== "schemas/registry-entry.schema.json") {
    errors.push("registry/manifest.json: entry_schema must reference schemas/registry-entry.schema.json");
  }

  const patternIds = loadIds(path.join(root, "corpus", "patterns"), root, errors);
  const tokenPaths = loadTokenPaths({ root, tokenManifest, errors });
  const platforms = new Set(taxonomy.platforms ?? []);
  const states = new Set(taxonomy.patternStates ?? []);
  const listedPaths = new Set(manifest.entries ?? []);
  const actualEntryFiles = fs.existsSync(path.join(root, "registry", "entries"))
    ? fs.readdirSync(path.join(root, "registry", "entries"))
      .filter((file) => file.endsWith(".json"))
      .map((file) => "registry/entries/" + file)
    : [];

  for (const actual of actualEntryFiles) {
    if (!listedPaths.has(actual)) errors.push(actual + ": registry entry is not listed in registry/manifest.json");
  }
  for (const listed of listedPaths) {
    if (!fs.existsSync(path.join(root, listed))) errors.push("registry/manifest.json: missing listed entry " + listed);
  }

  const ids = new Set();
  let componentCount = 0;
  let compositionCount = 0;
  for (const entryPath of manifest.entries ?? []) {
    const entry = readJson(path.join(root, entryPath), root, errors);
    if (!entry) continue;
    validateEntry({ entry, entryPath, root, errors, ids, patternIds, tokenPaths, platforms, states });
    if (entry.kind === "component") componentCount += 1;
    if (entry.kind === "composition") compositionCount += 1;
  }

  const adapters = manifest.adapters ?? {};
  for (const required of ["css", "tailwind-v4", "react"]) {
    if (!adapters[required]) errors.push('registry/manifest.json: missing adapter "' + required + '"');
  }

  const tailwindMap = adapters["tailwind-v4"]?.token_map ?? {};
  for (const [name, tokenPath] of Object.entries(tailwindMap)) {
    if (!name || !tokenPaths.has(tokenPath)) {
      errors.push('registry/manifest.json: Tailwind token "' + name + '" references unknown token "' + tokenPath + '"');
    }
  }

  const cssSource = path.join(root, "registry", "source", "css", "components.css");
  if (!fs.existsSync(cssSource)) {
    errors.push("registry/source/css/components.css: missing shared CSS implementation");
  } else {
    const css = fs.readFileSync(cssSource, "utf8");
    if (css.includes("--dd-primitive-")) {
      errors.push("registry/source/css/components.css: source implementation must consume semantic variables, not primitive token variables");
    }
    if (/#[0-9a-fA-F]{3,8}\b/.test(css)) {
      errors.push("registry/source/css/components.css: hard-coded color literals are not allowed");
    }
  }

  return {
    entryCount: ids.size,
    componentCount,
    compositionCount,
    adapterCount: Object.keys(adapters).length
  };
}

function validateEntry({ entry, entryPath, root, errors, ids, patternIds, tokenPaths, platforms, states }) {
  const prefix = entryPath + ": ";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id ?? "")) errors.push(prefix + "invalid id");
  if (ids.has(entry.id)) errors.push(prefix + 'duplicate registry id "' + entry.id + '"');
  ids.add(entry.id);

  if (entry.version !== "0.6.0") errors.push(prefix + "version must be 0.6.0");
  if (!["component", "composition"].includes(entry.kind)) errors.push(prefix + "kind must be component or composition");
  if (!entry.title || !entry.summary) errors.push(prefix + "title and summary are required");

  if (!Array.isArray(entry.platforms) || entry.platforms.length === 0) {
    errors.push(prefix + "platforms must contain at least one platform");
  } else {
    for (const platform of entry.platforms) if (!platforms.has(platform)) errors.push(prefix + 'unknown platform "' + platform + '"');
  }

  for (const field of ["states", "slots", "token_refs", "accessibility"]) {
    if (!Array.isArray(entry[field]) || entry[field].length === 0) errors.push(prefix + field + " must be a non-empty array");
  }

  for (const state of entry.states ?? []) {
    if (!states.has(state)) errors.push(prefix + 'unknown state "' + state + '"');
  }
  for (const tokenPath of entry.token_refs ?? []) {
    if (!tokenPaths.has(tokenPath)) errors.push(prefix + 'unknown token reference "' + tokenPath + '"');
  }
  for (const field of ["required", "related"]) {
    for (const patternId of entry.patterns?.[field] ?? []) {
      if (!patternIds.has(patternId)) errors.push(prefix + 'unknown pattern reference "' + patternId + '"');
    }
  }

  if (!Array.isArray(entry.intent?.use_when) || entry.intent.use_when.length === 0) errors.push(prefix + "intent.use_when is required");
  if (!Array.isArray(entry.intent?.avoid_when) || entry.intent.avoid_when.length === 0) errors.push(prefix + "intent.avoid_when is required");

  if (entry.implementation?.source_owned !== true) errors.push(prefix + "implementation.source_owned must be true");
  const cssSelectors = entry.implementation?.adapters?.css?.selectors;
  if (!Array.isArray(cssSelectors) || cssSelectors.length === 0 || cssSelectors.some((selector) => !selector.startsWith("."))) {
    errors.push(prefix + "CSS adapter needs class selectors");
  }

  const react = entry.implementation?.adapters?.react;
  if (!react?.source || !fs.existsSync(path.join(root, react.source))) {
    errors.push(prefix + "React source file does not exist");
  } else {
    const source = fs.readFileSync(path.join(root, react.source), "utf8");
    for (const exportName of react.exports ?? []) {
      if (!source.includes("export function " + exportName) && !source.includes("export const " + exportName)) {
        errors.push(prefix + 'React source does not export "' + exportName + '"');
      }
    }
  }
  if (!Array.isArray(react?.exports) || react.exports.length === 0) errors.push(prefix + "React adapter needs exports");

  if (entry.provenance?.origin !== "design-distillation") errors.push(prefix + "provenance.origin must be design-distillation");
  if (entry.provenance?.redistribution !== "pending-repository-license") {
    errors.push(prefix + "redistribution must remain pending-repository-license until the repository license is chosen");
  }
}

function loadTokenPaths({ root, tokenManifest, errors }) {
  const paths = new Set();
  const files = [
    ...(tokenManifest.sources ?? []).map((file) => path.join(root, "tokens", file)),
    ...Object.values(tokenManifest.themes ?? {}).map((file) => path.join(root, "tokens", file))
  ];
  for (const file of files) {
    const doc = readJson(file, root, errors);
    if (doc) collectTokenPaths(doc, [], paths);
  }
  return paths;
}

function collectTokenPaths(node, segments, paths) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return;
  if (Object.prototype.hasOwnProperty.call(node, "$value")) paths.add(segments.join("."));
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    collectTokenPaths(value, [...segments, key], paths);
  }
}

function loadIds(dir, root, errors) {
  const ids = new Set();
  if (!fs.existsSync(dir)) return ids;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const entry = readJson(path.join(dir, file), root, errors);
    if (entry?.id) ids.add(entry.id);
  }
  return ids;
}

function readJson(file, root, errors) {
  try {
    const content = fs.readFileSync(file, "utf8");
    return JSON.parse(content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content);
  } catch (error) {
    errors.push(path.relative(root, file).replaceAll("\\", "/") + ": invalid JSON (" + error.message + ")");
    return null;
  }
}
