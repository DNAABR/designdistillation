import test from "node:test";
import assert from "node:assert/strict";
import { runPipelineBenchmark } from "./pipeline-benchmark.mjs";

test("v1 release-candidate pipeline preserves the validated v0.9 semantic baseline", () => {
  const report = runPipelineBenchmark({ root:process.cwd() });
  const failures = report.comparisons.filter((item) => !item.passed);
  assert.deepEqual(failures, []);
  assert.deepEqual(report.current.validation_errors, []);
  assert.equal(report.passed, true);
  assert.equal(report.baselineVersion, "0.9.0");
});
