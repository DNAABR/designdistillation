import fs from "node:fs";
import path from "node:path";

export function validateCorpus({ root, errors }) {
  const corpusRoot = path.join(root, "corpus");
  const taxonomyPath = path.join(root, "taxonomy", "taxonomy.json");
  const taxonomy = readJson(taxonomyPath, root, errors);
  if (!taxonomy) return { entryCount: 0, patternCount: 0, antiPatternCount: 0, familyCount: 0 };

  const knownKinds = new Set(taxonomy.entryKinds ?? []);
  const knownSources = new Set(taxonomy.sourceTypes ?? []);
  const knownPlatforms = new Set(taxonomy.platforms ?? []);
  const knownStages = new Set(taxonomy.stages ?? []);
  const knownFamilies = new Set(taxonomy.patternFamilies ?? []);
  const knownStates = new Set(taxonomy.patternStates ?? []);
  const knownEvidence = new Set(taxonomy.evidenceLevels ?? []);
  const knownSeverities = new Set(taxonomy.severities ?? []);

  const ids = new Map();
  const entries = new Map();
  const patternTitles = new Map();
  const familiesSeen = new Set();

  for (const file of walk(corpusRoot).filter((candidate) => candidate.endsWith(".json"))) {
    const entry = readJson(file, root, errors);
    if (!entry) continue;

    const required = ["id", "kind", "title", "summary", "problem", "use_when", "avoid_when", "rationale", "sources"];
    for (const key of required) {
      if (entry[key] === undefined || entry[key] === null) fail(errors, root, file, 'missing required field "' + key + '"');
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id ?? "")) fail(errors, root, file, "id must be lowercase kebab-case");

    if (ids.has(entry.id)) {
      fail(errors, root, file, 'duplicate id "' + entry.id + '" (already in ' + ids.get(entry.id) + ")");
    } else if (entry.id) {
      ids.set(entry.id, rel(root, file));
      entries.set(entry.id, { entry, file });
    }

    if (!knownKinds.has(entry.kind)) fail(errors, root, file, 'unknown kind "' + entry.kind + '"');

    for (const field of ["use_when", "avoid_when", "rationale", "sources"]) {
      if (!Array.isArray(entry[field]) || entry[field].length === 0) fail(errors, root, file, '"' + field + '" must be a non-empty array');
    }

    for (const platform of entry.platforms ?? []) {
      if (!knownPlatforms.has(platform)) fail(errors, root, file, 'unknown platform "' + platform + '"');
    }
    if (entry.stage && !knownStages.has(entry.stage)) fail(errors, root, file, 'unknown stage "' + entry.stage + '"');

    for (const source of entry.sources ?? []) {
      if (!knownSources.has(source.type)) fail(errors, root, file, 'unknown source type "' + source.type + '"');
      if (!source.title) fail(errors, root, file, "every source needs a title");
      if (source.type !== "internal") {
        if (!source.url) fail(errors, root, file, "external sources need a url");
        if (!source.accessed) fail(errors, root, file, "external sources need an accessed date");
      }
      if (!source.redistribution) fail(errors, root, file, "every source needs redistribution metadata");
      else {
        if (typeof source.redistribution.code !== "boolean") fail(errors, root, file, "redistribution.code must be boolean");
        if (typeof source.redistribution.assets !== "boolean") fail(errors, root, file, "redistribution.assets must be boolean");
      }
    }

    if (entry.kind === "pattern") validatePattern(entry, file);
    if (entry.kind === "anti-pattern") validateAntiPattern(entry, file);
  }

  for (const [id, { entry, file }] of entries) {
    if (entry.kind !== "pattern") continue;
    for (const relatedId of entry.related?.patterns ?? []) validateReference(id, file, relatedId, "pattern");
    for (const relatedId of entry.related?.anti_patterns ?? []) validateReference(id, file, relatedId, "anti-pattern");
  }

  for (const family of knownFamilies) {
    if (!familiesSeen.has(family)) errors.push('taxonomy/taxonomy.json: pattern family "' + family + '" has no corpus coverage');
  }

  return {
    entryCount: ids.size,
    patternCount: [...entries.values()].filter(({ entry }) => entry.kind === "pattern").length,
    antiPatternCount: [...entries.values()].filter(({ entry }) => entry.kind === "anti-pattern").length,
    familyCount: familiesSeen.size,
  };

  function validatePattern(entry, file) {
    for (const key of ["family", "evidence", "states", "decision", "accessibility", "implementation", "related"]) {
      if (entry[key] === undefined || entry[key] === null) fail(errors, root, file, 'pattern missing required field "' + key + '"');
    }

    if (!knownFamilies.has(entry.family)) fail(errors, root, file, 'unknown pattern family "' + entry.family + '"');
    else familiesSeen.add(entry.family);

    if (!knownEvidence.has(entry.evidence)) fail(errors, root, file, 'unknown evidence level "' + entry.evidence + '"');

    if (!Array.isArray(entry.states) || entry.states.length === 0) {
      fail(errors, root, file, "pattern states must be a non-empty array");
    } else {
      const uniqueStates = new Set();
      for (const state of entry.states) {
        if (!knownStates.has(state)) fail(errors, root, file, 'unknown pattern state "' + state + '"');
        if (uniqueStates.has(state)) fail(errors, root, file, 'duplicate pattern state "' + state + '"');
        uniqueStates.add(state);
      }
    }

    requireArray(entry.decision?.use_if, file, "decision.use_if");
    requireArray(entry.decision?.prefer_alternatives_if, file, "decision.prefer_alternatives_if");
    requireArray(entry.accessibility?.requirements, file, "accessibility.requirements");
    requireArray(entry.implementation?.requirements, file, "implementation.requirements");

    if (!Array.isArray(entry.related?.patterns)) fail(errors, root, file, "related.patterns must be an array");
    if (!Array.isArray(entry.related?.anti_patterns)) fail(errors, root, file, "related.anti_patterns must be an array");

    const normalizedTitle = normalize(entry.title);
    if (patternTitles.has(normalizedTitle)) fail(errors, root, file, 'duplicate normalized pattern title with "' + patternTitles.get(normalizedTitle) + '"');
    else patternTitles.set(normalizedTitle, entry.id);

    if (entry.evidence === "standard-backed" && !(entry.sources ?? []).some((source) => source.type === "standard")) fail(errors, root, file, "standard-backed pattern needs at least one standard source");
    if (entry.evidence === "design-system-backed" && !(entry.sources ?? []).some((source) => source.type === "design-system")) fail(errors, root, file, "design-system-backed pattern needs at least one design-system source");
  }

  function validateAntiPattern(entry, file) {
    if (!entry.audit || typeof entry.audit !== "object") {
      fail(errors, root, file, "anti-pattern requires audit metadata");
      return;
    }
    if (!knownSeverities.has(entry.audit.severity)) fail(errors, root, file, 'unknown audit severity "' + entry.audit.severity + '"');
    requireArray(entry.audit.signals, file, "audit.signals");
  }

  function validateReference(ownerId, file, targetId, expectedKind) {
    if (targetId === ownerId) {
      fail(errors, root, file, 'related reference cannot point to itself "' + targetId + '"');
      return;
    }
    const target = entries.get(targetId);
    if (!target) {
      fail(errors, root, file, 'related reference "' + targetId + '" does not exist');
      return;
    }
    if (target.entry.kind !== expectedKind) fail(errors, root, file, 'related reference "' + targetId + '" must be kind "' + expectedKind + '"');
  }

  function requireArray(value, file, name) {
    if (!Array.isArray(value) || value.length === 0) fail(errors, root, file, name + " must be a non-empty array");
  }
}

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function fail(errors, root, file, message) {
  errors.push(rel(root, file) + ": " + message);
}
function rel(root, file) {
  return path.relative(root, file).replaceAll("\\", "/");
}
function readJson(file, root, errors) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) {
    fail(errors, root, file, "invalid JSON (" + error.message + ")");
    return null;
  }
}
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
