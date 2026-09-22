import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { composeRecipeBlend } from "./recipe-blender.mjs";

const root = process.cwd();

test("example recipe blend composes deterministically", () => {
  const request = JSON.parse(
    fs.readFileSync(path.join(root, "examples", "recipe-blend.saas-education.json"), "utf8")
  );
  const result = composeRecipeBlend({ root, selections: request.selections });
  assert.equal(result.base_recipe, "focused-saas");
  assert.equal(result.foundations.layout, "task-dense");
  assert.equal(result.design_dna["information-density"].target, 72);
  assert.equal(result.design_dna["information-density"].resolution, "protected-base");
  assert.equal(result.design_dna.symmetry.target, 52);
  assert.ok(result.patterns.prioritize.includes("progressive-onboarding"));
  assert.equal(result.brand_safety.named_product_style_blending, false);
});

test("blend rejects weights that do not sum to one", () => {
  assert.throws(
    () => composeRecipeBlend({
      root,
      selections: [
        { id: "focused-saas", weight: 0.7 },
        { id: "friendly-education", weight: 0.2 }
      ]
    }),
    /weights must sum to 1/
  );
});

test("blend rejects an influence above its allowed maximum", () => {
  assert.throws(
    () => composeRecipeBlend({
      root,
      selections: [
        { id: "focused-saas", weight: 0.6 },
        { id: "friendly-education", weight: 0.4 }
      ]
    }),
    /exceeds its allowed maximum/
  );
});

test("blend surfaces incompatible axis ranges and falls back to the base range", () => {
  const result = composeRecipeBlend({
    root,
    selections: [
      { id: "gaming-companion", weight: 0.85 },
      { id: "public-service", weight: 0.15 }
    ]
  });
  assert.ok(result.conflicts.some((conflict) => conflict.axis === "formality"));
  assert.equal(result.design_dna.formality.resolution, "base-range-conflict");
});
