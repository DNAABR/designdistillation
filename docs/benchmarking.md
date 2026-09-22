# Benchmarking and release confidence

v1 introduces an explicit benchmark layer over the existing validators/tests.

## Semantic baseline

benchmarks/baselines/v0.9.json captures the validated semantic behavior of the v0.9 pipeline before v1 release-candidate compatibility rules were added.

The baseline intentionally records product outcomes rather than complete generated-file snapshots:

- minimum corpus/token/registry/auditor coverage;
- retrieval recall and compactness constraints;
- expected Composer recipe selections and required patterns;
- expected token resolution;
- expected registry retrieval;
- expected audit findings.

This makes legitimate formatting/internal changes possible while surfacing design-behavior drift.

## Run the full pipeline benchmark

~~~bash
npm run benchmark:pipeline
~~~

A failed comparison identifies the exact semantic contract that changed.

Updating the baseline requires an intentional rationale in the same pull request. A green result should never be achieved by automatically accepting new output.

## Retrieval benchmark

~~~bash
npm run benchmark:retrieval
~~~

The dedicated retrieval benchmark continues to measure focused search relevance and response compactness.

## Visual regression fixture

~~~bash
npm run visual:fixture -- --out .design-distillation/visual-fixture
~~~

This creates a deterministic HTML/CSS gallery using the generated canonical token variables and source-owned registry CSS.

The fixture is deliberately runner-agnostic. Playwright, Chromatic, screenshot CI, or another visual-diff system can capture this same stable input later without making a browser dependency part of Design Distillation's core architecture.

The core CI verifies that the fixture builds deterministically. It does not claim pixel-level regression coverage yet.

## Release gate

A v1 stable release should require all of the following:

- npm run check passes;
- pipeline benchmark passes against the approved baseline;
- retrieval benchmark passes;
- compatibility/public manifests are internally valid;
- migration notes are complete;
- the repository license is explicitly chosen;
- the release candidate is explicitly approved for a v1.0.0 tag.

The last two conditions are human release decisions, not tasks for the validator to infer.
