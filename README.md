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

## Current milestone: v0.2 visual foundations

v0.1 established the corpus contract and architecture. v0.2 adds the framework-neutral visual layer that future composers and adapters can consume.

The current foundation includes:

- DTCG 2025.10-aligned token documents;
- primitive color, spacing, radius, border, typography, elevation, and motion scales;
- semantic spacing, sizing, typography, elevation, and motion roles;
- light, dark, and high-contrast semantic color themes;
- explicit reduced-motion semantics;
- token alias, cycle, scale, theme-parity, type-shape, and contrast validation;
- a design-profile example wired to the token manifest.

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
taxonomy/     shared vocabulary
examples/     example generated contracts
docs/         architecture and design rationale
scripts/      validation tooling
.github/      CI
~~~

Later milestones add a much broader UX-pattern corpus, product recipes, the composer, source-owned components, adapters, the anti-slop auditor, website explorer, MCP retrieval, and benchmarks.

## Validate

Requires Node.js 20+.

~~~bash
npm run validate
~~~

Validation checks both the corpus and visual foundations, including token references, circular aliases, DTCG value shapes, configured scale ordering, theme semantic parity, and configured contrast pairs.

## Status

Design Distillation is currently building toward a stable public format. The repository license and public launch/announcement will be decided separately.

See [implementationplan.md](./implementationplan.md), [docs/architecture.md](./docs/architecture.md), and [CONTRIBUTING.md](./CONTRIBUTING.md).
