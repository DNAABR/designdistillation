import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateTokens } from "./token-validator.mjs";

const projectRoot = process.cwd();

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-distillation-"));
  fs.cpSync(path.join(projectRoot, "tokens"), path.join(root, "tokens"), { recursive: true });
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
  validateTokens({ root, errors });
  return errors;
}

test("current visual foundations validate", () => {
  const errors = [];
  const stats = validateTokens({ root: projectRoot, errors });
  assert.deepEqual(errors, []);
  assert.equal(stats.themeCount, 3);
  assert.ok(stats.tokenCount > 150);
});

test("missing aliases are rejected", () => {
  const root = makeFixture();
  mutate(root, "tokens/themes/light.tokens.json", (doc) => {
    doc.semantic.color.text.primary.$value = "{primitive.color.neutral.missing}";
  });
  const errors = run(root);
  assert.ok(errors.some((error) => error.includes("references missing token")));
});

test("circular aliases are rejected", () => {
  const root = makeFixture();
  mutate(root, "tokens/semantic/dimensions.tokens.json", (doc) => {
    doc.semantic.loop = {
      $type: "dimension",
      a: { $value: "{semantic.loop.b}" },
      b: { $value: "{semantic.loop.a}" },
    };
  });
  const errors = run(root);
  assert.ok(errors.some((error) => error.includes("circular alias detected")));
});

test("theme semantic drift is rejected", () => {
  const root = makeFixture();
  mutate(root, "tokens/themes/dark.tokens.json", (doc) => {
    delete doc.semantic.color.text.muted;
  });
  const errors = run(root);
  assert.ok(errors.some((error) => error.includes("missing semantic color tokens")));
});

test("configured contrast regressions are rejected", () => {
  const root = makeFixture();
  mutate(root, "tokens/themes/light.tokens.json", (doc) => {
    doc.semantic.color.text.primary.$value = "{primitive.color.neutral.50}";
  });
  const errors = run(root);
  assert.ok(errors.some((error) => error.includes('contrast pair "primary text"')));
});
