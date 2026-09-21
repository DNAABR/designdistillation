# Composer

v0.5 turns Design Distillation from a knowledge base into a deterministic design compiler.

The composer accepts a structured request that may contain free-text product requirements, then produces three artifacts:

- `design-profile.json` — canonical machine-readable contract;
- `DESIGN.md` — human-readable explanation and rationale;
- `AGENTS.design.md` — implementation instructions for coding agents.

## Why deterministic first

The canonical composer does not depend on a hosted model. Recipe selection, blending, personality resolution, platform normalization, accessibility rules, and output generation are deterministic and testable.

AI systems can prepare a composer request, but they should not bypass the compiler's bounded rules.

## Selection order

The base recipe is selected in this order:

1. explicit `preferences.recipe`;
2. declared `product.type`;
3. transparent keyword scoring across description, task, audience, type, and features;
4. the configured fallback recipe, with a warning.

Influence recipes are never guessed automatically. They must be named explicitly with a weight and still obey the global and per-recipe blend limits.

## Personality resolution

A request may set any declared 24-axis Design DNA value from 0 to 100.

The composer resolves each value against the composed recipe range. Values outside the allowed range are clamped and recorded in the rationale and diagnostics rather than silently accepted.

## Platform and accessibility

Platform aliases normalize to `web`, `mobile`, `desktop`, or `cross-platform`.

The default accessibility target is WCAG 2.2 AA. Reduced-motion support remains mandatory even when standard motion is selected. High-contrast theme support remains part of the token contract.

## CLI

Requires Node.js 20+.

~~~bash
npm run compose -- --input examples/composer-request.operations-saas.json --out ./generated-design
~~~

The output directory will contain:

~~~text
design-profile.json
DESIGN.md
AGENTS.design.md
~~~

Use `--out .` when the generated contract should live in the target project's root.

## Library API

~~~js
import { composeDesignContract } from "./scripts/composer.mjs";

const result = composeDesignContract({
  root: process.cwd(),
  requirements
});

result.profile;
result.designMarkdown;
result.agentInstructions;
result.diagnostics;
~~~

## Contract boundaries

The composer may choose and blend Design Distillation recipes, resolve bounded Design DNA preferences, and explain its decisions.

It must not:

- clone the visual identity of a named product;
- weaken recipe brand-safety invariants;
- copy proprietary code or assets;
- invent framework-specific implementation values that bypass semantic tokens;
- become the website explorer, implementation registry, MCP server, or anti-slop auditor.

Those remain separate layers and later milestones.
