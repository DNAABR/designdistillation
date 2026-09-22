import fs from "node:fs";
import path from "node:path";

export function auditProject({ root = process.cwd(), sourceRoot, profile, exceptions = [] }) {
  if (!sourceRoot) throw new Error("Auditor requires a sourceRoot.");
  if (!profile || typeof profile !== "object") throw new Error("Auditor requires a design profile object.");

  const config = readJson(path.join(root, "taxonomy", "audit-rules.json"));
  const absoluteSourceRoot = path.resolve(sourceRoot);
  if (!fs.existsSync(absoluteSourceRoot)) throw new Error("Audit source root does not exist: " + absoluteSourceRoot);

  const knownRules = new Set(Object.keys(config.rules ?? {}));
  for (const exception of exceptions) {
    if (!knownRules.has(exception.rule)) throw new Error('Audit exception references unknown rule "' + exception.rule + '".');
    if (!exception.reason || String(exception.reason).trim().length < 10) {
      throw new Error('Audit exception for "' + exception.rule + '" needs a meaningful reason.');
    }
  }

  const files = collectSourceFiles({
    root: absoluteSourceRoot,
    extensions: new Set(config.source_extensions ?? []),
    ignoredDirectories: new Set(config.ignore_directories ?? [])
  });
  const sources = files.map((file) => ({
    relative: path.relative(absoluteSourceRoot, file).replaceAll("\\", "/"),
    content: fs.readFileSync(file, "utf8")
  }));

  return auditSources({ root, profile, sources, exceptions });
}

export function auditSources({ root = process.cwd(), profile, sources, exceptions = [] }) {
  if (!profile || typeof profile !== "object") throw new Error("Auditor requires a design profile object.");
  if (!Array.isArray(sources)) throw new Error("Auditor requires a sources array.");

  const config = readJson(path.join(root, "taxonomy", "audit-rules.json"));
  const knownRules = new Set(Object.keys(config.rules ?? {}));
  for (const exception of exceptions) {
    if (!knownRules.has(exception.rule)) throw new Error('Audit exception references unknown rule "' + exception.rule + '".');
    if (!exception.reason || String(exception.reason).trim().length < 10) {
      throw new Error('Audit exception for "' + exception.rule + '" needs a meaningful reason.');
    }
  }

  const normalizedSources = sources.map((source, index) => {
    if (!source || typeof source !== "object") throw new Error("Audit source " + index + " must be an object.");
    const relative = String(source.relative ?? source.path ?? "").replaceAll("\\", "/").trim();
    const content = String(source.content ?? "");
    if (!relative) throw new Error("Audit source " + index + " needs a relative path.");
    return { relative, content };
  });

  const findings = [];
  for (const source of normalizedSources) auditSourceFile({ source, profile, config, findings });
  auditGlobalSource({ sources:normalizedSources, profile, config, findings });

  const resolved = findings.map((finding) => applyException(finding, exceptions)).sort(compareFindings);
  return {
    version: config.version,
    profile: {
      product: profile.product?.name || profile.product?.type || "unknown",
      baseRecipe: profile.selection?.baseRecipe || "unknown"
    },
    scannedFiles: normalizedSources.length,
    summary: summarize(resolved),
    findings: resolved
  };
}

export function renderAuditMarkdown(report) {
  const lines = [
    "# Design Distillation Audit", "",
    "- Product: " + report.profile.product,
    "- Base recipe: " + report.profile.baseRecipe,
    "- Scanned files: " + report.scannedFiles,
    "- Errors: " + report.summary.error,
    "- Warnings: " + report.summary.warning,
    "- Style deviations: " + report.summary["style-deviation"],
    "- Intentional exceptions: " + report.summary["intentional-exception"], ""
  ];
  if (!report.findings.length) return [...lines, "No findings.", ""].join("\n");

  const tick = String.fromCharCode(96);
  for (const category of ["error", "warning", "style-deviation", "intentional-exception"]) {
    const group = report.findings.filter((finding) => finding.category === category);
    if (!group.length) continue;
    lines.push("## " + heading(category), "");
    for (const finding of group) {
      lines.push("- **" + finding.rule + "** — " + finding.file + ":" + finding.line + " — " + finding.message);
      lines.push("  - Evidence: " + tick + String(finding.evidence).replaceAll(tick, "'") + tick);
      if (finding.exceptionReason) lines.push("  - Exception: " + finding.exceptionReason);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function auditSourceFile({ source, profile, config, findings }) {
  const extension = path.extname(source.relative).toLowerCase();
  if ([".css", ".scss", ".sass", ".less"].includes(extension)) auditStyleSource({ source, profile, config, findings });
  if ([".html", ".htm", ".jsx", ".tsx", ".js", ".ts", ".vue"].includes(extension)) {
    auditMarkupSource({ source, findings });
    auditSurfaceNesting({ source, config, findings });
  }
}

function auditStyleSource({ source, profile, config, findings }) {
  const lines = source.content.split(/\r?\n/);
  let hasMotion = false;
  const hasReducedMotion = /prefers-reduced-motion\s*:\s*reduce/i.test(source.content);
  const avoids = (profile.rules?.avoid ?? []).join(" ").toLowerCase();
  const colorfulness = profile.personality?.colorfulness ?? 100;
  const visualComplexity = profile.personality?.["visual-complexity"] ?? 100;
  const depth = profile.personality?.depth ?? 100;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (/var\(\s*--dd-primitive-/i.test(line)) {
      add(findings, config, "primitive-token-use", source, lineNumber,
        "A primitive Design Distillation variable is consumed directly; use a semantic role instead.", trimmed);
    }

    const declaration = parseDeclaration(line);
    if (!declaration) return;
    const { property, value } = declaration;
    const lowerValue = value.toLowerCase();

    if (isColorProperty(property) && containsColorLiteral(value) && !/var\(/i.test(value)) {
      add(findings, config, "arbitrary-color", source, lineNumber,
        "Literal color value bypasses the semantic color contract.", trimmed);
    }
    if (isSpacingProperty(property) && containsRawDimension(value) && !onlyZeroDimensions(value) && !/var\(/i.test(value)) {
      add(findings, config, "arbitrary-spacing", source, lineNumber,
        "Raw spacing dimension bypasses the shared spacing scale.", trimmed);
    }
    if (property === "border-radius" && containsRawDimension(value) && !/var\(/i.test(value)) {
      add(findings, config, "arbitrary-radius", source, lineNumber,
        "Raw border radius bypasses the semantic radius contract.", trimmed);
    }
    if (["font-size", "line-height", "letter-spacing"].includes(property) &&
        containsRawDimension(value) && !/var\(/i.test(value)) {
      add(findings, config, "arbitrary-typography", source, lineNumber,
        "Raw typography value bypasses the semantic type contract.", trimmed);
    }
    if (/gradient\s*\(/i.test(value) &&
        (avoids.includes("gradient") ||
         colorfulness <= config.thresholds.restrained_colorfulness_max ||
         visualComplexity <= config.thresholds.restrained_visual_complexity_max)) {
      add(findings, config, "unjustified-gradient", source, lineNumber,
        "Gradient treatment is not supported by this restrained design profile.", trimmed);
    }
    if ((property === "backdrop-filter" || property === "-webkit-backdrop-filter") &&
        visualComplexity <= config.thresholds.restrained_visual_complexity_max) {
      add(findings, config, "unjustified-backdrop-effect", source, lineNumber,
        "Backdrop filtering adds visual complexity beyond the profile's restrained posture.", trimmed);
    }
    if (property === "box-shadow" && lowerValue !== "none" && !/var\(/i.test(value) &&
        depth <= config.thresholds.low_depth_max) {
      add(findings, config, "unjustified-shadow", source, lineNumber,
        "Raw box shadow conflicts with a low-depth profile; use semantic elevation when layering is meaningful.", trimmed);
    }
    if (property === "outline" && /^\s*(none|0(?:\s|$))/i.test(value)) {
      if (!/(box-shadow|border)\s*:/i.test(line)) {
        add(findings, config, "focus-outline-suppressed", source, lineNumber,
          "Focus outline is suppressed without a detectable replacement on this declaration line.", trimmed);
      }
    }
    if (property.startsWith("transition") || property.startsWith("animation")) {
      if (!/^none\b/i.test(value) && !/^0(?:ms|s)?\b/i.test(value)) hasMotion = true;
    }
  });

  if (hasMotion && !hasReducedMotion) {
    const required = profile.accessibility?.reducedMotion === "required";
    add(findings, config, "missing-reduced-motion-path", source, 1,
      "Motion declarations exist without a prefers-reduced-motion path.",
      "motion detected; no reduced-motion media query", required ? "error" : undefined);
  }
}

function auditMarkupSource({ source, findings }) {
  for (const match of source.content.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=/.test(match[0])) {
      addDirect(findings, {
        rule: "image-missing-alt", category: "error", source,
        line: lineAt(source.content, match.index ?? 0),
        message: "Static img element has no alt attribute.", evidence: compact(match[0])
      });
    }
  }

  for (const match of source.content.matchAll(/<input\b[^>]*>/gi)) {
    const tag = match[0];
    if (/\btype\s*=\s*["']?hidden["']?/i.test(tag) || /\baria-label(?:ledby)?\s*=/i.test(tag)) continue;
    const id = tag.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1];
    const hasLabel = id
      ? new RegExp("<label\\b[^>]*(?:htmlFor|for)\\s*=\\s*[\"']" + escapeRegex(id) + "[\"']", "i").test(source.content)
      : false;
    if (!hasLabel) {
      addDirect(findings, {
        rule: "input-accessible-name-review", category: "warning", source,
        line: lineAt(source.content, match.index ?? 0),
        message: "Static input has no detectable label association or aria accessible name.", evidence: compact(tag)
      });
    }
  }
}

function auditSurfaceNesting({ source, config, findings }) {
  const stack = [];
  for (const match of source.content.matchAll(/<\/?([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    const full = match[0];
    const tagName = match[1].toLowerCase();
    const attrs = match[2] ?? "";
    if (full.startsWith("</")) {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        const entry = stack[index];
        stack.splice(index, 1);
        if (entry.tagName === tagName) break;
      }
      continue;
    }
    const selfClosing = /\/\s*>$/.test(full) || ["input","img","br","hr","meta","link"].includes(tagName);
    const isSurface = /(?:^|[\s_-])(card|panel|surface)(?:$|[\s_-])/i.test(extractStaticClass(attrs));
    const surfaceDepth = stack.filter((entry) => entry.isSurface).length + (isSurface ? 1 : 0);
    if (isSurface && surfaceDepth > config.thresholds.surface_nesting_max) {
      addDirect(findings, {
        rule: "excessive-surface-nesting", category: "warning", source,
        line: lineAt(source.content, match.index ?? 0),
        message: "Surface-like wrappers are nested " + surfaceDepth + " levels deep.", evidence: compact(full)
      });
    }
    if (!selfClosing) stack.push({ tagName, isSurface });
  }
}

function auditGlobalSource({ sources, profile, config, findings }) {
  const combined = sources.map((source) => source.content).join("\n");
  auditIconFamilies({ sources, config, findings });
  auditHeadings({ sources, findings });
  const lower = combined.toLowerCase();
  for (const patternId of profile.patterns?.prioritize ?? []) {
    const signals = config.pattern_signals?.[patternId];
    if (!signals) continue;
    if (!signals.some((signal) => lower.includes(String(signal).toLowerCase()))) {
      findings.push({
        rule: "missing-pattern-state", category: "warning", file: ".", line: 1,
        message: 'Prioritized pattern "' + patternId + '" has no recognizable implementation signal in the audited source.',
        evidence: "expected one of: " + signals.join(", ")
      });
    }
  }
}

function auditIconFamilies({ sources, config, findings }) {
  const used = new Map();
  for (const source of sources) {
    for (const [family, packages] of Object.entries(config.icon_families ?? {})) {
      for (const packageName of packages) {
        const pattern = new RegExp("(?:from\\s*[\"']|require\\(\\s*[\"'])" + escapeRegex(packageName));
        if (!pattern.test(source.content)) continue;
        if (!used.has(family)) used.set(family, { source, packages: new Set() });
        used.get(family).packages.add(packageName);
      }
    }
  }
  if (used.size > 1) {
    const first = [...used.values()][0];
    const evidence = [...used.entries()]
      .map(([family, item]) => family + " (" + [...item.packages].join(", ") + ")").join("; ");
    addDirect(findings, {
      rule: "mixed-icon-families", category: "warning", source: first.source, line: 1,
      message: "Multiple icon-library families are imported across the audited source.", evidence
    });
  }
}

function auditHeadings({ sources, findings }) {
  const headings = [];
  for (const source of sources) {
    for (const match of source.content.matchAll(/<h([1-6])\b[^>]*>/gi)) {
      headings.push({
        level: Number(match[1]), source,
        line: lineAt(source.content, match.index ?? 0), evidence: compact(match[0])
      });
    }
  }
  if (!headings.length) return;
  if (!headings.some((heading) => heading.level === 1)) {
    const first = headings[0];
    addDirect(findings, {
      rule: "missing-primary-heading", category: "warning", source: first.source, line: first.line,
      message: "Static heading markup exists but no h1 was found.", evidence: first.evidence
    });
  }
  let previous = headings[0];
  for (const current of headings.slice(1)) {
    if (current.level > previous.level + 1) {
      addDirect(findings, {
        rule: "skipped-heading-level", category: "warning", source: current.source, line: current.line,
        message: "Heading level jumps from h" + previous.level + " to h" + current.level + ".", evidence: current.evidence
      });
    }
    previous = current;
  }
}

function add(findings, config, rule, source, line, message, evidence, override) {
  addDirect(findings, {
    rule, category: override || config.rules?.[rule]?.category || "warning",
    source, line, message, evidence
  });
}
function addDirect(findings, { rule, category, source, line, message, evidence }) {
  findings.push({
    rule, category, file: source?.relative ?? ".", line: Math.max(1, line || 1),
    message, evidence: compact(evidence)
  });
}
function applyException(finding, exceptions) {
  const exception = exceptions.find((item) =>
    item.rule === finding.rule && (!item.file || globMatch(finding.file, item.file))
  );
  if (!exception) return finding;
  return {
    ...finding, originalCategory: finding.category, category: "intentional-exception",
    exceptionReason: exception.reason
  };
}
function summarize(findings) {
  const summary = { error:0, warning:0, "style-deviation":0, "intentional-exception":0, total:findings.length };
  for (const finding of findings) summary[finding.category] += 1;
  return summary;
}
function collectSourceFiles({ root, extensions, ignoredDirectories }) {
  const files = [];
  walk(root);
  return files.sort();
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes:true })) {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) files.push(full);
    }
  }
}
function parseDeclaration(line) {
  const match = line.match(/^\s*([a-zA-Z-]+)\s*:\s*([^;]+);?/);
  return match ? { property:match[1].toLowerCase(), value:match[2].trim() } : null;
}
function isColorProperty(property) {
  return ["color","background","background-color","border-color","border-top-color","border-right-color",
    "border-bottom-color","border-left-color","outline-color","fill","stroke","text-decoration-color"].includes(property);
}
function isSpacingProperty(property) {
  return /^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left)(?:-|$)/.test(property);
}
function containsColorLiteral(value) {
  return /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\s*\(/i.test(value);
}
function containsRawDimension(value) {
  return /(?:^|[\s,(])[-+]?\d*\.?\d+(?:px|rem|em|ch|vh|vw|vmin|vmax|%)\b/i.test(value);
}
function onlyZeroDimensions(value) {
  return value.replace(/\b0(?:\.0+)?(?:px|rem|em|ch|vh|vw|vmin|vmax|%)?\b/gi, "").replace(/[\s,/]+/g, "") === "";
}
function extractStaticClass(attrs) {
  return attrs.match(/\b(?:class|className)\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
}
function lineAt(content, index) { return content.slice(0, index).split("\n").length; }
function compareFindings(a,b) {
  return a.file.localeCompare(b.file) || a.line-b.line || a.rule.localeCompare(b.rule) || a.message.localeCompare(b.message);
}
function compact(value) { return String(value ?? "").replace(/\s+/g, " ").trim().slice(0,220); }
function globMatch(value, pattern) {
  const escaped = String(pattern).replace(/[.+^$()|[\]{}\\]/g, "\\$&")
    .replace(/\*\*/g, "::DS::").replace(/\*/g, "[^/]*").replace(/::DS::/g, ".*");
  return new RegExp("^" + escaped + "$").test(value);
}
function escapeRegex(value) { return String(value).replace(/[.*+?^$()|[\]{}\\]/g, "\\$&"); }
function heading(category) {
  return { error:"Errors", warning:"Warnings", "style-deviation":"Style deviations",
    "intentional-exception":"Intentional exceptions" }[category] || category;
}
function readJson(file) {
  const text = fs.readFileSync(file, "utf8");
  return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
}
