# Design Distillation

Design Distillation is a public, machine-readable design knowledge base and visual-foundation system for humans and AI coding agents.

The goal is not to collect every attractive component on the internet. The goal is to distill a compact set of reusable design decisions, patterns, references, tokens, and constraints that can express a large useful design space—and make those decisions usable by coding agents without defaulting to generic AI UI.

## Product model

Design Distillation is designed as six connected layers:

1. **Design knowledge** — principles, UX laws, accessibility, historical design thinking, and anti-patterns.
2. **Design references** — structured analysis of excellent products and public design systems.
3. **Design DNA** — machine-readable dimensions such as density, warmth, playfulness, contrast, radius, depth, and motion intensity.
4. **Reusable implementation** — tokens, components, compositions, interaction patterns, and motion recipes.
5. **Design composer** — product intent + audience + brand personality -> a coherent design contract.
6. **Design auditor** — automated checks for incoherence, accessibility failures, missing states, and common AI-design failure modes.

## Current milestone: v0.5 composer

v0.1 established the corpus contract and architecture. v0.2 added framework-neutral visual foundations. v0.3 added a structured UX pattern graph. v0.4 added canonical product-archetype recipes and bounded recipe composition. v0.5 adds the first deterministic design compiler.

The current system includes:

- 30 canonical UX patterns across 10 pattern families;
- 9 anti-patterns with future auditor signals;
- 11 design recipes across 11 product categories;
- complete 24-axis Design DNA coverage for every recipe;
- foundation strategies for layout, type, color, shape, elevation, motion, icons, and imagery;
- hard constraints separated from strong defaults and exceptions;
- bounded recipe composition with protected dimensions and conflict reporting;
- deterministic weighted recipe selection from structured product intent, with no silent generic fallback;
- one optional bounded auto influence when secondary intent is strongly supported;
- bounded personality resolution with visible decisions and conflicts;
- capability-to-pattern mapping plus canonical platform requirements;
- accessibility targeting, theme selection, and required reduced-motion paths;
- generated `design-profile.json`, `DESIGN.md`, and `AGENTS.design.md` artifacts;
- named-product inspiration treated as reference-only rather than a cloning signal;
- non-negotiable brand-safety rules;
- runtime schema checks plus regression tests across the corpus, tokens, recipes, blending, and Composer configuration.

See [docs/composer.md](./docs/composer.md), [docs/design-recipes.md](./docs/design-recipes.md), and [docs/ux-pattern-corpus.md](./docs/ux-pattern-corpus.md).

## Token architecture

~~~text
primitive values
      ↓
semantic intent
      ↓
theme mapping
      ↓
future adapters/components
~~~

Components should consume semantic roles such as `semantic.color.text.primary` or `semantic.radius.control`, not hard-coded palette values such as `primitive.color.blue.600`.

See [tokens/README.md](./tokens/README.md) and [docs/visual-foundations.md](./docs/visual-foundations.md).

## Core philosophy

A useful corpus entry must explain **why**, not only **what**.

Every contribution should answer:

- What problem does this solve?
- When should it be used?
- When should it not be used?
- Why does it work?
- What implementation guidance is available?
- Where did the idea/code come from and what may be redistributed?

The project distinguishes observed design ideas from redistributable code and assets. Proprietary products may be analyzed, but their source code, screenshots, logos, and copyrighted assets must not be copied into the corpus unless their license explicitly permits it.

## Repository shape

~~~text
corpus/       structured design knowledge
tokens/       primitive, semantic, and theme foundations
schemas/      machine-readable contracts
taxonomy/     shared vocabulary and composer rules
examples/     example requests and generated-contract inputs
docs/         architecture and design rationale
scripts/      validation, blending, and composer tooling
.github/      CI
~~~

Later milestones add source-owned components, adapters, the anti-slop auditor, website explorer, MCP retrieval, and benchmarks.

## Compose a design contract

Requires Node.js 20+.

~~~bash
npm run compose -- examples/composer-input.olympiad-learning.json --out ./generated-design
~~~

The composer writes `design-profile.json`, `DESIGN.md`, and `AGENTS.design.md`. Recipe selection and all bounded resolutions are deterministic and explainable.

## Validate

~~~bash
npm run check
~~~

Validation checks recipes, UX patterns, visual foundations, and composer behavior, including Design DNA coverage/ranges, composition limits, brand-safety invariants, pattern family/state contracts, accessibility requirements, related-entry references, token references, circular aliases, DTCG value shapes, scale ordering, theme semantic parity, configured contrast pairs, recipe selection, personality clamping, and deterministic contract generation.

## Status

Design Distillation is currently building toward a stable public format. The repository license and public launch/announcement will be decided separately.

See [implementationplan.md](./implementationplan.md), [docs/architecture.md](./docs/architecture.md), and [CONTRIBUTING.md](./CONTRIBUTING.md).
