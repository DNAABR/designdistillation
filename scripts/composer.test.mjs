import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { composeDesign } from "./composer.mjs";

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
