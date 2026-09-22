# Architecture

## Product model

Design Distillation separates six concerns that are often mixed together in UI libraries.

### 1. Knowledge

Principles, accessibility constraints, UX patterns, anti-patterns, historical design thinking, and platform guidance.

### 2. References

Structured analyses of public design systems and products. References are evidence and inspiration, not templates to clone.

### 3. Design DNA

A normalized vocabulary for describing visual and interaction character, such as density, warmth, playfulness, formality, contrast, depth, radius, typography expression, and motion intensity.

### 4. Implementation

v0.6 turns the implementation layer into a small source-owned registry.

The canonical implementation contract is registry metadata: intent, supported platforms, states, slots, variants, UX-pattern relationships, accessibility requirements, and semantic token dependencies. Source code under `registry/source/` implements that contract.

The initial registry contains three components and three compositions. CSS, Tailwind v4, and React are adapter/distribution views; none of them replaces the framework-neutral corpus or DTCG token source.

The direction is:

~~~text
design knowledge + recipes + Composer
              ↓
        semantic DTCG tokens
              ↓
       registry entry contract
              ↓
      source-owned implementation
              ↓
       CSS / Tailwind / React
~~~

Adapters may change representation, but semantic meaning must survive the transformation.

### 5. Composer

v0.5 transforms structured product requirements into a deterministic generated design contract.

Inputs include product identity, platform, audience, primary task, optional category hints and capabilities, goals, brand descriptors, bounded Design DNA preferences, accessibility requirements, theme/preferences, optional inspiration traits, and automatic or explicit recipe selection.

Selection and resolution are explicit:

1. score all recipes from transparent product-intent signals;
2. require a credible base recipe rather than falling back to generic UI;
3. optionally add one strongly supported bounded influence in auto mode;
4. reuse the v0.4 recipe blender and preserve protected base dimensions;
5. clamp requested Design DNA values to composed recipe ranges and report conflicts;
6. add canonical UX patterns from declared capabilities and platform requirements;
7. apply accessibility requirements as hard constraints;
8. exclude named-product inspiration from recipe scoring and style generation.

Explicit mode accepts one to three recipe selections and still delegates all composition limits and conflict behavior to v0.4.

The Composer emits:

- `design-profile.json`;
- `DESIGN.md`;
- `AGENTS.design.md`;
- machine-readable decisions and conflicts explaining selection, platform requirements, accessibility constraints, and personality clamps.

The machine-readable profile remains canonical. Markdown outputs are generated explanations and instructions.

### 6. Auditor

v0.7 adds the first deterministic audit layer. It scans supported source files and compares observable implementation choices to the generated design profile and canonical token/pattern rules.

The source auditor reports four distinct categories: errors, warnings, style deviations, and intentional exceptions. Findings include stable rule IDs, file/line locations, messages, and compact evidence. Documented exceptions retain the original category and reason instead of disappearing from the report.

The source layer deliberately distinguishes evidence strength. Missing static image alt or suppressed focus outlines can be errors; pattern-signal absence, heading concerns, or icon-family mixing are warnings; arbitrary token/visual values and profile-incompatible decoration are style deviations. Static heuristics do not claim to replace runtime accessibility, computed-style, responsive, or visual-regression testing.

## Source-of-truth rule

Machine-readable data is canonical. Markdown is for explanation and navigation.

## Visual-foundation pipeline

v0.2 makes the implementation layer explicit:

~~~text
primitive tokens
      ↓
semantic tokens
      ↓
theme semantic colors
      ↓
design profile selection / composer overrides
      ↓
future framework adapters
      ↓
components and blocks
~~~

Individual token documents use DTCG 2025.10. `tokens/manifest.json` supplies a Design Distillation-specific composition contract across files and themes.

The canonical layer remains framework-neutral. v0.6 now provides generated CSS variables, curated Tailwind v4 theme aliases, and source-owned React entries as adapted views rather than the source of truth.

The CSS adapter resolves DTCG aliases and theme overrides deterministically. Light is the default root theme; dark and high-contrast replace the same semantic color variables. Composite typography and transition tokens expose both shorthand and named sub-properties so implementation CSS can preserve letter spacing and motion semantics.

The registry installer is intentionally local while the repository license remains undecided. It is not an npm/public-registry publication mechanism.

## Design profile

A design profile is the normalized output of the composer. It combines:

- product type and platform;
- audience and task;
- complete 24-axis Design DNA values;
- layout and information-density decisions;
- typography, shape, color, and motion strategies;
- accessibility target;
- explicit avoid/require rules;
- UX pattern priorities;
- a token-manifest/theme selection;
- recipe selection metadata, diagnostics, and rationale;
- brand-safety invariants.

The legacy focused-SaaS example and the v0.5 composer request demonstrate the contract at different stages of the architecture.

## Human explorer

v0.8 compiles the canonical corpus, registry, tokens, taxonomy, and deterministic Composer baselines into a static browser dataset. The explorer provides search/filtering, token inspection, provenance/source links, and a bounded Design DNA Lab without introducing a second database.

Every recipe preview begins as real Composer output. Browser slider changes stay inside the recipe's declared ranges, are marked as explorer-preview provenance, and can be downloaded as Composer input for canonical regeneration.

The static HTML/CSS/JavaScript layer is a distribution view. Machine-readable repository files remain authoritative.

## Retrieval-first architecture

AI agents should not ingest the entire repository. Later versions should expose targeted retrieval primitives such as:

- `get_design_recipe`;
- `search_patterns`;
- `get_reference`;
- `compose_design_profile`;
- `get_motion_recipe`;
- `audit_design_profile`;
- `audit_page`.

The repository should therefore favor small, addressable, typed entries over monolithic prose.

## Anti-slop philosophy

The project must not ban individual aesthetics such as gradients, glass, cards, large radii, or bento layouts. Any of those can be appropriate.

The auditor instead flags unjustified, inconsistent, or excessive use relative to the selected profile. The central question is whether a design decision follows from product intent and the design contract.

v0.7 operationalizes this principle with profile-aware thresholds, semantic-token drift checks, source evidence, and explicit intentional exceptions. A gradient or shadow is not inherently wrong; it is flagged when the implementation conflicts with the selected profile or bypasses the semantic contract.

The visual foundations support this by making arbitrary one-off decisions visible: a component that bypasses semantic tokens has intentionally departed from the contract.

## Distribution path

v0.6 currently emits:

- CSS custom properties for canonical token/theme values;
- Tailwind CSS v4 semantic theme aliases;
- source-owned React components/compositions suitable for Vite and Next.js.

Later adapters may add:

- shadcn-compatible registry packaging where it adds value;
- Vue/native targets;
- additional platform-specific resources;
- MCP/agent retrieval tools.

The repository license must be chosen before these artifacts are published as a redistributable package. Adapters may transform representation, but they must preserve semantic meaning.
