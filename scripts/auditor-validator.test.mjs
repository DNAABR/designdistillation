import test from "node:test";
import assert from "node:assert/strict";
import { validateAuditorConfig } from "./auditor-validator.mjs";

test("current auditor taxonomy validates", () => {
  const errors = [];
  const stats = validateAuditorConfig({ root:process.cwd(), errors });
  assert.deepEqual(errors, []);
  assert.equal(stats.ruleCount, 17);
  assert.equal(stats.patternSignalCount, 5);
});
