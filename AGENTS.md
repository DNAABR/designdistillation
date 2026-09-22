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

## Validation

Run:

~~~bash
npm run validate
~~~

Do not bypass validation to land new corpus or token data.

## Scope control

v0.2 establishes visual foundations only. Do not prematurely turn this branch into the website, component library, Tailwind adapter, MCP server, or design composer. Those layers depend on the token contract and are scheduled separately in `implementationplan.md`.
