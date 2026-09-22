import fs from "node:fs";
import path from "node:path";

export function composeRecipeBlend({ root = process.cwd(), selections }) {
  const config = readJson(path.join(root, "taxonomy", "recipe-composition.json"));
  const recipes = loadRecipes(path.join(root, "corpus", "recipes"));
  const errors = [];

  if (!Array.isArray(selections) || selections.length === 0) {
    throw new Error("Recipe blend requires at least one selection.");
  }
  if (selections.length > config.max_recipes) {
    errors.push("selection count exceeds global max_recipes");
  }

  const seen = new Set();
  let totalWeight = 0;
  const resolved = selections.map((selection, index) => {
    if (!selection || typeof selection !== "object") {
      errors.push("selection " + index + " must be an object");
      return null;
    }
    if (seen.has(selection.id)) errors.push('duplicate recipe selection "' + selection.id + '"');
    seen.add(selection.id);

    const recipe = recipes.get(selection.id);
    if (!recipe) errors.push('unknown recipe "' + selection.id + '"');

    if (!(typeof selection.weight === "number" && selection.weight > 0 && selection.weight <= 1)) {
      errors.push('invalid weight for recipe "' + selection.id + '"');
    } else {
      totalWeight += selection.weight;
    }

    return recipe ? { recipe, weight: selection.weight } : null;
  }).filter(Boolean);

  if (Math.abs(totalWeight - 1) > 1e-9) errors.push("recipe weights must sum to 1");
  if (!resolved.length) throwBlend(errors);

  const base = resolved[0];
  const baseMinimum = Math.max(config.base_weight_min, base.recipe.composition.base_weight_min);
  if (base.weight < baseMinimum) errors.push("base recipe weight is below its required minimum");

  const influenceTotal = resolved.slice(1).reduce((sum, item) => sum + item.weight, 0);
  if (influenceTotal > config.max_total_influence + 1e-9) errors.push("total influence weight exceeds global maximum");

  for (const item of resolved.slice(1)) {
    const max = Math.min(config.influence_weight_max, item.recipe.composition.influence_weight_max);
    if (item.weight > max + 1e-9) errors.push('influence weight for "' + item.recipe.id + '" exceeds its allowed maximum');
  }

  if (errors.length) throwBlend(errors);

  const conflicts = [];
  const protectedByBase = new Set(base.recipe.composition.protected_dimensions);
  const axisNames = Object.keys(base.recipe.design_dna);
  const designDna = {};

  for (const axis of axisNames) {
    if (protectedByBase.has(axis)) {
      designDna[axis] = {
        ...base.recipe.design_dna[axis],
        resolution: "protected-base"
      };
      continue;
    }

    const values = resolved.map(({ recipe, weight }) => ({
      ...recipe.design_dna[axis],
      weightShare: weight
    }));

    const target = Math.round(values.reduce((sum, value) => sum + value.target * value.weightShare, 0));
    const intersectMin = Math.max(...values.map((value) => value.min));
    const intersectMax = Math.min(...values.map((value) => value.max));
    const mergedWeight = Math.max(...values.map((value) => value.weight));

    if (intersectMin <= intersectMax) {
      designDna[axis] = {
        target: clamp(target, intersectMin, intersectMax),
        min: intersectMin,
        max: intersectMax,
        weight: mergedWeight,
        resolution: "weighted-intersection"
      };
    } else {
      designDna[axis] = {
        ...base.recipe.design_dna[axis],
        weight: mergedWeight,
        resolution: "base-range-conflict"
      };
      conflicts.push({
        type: "axis-range-conflict",
        axis,
        resolution: "base-recipe-range",
        recipes: resolved.map(({ recipe }) => recipe.id)
      });
    }
  }

  const prioritized = unique(resolved.flatMap(({ recipe }) => recipe.patterns.prioritize));
  const prioritizedSet = new Set(prioritized);
  const considered = unique(resolved.flatMap(({ recipe }) => recipe.patterns.consider))
    .filter((id) => !prioritizedSet.has(id));

  return {
    version: config.version,
    base_recipe: base.recipe.id,
    selections: resolved.map(({ recipe, weight }, index) => ({
      id: recipe.id,
      weight,
      role: index === 0 ? "base" : "influence"
    })),
    design_dna: designDna,
    foundations: { ...base.recipe.foundations },
    patterns: {
      prioritize: prioritized,
      consider: considered,
      avoid: unique(resolved.flatMap(({ recipe }) => recipe.patterns.avoid))
    },
    content: {
      voice: unique(resolved.flatMap(({ recipe }) => recipe.content.voice)),
      density: base.recipe.content.density,
      guidance: unique(resolved.flatMap(({ recipe }) => recipe.content.guidance))
    },
    constraints: {
      hard: unique(resolved.flatMap(({ recipe }) => recipe.constraints.hard)),
      strong_defaults: unique(resolved.flatMap(({ recipe }) => recipe.constraints.strong_defaults)),
      exceptions: unique(resolved.flatMap(({ recipe }) => recipe.constraints.exceptions))
    },
    protected_dimensions: unique(resolved.flatMap(({ recipe }) => recipe.composition.protected_dimensions)),
    conflicts,
    resolution: {
      numeric_axes: "weighted targets; intersect ranges where possible; base range on conflict",
      protected_axes: "base recipe wins",
      categorical_foundations: "base recipe wins",
      constraints: "union with base defaults listed first",
      brand_safety: "non-negotiable"
    },
    brand_safety: {
      named_product_style_blending: false,
      proprietary_asset_copying: false,
      proprietary_code_copying: false
    }
  };
}

function loadRecipes(dir) {
  const map = new Map();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const recipe = readJson(path.join(dir, file));
    map.set(recipe.id, recipe);
  }
  return map;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function unique(values) {
  return [...new Set(values)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function throwBlend(errors) {
  throw new Error("Recipe blend invalid:\n- " + errors.join("\n- "));
}
