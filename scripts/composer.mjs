import fs from "node:fs";
import path from "node:path";
import { composeRecipeBlend } from "./recipe-blender.mjs";

export function composeDesignContract({ root = process.cwd(), requirements }) {
  const config = readJson(path.join(root, "taxonomy", "composer.json"));
  const taxonomy = readJson(path.join(root, "taxonomy", "taxonomy.json"));
  const recipes = loadRecipes(path.join(root, "corpus", "recipes"));
  const normalized = normalizeRequirements({ requirements, config, taxonomy, recipes });
  const selection = selectBaseRecipe({
    product: normalized.product,
    preferredRecipe: normalized.preferences.recipe,
    config,
    recipes
  });

  const influences = resolveInfluences({
    baseRecipe: selection.recipe,
    influences: normalized.preferences.influences,
    recipes
  });
  const influenceWeight = influences.reduce((sum, item) => sum + item.weight, 0);
  const selections = [
    { id: selection.recipe.id, weight: 1 - influenceWeight },
    ...influences
  ];

  const blend = composeRecipeBlend({ root, selections });
  const personalityResult = resolvePersonality({
    requested: normalized.preferences.personality,
    designDna: blend.design_dna,
    axes: taxonomy.designAxes.axes
  });
  const theme = resolveTheme(normalized.preferences.theme, config);
  const accessibilityTarget = normalized.preferences.accessibilityTarget;
  const reducedMotion = normalized.preferences.reducedMotion === true;

  const warnings = [];
  if (selection.method === "fallback") {
    warnings.push(
      "No recipe keywords matched strongly enough; the configured fallback recipe was used. Prefer an explicit product type or recipe when the product is unusual."
    );
  }

  const rationale = [
    "Base recipe " + selection.recipe.id + " selected via " + selection.method + ".",
    "Platform normalized to " + normalized.product.platform + ".",
    "Accessibility target set to " + accessibilityTarget + ".",
    "Theme resolved to " + theme + "."
  ];

  if (influences.length) {
    rationale.push(
      "Recipe influences applied within bounded composition limits: " +
      influences.map((item) => item.id + " " + Math.round(item.weight * 100) + "%").join(", ") + "."
    );
  }

  for (const clamp of personalityResult.clamps) {
    rationale.push(
      "Requested personality axis " + clamp.axis + " was clamped from " + clamp.requested +
      " to " + clamp.resolved + " to stay inside the selected recipe range."
    );
  }

  for (const conflict of blend.conflicts) {
    rationale.push(
      "Recipe conflict on " + conflict.axis + " resolved with the base recipe range."
    );
  }

  const profile = {
    version: config.version,
    product: {
      type: selection.recipe.category,
      platform: normalized.product.platform,
      audience: normalized.product.audience,
      primaryTask: normalized.product.primaryTask
    },
    personality: personalityResult.values,
    layout: {
      strategy: blend.foundations.layout,
      density: blend.content.density,
      informationDensity: personalityResult.values["information-density"],
      navigationComplexity: personalityResult.values["navigation-complexity"]
    },
    typography: {
      strategy: blend.foundations.typography,
      expression: personalityResult.values["typographic-expression"],
      semanticScale: "tokens/semantic/typography.tokens.json"
    },
    shape: {
      strategy: blend.foundations.shape,
      radius: personalityResult.values.radius,
      borderProminence: personalityResult.values["border-prominence"],
      elevation: blend.foundations.elevation
    },
    color: {
      strategy: blend.foundations.color,
      contrast: personalityResult.values.contrast,
      colorfulness: personalityResult.values.colorfulness,
      warmth: personalityResult.values.warmth,
      semanticOnly: true
    },
    motion: {
      strategy: reducedMotion ? "minimal" : blend.foundations.motion,
      intensity: reducedMotion ? 0 : personalityResult.values["motion-intensity"],
      playfulness: reducedMotion ? 0 : personalityResult.values["motion-playfulness"],
      preference: reducedMotion ? "reduced" : "standard",
      default: "semantic.motion.enter",
      reduced: "semantic.motion.reduced"
    },
    accessibility: {
      target: accessibilityTarget,
      reducedMotionSupport: true,
      highContrastThemeAvailable: true
    },
    rules: {
      require: unique([
        ...blend.constraints.hard,
        "Consume semantic tokens rather than primitive palette values in components.",
        "Support " + accessibilityTarget + " throughout implementation.",
        "Respect user reduced-motion preferences using semantic.motion.reduced."
      ]),
      avoid: unique([
        ...blend.patterns.avoid.map((id) => "Anti-pattern: " + id),
        "Named-product imitation or proprietary brand-asset copying."
      ])
    },
    foundations: {
      tokenManifest: "tokens/manifest.json",
      theme,
      reducedMotionToken: "semantic.motion.reduced",
      overrides: []
    },
    patterns: {
      prioritize: blend.patterns.prioritize,
      consider: blend.patterns.consider,
      avoid: blend.patterns.avoid
    },
    content: blend.content,
    constraints: {
      hard: blend.constraints.hard,
      strongDefaults: blend.constraints.strong_defaults,
      exceptions: blend.constraints.exceptions
    },
    brandSafety: {
      imitateNamedProduct: false,
      copyBrandAssets: false,
      copyProprietaryCode: false
    },
    compiler: {
      version: config.version,
      baseRecipe: selection.recipe.id,
      selectionMethod: selection.method,
      selectionScores: selection.scores,
      selectedRecipes: blend.selections,
      protectedDimensions: blend.protected_dimensions,
      conflicts: blend.conflicts,
      personalityClamps: personalityResult.clamps,
      warnings
    },
    rationale
  };

  return {
    profile,
    designMarkdown: renderDesignMarkdown({ profile, productName: normalized.product.name }),
    agentInstructions: renderAgentInstructions(profile),
    diagnostics: profile.compiler
  };
}

function normalizeRequirements({ requirements, config, taxonomy, recipes }) {
  if (!requirements || typeof requirements !== "object" || Array.isArray(requirements)) {
    throw new Error("Composer requirements must be an object.");
  }
  if (typeof requirements.version !== "string" || !requirements.version.trim()) {
    throw new Error("Composer requirements need a version string.");
  }

  const product = requirements.product;
  if (!product || typeof product !== "object" || Array.isArray(product)) {
    throw new Error("Composer requirements need a product object.");
  }
  if (typeof product.description !== "string" || !product.description.trim()) {
    throw new Error("product.description is required.");
  }

  const preferences = requirements.preferences && typeof requirements.preferences === "object"
    ? requirements.preferences
    : {};
  const personality = preferences.personality && typeof preferences.personality === "object"
    ? preferences.personality
    : {};

  for (const [axis, value] of Object.entries(personality)) {
    if (!taxonomy.designAxes.axes.includes(axis)) {
      throw new Error('Unknown personality axis "' + axis + '".');
    }
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      throw new Error('Personality axis "' + axis + '" must be an integer from 0 to 100.');
    }
  }

  if (preferences.recipe && !recipes.has(preferences.recipe)) {
    throw new Error('Unknown preferred recipe "' + preferences.recipe + '".');
  }

  const platformInput = normalizeText(product.platform || config.default_platform);
  const platform = config.platform_aliases[platformInput];
  if (!platform) {
    throw new Error(
      'Unknown platform "' + (product.platform || "") +
      '". Use a declared platform alias from taxonomy/composer.json.'
    );
  }

  const accessibilityTarget =
    typeof preferences.accessibilityTarget === "string" && preferences.accessibilityTarget.trim()
      ? preferences.accessibilityTarget.trim()
      : config.default_accessibility_target;

  return {
    product: {
      name: typeof product.name === "string" && product.name.trim() ? product.name.trim() : "",
      description: product.description.trim(),
      type: typeof product.type === "string" ? normalizeText(product.type) : "",
      platform,
      audience:
        typeof product.audience === "string" && product.audience.trim()
          ? product.audience.trim()
          : "general users",
      primaryTask:
        typeof product.primaryTask === "string" && product.primaryTask.trim()
          ? product.primaryTask.trim()
          : product.description.trim(),
      features: Array.isArray(product.features)
        ? product.features.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
        : []
    },
    preferences: {
      recipe: preferences.recipe || "",
      influences: Array.isArray(preferences.influences) ? preferences.influences : [],
      personality,
      theme: preferences.theme || "auto",
      accessibilityTarget,
      reducedMotion: preferences.reducedMotion === true
    }
  };
}

function selectBaseRecipe({ product, preferredRecipe, config, recipes }) {
  if (preferredRecipe) {
    return {
      recipe: recipes.get(preferredRecipe),
      method: "explicit-recipe",
      scores: {}
    };
  }

  if (product.type) {
    if (recipes.has(product.type)) {
      return {
        recipe: recipes.get(product.type),
        method: "product-type",
        scores: {}
      };
    }

    const direct = config.recipe_selection[product.type];
    if (direct && recipes.has(direct.recipe)) {
      return {
        recipe: recipes.get(direct.recipe),
        method: "product-type",
        scores: {}
      };
    }

    const byCategory = [...recipes.values()].find((recipe) => recipe.category === product.type);
    if (byCategory) {
      return {
        recipe: byCategory,
        method: "product-type",
        scores: {}
      };
    }
  }

  const haystack = normalizeText(
    [
      product.type,
      product.description,
      product.primaryTask,
      product.audience,
      ...product.features
    ].join(" ")
  );

  const scores = {};
  let bestRecipe = null;
  let bestScore = 0;

  for (const [category, rule] of Object.entries(config.recipe_selection)) {
    const score = rule.keywords.reduce(
      (sum, keyword) => sum + (haystack.includes(normalizeText(keyword)) ? 1 : 0),
      0
    );
    scores[category] = score;
    if (score > bestScore && recipes.has(rule.recipe)) {
      bestScore = score;
      bestRecipe = recipes.get(rule.recipe);
    }
  }

  if (bestRecipe) {
    return {
      recipe: bestRecipe,
      method: "keyword-score",
      scores
    };
  }

  const fallback = recipes.get(config.default_recipe);
  if (!fallback) {
    throw new Error('Configured fallback recipe "' + config.default_recipe + '" does not exist.');
  }
  return {
    recipe: fallback,
    method: "fallback",
    scores
  };
}

function resolveInfluences({ baseRecipe, influences, recipes }) {
  if (influences.length > 2) {
    throw new Error("Composer supports at most two influence recipes.");
  }

  const seen = new Set([baseRecipe.id]);
  return influences.map((influence, index) => {
    if (!influence || typeof influence !== "object") {
      throw new Error("Influence " + index + " must be an object.");
    }
    if (typeof influence.id !== "string" || !recipes.has(influence.id)) {
      throw new Error('Unknown influence recipe "' + (influence.id || "") + '".');
    }
    if (seen.has(influence.id)) {
      throw new Error('Duplicate recipe influence "' + influence.id + '".');
    }
    seen.add(influence.id);
    if (!(typeof influence.weight === "number" && influence.weight > 0 && influence.weight < 0.5)) {
      throw new Error('Influence weight for "' + influence.id + '" must be greater than 0 and less than 0.5.');
    }
    return { id: influence.id, weight: influence.weight };
  });
}

function resolvePersonality({ requested, designDna, axes }) {
  const values = {};
  const clamps = [];

  for (const axis of axes) {
    const contract = designDna[axis];
    if (!contract) throw new Error('Composed recipe is missing Design DNA axis "' + axis + '".');

    const wanted = Object.prototype.hasOwnProperty.call(requested, axis)
      ? requested[axis]
      : contract.target;
    const resolved = clamp(wanted, contract.min, contract.max);
    values[axis] = resolved;

    if (resolved !== wanted) {
      clamps.push({
        axis,
        requested: wanted,
        resolved,
        min: contract.min,
        max: contract.max
      });
    }
  }

  return { values, clamps };
}

function resolveTheme(theme, config) {
  if (!config.allowed_themes.includes(theme)) {
    throw new Error('Unknown theme "' + theme + '".');
  }
  return theme === "auto" ? config.default_theme : theme;
}

function renderDesignMarkdown({ profile, productName }) {
  const title = productName || profile.product.type;
  const lines = [
    "# Design Contract: " + title,
    "",
    "Generated by Design Distillation " + profile.compiler.version + ". Machine-readable source: design-profile.json.",
    "",
    "## Product",
    "",
    "- Type: " + profile.product.type,
    "- Platform: " + profile.product.platform,
    "- Audience: " + profile.product.audience,
    "- Primary task: " + profile.product.primaryTask,
    "- Base recipe: " + profile.compiler.baseRecipe,
    "",
    "## Design DNA",
    "",
    "| Axis | Value |",
    "| --- | ---: |",
    ...Object.entries(profile.personality).map(([axis, value]) => "| " + axis + " | " + value + " |"),
    "",
    "## Foundations",
    "",
    "- Layout: " + profile.layout.strategy,
    "- Typography: " + profile.typography.strategy,
    "- Color: " + profile.color.strategy,
    "- Shape: " + profile.shape.strategy,
    "- Elevation: " + profile.shape.elevation,
    "- Motion: " + profile.motion.strategy,
    "- Theme: " + profile.foundations.theme,
    "",
    "## Accessibility",
    "",
    "- Target: " + profile.accessibility.target,
    "- Reduced-motion support is required.",
    "- A high-contrast theme is available through the shared token contract.",
    "",
    "## Prioritize these UX patterns",
    "",
    ...list(profile.patterns.prioritize),
    "",
    "## Consider these UX patterns",
    "",
    ...list(profile.patterns.consider),
    "",
    "## Hard constraints",
    "",
    ...list(profile.constraints.hard),
    "",
    "## Strong defaults",
    "",
    ...list(profile.constraints.strongDefaults),
    "",
    "## Avoid",
    "",
    ...list(profile.rules.avoid),
    "",
    "## Rationale",
    "",
    ...list(profile.rationale),
    "",
    "## Brand safety",
    "",
    "Do not imitate a named product, copy proprietary code, or reuse proprietary brand assets. The contract describes abstract design decisions, not trade dress.",
    ""
  ];

  return lines.join("\n");
}

function renderAgentInstructions(profile) {
  const lines = [
    "# Design Agent Instructions",
    "",
    "Treat design-profile.json as the canonical design contract for this project.",
    "",
    "## Required behavior",
    "",
    ...list(profile.rules.require),
    "",
    "## UX priorities",
    "",
    ...list(profile.patterns.prioritize.map((id) => "Use the " + id + " pattern when its documented conditions apply.")),
    "",
    "## Avoid",
    "",
    ...list(profile.rules.avoid),
    "",
    "## Implementation constraints",
    "",
    "- Consume semantic tokens from " + profile.foundations.tokenManifest + "; do not invent one-off visual scales.",
    "- Preserve the selected " + profile.foundations.theme + " theme semantics and reduced-motion path.",
    "- Keep layout, typography, color, shape, elevation, and motion aligned with the strategies in design-profile.json.",
    "- If product needs require a deliberate deviation, record the rationale instead of silently drifting from the contract.",
    "- Never use this contract as permission to clone a named product or proprietary design system.",
    ""
  ];

  return lines.join("\n");
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

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function unique(values) {
  return [...new Set(values)];
}

function list(values) {
  return values.length ? values.map((value) => "- " + value) : ["- None."];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
