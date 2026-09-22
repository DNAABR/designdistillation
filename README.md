# Design Distillation

Design Distillation is an open, machine-readable design knowledge base for humans and AI coding agents.

The goal is not to collect every attractive component on the internet. The goal is to distill the smallest set of reusable design decisions, patterns, references, tokens, and constraints that can express a very large useful design space—and make those decisions usable by coding agents without producing generic AI UI.

## What this project should become

Design Distillation is designed as six connected layers:

1. Design knowledge — principles, UX laws, accessibility, historical design thinking, anti-patterns.
2. Design references — structured analysis of excellent products and public design systems.
3. Design DNA — machine-readable dimensions such as density, warmth, playfulness, contrast, radius, depth, and motion intensity.
4. Reusable implementation — tokens, components, compositions, interaction and motion recipes.
5. Design composer — product intent + audience + brand personality -> a coherent design contract.
6. Design auditor — automated checks for incoherence, accessibility failures, missing states, and common AI-design failure modes.

## v0.1: Foundation

The first milestone intentionally focuses on the information architecture instead of the website.

Current v0.1 work includes:

- a canonical corpus entry model;
- a generated design-profile schema;
- taxonomy and provenance rules;
- contribution rules;
- starter principles, patterns, anti-patterns, and recipes;
- validation tooling and CI;
- architecture and implementation roadmap.

## Core philosophy

A useful entry must explain why, not only what.

Every contribution should answer:

- What problem does this solve?
- When should it be used?
- When should it not be used?
- Why does it work?
- What implementation guidance is available?
- Where did the idea/code come from and what may be redistributed?

The project must distinguish observed design ideas from redistributable code and assets. Proprietary products may be analyzed, but their source code, screenshots, logos, and copyrighted assets must not be copied into the corpus unless their license explicitly permits it.

## Repository shape

~~~text
corpus/
  principles/
  patterns/
  anti-patterns/
  recipes/

schemas/
taxonomy/
docs/
scripts/
.github/workflows/
~~~

Later milestones add tokens, typography, color, motion, branding, components, blocks, reference analyses, adapters, the composer, auditor, registry, MCP interface, benchmarks, and the website explorer.

## Validate

Requires Node.js 20+.

~~~bash
npm run validate
~~~

The validator checks JSON syntax, duplicate IDs, taxonomy membership, minimum corpus fields, provenance metadata, and basic schema consistency.

## Status

Design Distillation is at v0.1 / architecture foundation. APIs and data shapes are expected to evolve until the first stable corpus format is declared.

See implementationplan.md, docs/architecture.md, and CONTRIBUTING.md.
