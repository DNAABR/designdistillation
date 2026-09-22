# Migration policy

Design Distillation treats schema evolution, CLI behavior, MCP tools, and generated artifacts as versioned contracts.

## v0.9 to v1.0

No migration is required for existing canonical artifacts.

v1.0 adds a public-contract manifest, semantic cross-version benchmark baselines, a deterministic pipeline benchmark, a reusable visual-regression fixture, and explicit migration policy.

It does not rename canonical schemas or rewrite existing Composer, registry, or audit payload versions.

## Future migration rules

Patch releases must not require data migration.

Minor releases may add optional fields, new compatible entries, new adapter outputs, or new tools. They must not invalidate previously valid v1 inputs.

Major releases may make breaking changes, but must document old and new versions, affected surfaces, whether migration is automatic or manual, exact transformation rules, removed/deprecated behavior, and benchmark baseline changes.

## Deprecation

When practical, a public v1 surface should be deprecated for at least one minor release before removal in the next major compatibility line.

Deprecations must be machine-readable or validator-visible where feasible; documentation-only deprecation is insufficient for critical generated contracts.

## Baseline changes

Benchmark baseline updates require a written reason. A changed visual/design outcome is not accepted merely because tests were updated to match it.

The benchmark should answer: did the design contract improve intentionally, or did behavior drift?
