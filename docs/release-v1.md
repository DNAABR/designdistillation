# v1.0 release candidate

The repository can now exercise the complete architecture from design knowledge through retrieval and auditing, but this branch is intentionally a release candidate rather than an automatic v1.0.0 release.

## Automated gates

CI verifies corpus/tokens, recipe composition, Composer behavior, registry/adapters, auditor rules, explorer generation, retrieval/MCP integration, public-contract consistency, semantic pipeline baselines, and deterministic visual-fixture generation.

## Human release gates

Two decisions are deliberately not automated:

1. choose the repository license;
2. explicitly approve the v1.0.0 stable release/tag.

Until those happen:

- package version remains 1.0.0-rc.1;
- package license remains UNLICENSED;
- public surfaces remain v1-candidate;
- documentation must not claim that the repository is a final open-source v1 release.

## Stable-release change

Once the license is chosen and release is approved, the release change should be intentionally small:

- add/confirm the selected LICENSE file and matching package metadata;
- change package/public manifest version to 1.0.0;
- change public-contract status from release-candidate to stable;
- update roadmap/status wording;
- run the full benchmark suite;
- tag v1.0.0.

No unrelated product work should be bundled into that release gate.
