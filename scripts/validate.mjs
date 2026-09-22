import fs from "node:fs";
import path from "node:path";
import { validateCorpus } from "./corpus-validator.mjs";
import { validateTokens } from "./token-validator.mjs";
import { validateComposerConfig } from "./composer-validator.mjs";

const root = process.cwd();
const errors = [];

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) {
    errors.push(path.relative(root, file).replaceAll("\\", "/") + ": invalid JSON (" + error.message + ")");
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

for (const dir of ["schemas", "taxonomy", "examples"]) {
  for (const file of walk(path.join(root, dir)).filter((candidate) => candidate.endsWith(".json"))) readJson(file);
}

const corpusStats = validateCorpus({ root, errors });
const tokenStats = validateTokens({ root, errors });
const composerStats = validateComposerConfig({ root, errors });

if (errors.length) {
  console.error("\nDesign Distillation validation failed:\n");
  for (const error of errors) console.error("- " + error);
  console.error("\n" + errors.length + " error(s).\n");
  process.exit(1);
}

console.log(
  "Design Distillation validation passed. " +
  corpusStats.entryCount + " corpus entries (" +
  corpusStats.patternCount + " patterns, " +
  corpusStats.antiPatternCount + " anti-patterns across " +
  corpusStats.familyCount + " families, " +
  corpusStats.recipeCount + " recipes across " +
  corpusStats.recipeCategoryCount + " categories), " +
  tokenStats.tokenCount + " token paths, " +
  tokenStats.themeCount + " themes, " +
  composerStats.recipeSignalCount + " composer recipe signals, and " +
  composerStats.capabilityCount + " capability mappings across " +
  composerStats.platformRuleCount + " platform rules checked."
);
