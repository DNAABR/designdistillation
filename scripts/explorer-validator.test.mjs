import test from "node:test";
import assert from "node:assert/strict";
import { validateExplorer } from "./explorer-validator.mjs";

test("current website explorer contract validates", () => {
  const errors = [];
  const stats = validateExplorer({ root:process.cwd(), errors });
  assert.deepEqual(errors, []);
  assert.equal(stats.corpusCount, 51);
  assert.equal(stats.registryCount, 6);
  assert.equal(stats.profileCount, 11);
  assert.ok(stats.tokenRecordCount >= 219);
});
