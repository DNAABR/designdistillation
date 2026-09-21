# Visual tokens

The `tokens/` directory is the framework-neutral visual foundation for Design Distillation.

## Canonical format

Individual `*.tokens.json` documents use the Design Tokens Community Group **2025.10 stable format**.

Design Distillation intentionally pins the stable version instead of following draft/preview revisions. The format reference is:

https://www.designtokens.org/TR/2025.10/format/

The DTCG format defines a token document. Design Distillation additionally uses `tokens/manifest.json` to compose several token files into one logical tree. **That cross-file deep-merge convention is a Design Distillation convention, not a claim that DTCG itself defines multi-file composition.**

## Three layers

### 1. Primitive

Primitive tokens are raw design values: color ramps, spacing, border widths, radius, typography primitives, shadow primitives, durations, and easings.

Primitive names describe values, not interface intent. Components should rarely consume them directly.

### 2. Semantic

Semantic tokens describe why a value exists:

- `semantic.space.stack.md`
- `semantic.radius.control`
- `semantic.type.body-medium`
- `semantic.elevation.floating`
- `semantic.motion.enter`

Semantic tokens alias primitives so recipes or future composer outputs can change a product's visual character without rewriting component code.

### 3. Theme

Theme files provide one semantic color contract:

- `themes/light.tokens.json`
- `themes/dark.tokens.json`
- `themes/high-contrast.tokens.json`

Every theme must expose the same `semantic.color.*` paths.

## Color

The starter palette is an original Design Distillation foundation rather than a copied third-party palette.

Colors are represented in OKLCH with six-digit hex fallbacks. OKLCH supports perceptual composition while the fallback lets validation run deterministic WCAG-style contrast checks.

Palette tokens do not have product meaning. Meaning appears only in a theme's semantic mapping.

## Typography

A semantic typography token is a DTCG typography composite referencing font family, size, weight, letter spacing, and line height.

The starter type system is deliberately neutral. Brand recipes can replace preferred families and scale choices later without teaching components new semantic token names.

## Spacing and shape

The primitive spacing and radius scales are finite on purpose. Arbitrary one-off values should require a documented constraint.

`semantic.size.target.comfortable-minimum` is an opinionated comfortable interaction default. It is **not** presented as a normative accessibility minimum.

## Elevation

Shadows communicate spatial layering rather than decorate every container.

The semantic elevation roles are intentionally few: raised, floating, and modal.

## Motion

Motion tokens separate duration/easing primitives from semantic events such as enter, exit, hover, feedback, expansion, and movement.

`semantic.motion.reduced` resolves to zero-duration, linear, non-essential motion and is the canonical override for adapters when a platform or user requests reduced motion.

The existence of a motion token is not permission to animate everything.

## Validation

Run:

~~~bash
npm run validate
~~~

The token validator checks:

- manifest presence and pinned DTCG version;
- legal token/group names;
- supported types and inherited types;
- missing aliases and circular aliases;
- alias type mismatches;
- dimension, duration, color, cubic-Bezier, shadow, transition, and typography shapes;
- ordered core scales;
- identical semantic color paths across themes;
- configured foreground/background contrast pairs.

## Future adapters

CSS, Tailwind, React, native, and registry adapters belong downstream of this layer.

Adapters may transform representation, but they should not silently invent a second design system. The canonical intent stays in these token documents.
