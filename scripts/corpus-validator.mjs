import fs from "node:fs";
import path from "node:path";

export function validateCorpus({ root, errors }) {
  const corpusRoot = path.join(root, "corpus");
  const taxonomyPath = path.join(root, "taxonomy", "taxonomy.json");
  const recipeCompositionPath = path.join(root, "taxonomy", "recipe-composition.json");
  const taxonomy = readJson(taxonomyPath, root, errors);
  if (!taxonomy) return { entryCount: 0, patternCount: 0, antiPatternCount: 0, familyCount: 0 };
  const recipeComposition = readJson(recipeCompositionPath, root, errors);

  const knownKinds = new Set(taxonomy.entryKinds ?? []);
  const knownSources = new Set(taxonomy.sourceTypes ?? []);
  const knownPlatforms = new Set(taxonomy.platforms ?? []);
  const knownStages = new Set(taxonomy.stages ?? []);
  const knownFamilies = new Set(taxonomy.patternFamilies ?? []);
  const knownStates = new Set(taxonomy.patternStates ?? []);
  const knownEvidence = new Set(taxonomy.evidenceLevels ?? []);
  const knownSeverities = new Set(taxonomy.severities ?? []);
  const knownRecipeCategories = new Set(taxonomy.recipeCategories ?? []);
  const knownDesignAxes = new Set(taxonomy.designAxes?.axes ?? []);
  const knownProtectedDimensions = new Set(taxonomy.recipeProtectedDimensions ?? []);
  const recipeStrategies = taxonomy.recipeStrategies ?? {};

  const ids = new Map();
  const entries = new Map();
  const patternTitles = new Map();
  const recipeTitles = new Map();
  const familiesSeen = new Set();
  const recipeCategoriesSeen = new Set();

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
    if (entry.kind === "recipe") validateRecipe(entry, file);
  }

  for (const [id, { entry, file }] of entries) {
    if (entry.kind === "pattern") {
      for (const relatedId of entry.related?.patterns ?? []) validateReference(id, file, relatedId, "pattern");
      for (const relatedId of entry.related?.anti_patterns ?? []) validateReference(id, file, relatedId, "anti-pattern");
    }
    if (entry.kind === "recipe") {
      for (const patternId of entry.patterns?.prioritize ?? []) validateReference(id, file, patternId, "pattern");
      for (const patternId of entry.patterns?.consider ?? []) validateReference(id, file, patternId, "pattern");
      for (const antiPatternId of entry.patterns?.avoid ?? []) validateReference(id, file, antiPatternId, "anti-pattern");
    }
  }

  for (const family of knownFamilies) {
    if (!familiesSeen.has(family)) errors.push('taxonomy/taxonomy.json: pattern family "' + family + '" has no corpus coverage');
  }
  for (const category of knownRecipeCategories) {
    if (!recipeCategoriesSeen.has(category)) errors.push('taxonomy/taxonomy.json: recipe category "' + category + '" has no corpus coverage');
  }

  validateRecipeComposition();

  return {
    entryCount: ids.size,
    patternCount: [...entries.values()].filter(({ entry }) => entry.kind === "pattern").length,
    antiPatternCount: [...entries.values()].filter(({ entry }) => entry.kind === "anti-pattern").length,
    familyCount: familiesSeen.size,
    recipeCount: [...entries.values()].filter(({ entry }) => entry.kind === "recipe").length,
    recipeCategoryCount: recipeCategoriesSeen.size,
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

  function validateRecipe(entry, file) {
    for (const key of ["category", "intent", "design_dna", "foundations", "patterns", "content", "constraints", "composition", "brand_safety"]) {
      if (entry[key] === undefined || entry[key] === null) fail(errors, root, file, 'recipe missing required field "' + key + '"');
    }

    if (!knownRecipeCategories.has(entry.category)) fail(errors, root, file, 'unknown recipe category "' + entry.category + '"');
    else recipeCategoriesSeen.add(entry.category);

    const normalizedTitle = normalize(entry.title);
    if (recipeTitles.has(normalizedTitle)) fail(errors, root, file, 'duplicate normalized recipe title with "' + recipeTitles.get(normalizedTitle) + '"');
    else recipeTitles.set(normalizedTitle, entry.id);

    requireArray(entry.intent?.primary_outcomes, file, "intent.primary_outcomes");
    requireArray(entry.intent?.interaction_model, file, "intent.interaction_model");
    if (!["standard", "elevated", "high"].includes(entry.intent?.trust_level)) fail(errors, root, file, 'invalid recipe trust level "' + entry.intent?.trust_level + '"');

    const dna = entry.design_dna ?? {};
    for (const axis of knownDesignAxes) {
      if (!Object.prototype.hasOwnProperty.call(dna, axis)) {
        fail(errors, root, file, 'design_dna missing axis "' + axis + '"');
        continue;
      }
      validateAxis(axis, dna[axis], file);
    }
    for (const axis of Object.keys(dna)) {
      if (!knownDesignAxes.has(axis)) fail(errors, root, file, 'design_dna has unknown axis "' + axis + '"');
    }

    for (const [strategyName, allowedValues] of Object.entries(recipeStrategies)) {
      const actual = entry.foundations?.[strategyName];
      if (!actual) fail(errors, root, file, 'foundations missing strategy "' + strategyName + '"');
      else if (!allowedValues.includes(actual)) fail(errors, root, file, 'unknown ' + strategyName + ' strategy "' + actual + '"');
    }
    for (const strategyName of Object.keys(entry.foundations ?? {})) {
      if (!Object.prototype.hasOwnProperty.call(recipeStrategies, strategyName)) fail(errors, root, file, 'unknown foundation strategy group "' + strategyName + '"');
    }

    requireArray(entry.patterns?.prioritize, file, "patterns.prioritize");
    if (!Array.isArray(entry.patterns?.consider)) fail(errors, root, file, "patterns.consider must be an array");
    requireArray(entry.patterns?.avoid, file, "patterns.avoid");
    const prioritized = new Set(entry.patterns?.prioritize ?? []);
    for (const id of entry.patterns?.consider ?? []) {
      if (prioritized.has(id)) fail(errors, root, file, 'pattern "' + id + '" cannot be both prioritize and consider');
    }

    requireArray(entry.content?.voice, file, "content.voice");
    requireArray(entry.content?.guidance, file, "content.guidance");
    if (!["low", "medium", "medium-high", "high"].includes(entry.content?.density)) fail(errors, root, file, 'invalid content density "' + entry.content?.density + '"');

    requireArray(entry.constraints?.hard, file, "constraints.hard");
    requireArray(entry.constraints?.strong_defaults, file, "constraints.strong_defaults");
    requireArray(entry.constraints?.exceptions, file, "constraints.exceptions");

    const baseWeight = entry.composition?.base_weight_min;
    const influenceWeight = entry.composition?.influence_weight_max;
    if (!(typeof baseWeight === "number" && baseWeight >= 0.5 && baseWeight <= 1)) fail(errors, root, file, "composition.base_weight_min must be between 0.5 and 1");
    if (!(typeof influenceWeight === "number" && influenceWeight >= 0 && influenceWeight <= 0.5)) fail(errors, root, file, "composition.influence_weight_max must be between 0 and 0.5");
    if (recipeComposition) {
      if (typeof recipeComposition.base_weight_min === "number" && baseWeight < recipeComposition.base_weight_min) fail(errors, root, file, "composition.base_weight_min is below global recipe minimum");
      if (typeof recipeComposition.influence_weight_max === "number" && influenceWeight > recipeComposition.influence_weight_max) fail(errors, root, file, "composition.influence_weight_max exceeds global recipe maximum");
    }

    if (!Array.isArray(entry.composition?.protected_dimensions)) fail(errors, root, file, "composition.protected_dimensions must be an array");
    else {
      for (const dimension of entry.composition.protected_dimensions) {
        if (!knownProtectedDimensions.has(dimension)) fail(errors, root, file, 'unknown protected dimension "' + dimension + '"');
      }
    }

    for (const key of ["copy_brand_assets", "copy_proprietary_code", "imitate_named_product"]) {
      if (entry.brand_safety?.[key] !== false) fail(errors, root, file, "brand_safety." + key + " must be false");
    }
  }

  function validateAxis(axis, value, file) {
    if (!value || typeof value !== "object") {
      fail(errors, root, file, 'design_dna."' + axis + '" must be an object');
      return;
    }
    const { target, min, max, weight } = value;
    for (const [name, number] of [["target", target], ["min", min], ["max", max]]) {
      if (!(Number.isInteger(number) && number >= 0 && number <= 100)) fail(errors, root, file, 'design_dna."' + axis + '".' + name + " must be an integer from 0 to 100");
    }
    if (Number.isInteger(min) && Number.isInteger(target) && Number.isInteger(max) && !(min <= target && target <= max)) {
      fail(errors, root, file, 'design_dna."' + axis + '" must satisfy min <= target <= max');
    }
    if (!(typeof weight === "number" && weight >= 0 && weight <= 1)) fail(errors, root, file, 'design_dna."' + axis + '".weight must be from 0 to 1');
  }

  function validateRecipeComposition() {
    if (!recipeComposition) return;
    if (!(Number.isInteger(recipeComposition.max_recipes) && recipeComposition.max_recipes >= 1)) errors.push("taxonomy/recipe-composition.json: max_recipes must be a positive integer");
    if (!(typeof recipeComposition.base_weight_min === "number" && recipeComposition.base_weight_min >= 0.5 && recipeComposition.base_weight_min <= 1)) errors.push("taxonomy/recipe-composition.json: base_weight_min must be between 0.5 and 1");
    if (!(typeof recipeComposition.max_total_influence === "number" && recipeComposition.max_total_influence >= 0 && recipeComposition.max_total_influence <= 0.5)) errors.push("taxonomy/recipe-composition.json: max_total_influence must be between 0 and 0.5");
    if (!(typeof recipeComposition.influence_weight_max === "number" && recipeComposition.influence_weight_max >= 0 && recipeComposition.influence_weight_max <= recipeComposition.max_total_influence)) errors.push("taxonomy/recipe-composition.json: influence_weight_max must not exceed max_total_influence");
    for (const key of ["named_product_style_blending", "proprietary_asset_copying", "proprietary_code_copying"]) {
      if (recipeComposition.brand_safety?.[key] !== false) errors.push("taxonomy/recipe-composition.json: brand_safety." + key + " must be false");
    }
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
