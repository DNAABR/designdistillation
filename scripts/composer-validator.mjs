import fs from "node:fs";
import path from "node:path";

export function validateComposerConfig({ root, errors }) {
  const taxonomy = readJson(path.join(root, "taxonomy", "taxonomy.json"), root, errors);
  const signals = readJson(path.join(root, "taxonomy", "composer-signals.json"), root, errors);
  if (!taxonomy || !signals) return { recipeSignalCount: 0, capabilityCount: 0, platformRuleCount: 0 };

  const recipeIds = loadIds(path.join(root, "corpus", "recipes"), root, errors);
  const patternIds = loadIds(path.join(root, "corpus", "patterns"), root, errors);
  const configuredRecipes = signals.recipes ?? {};
  const aliasOwners = new Map();

  for (const recipeId of recipeIds) {
    if (!configuredRecipes[recipeId]) {
      errors.push('taxonomy/composer-signals.json: recipe "' + recipeId + '" has no composer signals');
    }
  }

  for (const [recipeId, config] of Object.entries(configuredRecipes)) {
    if (!recipeIds.has(recipeId)) {
      errors.push('taxonomy/composer-signals.json: composer signals reference unknown recipe "' + recipeId + '"');
    }

    if (!Array.isArray(config.aliases) || config.aliases.length === 0) {
      errors.push('taxonomy/composer-signals.json: recipe "' + recipeId + '" needs aliases');
    }
    if (!Array.isArray(config.keywords) || config.keywords.length === 0) {
      errors.push('taxonomy/composer-signals.json: recipe "' + recipeId + '" needs keywords');
    }

    for (const alias of config.aliases ?? []) {
      const normalized = normalize(alias);
      const owner = aliasOwners.get(normalized);
      if (owner && owner !== recipeId) {
        errors.push(
          'taxonomy/composer-signals.json: alias "' + alias +
          '" is ambiguous between "' + owner + '" and "' + recipeId + '"'
        );
      } else {
        aliasOwners.set(normalized, recipeId);
      }
    }
  }

  for (const [field, weight] of Object.entries(signals.fieldWeights ?? {})) {
    if (!(typeof weight === "number" && Number.isFinite(weight) && weight >= 0)) {
      errors.push('taxonomy/composer-signals.json: field weight "' + field + '" must be a non-negative number');
    }
  }

  validateAutoSelection(signals.autoSelection ?? {}, errors);

  for (const [capability, ids] of Object.entries(signals.capabilityPatterns ?? {})) {
    if (!Array.isArray(ids) || ids.length === 0) {
      errors.push('taxonomy/composer-signals.json: capability "' + capability + '" must map to at least one pattern');
      continue;
    }
    for (const id of ids) {
      if (!patternIds.has(id)) {
        errors.push(
          'taxonomy/composer-signals.json: capability "' + capability +
          '" references unknown pattern "' + id + '"'
        );
      }
    }
  }

  const taxonomyPlatforms = new Set(taxonomy.platforms ?? []);
  const platformRules = signals.platformRules ?? {};
  for (const platform of taxonomyPlatforms) {
    if (!platformRules[platform]) {
      errors.push('taxonomy/composer-signals.json: platform "' + platform + '" has no Composer rule');
    }
  }
  for (const [platform, config] of Object.entries(platformRules)) {
    if (!taxonomyPlatforms.has(platform)) {
      errors.push('taxonomy/composer-signals.json: unknown platform rule "' + platform + '"');
    }
    if (!Array.isArray(config.require) || config.require.length === 0 || config.require.some((rule) => !String(rule).trim())) {
      errors.push('taxonomy/composer-signals.json: platform "' + platform + '" needs non-empty require rules');
    }
    if (!Array.isArray(config.patterns)) {
      errors.push('taxonomy/composer-signals.json: platform "' + platform + '" patterns must be an array');
      continue;
    }
    for (const id of config.patterns) {
      if (!patternIds.has(id)) {
        errors.push('taxonomy/composer-signals.json: platform "' + platform + '" references unknown pattern "' + id + '"');
      }
    }
  }

  const reducedMotionRules = signals.accessibilityRules?.reducedMotion?.require;
  if (!Array.isArray(reducedMotionRules) || reducedMotionRules.length === 0 || reducedMotionRules.some((rule) => !String(rule).trim())) {
    errors.push("taxonomy/composer-signals.json: accessibilityRules.reducedMotion.require must contain non-empty rules");
  }

  const taxonomyCategories = new Set(taxonomy.recipeCategories ?? []);
  for (const recipeId of recipeIds) {
    const file = path.join(root, "corpus", "recipes", recipeId + ".json");
    if (!fs.existsSync(file)) continue;
    const recipe = readJson(file, root, errors);
    if (!recipe) continue;
    if (!taxonomyCategories.has(recipe.category)) {
      errors.push('taxonomy/composer-signals.json: recipe "' + recipeId + '" has an undeclared category');
    }
    const aliases = new Set((configuredRecipes[recipeId]?.aliases ?? []).map(normalize));
    if (!aliases.has(normalize(recipe.category))) {
      errors.push(
        'taxonomy/composer-signals.json: recipe "' + recipeId +
        '" must include its category "' + recipe.category + '" as an alias'
      );
    }
  }

  return {
    recipeSignalCount: Object.keys(configuredRecipes).length,
    capabilityCount: Object.keys(signals.capabilityPatterns ?? {}).length,
    platformRuleCount: Object.keys(platformRules).length
  };
}

function validateAutoSelection(auto, errors) {
  for (const field of [
    "minimumBaseScore",
    "minimumInfluenceScore",
    "strongInfluenceWeight",
    "mediumInfluenceWeight",
    "lightInfluenceWeight"
  ]) {
    if (!(typeof auto[field] === "number" && Number.isFinite(auto[field]) && auto[field] >= 0)) {
      errors.push('taxonomy/composer-signals.json: autoSelection.' + field + " must be a non-negative number");
    }
  }

  for (const field of ["minimumInfluenceRatio", "strongInfluenceRatio", "mediumInfluenceRatio"]) {
    if (!(typeof auto[field] === "number" && auto[field] >= 0 && auto[field] <= 1)) {
      errors.push('taxonomy/composer-signals.json: autoSelection.' + field + " must be from 0 to 1");
    }
  }

  if (!(Number.isInteger(auto.maxAutoInfluences) && auto.maxAutoInfluences >= 0 && auto.maxAutoInfluences <= 2)) {
    errors.push("taxonomy/composer-signals.json: autoSelection.maxAutoInfluences must be an integer from 0 to 2");
  }

  if (
    typeof auto.strongInfluenceRatio === "number" &&
    typeof auto.mediumInfluenceRatio === "number" &&
    typeof auto.minimumInfluenceRatio === "number" &&
    !(auto.strongInfluenceRatio >= auto.mediumInfluenceRatio &&
      auto.mediumInfluenceRatio >= auto.minimumInfluenceRatio)
  ) {
    errors.push("taxonomy/composer-signals.json: influence ratios must descend strong >= medium >= minimum");
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
    const text = fs.readFileSync(file, "utf8");
    return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
  } catch (error) {
    errors.push(path.relative(root, file).replaceAll("\\", "/") + ": invalid JSON (" + error.message + ")");
    return null;
  }
}

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
