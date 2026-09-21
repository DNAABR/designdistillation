import test from "node:test";
import assert from "node:assert/strict";
import { composeDesignContract } from "./composer.mjs";

const root = process.cwd();

function request(overrides = {}) {
  return {
    version: "0.5.0",
    product: {
      description: "A responsive application for teams to manage recurring operational work.",
      type: "saas",
      platform: "responsive-web",
      audience: "operations teams",
      primaryTask: "manage recurring workflows",
      ...(overrides.product || {})
    },
    preferences: {
      ...(overrides.preferences || {})
    }
  };
}

test("composer selects the product-type recipe and emits all three contract surfaces", () => {
  const result = composeDesignContract({
    root,
    requirements: request({
      product: {
        description: "A learning app with lessons, quizzes, and student progress.",
        type: "education",
        platform: "web",
        audience: "students",
        primaryTask: "complete lessons and practice"
      }
    })
  });

  assert.equal(result.profile.compiler.baseRecipe, "friendly-education");
  assert.equal(result.profile.product.type, "education");
  assert.equal(result.profile.product.platform, "web");
  assert.match(result.designMarkdown, /# Design Contract:/);
  assert.match(result.agentInstructions, /canonical design contract/);
});

test("composer can select a recipe from free-text requirements", () => {
  const result = composeDesignContract({
    root,
    requirements: {
      version: "0.5.0",
      product: {
        description: "A developer API dashboard for inspecting deploy logs, debugging code, and managing database tools.",
        platform: "browser"
      }
    }
  });

  assert.equal(result.profile.compiler.baseRecipe, "developer-tooling");
  assert.equal(result.profile.compiler.selectionMethod, "keyword-score");
});

test("personality requests are clamped to the composed recipe contract", () => {
  const result = composeDesignContract({
    root,
    requirements: request({
      preferences: {
        personality: {
          radius: 100
        }
      }
    })
  });

  assert.equal(result.profile.personality.radius, 53);
  assert.deepEqual(result.profile.compiler.personalityClamps[0], {
    axis: "radius",
    requested: 100,
    resolved: 53,
    min: 17,
    max: 53
  });
});

test("bounded influences preserve protected base dimensions", () => {
  const result = composeDesignContract({
    root,
    requirements: request({
      preferences: {
        influences: [
          { id: "friendly-education", weight: 0.2 }
        ]
      }
    })
  });

  assert.deepEqual(result.profile.compiler.selectedRecipes, [
    { id: "focused-saas", weight: 0.8, role: "base" },
    { id: "friendly-education", weight: 0.2, role: "influence" }
  ]);
  assert.equal(result.profile.personality["information-density"], 72);
  assert.ok(result.profile.patterns.prioritize.includes("progressive-onboarding"));
});

test("reduced-motion preference keeps the accessibility path explicit", () => {
  const result = composeDesignContract({
    root,
    requirements: request({
      preferences: {
        reducedMotion: true,
        theme: "high-contrast"
      }
    })
  });

  assert.equal(result.profile.motion.strategy, "minimal");
  assert.equal(result.profile.motion.intensity, 0);
  assert.equal(result.profile.foundations.theme, "high-contrast");
  assert.equal(result.profile.accessibility.reducedMotionSupport, true);
});

test("composer rejects unknown Design DNA axes", () => {
  assert.throws(
    () => composeDesignContract({
      root,
      requirements: request({
        preferences: {
          personality: {
            "made-up-axis": 50
          }
        }
      })
    }),
    /Unknown personality axis/
  );
});

test("composer output is deterministic for the same request", () => {
  const requirements = request({
    preferences: {
      personality: {
        warmth: 46
      }
    }
  });
  const first = composeDesignContract({ root, requirements });
  const second = composeDesignContract({ root, requirements });

  assert.deepEqual(first.profile, second.profile);
  assert.equal(first.designMarkdown, second.designMarkdown);
  assert.equal(first.agentInstructions, second.agentInstructions);
});
