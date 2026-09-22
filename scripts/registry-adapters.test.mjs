import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  generateCssVariables,
  generateTailwindTheme,
  installRegistryEntries,
  resolveTokenValue
} from "./registry-adapters.mjs";

const root = process.cwd();

test("CSS adapter emits semantic variables for all three themes", () => {
  const css = generateCssVariables({ root });
  assert.match(css, /--dd-semantic-color-text-primary:/);
  assert.match(css, /\[data-dd-theme="dark"\]/);
  assert.match(css, /\[data-dd-theme="high-contrast"\]/);
  assert.match(css, /--dd-semantic-type-body-medium-letter-spacing:/);
});

test("theme resolution changes semantic color while preserving token identity", () => {
  const light = resolveTokenValue({ root, theme: "light", tokenPath: "semantic.color.text.primary" });
  const dark = resolveTokenValue({ root, theme: "dark", tokenPath: "semantic.color.text.primary" });
  assert.equal(light.hex, "#07080b");
  assert.equal(dark.hex, "#f9fafc");
});

test("Tailwind v4 adapter maps aliases back to canonical semantic CSS variables", () => {
  const css = generateTailwindTheme({ root });
  assert.match(css, /@theme inline/);
  assert.match(css, /--color-dd-primary: var\(--dd-semantic-color-action-primary-background\)/);
  assert.match(css, /--radius-dd-control: var\(--dd-semantic-radius-control\)/);
});

test("React install copies only selected source-owned entries plus shared styles", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "dd-registry-"));
  try {
    const result = installRegistryEntries({
      root,
      outDir,
      adapter: "react",
      ids: ["action-button", "text-field"]
    });
    assert.deepEqual(result.entries.map((entry) => entry.id), ["action-button", "text-field"]);
    assert.ok(fs.existsSync(path.join(outDir, "design-tokens.css")));
    assert.ok(fs.existsSync(path.join(outDir, "components.css")));
    assert.ok(fs.existsSync(path.join(outDir, "components", "ActionButton.tsx")));
    assert.ok(fs.existsSync(path.join(outDir, "components", "TextField.tsx")));
    assert.equal(fs.existsSync(path.join(outDir, "components", "StatusBanner.tsx")), false);
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});
