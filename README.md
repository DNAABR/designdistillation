# Design Distillation

Design Distillation is a public, machine-readable design knowledge base and visual-foundation system for humans and AI coding agents.

The goal is not to collect every attractive component on the internet. The goal is to distill a compact set of reusable design decisions, patterns, references, tokens, and constraints that can express a large useful design space—and make those decisions usable by coding agents without defaulting to generic AI UI.

## Product model

Design Distillation is designed as six connected layers:

1. **Design knowledge** — principles, UX laws, accessibility, historical design thinking, and anti-patterns.
2. **Design references** — structured analysis of excellent products and public design systems.
3. **Design DNA** — machine-readable dimensions such as density, warmth, playfulness, contrast, radius, depth, and motion intensity.
4. **Reusable implementation** — tokens, components, compositions, interaction patterns, and motion recipes.
5. **Design composer** — product intent + audience + brand personality -> a coherent design contract.
6. **Design auditor** — automated checks for incoherence, accessibility failures, missing states, and common AI-design failure modes.

## Current milestone: v1.1 PR auditing

v0.1 established the corpus contract and architecture. v0.2 added framework-neutral visual foundations. v0.3 added a structured UX pattern graph. v0.4 added canonical product-archetype recipes and bounded recipe composition. v0.5 added the deterministic design compiler. v0.6 added the source-owned registry. v0.7 added the anti-slop auditor. v0.8 added the static human-facing explorer. v0.9 added focused retrieval and MCP. v1.0 stabilizes the complete pipeline with cross-layer semantic benchmarks, explicit public-contract/migration manifests, and deterministic visual-regression fixtures.

The current system includes:

- 30 canonical UX patterns across 10 pattern families;
- 9 anti-patterns with future auditor signals;
- 11 design recipes across 11 product categories;
- complete 24-axis Design DNA coverage for every recipe;
- framework-neutral DTCG visual foundations with light, dark, and high-contrast themes;
- deterministic Composer output with visible recipe/personality decisions and conflicts;
- 6 source-owned registry entries: 3 components and 3 compositions;
- CSS custom-property generation directly from canonical tokens;
- a curated Tailwind CSS v4 semantic adapter;
- dependency-light React source entries for Vite/Next.js projects;
- local registry list/build/install tooling;
- validation tying registry entries back to canonical patterns, taxonomy, source files, and semantic tokens;
- non-negotiable brand-safety and accessibility rules;
- 17 anti-slop audit rules covering token drift, arbitrary visual values, excessive surface nesting, icon-family mixing, missing pattern signals, hierarchy, accessibility, and reduced motion;
- separate error, warning, style-deviation, and intentional-exception reporting with file/line evidence;
- a static searchable explorer for corpus/registry entries and DTCG token records;
- a bounded Design DNA Lab backed by 11 real Composer-generated baseline profiles and source links;
- focused pattern/reference/registry retrieval with deterministic compact ranking;
- a local MCP stdio server exposing recipe selection, profile composition, token lookup, explicit-source auditing, and targeted retrieval;
- retrieval relevance/compactness benchmarks plus a real MCP client/server integration test;
- a v1 public-contract manifest covering schemas, commands, and MCP tools;
- migration rules for future breaking changes;
- a cross-layer semantic benchmark against the validated v0.9 baseline;
- a deterministic registry visual fixture suitable for external screenshot-regression runners.

v1.1 adds a first-class pull-request workflow: agents can use focused MCP retrieval while reviewing a PR, and the local `audit-pr` command can automatically audit only the changed frontend/source files in a Git diff.\n\nSee [docs/release-v1.md](./docs/release-v1.md), [docs/benchmarking.md](./docs/benchmarking.md), [docs/public-api.md](./docs/public-api.md), and [docs/migrations.md](./docs/migrations.md).

## Review a pull request with Design Distillation

There are two complementary ways to use Design Distillation during a frontend PR review.

### Agent + MCP workflow

Run the Design Distillation MCP server and configure it in your coding agent:

~~~bash
npm install
npm run mcp
~~~

Then open the application repository/PR in the coding agent and ask it to review the changed UI with Design Distillation. A practical prompt is:

> Review this PR using Design Distillation. Determine the appropriate existing design recipe/profile, retrieve the relevant UX patterns and semantic tokens, inspect registry primitives when useful, and audit the frontend files changed by this PR. Report accessibility errors, design-contract violations, style deviations, missing UX states, and unjustified UI choices. Fix clear implementation defects, but explain intentional product/design changes before redesigning them.

A useful agent sequence is:

1. use `select_design_recipes` only when the project does not already have a Design Distillation profile;
2. use `search_patterns` and then `get_design_entry` for the UX involved in the PR;
3. use `get_token` for semantic-token questions;
4. use `search_registry` when a vetted implementation primitive may already exist;
5. use `audit_sources` on the changed frontend files.

If the application already has a generated `design-profile.json`, keep that profile as the contract. Do not select a fresh recipe for every PR.

### Local diff-scoped audit

From the Design Distillation repository, audit another Git repository's current PR branch:

~~~bash
npm run audit-pr -- \
  --profile ../my-app/design-profile.json \
  --repo ../my-app \
  --base origin/main \
  --out ./audit-output
~~~

`--base` is optional. The command checks GitHub Actions' base ref first, then `origin/main`, `main`, `origin/master`, and `master`. The head defaults to `HEAD`.

The command uses `git diff base...head`, filters to the configured auditable source extensions, skips deleted/build/generated files, and writes:

~~~text
audit-report.json
PR_AUDIT.md
~~~

Only committed changes in the selected Git refs are included. The PR audit is intentionally diff-scoped: global/static heuristics see only changed auditable files, so it complements rather than replaces full-project, runtime, accessibility, responsive, or visual testing.

## Token and implementation architecture

~~~text
primitive values
      ↓
semantic intent
      ↓
theme mapping
      ↓
Composer design contract
      ↓
registry contract
      ↓
CSS / Tailwind / React adapters
~~~

Components consume semantic roles such as `semantic.color.text.primary` or `semantic.radius.control`, not hard-coded palette values such as `primitive.color.blue.600`.

## Repository shape

~~~text
corpus/       structured design knowledge
tokens/       primitive, semantic, and theme foundations
registry/     source-owned reusable implementation and metadata
schemas/      machine-readable contracts
taxonomy/     shared vocabulary and Composer rules
examples/     example requests and generated-contract inputs
docs/         architecture and design rationale
scripts/      validation, Composer, registry, audit, explorer, retrieval, and MCP tooling
benchmarks/   retrieval, semantic baseline, and visual-regression fixtures
migrations/   machine-readable compatibility/migration records
explorer/     static browser source generated from canonical data
.github/      CI
~~~

## Compose a design contract

Requires Node.js 20+.

~~~bash
npm run compose -- examples/composer-input.olympiad-learning.json --out ./generated-design
~~~

## Use the registry

~~~bash
npm run registry -- list
npm run registry -- build --out .design-distillation/registry
npm run registry -- install --entries action-button,text-field --adapter react --out ./src/design-distillation
~~~

The repository is intentionally `UNLICENSED`/proprietary. Registry installation is provided for local evaluation; this stable release does not grant open-source redistribution rights.

## Audit an implementation

~~~bash
npm run audit -- --profile ./generated-design/design-profile.json --root ../my-app/src --out ./audit-output
~~~

The source auditor is intentionally heuristic. It reports concrete source evidence and does not claim to replace browser/runtime accessibility, responsive, or visual-regression testing.

## Browse the explorer

~~~bash
npm run explorer -- build --out .design-distillation/explorer
npm run explorer -- serve --port 4173
~~~

The explorer is static and carries machine-source links for every browsable record. Design DNA changes are bounded preview overrides; download the generated Composer input to produce a canonical design contract.

## Use focused MCP retrieval

~~~bash
npm install
npm run mcp
~~~

The local stdio server exposes focused read-only tools instead of dumping the repository into agent context. Run `npm run benchmark:retrieval` to inspect retrieval relevance and compactness.

## Benchmark the complete pipeline

~~~bash
npm run benchmark:pipeline
npm run visual:fixture -- --out .design-distillation/visual-fixture
~~~

v1.0 compares semantic outcomes against the validated v0.9 baseline instead of snapshotting every generated byte. The visual fixture is deterministic and runner-agnostic; core CI does not claim pixel-level browser regression coverage.

## Validate

~~~bash
npm run check
~~~

Validation covers the full corpus-to-MCP pipeline, public-contract consistency, migration metadata, retrieval efficiency, semantic cross-version behavior, deterministic visual-fixture generation, and the real MCP stdio client/server integration.

## Status

Design Distillation v1.1.0 extends the stable v1 compatibility line with additive PR-scoped auditing. The repository remains `UNLICENSED`/proprietary and is not an open-source release.

See [implementationplan.md](./implementationplan.md), [docs/architecture.md](./docs/architecture.md), [CONTRIBUTING.md](./CONTRIBUTING.md), and [AGENTS.md](./AGENTS.md).
