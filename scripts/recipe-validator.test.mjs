import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateCorpus } from "./corpus-validator.mjs";

const projectRoot = process.cwd();

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-distillation-recipes-"));
  fs.cpSync(path.join(projectRoot, "corpus"), path.join(root, "corpus"), { recursive: true });
  fs.cpSync(path.join(projectRoot, "taxonomy"), path.join(root, "taxonomy"), { recursive: true });
  return root;
}

function mutate(root, relative, fn) {
  const file = path.join(root, relative);
  const doc = JSON.parse(fs.readFileSync(file, "utf8"));
  fn(doc);
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
}

function run(root) {
  const errors = [];
  const stats = validateCorpus({ root, errors });
  return { errors, stats };
}

test("current recipe corpus validates with complete category coverage", () => {
  const { errors, stats } = run(projectRoot);
  assert.deepEqual(errors, []);
  assert.equal(stats.recipeCount, 11);
  assert.equal(stats.recipeCategoryCount, 11);
});

test("recipes must cover every Design DNA axis", () => {
  const root = makeFixture();
  mutate(root, "corpus/recipes/focused-saas.json", (entry) => {
    delete entry.design_dna["information-density"];
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes('design_dna missing axis "information-density"')));
});

test("recipe axis ranges must contain the target", () => {
  const root = makeFixture();
  mutate(root, "corpus/recipes/friendly-education.json", (entry) => {
    entry.design_dna.playfulness.min = 90;
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes("must satisfy min <= target <= max")));
});

test("recipe pattern references must resolve to the correct entry kind", () => {
  const root = makeFixture();
  mutate(root, "corpus/recipes/developer-tooling.json", (entry) => {
    entry.patterns.prioritize.push("card-everything");
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes('related reference "card-everything" must be kind "pattern"')));
});

test("recipe foundation strategies must come from taxonomy", () => {
  const root = makeFixture();
  mutate(root, "corpus/recipes/editorial-content.json", (entry) => {
    entry.foundations.motion = "cinematic-everywhere";
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes('unknown motion strategy "cinematic-everywhere"')));
});

test("every declared recipe category must have coverage", () => {
  const root = makeFixture();
  mutate(root, "taxonomy/taxonomy.json", (taxonomy) => {
    taxonomy.recipeCategories.push("uncovered-recipe");
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes('recipe category "uncovered-recipe" has no corpus coverage')));
});

test("recipe brand safety cannot be relaxed", () => {
  const root = makeFixture();
  mutate(root, "corpus/recipes/consumer-social.json", (entry) => {
    entry.brand_safety.imitate_named_product = true;
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes("brand_safety.imitate_named_product must be false")));
});

test("per-recipe influence limits cannot exceed the global composition limit", () => {
  const root = makeFixture();
  mutate(root, "corpus/recipes/gaming-companion.json", (entry) => {
    entry.composition.influence_weight_max = 0.5;
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes("composition.influence_weight_max exceeds global recipe maximum")));
});
