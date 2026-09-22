import test from "node:test";
import assert from "node:assert/strict";
import { validateRegistry } from "./registry-validator.mjs";

const root = process.cwd();

test("current registry validates with balanced component and composition coverage", () => {
  const errors = [];
  const stats = validateRegistry({ root, errors });
  assert.deepEqual(errors, []);
  assert.equal(stats.entryCount, 6);
  assert.equal(stats.componentCount, 3);
  assert.equal(stats.compositionCount, 3);
  assert.equal(stats.adapterCount, 3);
});
