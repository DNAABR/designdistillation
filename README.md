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

## Current milestone: v0.3 UX pattern corpus

v0.1 established the corpus contract and architecture. v0.2 added framework-neutral visual foundations. v0.3 now gives AI agents structured task-level UX decisions instead of forcing them to improvise entire flows from components.

The current corpus includes:

- 30 canonical UX patterns across 10 pattern families;
- explicit use/avoid decision rules for every pattern;
- relevant interaction-state coverage;
- accessibility and implementation requirements;
- evidence levels and source provenance;
- graph links between related patterns and anti-patterns;
- 9 anti-patterns with future auditor signals;
- validation for family coverage, broken references, duplicate titles, evidence/source mismatches, and missing pattern requirements.

See [docs/ux-pattern-corpus.md](./docs/ux-pattern-corpus.md) and [corpus/patterns/README.md](./corpus/patterns/README.md).

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

Later milestones add richer product recipes, the composer, source-owned components, adapters, the anti-slop auditor, website explorer, MCP retrieval, and benchmarks.

## Validate

Requires Node.js 20+.

~~~bash
npm run validate
~~~

Validation checks both the UX corpus and visual foundations, including pattern family/state contracts, accessibility requirements, evidence/source alignment, related-entry references, token references, circular aliases, DTCG value shapes, scale ordering, theme semantic parity, and configured contrast pairs.

## Status

Design Distillation is currently building toward a stable public format. The repository license and public launch/announcement will be decided separately.

See [implementationplan.md](./implementationplan.md), [docs/architecture.md](./docs/architecture.md), and [CONTRIBUTING.md](./CONTRIBUTING.md).
