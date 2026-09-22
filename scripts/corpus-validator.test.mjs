import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateCorpus } from "./corpus-validator.mjs";

const projectRoot = process.cwd();

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-distillation-corpus-"));
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

test("current UX corpus validates with complete family coverage", () => {
  const { errors, stats } = run(projectRoot);
  assert.deepEqual(errors, []);
  assert.equal(stats.patternCount, 30);
  assert.equal(stats.antiPatternCount, 9);
  assert.equal(stats.familyCount, 10);
});

test("patterns require accessibility requirements", () => {
  const root = makeFixture();
  mutate(root, "corpus/patterns/primary-navigation.json", (entry) => {
    entry.accessibility.requirements = [];
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes("accessibility.requirements must be a non-empty array")));
});

test("broken related pattern references are rejected", () => {
  const root = makeFixture();
  mutate(root, "corpus/patterns/primary-navigation.json", (entry) => {
    entry.related.patterns.push("does-not-exist");
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes('related reference "does-not-exist" does not exist')));
});

test("evidence labels require matching source types", () => {
  const root = makeFixture();
  mutate(root, "corpus/patterns/tabs-for-peer-sections.json", (entry) => {
    entry.sources = [{ type: "internal", title: "test", license: null, redistribution: { code: false, assets: false } }];
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes("standard-backed pattern needs at least one standard source")));
});

test("every declared pattern family must have corpus coverage", () => {
  const root = makeFixture();
  mutate(root, "taxonomy/taxonomy.json", (taxonomy) => {
    taxonomy.patternFamilies.push("uncovered-family");
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes('pattern family "uncovered-family" has no corpus coverage')));
});

test("duplicate normalized pattern titles are rejected", () => {
  const root = makeFixture();
  mutate(root, "corpus/patterns/responsive-navigation.json", (entry) => {
    entry.title = "Stable primary navigation!!!";
  });
  const { errors } = run(root);
  assert.ok(errors.some((error) => error.includes("duplicate normalized pattern title")));
});
