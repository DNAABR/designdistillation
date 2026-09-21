# AGENTS.md

These rules apply to coding agents working in this repository.

## Product objective

Design Distillation is a machine-readable design knowledge base and future design compiler/auditor. Optimize for durable structured knowledge and coherent implementation constraints, not visual demo volume.

## Non-negotiables

- Machine-readable data is the source of truth.
- Prefer a small canonical entry over many near-duplicates.
- Every corpus entry must explain problem, appropriate use, inappropriate use, and rationale.
- Preserve provenance. Do not strip source or licensing metadata.
- Never copy proprietary source code, screenshots, logos, brand assets, or closed design-system content into the repository without an explicit compatible license.
- An observation about a public product is not permission to redistribute its implementation.
- Accessibility is foundational, not a final polish pass.
- Avoid adding fashionable visual treatments without documented product/design rationale.
- Do not create arbitrary one-off scales for spacing, typography, radius, color, elevation, or motion.

## Token rules

- Keep individual token files aligned with DTCG 2025.10 until the project deliberately upgrades the pinned stable format.
- Treat `tokens/manifest.json` multi-file composition as a Design Distillation convention, not a DTCG feature.
- Preserve the primitive -> semantic -> theme separation.
- Components and future adapters should consume semantic tokens whenever a semantic role exists.
- Do not add product meaning to primitive palette names.
- Every theme must expose the same `semantic.color.*` paths.
- New aliases must resolve; circular and missing aliases are invalid.
- Prefer existing finite scales over one-off values.
- New meaningful foreground/background combinations should be considered for manifest contrast checks.
- Non-essential motion must have a reduced-motion path.
- Shadows communicate layering; they are not default decoration.
- Do not silently change a token's semantic meaning merely to make one component look better.

## Data changes

Before adding a new field to corpus entries, schemas, token manifests, or generated contracts:

1. explain why existing fields cannot represent the concept;
2. update the relevant schema/documentation;
3. update validation when the field affects invariants;
4. update at least one example when useful;
5. keep future migration/backwards compatibility in mind.

## New corpus entries

A valid contribution is not automatically a good contribution. Reviewers should reject:

- duplicates with superficial naming changes;
- copied gallery/inspiration content without reasoning;
- unlicensed implementation code;
- entries that only describe aesthetics;
- entries that encourage inaccessible defaults;
- rules presented as universal when they are context-dependent.

## UX pattern rules

- A pattern is a context-dependent design decision, not a screenshot or component example.
- Every pattern needs a family, evidence level, relevant states, decision rules, accessibility requirements, implementation requirements, and related-entry arrays.
- use_when / decision.use_if must explain when the pattern belongs.
- avoid_when / decision.prefer_alternatives_if must prevent the pattern from becoming a universal rule.
- Prefer extending an existing canonical pattern over adding a near-duplicate with different product vocabulary.
- standard-backed entries require a standard source; design-system-backed entries require a design-system source.
- Related pattern and anti-pattern IDs must resolve.
- Accessibility requirements are part of the pattern contract, not optional implementation notes.
- Do not turn WAI-ARIA example code into a default implementation; prefer native platform semantics where they solve the task.

## Design recipe rules

- A recipe is a product-archetype starting design language, not a named-product style clone.
- Every recipe must cover all Design DNA axes with target, min, max, and weight.
- Keep target values inside their declared min/max range.
- Use only foundation strategy values declared in taxonomy.
- patterns.prioritize and patterns.consider must reference real UX patterns; patterns.avoid must reference anti-patterns.
- Hard constraints are non-negotiable product qualities. Strong defaults may be overridden only with explicit rationale.
- Protected dimensions in the base recipe win during blending.
- Do not average categorical foundation strategies. Base recipe strategy is the default unless a later composer records an explicit reason to override it.
- Recipe influences must obey global and per-recipe weight limits.
- Never relax brand-safety fields or use a recipe as permission to copy brand assets, proprietary code, or exact named-product trade dress.
- Prefer one canonical recipe with useful ranges over multiple cosmetic variants.

## Validation

Run:

~~~bash
npm run check
~~~

Do not bypass validation to land new corpus or token data.

## Scope control

v0.4 establishes canonical design recipes and explicit recipe blending only. It does not select recipes from natural-language product requirements or generate final design contracts; that is v0.5. Do not prematurely turn this branch into the website, component library, Tailwind adapter, MCP server, or full auditor.
