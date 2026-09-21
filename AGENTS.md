# AGENTS.md

These rules apply to coding agents working in this repository.

## Product objective

Design Distillation is a machine-readable design knowledge base and future design compiler/auditor. Optimize for durable structured knowledge, not visual demo volume.

## Non-negotiables

- Machine-readable data is the source of truth.
- Prefer a small canonical entry over many near-duplicates.
- Every corpus entry must explain problem, appropriate use, inappropriate use, and rationale.
- Preserve provenance. Do not strip source or licensing metadata.
- Never copy proprietary source code, screenshots, logos, brand assets, or closed design-system content into the repository without an explicit compatible license.
- An observation about a public product is not permission to redistribute its implementation.
- Accessibility is foundational, not a final polish pass.
- Semantic tokens should be preferred over literal component styling once token work begins.
- Avoid adding fashionable visual treatments without a documented product/design rationale.
- Do not create arbitrary one-off scales for spacing, typography, radius, color, elevation, or motion.

## Data changes

Before adding a new field to corpus entries:

1. explain why existing fields cannot represent the concept;
2. update the relevant schema;
3. update the validator if the field affects invariants;
4. update at least one fixture/example;
5. keep backwards compatibility in mind.

## New corpus entries

Run npm run validate.

A valid contribution is not automatically a good contribution. Reviewers should also reject:

- duplicates with superficial naming changes;
- copied gallery/inspiration content without reasoning;
- unlicensed implementation code;
- entries that only describe aesthetics;
- entries that encourage inaccessible defaults;
- rules presented as universal when they are context-dependent.

## Scope control

Do not build the website, MCP server, registry, CLI, or framework adapters inside v0.1 unless the implementation plan is explicitly advanced. The first milestone exists to make those later systems trustworthy.
