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

Before adding a new field to corpus entries, schemas, token manifests, composer requests, or generated contracts:

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
- Do not average categorical foundation strategies. Base recipe strategy is the default unless the composer records an explicit reason to override it.
- Recipe influences must obey global and per-recipe weight limits.
- Never relax brand-safety fields or use a recipe as permission to copy brand assets, proprietary code, or exact named-product trade dress.
- Prefer one canonical recipe with useful ranges over multiple cosmetic variants.

## Composer rules

- Keep the canonical composer deterministic and dependency-free unless the architecture is deliberately revised.
- Treat `schemas/composer-input.schema.json` as the input contract and `schemas/design-profile.schema.json` as the generated profile contract.
- Automatic recipe selection must use transparent weighted signals and fail when no credible base recipe can be inferred.
- An automatic influence is allowed only when secondary intent clears the configured evidence thresholds and all v0.4 global/per-recipe limits.
- Explicit selections still obey all v0.4 base-weight, influence-weight, protected-dimension, and conflict rules.
- Resolve requested Design DNA values inside the composed min/max contract. Clamp out-of-range values and surface the clamp as both a decision and a conflict.
- Use `taxonomy/composer-signals.json` for recipe signals, capability mappings, platform rules, and Composer accessibility rules.
- Platform requirements and accessibility requirements are constraints, not aesthetic suggestions.
- Reduced-motion requirements must remain a complete product path even when the standard design uses motion.
- Generated Markdown explains the machine-readable contract; it is not the source of truth.
- Composer output must be deterministic for the same repository state and request.
- Named products are reference-only: exclude them from recipe scoring and never use them to authorize copying visual identity, assets, code, or trade dress.

## Registry rules

- Registry metadata defines reusable intent, states, slots, pattern links, accessibility requirements, and token dependencies; framework source is an implementation of that contract.
- Keep source-owned registry entries small and justified by recurring product needs. Do not grow a component gallery for its own sake.
- Registry CSS must consume generated semantic `--dd-*` variables whenever a semantic token exists. Do not hard-code palette colors or consume primitive palette variables.
- Adapters may transform DTCG values into CSS, Tailwind, or framework source, but they must not create a second token system.
- React registry source should prefer native HTML semantics and stay dependency-light. Do not add a headless/component-library dependency for behavior the platform already provides well.
- Registry entries must reference real UX patterns and real token paths; keep those relationships validated.
- Accessibility requirements are part of the reusable implementation contract, not comments around the code.
- Keep generated adapter output deterministic for the same repository state.
- The repository license is still undecided. Do not publish packages, registries, or redistributed bundles as open source until an explicit license is chosen.

## Auditor rules

- Treat the v0.7 auditor as deterministic source evidence, not proof of runtime UX or accessibility.
- Every audit rule must have a stable ID, default category, and plain-language description in `taxonomy/audit-rules.json`.
- Errors require stronger static evidence than warnings. Use warnings when runtime or product context could change the conclusion.
- Style deviations compare implementation choices to the selected design profile; do not turn aesthetic preferences into universal errors.
- Intentional exceptions must stay visible in reports with their original category and a meaningful reason. Never use exceptions as silent suppression.
- Keep profile-aware thresholds/configuration machine-readable rather than scattering magic numbers through the scanner.
- New prioritized-pattern source signals are heuristics and must remain warnings unless stronger evidence exists.
- Source checks must report file, line, rule, message, and compact evidence so a coding agent can act on them.
- Do not claim static source scanning replaces browser accessibility testing, computed-style inspection, responsive/device testing, or visual regression.

## Explorer rules

- The website explorer is a generated human view over canonical machine-readable data; it is not a second CMS or data source.
- Keep explorer data compilation deterministic and source-linked.
- Every browsable corpus, registry, and token record must preserve a path/link back to its machine source.
- Use the real Composer to generate baseline recipe profiles; do not reimplement recipe composition in browser code.
- Interactive Design DNA controls must remain inside the selected recipe ranges.
- Browser changes are previews. Mark them as such and provide a Composer input for canonical recompilation.
- Do not introduce a frontend framework or backend solely for static browsing needs without a demonstrated requirement.
- Preserve keyboard/focus usability and reduced-motion behavior in the explorer itself.

## Validation

Run:

~~~bash
npm run check
~~~

Do not bypass validation to land new corpus, token, recipe, Composer, registry, adapter, auditor, or explorer data.

## Scope control

v0.8 establishes the static human explorer. Do not turn this branch into the MCP retrieval server, hosted AI service, account system, editable CMS, visual-regression/browser automation suite, npm publication, or a broad component-library clone. Those belong to later milestones or separate architecture decisions.
