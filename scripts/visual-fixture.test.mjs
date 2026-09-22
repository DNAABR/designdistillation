import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildVisualFixture } from "./visual-fixture.mjs";

test("visual regression fixture builds deterministically from canonical registry tokens/styles", () => {
  const first = fs.mkdtempSync(path.join(os.tmpdir(), "dd-visual-a-"));
  const second = fs.mkdtempSync(path.join(os.tmpdir(), "dd-visual-b-"));
  try {
    const a = buildVisualFixture({ root:process.cwd(), outDir:first });
    const b = buildVisualFixture({ root:process.cwd(), outDir:second });
    assert.deepEqual(a.files, ["index.html","design-tokens.css","components.css"]);
    assert.deepEqual(b.files, a.files);
    for (const file of a.files) {
      assert.equal(
        fs.readFileSync(path.join(first, file), "utf8"),
        fs.readFileSync(path.join(second, file), "utf8")
      );
    }
    const html = fs.readFileSync(path.join(first, "index.html"), "utf8");
    assert.match(html, /dd-button--primary/);
    assert.match(html, /dd-banner--danger/);
    assert.match(html, /dd-empty-state/);
  } finally {
    fs.rmSync(first, { recursive:true, force:true });
    fs.rmSync(second, { recursive:true, force:true });
  }
});
