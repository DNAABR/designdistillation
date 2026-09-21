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

v0.5 transforms product requirements into a deterministic generated design contract.

Inputs may include free-text product description, product type, platform, audience, primary task, features, recipe preferences, explicit influence recipes, Design DNA preferences, theme, accessibility target, and reduced-motion preference.

Selection and resolution order is explicit:

1. explicit recipe preference;
2. declared product type;
3. transparent free-text keyword scoring;
4. configured fallback with a warning;
5. bounded recipe blending for explicit influences;
6. personality clamping to composed recipe ranges;
7. platform, theme, accessibility, and motion resolution.

The composer emits:

- `design-profile.json`;
- `DESIGN.md`;
- `AGENTS.design.md`;
- diagnostics that explain recipe selection, recipe conflicts, and personality clamps.

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
