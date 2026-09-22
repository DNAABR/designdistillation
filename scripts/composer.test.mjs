import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { composeDesign } from "./composer.mjs";
import { validateJsonSchemaSubset } from "./json-schema-lite.mjs";

const root = process.cwd();

function baseInput(overrides = {}) {
  return {
    version: "0.5.0",
    product: {
      name: "Test Product",
      type: "software",
      description: "A software product used to exercise deterministic composer behavior.",
      platform: "responsive-web",
      audience: "general users",
      primary_task: "complete a useful task",
      category_hints: [],
      capabilities: [],
      ...(overrides.product ?? {})
    },
    goals: overrides.goals ?? [],
    brand: overrides.brand,
    inspiration: overrides.inspiration,
    personality: overrides.personality,
    accessibility: overrides.accessibility,
    preferences: overrides.preferences,
    recipe_selection: overrides.recipe_selection
  };
}

test("Olympiad learning fixture selects education with bounded SaaS influence", () => {
  const input = JSON.parse(fs.readFileSync(path.join(root, "examples", "composer-input.olympiad-learning.json"), "utf8"));
  const { profile } = composeDesign({ root, input });
  assert.equal(profile.selection.baseRecipe, "friendly-education");
  assert.equal(profile.selection.recipes.length, 2);
  assert.equal(profile.selection.recipes[1].id, "focused-saas");
  assert.equal(profile.selection.recipes[1].weight, 0.25);
  assert.ok(profile.patterns.prioritize.includes("progressive-onboarding"));
  assert.ok(profile.patterns.prioritize.includes("search-query-state"));
  assert.ok(profile.patterns.prioritize.includes("save-status-feedback"));
  assert.equal(profile.accessibility.reducedMotion, "required");
});

test("high-signal finance requirements select serious fintech", () => {
  const input = baseInput({ product: {
    type: "fintech wallet",
    description: "A mobile wallet for balances, payments, money transfers, and transaction history.",
    platform: "mobile",
    audience: "consumer banking customers",
    primary_task: "send payments and review transactions",
    category_hints: ["fintech"],
    capabilities: ["transactions", "forms"]
  }});
  const { profile } = composeDesign({ root, input });
  assert.equal(profile.selection.baseRecipe, "serious-fintech");
  assert.ok(profile.patterns.prioritize.includes("review-before-submit"));
  assert.ok(profile.patterns.prioritize.includes("transaction-confirmation"));
});

test("explicit recipe selection is preserved exactly", () => {
  const input = baseInput({
    product: {
      type: "hybrid software",
      description: "A deliberately hybrid product whose recipe weights are supplied explicitly.",
      primary_task: "combine technical work with learning"
    },
    recipe_selection: {
      mode: "explicit",
      selections: [
        { id: "developer-tooling", weight: 0.7 },
        { id: "friendly-education", weight: 0.3 }
      ]
    }
  });
  const { profile } = composeDesign({ root, input });
  assert.equal(profile.selection.mode, "explicit");
  assert.deepEqual(profile.selection.recipes.map(({ id, weight }) => ({ id, weight })), [
    { id: "developer-tooling", weight: 0.7 },
    { id: "friendly-education", weight: 0.3 }
  ]);
});

test("personality requests outside recipe bounds are clamped and explained", () => {
  const input = baseInput({
    product: {
      type: "public service",
      description: "A government benefits service used by citizens to apply for assistance.",
      primary_task: "complete an essential benefits application",
      category_hints: ["public-service"]
    },
    personality: { playfulness: 90 }
  });
  const { profile } = composeDesign({ root, input });
  assert.ok(profile.personality.playfulness < 90);
  const decision = profile.decisions.find((item) => item.field === "playfulness");
  assert.equal(decision.requested, 90);
  assert.equal(decision.applied, profile.personality.playfulness);
  assert.match(decision.reason, /clamped/i);
});

test("high-trust intent wins an equal recipe-score tie and playful overrides remain bounded", () => {
  const input = baseInput({
    product: {
      type: "hybrid service",
      description: "A consequential account service with intentionally mixed category signals.",
      audience: "account holders",
      primary_task: "manage important account state",
      category_hints: ["fintech", "gaming-companion"]
    },
    personality: { playfulness: 95 }
  });
  const { profile } = composeDesign({ root, input });
  assert.equal(profile.selection.baseRecipe, "serious-fintech");
  assert.equal(profile.personality.playfulness, 26);
  assert.ok(profile.conflicts.some((conflict) =>
    conflict.type === "personality-outside-recipe-range" &&
    conflict.axis === "playfulness" &&
    conflict.resolution === "clamped-to-recipe-range"
  ));
});

test("reduced-motion accessibility remains a hard path even for an expressive gaming recipe", () => {
  const input = baseInput({
    product: {
      type: "gaming companion",
      description: "A playful game companion with progression, quests, and energetic feedback.",
      audience: "players",
      primary_task: "track progression and complete companion tasks",
      category_hints: ["gaming-companion"]
    },
    accessibility: {
      target: "WCAG 2.2 AA",
      reduced_motion: true
    },
    personality: {
      "motion-intensity": 80,
      "motion-playfulness": 90
    },
    recipe_selection: {
      mode: "explicit",
      selections: [{ id: "gaming-companion", weight: 1 }]
    }
  });
  const result = composeDesign({ root, input });
  assert.equal(result.profile.accessibility.reducedMotion, "required");
  assert.ok(result.profile.rules.require.some((rule) => /required product path/i.test(rule)));
  assert.ok(result.profile.rules.require.some((rule) => /do not require motion/i.test(rule)));
  assert.ok(result.profile.decisions.some((decision) => decision.type === "accessibility-constraint"));
  assert.match(result.agentInstructions, /reduced-motion path is mandatory/i);
});

test("platform rules add canonical mobile interaction constraints", () => {
  const input = baseInput({
    product: {
      type: "education",
      description: "A mobile learning app for lessons, practice, quizzes, and student progress.",
      platform: "mobile",
      audience: "students",
      primary_task: "complete lessons and practice",
      category_hints: ["education"]
    }
  });
  const { profile } = composeDesign({ root, input });
  assert.ok(profile.patterns.prioritize.includes("responsive-navigation"));
  assert.ok(profile.rules.require.some((rule) => /touch-friendly targets/i.test(rule)));
  assert.ok(profile.rules.require.some((rule) => /hover or pointer precision/i.test(rule)));
  assert.ok(profile.decisions.some((decision) =>
    decision.type === "platform-constraint" && decision.applied === "mobile"
  ));
});

test("named-product inspiration is reference-only and excluded from recipe scoring", () => {
  const input = baseInput({
    product: {
      type: "education",
      description: "A learning product for students with lessons and practice.",
      audience: "students",
      primary_task: "learn and practice",
      category_hints: ["education"]
    },
    inspiration: {
      named_products: ["Linear", "Notion"],
      traits: ["calm", "direct", "content-forward"]
    }
  });
  const { profile } = composeDesign({ root, input });
  assert.equal(profile.selection.baseRecipe, "friendly-education");
  assert.ok(profile.selection.recipes.every((recipe) =>
    (recipe.evidence ?? []).every((item) => item.field !== "inspiration")
  ));
  assert.ok(profile.decisions.some((decision) =>
    decision.type === "brand-safety" && decision.applied === "reference-only"
  ));
  assert.ok(profile.rationale.some((item) => /excluded named product inspirations from recipe scoring/i.test(item)));
  assert.ok(profile.rules.avoid.some((rule) => /do not imitate a named product/i.test(rule)));
});

test("generated design profile conforms to the canonical v0.5 schema", () => {
  const input = JSON.parse(fs.readFileSync(
    path.join(root, "examples", "composer-input.olympiad-learning.json"),
    "utf8"
  ));
  const schema = JSON.parse(fs.readFileSync(
    path.join(root, "schemas", "design-profile.schema.json"),
    "utf8"
  ));
  const { profile } = composeDesign({ root, input });
  assert.deepEqual(validateJsonSchemaSubset(schema, profile), []);
});

test("Composer input rejects unsupported versions and platforms", () => {
  const wrongVersion = baseInput({
    product: {
      type: "education",
      description: "A learning product for students with lessons and practice.",
      primary_task: "learn and practice",
      category_hints: ["education"]
    }
  });
  wrongVersion.version = "0.4.0";
  assert.throws(() => composeDesign({ root, input: wrongVersion }), /Composer input invalid/i);

  const wrongPlatform = baseInput({
    product: {
      type: "education",
      description: "A learning product for students with lessons and practice.",
      platform: "smart-fridge",
      primary_task: "learn and practice",
      category_hints: ["education"]
    }
  });
  assert.throws(() => composeDesign({ root, input: wrongPlatform }), /Composer input invalid/i);
});

test("ambiguous requirements fail instead of defaulting to a generic recipe", () => {
  const input = baseInput({ product: {
    type: "miscellaneous interface",
    description: "An interface for a purpose not represented by known category signals.",
    primary_task: "complete a generic action"
  }});
  assert.throws(() => composeDesign({ root, input }), /could not infer a credible base recipe/i);
});

test("unknown required patterns are rejected", () => {
  const input = baseInput({
    product: {
      type: "education",
      description: "A learning product for students with lessons and practice.",
      primary_task: "learn and practice",
      category_hints: ["education"]
    },
    preferences: { required_patterns: ["not-a-real-pattern"] }
  });
  assert.throws(() => composeDesign({ root, input }), /Unknown required pattern "not-a-real-pattern"/);
});

test("renderers emit human and agent contracts", () => {
  const input = baseInput({ product: {
    type: "developer tools",
    description: "A developer platform for APIs, logs, deployments, and infrastructure debugging.",
    audience: "software developers",
    primary_task: "inspect logs and debug deployments",
    category_hints: ["developer-tools"]
  }});
  const result = composeDesign({ root, input });
  assert.match(result.designMarkdown, /# DESIGN/);
  assert.match(result.designMarkdown, /## Design DNA/);
  assert.match(result.agentInstructions, /# Design agent instructions/);
  assert.match(result.agentInstructions, /semantic tokens/i);
});

test("CLI writes all three generated artifacts", () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "design-distillation-compose-"));
  const run = spawnSync(process.execPath, [
    path.join(root, "scripts", "compose.mjs"),
    path.join(root, "examples", "composer-input.olympiad-learning.json"),
    "--out",
    output
  ], { cwd: root, encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  assert.ok(fs.existsSync(path.join(output, "design-profile.json")));
  assert.ok(fs.existsSync(path.join(output, "DESIGN.md")));
  assert.ok(fs.existsSync(path.join(output, "AGENTS.design.md")));
});
