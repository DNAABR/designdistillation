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

## Current milestone: v0.6 registry

v0.1 established the corpus contract and architecture. v0.2 added framework-neutral visual foundations. v0.3 added a structured UX pattern graph. v0.4 added canonical product-archetype recipes and bounded recipe composition. v0.5 added the deterministic design compiler. v0.6 adds the first source-owned reusable implementation registry.

The current system includes:

- 30 canonical UX patterns across 10 pattern families;
- 9 anti-patterns with future auditor signals;
- 11 design recipes across 11 product categories;
- complete 24-axis Design DNA coverage for every recipe;
- framework-neutral DTCG visual foundations with light, dark, and high-contrast themes;
- deterministic Composer output with visible recipe/personality decisions and conflicts;
- 6 source-owned registry entries: 3 components and 3 compositions;
- CSS custom-property generation directly from canonical tokens;
- a curated Tailwind CSS v4 semantic adapter;
- dependency-light React source entries for Vite/Next.js projects;
- local registry list/build/install tooling;
- validation tying registry entries back to canonical patterns, taxonomy, source files, and semantic tokens;
- non-negotiable brand-safety and accessibility rules.

See [docs/registry.md](./docs/registry.md), [docs/composer.md](./docs/composer.md), and [docs/design-recipes.md](./docs/design-recipes.md).

## Token and implementation architecture

~~~text
primitive values
      ↓
semantic intent
      ↓
theme mapping
      ↓
Composer design contract
      ↓
registry contract
      ↓
CSS / Tailwind / React adapters
~~~

Components consume semantic roles such as `semantic.color.text.primary` or `semantic.radius.control`, not hard-coded palette values such as `primitive.color.blue.600`.

## Repository shape

~~~text
corpus/       structured design knowledge
tokens/       primitive, semantic, and theme foundations
registry/     source-owned reusable implementation and metadata
schemas/      machine-readable contracts
taxonomy/     shared vocabulary and Composer rules
examples/     example requests and generated-contract inputs
docs/         architecture and design rationale
scripts/      validation, Composer, registry, and adapter tooling
.github/      CI
~~~

## Compose a design contract

Requires Node.js 20+.

~~~bash
npm run compose -- examples/composer-input.olympiad-learning.json --out ./generated-design
~~~

## Use the registry

~~~bash
npm run registry -- list
npm run registry -- build --out .design-distillation/registry
npm run registry -- install --entries action-button,text-field --adapter react --out ./src/design-distillation
~~~

The repository license is still undecided. Registry installation is therefore provided for local evaluation; public package publishing/redistribution waits for an explicit license decision.

## Validate

~~~bash
npm run check
~~~

Validation covers corpus knowledge, recipes, visual foundations, Composer behavior, registry contracts, semantic-token references, source-owned implementation metadata, and deterministic adapter generation.

## Status

Design Distillation is currently building toward a stable public format. The repository license and public launch/announcement will be decided separately.

See [implementationplan.md](./implementationplan.md), [docs/architecture.md](./docs/architecture.md), [CONTRIBUTING.md](./CONTRIBUTING.md), and [AGENTS.md](./AGENTS.md).
