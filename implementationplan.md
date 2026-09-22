# Design Distillation implementation plan

This roadmap keeps the project architecture-first. Each phase should leave the repository usable and validated before the next layer is added.

## v0.1 — Corpus contract and architecture

Status: in progress

- [x] Establish repository philosophy and scope.
- [x] Define corpus entry model and provenance rules.
- [x] Define Design DNA vocabulary.
- [x] Define generated design-profile schema.
- [x] Add contribution and agent rules.
- [x] Add dependency-free corpus validation.
- [x] Add CI validation.
- [x] Seed a principle, anti-pattern, UX pattern, and product recipe.
- [ ] Review the initial schema through real contributions.
- [ ] Decide and add the repository license before calling the project open source.
- [ ] Declare the first stable v0.1 corpus format.

Exit criterion: contributors and coding agents can add structured design knowledge without inventing a new shape for every entry.

## v0.2 — Tokens and visual foundations

Status: implementation complete on `feat/v0.2-visual-foundations`; awaiting review/merge.

- [x] Pin the visual foundation to stable DTCG 2025.10 token documents.
- [x] Define Design Distillation's explicit multi-file/token-theme composition manifest.
- [x] Add primitive and semantic token vocabularies.
- [x] Add spacing, typography, radius, border, elevation, color, and motion foundations.
- [x] Add light, dark, and high-contrast themes with one semantic color contract.
- [x] Add explicit reduced-motion semantics.
- [x] Add missing/circular alias, type-shape, scale, and theme-parity validation.
- [x] Add configured contrast checks across every theme.
- [x] Keep the canonical foundation framework-neutral.
- [x] Connect an example design profile to the token manifest/theme contract.
- [x] Document visual-foundation and token contribution rules.

Exit criterion: a design profile can resolve into coherent framework-neutral visual tokens without components inventing their own design values.

## v0.3 — UX pattern corpus

- Expand navigation, forms, search, onboarding, settings, data display, permissions, destructive actions, empty states, loading, offline, and recovery patterns.
- Model complete interaction states rather than happy-path screenshots.
- Add accessibility requirements per pattern.
- Add deduplication/review guidance.

Exit criterion: the corpus covers the common product flows an AI usually improvises badly.

## v0.4 — Design recipes

- Add product recipes for SaaS, fintech, education, consumer social, commerce, editorial, developer tooling, health/wellness, gaming companions, creative software, and public-service interfaces.
- Add rule-based composition between recipes.
- Separate strong defaults from hard constraints.

Exit criterion: product intent can select a coherent starting design language without copying a brand.

## v0.5 — Composer

- Build a CLI/library that converts product requirements into `design-profile.json`.
- Generate `DESIGN.md` and agent instructions.
- Resolve recipe + personality + platform + accessibility constraints.
- Explain the rationale behind generated decisions.

Exit criterion: a new project can begin with a coherent design contract instead of a blank prompt.

## v0.6 — Registry and reusable implementation

- Add source-owned components and compositions.
- Publish installable registry entries where practical.
- Keep knowledge/tokens framework-neutral.
- Add adapters for CSS/Tailwind and common web stacks first.

Exit criterion: agents can retrieve not only advice but vetted implementation primitives.

## v0.7 — Anti-slop auditor

- Check spacing/radius/type scale consistency.
- Detect excessive surface nesting, arbitrary colors, icon-family mixing, missing states, weak hierarchy, and unjustified decorative patterns.
- Add accessibility and reduced-motion checks.
- Report errors, warnings, style deviations, and intentional exceptions separately.

Exit criterion: generated UI can be checked against its own design contract.

## v0.8 — Website explorer

- Browse/search the corpus.
- Inspect patterns, references, recipes, tokens, and provenance.
- Interactively tune Design DNA.
- Preview generated design profiles.
- Link every human-facing view back to machine-readable source data.

Exit criterion: non-agent users can understand and configure the system without editing JSON.

## v0.9 — Retrieval / MCP layer

- Add focused retrieval tools rather than dumping the repository into context.
- Support pattern/reference search, recipe selection, profile composition, and audits.
- Benchmark retrieval relevance and token efficiency.

Exit criterion: coding agents can pull only the design knowledge needed for the current task.

## v1.0 — Benchmarked design pipeline

- Maintain prompt/task benchmarks.
- Compare generated results across versions.
- Add visual-regression fixtures where useful.
- Document stable public schemas and contribution APIs.
- Publish migration rules for future schema changes.

Exit criterion: Design Distillation behaves like dependable open design infrastructure, not an inspiration archive.
