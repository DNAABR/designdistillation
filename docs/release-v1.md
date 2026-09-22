# v1.0 stable release

Design Distillation v1.0.0 is the first stable compatibility line for the complete corpus-to-MCP design pipeline.

## Release status

The release is approved as stable.

- package version: 1.0.0
- public-contract status: stable
- compatibility line: v1
- distribution: proprietary
- package license metadata: UNLICENSED

The repository is publicly visible, but it is not an open-source release and does not grant redistribution rights through an open-source license.

## Automated gates

CI verifies corpus/tokens, recipe composition, Composer behavior, registry/adapters, auditor rules, explorer generation, retrieval/MCP integration, public-contract consistency, semantic pipeline baselines, and deterministic visual-fixture generation.

## Stable v1 guarantees

The public schemas, documented CLI commands, and MCP tool names listed in schemas/public-manifest.json are stable for the v1 compatibility line under docs/public-api.md.

Breaking public-contract changes require a future major-version decision plus migration documentation and benchmark updates.

## Release discipline

Future v1.x changes must preserve the validated semantic baseline unless a behavior change is intentional and documented.

No open-source license should be added or public-package redistribution enabled without a separate explicit decision.
