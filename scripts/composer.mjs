import fs from "node:fs";
import path from "node:path";
import { composeRecipeBlend } from "./recipe-blender.mjs";
import { assertJsonSchemaSubset } from "./json-schema-lite.mjs";

export function composeDesign({ root = process.cwd(), input }) {
  assertJsonSchemaSubset(
    readJson(path.join(root, "schemas", "composer-input.schema.json")),
    input,
    "Composer input"
  );
  validateInputShape(input);

  const taxonomy = readJson(path.join(root, "taxonomy", "taxonomy.json"));
  const signals = readJson(path.join(root, "taxonomy", "composer-signals.json"));
  const recipes = loadEntries(path.join(root, "corpus", "recipes"));
  const patterns = loadEntries(path.join(root, "corpus", "patterns"));
  const antiPatterns = loadEntries(path.join(root, "corpus", "anti-patterns"));

  const scoring = scoreRecipes({ input, signals, recipes });
  const selection = resolveRecipeSelection({ input, scoring, recipes, signals });
  const blend = composeRecipeBlend({
    root,
    selections: selection.recipes.map(({ id, weight }) => ({ id, weight }))
  });

  const decisions = [];
  const conflicts = [...blend.conflicts];
  const personality = resolvePersonality({
    blend,
    input,
    knownAxes: new Set(taxonomy.designAxes?.axes ?? []),
    decisions,
    conflicts
  });

  const platformRequirements = resolvePlatformRequirements({
    platform: input.product.platform,
    signals,
    patterns
  });
  decisions.push({
    type: "platform-constraint",
    field: "product.platform",
    requested: input.product.platform,
    applied: input.product.platform,
    reason: "Applied the canonical platform behavior and UX requirements for this target."
  });

  const accessibilityRequirements = resolveAccessibilityRequirements({
    reducedMotionRequired: input.accessibility?.reduced_motion === true,
    signals,
    decisions
  });

  const capabilityPatterns = resolveCapabilityPatterns({
    capabilities: input.product.capabilities ?? [],
    signals,
    patterns
  });

  const prioritized = unique([
    ...blend.patterns.prioritize,
    ...capabilityPatterns,
    ...platformRequirements.patterns,
    ...(input.preferences?.required_patterns ?? [])
  ]);
  validateReferences(prioritized, patterns, "required pattern");

  const considered = unique(blend.patterns.consider)
    .filter((id) => !prioritized.includes(id));

  const avoided = unique([
    ...blend.patterns.avoid,
    ...(input.preferences?.avoid_anti_patterns ?? [])
  ]);
  validateReferences(avoided, antiPatterns, "anti-pattern");

  const reducedMotionRequired = input.accessibility?.reduced_motion === true;
  const inspirationTraits = unique(input.inspiration?.traits ?? []);
  const namedInspirations = unique(input.inspiration?.named_products ?? []);
  if (namedInspirations.length) {
    decisions.push({
      type: "brand-safety",
      field: "inspiration.named_products",
      requested: namedInspirations,
      applied: "reference-only",
      reason: "Named products never participate in recipe scoring or authorize copying; only abstract reusable traits may guide implementation."
    });
  }
  const requiredRules = unique([
    "Consume semantic tokens instead of hard-coded primitive design values in product components.",
    "Preserve explicit loading, empty, error, disabled, focus, and recovery states where the selected patterns require them.",
    ...platformRequirements.require,
    ...blend.constraints.hard,
    ...blend.constraints.strong_defaults,
    ...accessibilityRequirements.require,
    ...(inspirationTraits.length
      ? ["Preserve these abstract inspiration traits without copying a named product: " + inspirationTraits.join(", ") + "."]
      : []),
    ...(input.preferences?.require ?? [])
  ]);

  const avoidRules = unique([
    ...avoided.map((id) => "Avoid anti-pattern: " + id + "."),
    "Do not imitate a named product's exact visual identity, proprietary implementation, or brand assets.",
    ...(input.preferences?.avoid ?? [])
  ]);

  const theme = input.preferences?.theme ?? "light";
  const navigation = inferNavigation(prioritized);
  const accessibilityTarget = input.accessibility?.target ?? "WCAG 2.2 AA";

  const profile = {
    version: "0.5.0",
    product: {
      name: input.product.name,
      type: input.product.type,
      description: input.product.description,
      platform: input.product.platform,
      audience: input.product.audience,
      primaryTask: input.product.primary_task,
      capabilities: [...(input.product.capabilities ?? [])]
    },
    selection: {
      mode: selection.mode,
      baseRecipe: selection.recipes[0].id,
      recipes: selection.recipes.map((recipe, index) => ({
        id: recipe.id,
        weight: recipe.weight,
        role: index === 0 ? "base" : "influence",
        score: scoring.byId.get(recipe.id)?.score ?? 0,
        evidence: scoring.byId.get(recipe.id)?.evidence ?? []
      }))
    },
    personality,
    layout: {
      strategy: blend.foundations.layout,
      density: blend.content.density,
      navigation,
      spacing: "semantic"
    },
    typography: {
      strategy: blend.foundations.typography,
      body: "semantic.type.body-medium",
      heading: "semantic.type.heading-medium"
    },
    shape: {
      strategy: blend.foundations.shape,
      controlRadius: "semantic.radius.control",
      surfaceRadius: "semantic.radius.surface",
      elevation: blend.foundations.elevation
    },
    color: {
      strategy: blend.foundations.color,
      semanticOnly: true
    },
    motion: {
      strategy: blend.foundations.motion,
      default: "semantic.motion.enter",
      reduced: "semantic.motion.reduced"
    },
    iconography: {
      strategy: blend.foundations.iconography
    },
    imagery: {
      strategy: blend.foundations.imagery
    },
    accessibility: {
      target: accessibilityTarget,
      reducedMotion: reducedMotionRequired ? "required" : "supported"
    },
    patterns: {
      prioritize: prioritized,
      consider: considered,
      avoid: avoided
    },
    content: {
      voice: blend.content.voice,
      density: blend.content.density,
      guidance: blend.content.guidance
    },
    rules: {
      require: requiredRules,
      avoid: avoidRules
    },
    foundations: {
      tokenManifest: "tokens/manifest.json",
      theme,
      reducedMotionToken: "semantic.motion.reduced",
      overrides: decisions
        .filter((decision) => decision.type === "personality-preference" || decision.type === "accessibility-constraint")
        .map((decision) => decision.field + "=" + decision.applied)
    },
    rationale: buildRationale({ selection, scoring, blend, input }),
    conflicts,
    decisions,
    provenance: {
      composer: "deterministic-v0.5",
      inputVersion: input.version,
      tokenManifest: "tokens/manifest.json",
      recipeCorpusVersion: taxonomy.version
    }
  };

  assertJsonSchemaSubset(
    readJson(path.join(root, "schemas", "design-profile.schema.json")),
    profile,
    "Generated design profile"
  );

  return {
    profile,
    designMarkdown: renderDesignMarkdown(profile, { patterns, antiPatterns }),
    agentInstructions: renderAgentInstructions(profile)
  };
}

export function scoreRecipes({ input, signals, recipes }) {
  const fields = {
    category_hints: input.product.category_hints ?? [],
    type: [input.product.type],
    primary_task: [input.product.primary_task],
    description: [input.product.description],
    goals: input.goals ?? [],
    audience: [input.product.audience],
    brand_descriptors: input.brand?.descriptors ?? []
  };

  const results = [];

  for (const [id, recipe] of recipes) {
    const definition = signals.recipes?.[id];
    if (!definition) continue;
    const aliases = unique([recipe.category, id, ...(definition.aliases ?? [])]).map(normalize);
    const keywords = unique([...(definition.keywords ?? []), ...(definition.aliases ?? [])]).map(normalize);
    const evidence = [];
    let score = 0;

    for (const [field, values] of Object.entries(fields)) {
      const points = signals.fieldWeights?.[field] ?? 0;
      const normalizedValues = values.map(normalize).filter(Boolean);
      const seenTerms = new Set();

      if (field === "category_hints") {
        for (const value of normalizedValues) {
          for (const alias of aliases) {
            if (value === alias && !seenTerms.has(alias)) {
              score += points;
              evidence.push({ field, term: alias, points });
              seenTerms.add(alias);
            }
          }
        }
        continue;
      }

      for (const value of normalizedValues) {
        for (const term of keywords) {
          if (containsPhrase(value, term) && !seenTerms.has(term)) {
            score += points;
            evidence.push({ field, term, points });
            seenTerms.add(term);
          }
        }
      }
    }

    results.push({
      id,
      score,
      evidence,
      trustLevel: recipe.intent?.trust_level ?? "standard"
    });
  }

  const trustRank = { standard: 0, elevated: 1, high: 2 };
  results.sort((a, b) =>
    b.score - a.score ||
    (trustRank[b.trustLevel] ?? 0) - (trustRank[a.trustLevel] ?? 0) ||
    a.id.localeCompare(b.id)
  );
  return {
    ranked: results,
    byId: new Map(results.map((result) => [result.id, result]))
  };
}

function resolveRecipeSelection({ input, scoring, recipes, signals }) {
  const mode = input.recipe_selection?.mode ?? "auto";

  if (mode === "explicit") {
    const selections = input.recipe_selection?.selections;
    if (!Array.isArray(selections) || selections.length === 0) {
      throw new Error("Explicit recipe selection requires recipe_selection.selections.");
    }
    for (const selection of selections) {
      if (!recipes.has(selection.id)) throw new Error('Unknown explicit recipe "' + selection.id + '".');
    }
    return {
      mode,
      recipes: selections.map((selection) => ({
        id: selection.id,
        weight: selection.weight
      }))
    };
  }

  const auto = signals.autoSelection ?? {};
  const [base, second] = scoring.ranked;
  if (!base || base.score < (auto.minimumBaseScore ?? 1)) {
    throw new Error(
      "Composer could not infer a credible base recipe. Add product.category_hints or use explicit recipe_selection."
    );
  }

  const baseRecipe = recipes.get(base.id);
  let influence = null;

  if (
    second &&
    (auto.maxAutoInfluences ?? 1) > 0 &&
    second.score >= (auto.minimumInfluenceScore ?? Infinity) &&
    second.score / base.score >= (auto.minimumInfluenceRatio ?? 1)
  ) {
    const ratio = second.score / base.score;
    let requested = auto.lightInfluenceWeight ?? 0.2;
    if (ratio >= (auto.strongInfluenceRatio ?? 1)) requested = auto.strongInfluenceWeight ?? 0.3;
    else if (ratio >= (auto.mediumInfluenceRatio ?? 1)) requested = auto.mediumInfluenceWeight ?? 0.25;

    const influenceRecipe = recipes.get(second.id);
    const maxByBase = 1 - Math.max(0.5, baseRecipe.composition.base_weight_min);
    const maxByInfluence = influenceRecipe.composition.influence_weight_max;
    const weight = Math.min(requested, maxByBase, maxByInfluence);
    if (weight >= 0.1) influence = { id: second.id, weight };
  }

  if (!influence) {
    return { mode, recipes: [{ id: base.id, weight: 1 }] };
  }

  return {
    mode,
    recipes: [
      { id: base.id, weight: roundWeight(1 - influence.weight) },
      { id: influence.id, weight: roundWeight(influence.weight) }
    ]
  };
}

function resolvePersonality({ blend, input, knownAxes, decisions, conflicts }) {
  const personality = Object.fromEntries(
    Object.entries(blend.design_dna).map(([axis, value]) => [axis, value.target])
  );

  const requested = {
    ...(input.personality ?? {})
  };
  if (Number.isInteger(input.brand?.prominence) && requested["brand-prominence"] === undefined) {
    requested["brand-prominence"] = input.brand.prominence;
  }

  for (const [axis, value] of Object.entries(requested)) {
    if (!knownAxes.has(axis)) throw new Error('Unknown personality axis "' + axis + '".');
    if (!(Number.isInteger(value) && value >= 0 && value <= 100)) {
      throw new Error('Personality axis "' + axis + '" must be an integer from 0 to 100.');
    }

    const range = blend.design_dna[axis];
    const applied = clamp(value, range.min, range.max);
    personality[axis] = applied;
    decisions.push({
      type: "personality-preference",
      field: axis,
      requested: value,
      applied,
      reason: applied === value
        ? "Preference fits inside the selected recipe range."
        : "Preference was clamped to the selected recipe range to preserve recipe coherence."
    });
    if (applied !== value) {
      conflicts.push({
        type: "personality-outside-recipe-range",
        axis,
        requested: value,
        allowed_range: { min: range.min, max: range.max },
        resolution: "clamped-to-recipe-range"
      });
    }
  }

  return personality;
}

function resolveCapabilityPatterns({ capabilities, signals, patterns }) {
  const resolved = [];
  for (const capability of capabilities) {
    const ids = signals.capabilityPatterns?.[capability] ?? [];
    validateReferences(ids, patterns, 'capability pattern for "' + capability + '"');
    resolved.push(...ids);
  }
  return unique(resolved);
}

function resolvePlatformRequirements({ platform, signals, patterns }) {
  const config = signals.platformRules?.[platform];
  if (!config) throw new Error('No Composer platform rule exists for "' + platform + '".');
  const patternIds = config.patterns ?? [];
  validateReferences(patternIds, patterns, 'platform pattern for "' + platform + '"');
  return {
    patterns: unique(patternIds),
    require: unique(config.require ?? [])
  };
}

function resolveAccessibilityRequirements({ reducedMotionRequired, signals, decisions }) {
  if (!reducedMotionRequired) return { require: [] };
  const config = signals.accessibilityRules?.reducedMotion;
  if (!config) throw new Error("Composer accessibility rules are missing reducedMotion configuration.");
  decisions.push({
    type: "accessibility-constraint",
    field: "accessibility.reduced_motion",
    requested: true,
    applied: "required",
    reason: "Accessibility constraints are hard requirements and cannot be displaced by visual or motion preferences."
  });
  return { require: unique(config.require ?? []) };
}

function buildRationale({ selection, scoring, blend, input }) {
  const rationale = [];
  const base = selection.recipes[0];
  const baseScore = scoring.byId.get(base.id);
  const evidence = (baseScore?.evidence ?? []).slice(0, 5)
    .map((item) => item.field + ":" + item.term + " (+" + item.points + ")")
    .join(", ");

  if (selection.mode === "auto") {
    rationale.push(
      "Selected " + base.id + " as the base recipe from deterministic requirement signals" +
      (evidence ? ": " + evidence + "." : ".")
    );
  } else {
    rationale.push("Used explicit recipe selection supplied by the product requirements.");
  }

  if (selection.recipes.length > 1) {
    const influence = selection.recipes[1];
    rationale.push(
      "Applied " + influence.id + " as a bounded " + Math.round(influence.weight * 100) +
      "% influence while preserving protected base dimensions."
    );
  }

  rationale.push(
    "Resolved categorical foundations from the base recipe and merged compatible UX guidance from selected recipes."
  );

  if ((input.product.capabilities ?? []).length) {
    rationale.push(
      "Added UX patterns for declared product capabilities: " + input.product.capabilities.join(", ") + "."
    );
  }

  if (blend.conflicts.length) {
    rationale.push(
      "Recipe composition produced " + blend.conflicts.length +
      " bounded range conflict(s); each falls back to the base recipe range and remains visible in conflicts."
    );
  }

  if ((input.inspiration?.named_products ?? []).length) {
    rationale.push(
      "Excluded named product inspirations from recipe scoring and style generation; they remain reference-only under the brand-safety contract."
    );
  }

  return rationale;
}

function renderDesignMarkdown(profile, { patterns, antiPatterns }) {
  const lines = [
    "# DESIGN",
    "",
    "Generated by Design Distillation v0.5.",
    "",
    "## Product",
    "",
    "- **Name:** " + profile.product.name,
    "- **Type:** " + profile.product.type,
    "- **Platform:** " + profile.product.platform,
    "- **Audience:** " + profile.product.audience,
    "- **Primary task:** " + profile.product.primaryTask,
    "",
    profile.product.description,
    "",
    "## Recipe selection",
    "",
    ...profile.selection.recipes.map((recipe) =>
      "- **" + recipe.id + "** - " + Math.round(recipe.weight * 100) + "% (" + recipe.role + ")"
    ),
    "",
    "## Design DNA",
    "",
    "| Axis | Value |",
    "| --- | ---: |",
    ...Object.entries(profile.personality).map(([axis, value]) => "| " + axis + " | " + value + " |"),
    "",
    "## Foundations",
    "",
    "- Layout: " + profile.layout.strategy + " / " + profile.layout.density,
    "- Navigation: " + profile.layout.navigation,
    "- Typography: " + profile.typography.strategy,
    "- Color: " + profile.color.strategy,
    "- Shape: " + profile.shape.strategy,
    "- Elevation: " + profile.shape.elevation,
    "- Motion: " + profile.motion.strategy,
    "- Iconography: " + profile.iconography.strategy,
    "- Imagery: " + profile.imagery.strategy,
    "- Theme: " + profile.foundations.theme,
    "",
    "## Prioritized UX patterns",
    "",
    ...profile.patterns.prioritize.map((id) => "- **" + id + "** - " + (patterns.get(id)?.summary ?? "Canonical Design Distillation pattern.")),
    "",
    "## Consider when relevant",
    "",
    ...profile.patterns.consider.map((id) => "- " + id),
    "",
    "## Avoid",
    "",
    ...profile.patterns.avoid.map((id) => "- **" + id + "** - " + (antiPatterns.get(id)?.summary ?? "Canonical Design Distillation anti-pattern.")),
    "",
    "## Required rules",
    "",
    ...profile.rules.require.map((rule) => "- " + rule),
    "",
    "## Content posture",
    "",
    "- Voice: " + profile.content.voice.join(", "),
    "- Density: " + profile.content.density,
    ...profile.content.guidance.map((rule) => "- " + rule),
    "",
    "## Accessibility",
    "",
    "- Target: " + profile.accessibility.target,
    "- Reduced motion: " + profile.accessibility.reducedMotion,
    "",
    "## Rationale",
    "",
    ...profile.rationale.map((item) => "- " + item)
  ];

  if (profile.conflicts.length) {
    lines.push("", "## Composition conflicts", "");
    for (const conflict of profile.conflicts) {
      lines.push("- " + conflict.type + " on " + conflict.axis + " -> " + conflict.resolution);
    }
  }

  if (profile.decisions.length) {
    lines.push("", "## Resolved preferences", "");
    for (const decision of profile.decisions) {
      lines.push(
        "- " + decision.field + " requested " + decision.requested +
        ", applied " + decision.applied + " - " + decision.reason
      );
    }
  }

  lines.push(
    "",
    "## Machine-readable source",
    "",
    "Treat design-profile.json as the canonical generated contract. This document is the human-readable explanation.",
    ""
  );

  return lines.join("\n");
}

function renderAgentInstructions(profile) {
  return [
    "# Design agent instructions",
    "",
    "Use design-profile.json as the machine-readable source of truth and DESIGN.md as its human-readable explanation.",
    "",
    "## Required behavior",
    "",
    "- Preserve the selected recipe logic rather than inventing a new visual language page by page.",
    "- Consume semantic tokens from " + profile.foundations.tokenManifest + "; do not introduce arbitrary one-off spacing, radius, typography, color, elevation, or motion values.",
    "- Implement prioritized UX patterns when their underlying task is present.",
    "- Do not introduce listed anti-patterns without an explicit documented exception.",
    "- Preserve loading, empty, error, disabled, keyboard/focus, recovery, responsive, and reduced-motion states where applicable.",
    "- Keep accessibility target at " + profile.accessibility.target + " or better.",
    ...(profile.accessibility.reducedMotion === "required"
      ? ["- The reduced-motion path is mandatory; never remove it to preserve visual effects."]
      : []),
    "- Treat hard requirements in rules.require as constraints, not suggestions.",
    "- Do not clone a named product's exact style, assets, proprietary source, or trade dress.",
    "",
    "## Current design posture",
    "",
    "- Base recipe: " + profile.selection.baseRecipe,
    "- Layout: " + profile.layout.strategy,
    "- Typography: " + profile.typography.strategy,
    "- Color: " + profile.color.strategy,
    "- Motion: " + profile.motion.strategy,
    "- Content density: " + profile.content.density,
    "",
    "When a product requirement conflicts with this generated contract, record the conflict and update the profile intentionally instead of silently drifting.",
    ""
  ].join("\n");
}

function inferNavigation(prioritized) {
  const primary = prioritized.includes("primary-navigation");
  const responsive = prioritized.includes("responsive-navigation");
  if (primary && responsive) return "persistent-adaptive";
  if (primary) return "persistent";
  if (responsive) return "adaptive";
  return "contextual";
}

function validateInputShape(input) {
  if (!input || typeof input !== "object") throw new Error("Composer input must be an object.");
  if (!input.version) throw new Error("Composer input requires version.");
  if (!input.product || typeof input.product !== "object") throw new Error("Composer input requires product.");

  for (const key of ["name", "type", "description", "platform", "audience", "primary_task"]) {
    if (!String(input.product[key] ?? "").trim()) {
      throw new Error('Composer input product requires "' + key + '".');
    }
  }

  if (input.preferences?.theme && !["light", "dark", "high-contrast"].includes(input.preferences.theme)) {
    throw new Error('Unknown theme "' + input.preferences.theme + '".');
  }
}

function validateReferences(ids, entries, label) {
  for (const id of ids) {
    if (!entries.has(id)) throw new Error('Unknown ' + label + ' "' + id + '".');
  }
}

function loadEntries(dir) {
  const map = new Map();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const entry = readJson(path.join(dir, file));
    map.set(entry.id, entry);
  }
  return map;
}

function readJson(file) {
  const text = fs.readFileSync(file, "utf8");
  return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
}

function containsPhrase(value, phrase) {
  if (!phrase) return false;
  return (" " + value + " ").includes(" " + phrase + " ");
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values) {
  return [...new Set(values)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundWeight(value) {
  return Math.round(value * 1000) / 1000;
}
