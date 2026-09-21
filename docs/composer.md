# Composer

v0.5 turns Design Distillation from a machine-readable knowledge base into a deterministic design compiler.

The Composer accepts structured product intent and produces three artifacts:

- `design-profile.json` - the canonical machine-readable design contract;
- `DESIGN.md` - a human-readable explanation of the contract and rationale;
- `AGENTS.design.md` - concise implementation rules for coding agents.

## Why deterministic first

The canonical Composer does not depend on a hosted model. Recipe scoring, bounded blending, Design DNA resolution, platform requirements, accessibility requirements, and output generation are deterministic and testable.

An AI system may prepare Composer input, but the compiler remains the final gate for bounded recipe composition, protected dimensions, accessibility requirements, and brand-safety rules.

## Input contract

The canonical input schema is `schemas/composer-input.schema.json`.

A request describes:

- product name, type, description, platform, audience, and primary task;
- optional category hints and capabilities;
- product goals;
- brand descriptors and brand prominence;
- optional Design DNA preferences;
- accessibility requirements;
- theme, required rules, avoided rules, and pattern constraints;
- optional named-product references and abstract inspiration traits;
- automatic or explicit recipe selection.

Canonical platforms are `web`, `responsive-web`, `mobile`, `desktop`, and `cross-platform`.

## Recipe selection

Automatic selection uses inspectable weighted signals from category hints, product type, primary task, description, goals, audience, and brand descriptors.

The highest-scoring credible recipe becomes the base. If a second recipe has strong enough evidence, the Composer may add it as one bounded influence. Auto influences still obey both the global v0.4 composition limits and each recipe's own influence limit.

If requirements do not provide enough evidence for a credible base recipe, composition fails with an actionable error instead of silently falling back to generic UI.

Explicit mode accepts one to three recipe selections and delegates their composition to the existing v0.4 `composeRecipeBlend` contract.

When recipe scores tie, higher-trust recipes win before the stable ID tie-break. This avoids an equally supported expressive recipe displacing a high-trust recipe by alphabetical accident.

## Design DNA and conflicts

The composed recipe supplies a target and allowed range for every one of the 24 Design DNA axes.

User-requested personality values are clamped to the selected recipe range when necessary. Every clamp is recorded as both a decision and a visible conflict; the Composer does not silently accept a request that would break recipe coherence.

Recipe range conflicts continue to use the v0.4 base-range fallback and remain visible in the generated profile.

## Platform and accessibility

Platform rules are canonical configuration in `taxonomy/composer-signals.json`. They can add UX patterns and hard implementation requirements such as responsive behavior, keyboard access, and touch-target expectations.

The default accessibility target is WCAG 2.2 AA.

When reduced motion is required, the Composer records it as a hard accessibility constraint and requires a reduced-motion path. It does not erase the standard motion design; it requires the product to remain understandable and usable without depending on motion.

## Capabilities and UX patterns

Declared product capabilities can add canonical UX patterns. Examples include search, forms, data tables, transactions, onboarding, filters, settings, offline behavior, permissions, and autosave.

Capability mappings are validated against the UX pattern corpus so the Composer cannot emit unknown pattern IDs.

## Inspiration without imitation

Named products are reference-only. They never participate in recipe scoring and never authorize copying visual identity, source code, assets, or trade dress.

If inspiration is useful, provide abstract reusable traits such as `calm`, `direct`, or `content-forward`. Those traits may become explicit implementation guidance while the brand-safety invariants remain false.

## CLI

Requires Node.js 20+.

~~~bash
npm run compose -- examples/composer-input.olympiad-learning.json --out ./generated-design
~~~

The output directory contains:

~~~text
design-profile.json
DESIGN.md
AGENTS.design.md
~~~

If `--out` is omitted, output goes to `.design-distillation/`.

## Library API

~~~js
import { composeDesign } from "./scripts/composer.mjs";

const result = composeDesign({
  root: process.cwd(),
  input
});

result.profile;
result.designMarkdown;
result.agentInstructions;
~~~

## Contract boundaries

The Composer may select and blend Design Distillation recipes, resolve bounded Design DNA preferences, add canonical UX requirements, and explain its decisions.

It must not:

- clone the visual identity of a named product;
- weaken recipe brand-safety invariants;
- bypass protected base dimensions or recipe influence limits;
- copy proprietary code or assets;
- invent framework-specific implementation values that bypass semantic tokens;
- become the source-owned component registry, website explorer, MCP server, or anti-slop auditor.

Those remain separate layers and later milestones.
