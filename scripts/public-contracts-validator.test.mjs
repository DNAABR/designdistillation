import test from "node:test";
import assert from "node:assert/strict";
import { validatePublicContracts } from "./public-contracts-validator.mjs";

test("v1 stable public-contract manifest is internally consistent", () => {
  const errors = [];
  const stats = validatePublicContracts({ root:process.cwd(), errors });
  assert.deepEqual(errors, []);
  assert.equal(stats.schemaCount, 10);
  assert.equal(stats.commandCount, 5);
  assert.equal(stats.toolCount, 9);
  assert.equal(stats.migrationCount, 1);
});
