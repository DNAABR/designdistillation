import fs from "node:fs";
import path from "node:path";
import { buildExplorerData } from "./explorer-data.mjs";

export function validateExplorer({ root = process.cwd(), errors = [] } = {}) {
  for (const file of ["index.html","styles.css","app.js"]) {
    if (!fs.existsSync(path.join(root, "explorer", file))) errors.push("explorer/" + file + ": missing explorer source");
  }

  let data;
  try {
    data = buildExplorerData({ root });
  } catch (error) {
    errors.push("explorer data build failed: " + error.message);
    return { corpusCount:0, registryCount:0, tokenRecordCount:0, profileCount:0 };
  }

  if (data.version !== "0.8.0") errors.push("explorer data: version must be 0.8.0");
  if (data.counts.corpus !== data.corpus.length) errors.push("explorer data: corpus count mismatch");
  if (data.counts.registry !== data.registry.length) errors.push("explorer data: registry count mismatch");
  if (data.counts.tokens !== data.tokens.length) errors.push("explorer data: token count mismatch");

  for (const item of [...data.corpus, ...data.registry, ...data.tokens]) {
    if (!item.sourcePath || !item.sourceUrl) errors.push("explorer data: every human-facing record needs sourcePath/sourceUrl");
    if (item.sourceUrl && !item.sourceUrl.includes("/blob/")) errors.push("explorer data: source URL must link to machine-readable repository data");
  }

  const axes = data.taxonomy.designAxes?.axes ?? [];
  const recipes = data.corpus.filter((entry) => entry.kind === "recipe");
  for (const recipe of recipes) {
    const preview = data.profiles[recipe.id];
    if (!preview?.profile || !preview?.input) {
      errors.push('explorer data: missing generated profile for recipe "' + recipe.id + '"');
      continue;
    }
    if (preview.profile.selection?.baseRecipe !== recipe.id) {
      errors.push('explorer data: preview for "' + recipe.id + '" must use that recipe as the base');
    }
    for (const axis of axes) {
      const value = preview.profile.personality?.[axis];
      const range = recipe.design_dna?.[axis];
      if (!Number.isInteger(value)) errors.push('explorer data: preview "' + recipe.id + '" missing DNA axis "' + axis + '"');
      if (range && (value < range.min || value > range.max)) {
        errors.push('explorer data: preview "' + recipe.id + '" axis "' + axis + '" is outside recipe range');
      }
    }
  }

  return {
    corpusCount:data.corpus.length,
    registryCount:data.registry.length,
    tokenRecordCount:data.tokens.length,
    profileCount:Object.keys(data.profiles).length
  };
}
