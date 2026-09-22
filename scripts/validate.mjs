import fs from "node:fs";
import path from "node:path";
import { validateCorpus } from "./corpus-validator.mjs";
import { validateTokens } from "./token-validator.mjs";
import { validateComposerConfig } from "./composer-validator.mjs";
import { validateRegistry } from "./registry-validator.mjs";
import { validateAuditorConfig } from "./auditor-validator.mjs";
import { validateExplorer } from "./explorer-validator.mjs";

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
  return fs.readdirSync(dir, { withFileTypes:true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
for (const dir of ["schemas","taxonomy","examples","registry"]) {
  for (const file of walk(path.join(root, dir)).filter((candidate) => candidate.endsWith(".json"))) readJson(file);
}
const corpusStats = validateCorpus({ root, errors });
const tokenStats = validateTokens({ root, errors });
const composerStats = validateComposerConfig({ root, errors });
const registryStats = validateRegistry({ root, errors });
const auditorStats = validateAuditorConfig({ root, errors });
const explorerStats = validateExplorer({ root, errors });

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
  composerStats.recipeSignalCount + " composer recipe signals, " +
  composerStats.capabilityCount + " capability mappings across " +
  composerStats.platformRuleCount + " platform rules, " +
  registryStats.entryCount + " registry entries (" +
  registryStats.componentCount + " components, " +
  registryStats.compositionCount + " compositions) across " +
  registryStats.adapterCount + " adapters, " +
  auditorStats.ruleCount + " audit rules with " +
  auditorStats.patternSignalCount + " prioritized-pattern signal checks, and an explorer over " +
  explorerStats.corpusCount + " corpus entries, " +
  explorerStats.registryCount + " registry entries, " +
  explorerStats.tokenRecordCount + " token records, and " +
  explorerStats.profileCount + " generated recipe profiles."
);
