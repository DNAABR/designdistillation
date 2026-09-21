import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const corpusRoot = path.join(root, "corpus");
const taxonomyPath = path.join(root, "taxonomy", "taxonomy.json");
const errors = [];

function fail(file, message) {
  errors.push(path.relative(root, file) + ": " + message);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(file, "invalid JSON (" + error.message + ")");
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

const taxonomy = readJson(taxonomyPath);
if (!taxonomy) process.exit(1);

const knownKinds = new Set(taxonomy.entryKinds ?? []);
const knownSources = new Set(taxonomy.sourceTypes ?? []);
const knownPlatforms = new Set(taxonomy.platforms ?? []);
const knownStages = new Set(taxonomy.stages ?? []);
const ids = new Map();

for (const file of walk(corpusRoot).filter((candidate) => candidate.endsWith(".json"))) {
  const entry = readJson(file);
  if (!entry) continue;

  const required = ["id", "kind", "title", "summary", "problem", "use_when", "avoid_when", "rationale", "sources"];
  for (const key of required) {
    if (entry[key] === undefined || entry[key] === null) fail(file, "missing required field " + key);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id ?? "")) fail(file, "id must be lowercase kebab-case");
  if (ids.has(entry.id)) fail(file, "duplicate id " + entry.id + " (already in " + ids.get(entry.id) + ")");
  else if (entry.id) ids.set(entry.id, path.relative(root, file));

  if (!knownKinds.has(entry.kind)) fail(file, "unknown kind " + entry.kind);

  for (const field of ["use_when", "avoid_when", "rationale", "sources"]) {
    if (!Array.isArray(entry[field]) || entry[field].length === 0) fail(file, field + " must be a non-empty array");
  }

  for (const platform of entry.platforms ?? []) {
    if (!knownPlatforms.has(platform)) fail(file, "unknown platform " + platform);
  }
  if (entry.stage && !knownStages.has(entry.stage)) fail(file, "unknown stage " + entry.stage);

  for (const source of entry.sources ?? []) {
    if (!knownSources.has(source.type)) fail(file, "unknown source type " + source.type);
    if (!source.title) fail(file, "every source needs a title");
    if (source.type !== "internal") {
      if (!source.url) fail(file, "external sources need a url");
      if (!source.accessed) fail(file, "external sources need an accessed date");
    }
    if (!source.redistribution) fail(file, "every source needs redistribution metadata");
    else {
      if (typeof source.redistribution.code !== "boolean") fail(file, "redistribution.code must be boolean");
      if (typeof source.redistribution.assets !== "boolean") fail(file, "redistribution.assets must be boolean");
    }
  }
}

for (const dir of ["schemas", "taxonomy"]) {
  for (const file of walk(path.join(root, dir)).filter((candidate) => candidate.endsWith(".json"))) readJson(file);
}

if (errors.length) {
  console.error("\nDesign Distillation validation failed:\n");
  for (const error of errors) console.error("- " + error);
  console.error("\n" + errors.length + " error(s).\n");
  process.exit(1);
}

console.log("Design Distillation validation passed. " + ids.size + " corpus " + (ids.size === 1 ? "entry" : "entries") + " checked.");
