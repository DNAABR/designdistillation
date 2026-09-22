# Visual foundations

v0.2 establishes the visual substrate that later Design Distillation phases will compose, adapt, and audit.

## Why this layer exists

A coding agent that receives only a mood such as "clean, modern SaaS" still has to improvise spacing, type scale, surfaces, radius, border strength, elevation, animation, colors, dark mode, focus treatment, and status colors.

Those improvisations are a major source of incoherent AI-generated UI.

Design Distillation instead gives the agent a constrained visual vocabulary with explicit semantic intent.

## Pipeline

~~~text
product intent / Design DNA
             ↓
        design profile
             ↓
    token manifest + theme
             ↓
     semantic token contract
             ↓
 future framework adapters
             ↓
       components / blocks
~~~

v0.2 implements the token-manifest and semantic-contract portion. The automated composer arrives later.

## Decisions encoded in v0.2

### Finite scales

Core spacing, type-size, radius, and border scales are intentionally finite. Future recipes can select from or override them, but components should not produce arbitrary visual values by default.

### Intent-based semantics

Semantic names describe purpose rather than appearance.

- good: `semantic.color.status.danger.foreground`
- bad: `semantic.color.red-text`

The first survives theme and brand changes. The second leaks an implementation choice into component APIs.

### Theme parity

Light, dark, and high-contrast modes expose the same semantic color paths. Theme switching changes resolved values, not component contracts.

### Accessible defaults

The manifest lists important foreground/background pairs and minimum contrast ratios. Validation resolves aliases through each theme and checks those pairs.

This is an automated floor, not a complete accessibility audit. Accessibility also depends on focus behavior, states, text sizing, targets, semantics, keyboard interaction, and content.

### Purposeful elevation

Only a small set of semantic elevation roles exists. Containers should not gain shadows merely because a generated layout looks empty.

### Purposeful motion

Motion semantics are attached to interaction meaning. Reduced motion has an explicit zero-duration path instead of being an afterthought.

## What v0.2 does not do

It does not claim that one palette, radius scale, type scale, or motion personality is perfect for every product.

The starter foundation is a coherent neutral baseline. Later product recipes and the composer will translate Design DNA into controlled overrides while preserving the semantic contract.

It also does not define components yet. The token system should precede the component library so components inherit constraints instead of becoming the source of arbitrary styling.

## Composition convention

DTCG 2025.10 is the format used by each token document.

Design Distillation's `tokens/manifest.json` defines an additional repository convention: source files are deep-merged into a logical token tree, then one theme contributes the `semantic.color.*` layer.

This convention is explicit so future CLI/MCP/adapter tooling can reproduce the same resolution behavior.

## Future composer behavior

A future generated design profile should select:

- the token manifest;
- an initial theme;
- recipe/personality overrides;
- brand-specific primitive substitutions when appropriate;
- reduced-motion behavior;
- rationale for intentional deviations.

`examples/design-profile.focused-saas.json` demonstrates the current contract without pretending the composer already exists.
