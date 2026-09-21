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

Transforms product intent into a generated design contract. Expected outputs eventually include:

- `DESIGN.md`;
- `design-profile.json`;
- design-token selections/overrides;
- typography rules;
- motion rules;
- component constraints;
- anti-pattern constraints;
- agent instructions.

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
design profile selection / future overrides
      ↓
future framework adapters
      ↓
components and blocks
~~~

Individual token documents use DTCG 2025.10. `tokens/manifest.json` supplies a Design Distillation-specific composition contract across files and themes.

The canonical layer remains framework-neutral. CSS variables, Tailwind configuration, shadcn registries, native resources, and other targets are generated/adapted views rather than the source of truth.

## Design profile

A design profile is the normalized output of the future composer. It combines:

- product type and platform;
- audience and task;
- brand/personality dimensions;
- layout and information-density decisions;
- typography, shape, color, and motion strategies;
- accessibility target;
- explicit avoid/require rules;
- a token-manifest/theme selection;
- rationale and provenance.

The example profile in `examples/` demonstrates how the v0.2 visual layer plugs into that future contract.

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
