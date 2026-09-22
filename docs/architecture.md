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

Tokens, components, blocks, interaction recipes, motion recipes, adapters, and framework-specific distributions.

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

Checks implementation against the design contract and reports errors, warnings, style deviations, and intentional exceptions.

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

The canonical layer remains framework-neutral. CSS variables, Tailwind configuration, shadcn registries, native resources, and other targets are generated/adapted views rather than the source of truth.

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

The auditor should instead flag unjustified, inconsistent, or excessive use. The central question is whether a design decision follows from product intent and the design contract.

The visual foundations support this by making arbitrary one-off decisions visible: a component that bypasses semantic tokens has intentionally departed from the contract.

## Future distribution

Adapters may later emit:

- CSS variables;
- Tailwind configuration;
- shadcn-compatible registries;
- React/Vite and Next.js components;
- Vue/native targets;
- MCP/agent retrieval tools.

Adapters may transform representation, but they must preserve semantic meaning.
