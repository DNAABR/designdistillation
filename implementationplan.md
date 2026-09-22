# Design Distillation implementation plan

This roadmap keeps the project architecture-first. Each phase should leave the repository usable and validated before the next layer is added.

## v0.1 — Corpus contract and architecture

Status: merged into `main`; stabilized in v1.0.0.

- [x] Establish repository philosophy and scope.
- [x] Define corpus entry model and provenance rules.
- [x] Define Design DNA vocabulary.
- [x] Define generated design-profile schema.
- [x] Add contribution and agent rules.
- [x] Add dependency-free corpus validation.
- [x] Add CI validation.
- [x] Seed a principle, anti-pattern, UX pattern, and product recipe.
- [x] Review the initial schema through real contributions.
- [x] Finalize v1.0 distribution as proprietary/`UNLICENSED`; do not call the project open source.
- [x] Stabilize the corpus contract as part of the v1.0 compatibility line.

Exit criterion: contributors and coding agents can add structured design knowledge without inventing a new shape for every entry.

## v0.2 — Tokens and visual foundations

Status: implementation complete on `feat/v0.2-visual-foundations`; merged into `main`.

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

Status: implementation complete on `feat/v0.3-ux-pattern-corpus`; merged into `main`.

- [x] Expand navigation, forms, search, onboarding, settings, data display, permissions, destructive actions, empty states, loading, offline, and recovery patterns.
- [x] Create a dedicated UX pattern schema and taxonomy.
- [x] Model relevant interaction states rather than happy-path screenshots.
- [x] Add explicit decision rules for when to use a pattern and when to prefer an alternative.
- [x] Add accessibility and implementation requirements per pattern.
- [x] Add evidence levels and provenance rules for standard/design-system-backed patterns.
- [x] Link related patterns and anti-patterns as a validated graph.
- [x] Add anti-pattern audit signals for common flow failures.
- [x] Enforce coverage across all declared pattern families.
- [x] Add duplicate-title, broken-reference, evidence/source, and pattern-contract validation.
- [x] Add regression tests for the corpus validator.
- [x] Add deduplication and contribution guidance.

Exit criterion: the corpus covers the common product flows an AI usually improvises badly.

## v0.4 — Design recipes

Status: implementation complete on `feat/v0.4-design-recipes`; merged into `main`.

- [x] Add product recipes for SaaS, fintech, education, consumer social, commerce, editorial, developer tooling, health/wellness, gaming companions, creative software, and public-service interfaces.
- [x] Require complete 24-axis Design DNA coverage per recipe.
- [x] Add bounded target/min/max/weight semantics for Design DNA.
- [x] Add foundation strategy taxonomy for layout, typography, color, shape, elevation, motion, iconography, and imagery.
- [x] Connect recipes to canonical UX patterns and anti-patterns.
- [x] Separate hard constraints from strong defaults and exceptions.
- [x] Add protected dimensions and per-recipe composition limits.
- [x] Add global rule-based recipe composition.
- [x] Add deterministic recipe-blending logic and conflict reporting.
- [x] Add recipe and blend schemas/examples.
- [x] Add brand-safety invariants preventing named-product imitation and proprietary copying.
- [x] Add recipe validation and regression tests.

Exit criterion: product intent can select a coherent starting design language without copying a brand.

## v0.5 - Composer

Status: implementation complete on `feat/v0.5-composer`; merged into `main`.

- [x] Add a deterministic library that converts structured product requirements into a design contract.
- [x] Add a CLI that writes `design-profile.json`, `DESIGN.md`, and `AGENTS.design.md`.
- [x] Add transparent weighted recipe selection from category hints, type, task, description, goals, audience, and brand descriptors.
- [x] Fail ambiguous automatic selection instead of silently generating a generic design.
- [x] Add one optional bounded auto influence when secondary product intent has strong evidence.
- [x] Preserve explicit one-to-three recipe selection and reuse the v0.4 recipe blender.
- [x] Resolve all 24 Design DNA axes against composed recipe ranges.
- [x] Clamp out-of-range personality requests with visible decisions and conflicts.
- [x] Add canonical platform rules for web, responsive web, mobile, desktop, and cross-platform products.
- [x] Map declared product capabilities to validated canonical UX patterns.
- [x] Resolve theme, accessibility target, and reduced-motion requirements without weakening accessibility support.
- [x] Treat named-product inspiration as reference-only and exclude it from recipe scoring.
- [x] Add runtime schema checks for Composer input and generated design profiles.
- [x] Add Composer input examples, documentation, configuration validation, and regression tests.
- [x] Keep generated outputs deterministic, framework-neutral, and brand-safe.

Exit criterion: a new project can begin with a coherent, explainable design contract instead of a blank prompt.

## v0.6 — Registry and reusable implementation

Status: implementation complete on `feat/v0.6-registry`; merged into `main`.

- [x] Define a canonical registry manifest and registry-entry schema.
- [x] Add 3 source-owned components: action button, text field, and status banner.
- [x] Add 3 source-owned compositions: empty state, application shell, and data toolbar.
- [x] Link registry entries to canonical UX patterns, states, platforms, accessibility requirements, and semantic token dependencies.
- [x] Add source-owned shared CSS that consumes semantic Design Distillation variables.
- [x] Add a dependency-light React source adapter suitable for Vite and Next.js projects.
- [x] Add a CSS custom-property adapter generated directly from DTCG token documents.
- [x] Add a curated Tailwind CSS v4 `@theme inline` adapter over semantic variables.
- [x] Add local registry list/build/install CLI commands.
- [x] Add deterministic token resolution for dimensions, colors, font families, typography, shadows, motion, and themes.
- [x] Add registry/adapter validation and regression tests.
- [x] Keep public package publication blocked on the explicit repository-license decision.

Exit criterion: agents can retrieve not only advice but vetted implementation primitives.

## v0.7 — Anti-slop auditor

Status: implementation complete on `feat/v0.7-anti-slop-auditor`; merged into `main`.

- [x] Add a deterministic source-audit library and CLI driven by a generated design profile.
- [x] Check raw spacing, radius, typography, color, primitive-token, and low-depth shadow drift.
- [x] Detect profile-incompatible gradients/backdrop effects instead of banning those aesthetics universally.
- [x] Detect excessive card/panel/surface nesting and mixed icon-library families.
- [x] Add static heading-hierarchy and prioritized-pattern implementation-signal checks.
- [x] Add static accessibility checks for image alt, focus-outline suppression, and input accessible-name review.
- [x] Add reduced-motion path checks with severity strengthened when the profile requires reduced motion.
- [x] Report errors, warnings, style deviations, and intentional exceptions separately.
- [x] Add documented wildcard exceptions that remain visible in the final report.
- [x] Generate both machine-readable audit-report.json and human-readable AUDIT.md.
- [x] Keep the source auditor explicitly heuristic and separate from future browser/runtime testing.
- [x] Add schemas, audit-rule taxonomy, validation, examples, documentation, and regression tests.

Exit criterion: generated UI can be checked against its own design contract.

## v0.8 — Website explorer

Status: implementation complete on `feat/v0.8-website-explorer`; merged into `main`.

- [x] Add a dependency-free static explorer build and local server.
- [x] Compile corpus, registry, token, taxonomy, and Composer data directly from canonical repository sources.
- [x] Add searchable/filterable corpus and registry browsing.
- [x] Add primitive, semantic, and theme token inspection.
- [x] Preserve provenance/source paths and clickable machine-source links for every browsable record.
- [x] Generate one real deterministic Composer baseline profile for each of the 11 design recipes.
- [x] Add a recipe-bound Design DNA Lab covering all 24 axes.
- [x] Constrain every interactive axis to the selected recipe min/max range.
- [x] Add theme preview, foundation-strategy summaries, and structured profile preview.
- [x] Allow users to download a Composer input reflecting preview settings instead of editing JSON manually.
- [x] Mark browser-adjusted profiles as explorer previews rather than canonical Composer artifacts.
- [x] Add deterministic dataset/build validation and regression tests.

Exit criterion: non-agent users can understand and configure the system without editing JSON.

## v0.9 — Retrieval / MCP layer

Status: implementation complete on `feat/v0.9-mcp-retrieval`; merged into `main`.

- [x] Add deterministic compact search over corpus and registry data instead of repository-wide context dumps.
- [x] Add focused pattern search and a forward-compatible reference-search surface.
- [x] Add full-entry and full-recipe fetch tools after retrieval identifies the relevant item.
- [x] Add compact deterministic recipe ranking/selection and full Composer profile generation.
- [x] Add semantic DTCG token resolution by theme.
- [x] Add explicit-content source auditing without arbitrary filesystem browsing through MCP.
- [x] Implement a local stdio MCP server using the official TypeScript SDK v2.
- [x] Mark the MCP tool surface read-only, idempotent, and closed-world where applicable.
- [x] Add a real MCP client/server stdio integration test covering initialize, tools/list, and tools/call.
- [x] Add eight retrieval benchmark cases spanning UX patterns and recipes.
- [x] Require 100% benchmark recall at the configured result limits.
- [x] Enforce compact retrieval responses relative to the serialized full corpus.
- [x] Add documentation, validation, and pinned MCP SDK dependencies.

Exit criterion: coding agents can pull only the design knowledge needed for the current task.

## v1.0 — Benchmarked design pipeline

Status: stable v1.0.0 implementation complete and merged into `main`.

- [x] Add a machine-readable v1 public-contract manifest for schemas, commands, and MCP tools.
- [x] Add migration policy plus a machine-readable v0.9 -> v1 RC migration record.
- [x] Capture the validated v0.9 semantic behavior as a versioned baseline.
- [x] Add a cross-layer pipeline benchmark covering corpus/tokens, Composer, registry retrieval, themed tokens, auditing, explorer coverage, and focused retrieval.
- [x] Compare semantic outcomes rather than brittle whole-file snapshots.
- [x] Require retrieval relevance/compactness to remain within the validated baseline.
- [x] Add a deterministic registry visual-regression fixture generated from canonical tokens and source-owned CSS.
- [x] Keep the visual fixture runner-agnostic instead of forcing browser automation into core dependencies.
- [x] Add public API compatibility rules for the v1 line.
- [x] Document future deprecation and breaking-change migration requirements.
- [x] Add CI/test gates for compatibility manifests, semantic baseline comparisons, and deterministic visual fixture generation.
- [x] Finalize distribution as proprietary/`UNLICENSED` for v1.0.
- [x] Explicitly approve the stable `v1.0.0` release.

Exit criterion: complete. v1.0.0 is the stable compatibility line.
