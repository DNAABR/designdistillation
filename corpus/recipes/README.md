# Design recipes

This directory contains canonical product-archetype recipes.

Recipes are machine-readable starting design languages, not themes to copy unchanged.

Each recipe includes category and intent, complete Design DNA coverage, foundation strategies, prioritized/considered UX patterns, anti-patterns to avoid, content guidance, hard constraints, strong defaults, exceptions, composition limits, protected dimensions, and brand-safety settings.

Before adding a recipe, ask whether it represents a genuinely different product-design problem. Do not create separate recipes solely for a different brand color, a fashionable aesthetic, a named product imitation, a small radius or shadow difference, or a cosmetic variation that existing Design DNA ranges can already express.

Prefer widening or refining an existing recipe's ranges when the underlying product logic is the same.

Every Design DNA axis must be present, every pattern reference must resolve, and every foundation strategy must exist in taxonomy/taxonomy.json.

Run:

~~~bash
npm run check
~~~

See docs/design-recipes.md for composition behavior.
