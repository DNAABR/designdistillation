import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  benchmarkRetrieval,
  getDesignRecipe,
  searchPatterns,
  searchReferences,
  searchRegistry
} from "./retrieval.mjs";

const root = process.cwd();

test("pattern retrieval ranks direct task intent compactly", () => {
  const results = searchPatterns({ root, query:"preserve form input validation error", limit:3 });
  assert.equal(results[0].id, "preserve-form-input");
  assert.ok(results[0].score > 0);
  assert.ok(results[0].matchedFields.length > 0);
  assert.equal("rationale" in results[0], false);
});

test("reference retrieval surface is supported before references are populated", () => {
  assert.deepEqual(searchReferences({ root, query:"material design", limit:3 }), []);
});

test("recipe and registry retrieval find canonical entries", () => {
  assert.equal(getDesignRecipe({ root, id:"friendly-education" }).kind, "recipe");
  assert.equal(searchRegistry({ root, query:"labeled input field validation", limit:3 })[0].id, "text-field");
});

test("retrieval benchmark meets relevance and compactness targets", () => {
  const benchmark = JSON.parse(fs.readFileSync(path.join(root, "benchmarks", "retrieval.json"), "utf8"));
  const report = benchmarkRetrieval({ root, benchmark });
  assert.equal(report.passed, benchmark.cases.length);
  assert.equal(report.recallAtRequestedLimit, benchmark.target_recall);
  assert.ok(report.averageCompactRatio <= benchmark.max_average_compact_ratio);
});
