import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildExplorerData } from "./explorer-data.mjs";
import { buildExplorer } from "./explorer-build.mjs";

const root = process.cwd();

test("explorer data compiles canonical corpus, registry, tokens, and one Composer profile per recipe", () => {
  const data = buildExplorerData({ root, sourceRef:"test-ref" });
  assert.equal(data.counts.corpus, 51);
  assert.equal(data.counts.registry, 6);
  assert.equal(data.counts.recipes, 11);
  assert.equal(Object.keys(data.profiles).length, 11);
  assert.ok(data.tokens.length >= 219);
  assert.equal(data.sourceRef, "test-ref");

  for (const recipe of data.corpus.filter((entry) => entry.kind === "recipe")) {
    const generated = data.profiles[recipe.id];
    assert.equal(generated.profile.selection.baseRecipe, recipe.id);
    assert.equal(Object.keys(generated.profile.personality).length, 24);
    for (const [axis, range] of Object.entries(recipe.design_dna)) {
      const value = generated.profile.personality[axis];
      assert.ok(value >= range.min && value <= range.max);
    }
  }
});

test("every browsable record links back to its machine-readable repository source", () => {
  const data = buildExplorerData({ root, repository:"Example/Repo", sourceRef:"branch/name" });
  for (const item of [...data.corpus, ...data.registry, ...data.tokens]) {
    assert.ok(item.sourcePath);
    assert.match(item.sourceUrl, /^https:\/\/github\.com\/Example\/Repo\/blob\/branch\/name\//);
  }
});

test("explorer dataset generation is deterministic for the same ref", () => {
  const first = buildExplorerData({ root, sourceRef:"deterministic-ref" });
  const second = buildExplorerData({ root, sourceRef:"deterministic-ref" });
  assert.deepEqual(first, second);
});

test("static explorer build writes source assets plus compiled data.js", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "dd-explorer-"));
  try {
    const result = buildExplorer({ root, outDir, sourceRef:"preview-ref" });
    assert.deepEqual(result.files, ["index.html","styles.css","app.js","data.js"]);
    for (const file of result.files) assert.ok(fs.existsSync(path.join(outDir, file)));
    const dataJs = fs.readFileSync(path.join(outDir, "data.js"), "utf8");
    assert.match(dataJs, /window\.__DESIGN_DISTILLATION_EXPLORER__/);
    assert.match(dataJs, /preview-ref/);
  } finally {
    fs.rmSync(outDir, { recursive:true, force:true });
  }
});
