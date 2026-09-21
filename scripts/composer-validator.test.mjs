import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateComposerConfig } from "./composer-validator.mjs";

const projectRoot = process.cwd();

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-distillation-composer-config-"));
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
  const stats = validateComposerConfig({ root, errors });
  return { errors, stats };
}

test("current composer signal taxonomy validates", () => {
  const { errors, stats } = run(projectRoot);
  assert.deepEqual(errors, []);
  assert.equal(stats.recipeSignalCount, 11);
  assert.equal(stats.capabilityCount, 13);
});

test("every recipe needs composer selection signals", () => {
  const root = makeFixture();
  mutate(root, "taxonomy/composer-signals.json", (signals) => {
    delete signals.recipes["focused-saas"];
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes('recipe "focused-saas" has no composer signals')));
});

test("capability mappings must reference real UX patterns", () => {
  const root = makeFixture();
  mutate(root, "taxonomy/composer-signals.json", (signals) => {
    signals.capabilityPatterns.search.push("missing-search-pattern");
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes('references unknown pattern "missing-search-pattern"')));
});

test("category aliases cannot be ambiguous between recipes", () => {
  const root = makeFixture();
  mutate(root, "taxonomy/composer-signals.json", (signals) => {
    signals.recipes["public-service"].aliases.push("saas");
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes('alias "saas" is ambiguous')));
});
