# Public API and compatibility policy

This document defines the v1 compatibility contract. The v1.0.0 compatibility line is stable.

## Stable v1 status

The machine-readable compatibility manifest is schemas/public-manifest.json.

All listed schemas, commands, and MCP tool names are v1-candidate. They become stable v1 public contracts only when an explicit v1.0.0 release is approved and tagged.

The remaining release blocker is the repository license decision. The RC does not choose a license or claim open-source redistribution rights.

## Stable-contract rules for v1

For the stable v1 line:

- existing required fields will not be removed or renamed in a v1 minor/patch release;
- enum values may be added only where consumers are expected to tolerate extension;
- a field's semantic meaning will not be silently repurposed;
- CLI command names and documented required arguments remain compatible through v1;
- MCP tool names and required input fields remain compatible through v1;
- newly added optional fields must preserve existing valid payloads;
- breaking changes require a new major compatibility line and a migration note.

Internal implementation files are not public API unless named in the manifest.

## Versioned payloads

Artifact payload versions intentionally remain tied to the milestone that introduced their contract. A v1 distribution may still emit a 0.5.0 Composer profile payload when that payload contract has not changed.

Distribution/package version and payload-schema version are separate concepts.

## Contribution API

Contributors extend canonical data through the documented schemas and validation pipeline: corpus entries, patterns and recipes, DTCG token documents and token manifest, registry entries, and audit configuration/exceptions.

A contribution is accepted only when npm run check remains green and semantic/retrieval pipeline benchmarks do not regress without an intentional baseline update.

## Intentional breaking changes

A future breaking change must include, in the same pull request:

1. updated schema/API documentation;
2. a migration entry under migrations/manifest.json;
3. updated benchmark expectations;
4. compatibility tests for the old-to-new transition where automation is feasible;
5. an explicit major-version decision.

Silent breakage is not an allowed migration strategy.
