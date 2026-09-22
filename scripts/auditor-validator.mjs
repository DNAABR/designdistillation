import fs from "node:fs";
import path from "node:path";

export function validateAuditorConfig({ root = process.cwd(), errors = [] } = {}) {
  const config = readJson(path.join(root, "taxonomy", "audit-rules.json"), root, errors);
  const taxonomy = readJson(path.join(root, "taxonomy", "taxonomy.json"), root, errors);
  if (!config || !taxonomy) return { ruleCount:0, patternSignalCount:0 };

  if (config.version !== "0.7.0") errors.push("taxonomy/audit-rules.json: version must be 0.7.0");
  const severities = new Set(taxonomy.severities ?? []);
  for (const [ruleId, rule] of Object.entries(config.rules ?? {})) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ruleId)) errors.push('taxonomy/audit-rules.json: invalid rule id "' + ruleId + '"');
    if (!severities.has(rule.category)) errors.push('taxonomy/audit-rules.json: rule "' + ruleId + '" uses unknown category "' + rule.category + '"');
    if (!rule.description || !String(rule.description).trim()) errors.push('taxonomy/audit-rules.json: rule "' + ruleId + '" needs a description');
  }
  for (const field of ["surface_nesting_max","low_depth_max","restrained_colorfulness_max","restrained_visual_complexity_max"]) {
    const value = config.thresholds?.[field];
    if (!(Number.isFinite(value) && value >= 0)) errors.push("taxonomy/audit-rules.json: thresholds." + field + " must be non-negative");
  }
  if (!Array.isArray(config.source_extensions) || !config.source_extensions.length) errors.push("taxonomy/audit-rules.json: source_extensions must be non-empty");
  if (!Array.isArray(config.ignore_directories)) errors.push("taxonomy/audit-rules.json: ignore_directories must be an array");

  const patternIds = loadIds(path.join(root, "corpus", "patterns"), root, errors);
  for (const [patternId, signals] of Object.entries(config.pattern_signals ?? {})) {
    if (!patternIds.has(patternId)) errors.push('taxonomy/audit-rules.json: unknown pattern "' + patternId + '"');
    if (!Array.isArray(signals) || !signals.length || signals.some((signal) => !String(signal).trim())) {
      errors.push('taxonomy/audit-rules.json: pattern "' + patternId + '" needs non-empty signals');
    }
  }
  for (const [family, packages] of Object.entries(config.icon_families ?? {})) {
    if (!family || !Array.isArray(packages) || !packages.length) errors.push("taxonomy/audit-rules.json: invalid icon family");
  }
  return { ruleCount:Object.keys(config.rules ?? {}).length, patternSignalCount:Object.keys(config.pattern_signals ?? {}).length };
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
    const text = fs.readFileSync(file, "utf8");
    return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
  } catch (error) {
    errors.push(path.relative(root, file).replaceAll("\\", "/") + ": invalid JSON (" + error.message + ")");
    return null;
  }
}
