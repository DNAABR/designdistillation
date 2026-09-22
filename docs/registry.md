# Registry and reusable implementation

v0.6 adds a source-owned implementation registry without turning framework code into the design source of truth.

## Layering

The registry follows this direction:

~~~text
corpus + recipes + Composer
          ↓
semantic DTCG tokens
          ↓
registry entry contract
          ↓
source-owned implementation
          ↓
CSS / Tailwind v4 / React adapters
~~~

Registry metadata describes intent, states, slots, variants, required UX patterns, accessibility requirements, and semantic token dependencies. Source code implements that contract. Adapters transform representation; they do not invent a parallel palette, spacing scale, or component design language.

## Initial registry

v0.6 starts deliberately small:

- `action-button` — native action semantics with bounded emphasis variants;
- `text-field` — persistent labels, help/error association, and native input semantics;
- `status-banner` — persistent contextual feedback;
- `empty-state` — explanation plus useful next action;
- `app-shell` — responsive application landmarks and primary navigation;
- `data-toolbar` — search/filter/selection/action controls for data-heavy views.

The goal is useful primitives with strong contracts, not a large component gallery.

## Source ownership

All implementation code under `registry/source/` is authored for Design Distillation. Registry entries explicitly record `source_owned: true`.

The repository license is still undecided, so v0.6 does **not** publish an npm package or claim that these files are open-source redistributable artifacts. The CLI supports local generation/installation for evaluation. Public package distribution should wait for an explicit license decision.

## CSS token adapter

The CSS adapter resolves the existing DTCG token documents and emits custom properties. Light is the default root theme; dark and high-contrast override the same semantic color variables through `data-dd-theme`.

~~~bash
npm run registry -- build --out .design-distillation/registry
~~~

This writes:

~~~text
design-tokens.css
tailwind-theme.css
components.css
~~~

Composite typography and transition tokens also expose named sub-properties, so source CSS can preserve letter spacing and motion semantics instead of hard-coding them.

## Tailwind CSS v4

The Tailwind adapter emits `@theme inline` aliases that point to Design Distillation's generated semantic CSS variables.

A consuming project can import the generated files after Tailwind:

~~~css
@import "tailwindcss";
@import "./design-tokens.css";
@import "./tailwind-theme.css";
@import "./components.css";
~~~

The adapter intentionally exposes a curated semantic namespace such as `bg-dd-canvas`, `text-dd-text`, `rounded-dd-control`, and `shadow-dd-raised`. It does not mirror the entire primitive palette into Tailwind utilities.

## React adapter

React is the first source adapter because it serves both Vite and Next.js projects without requiring a component-library dependency.

~~~bash
npm run registry -- install --entries action-button,text-field --adapter react --out ./src/design-distillation
~~~

The installer writes the shared token/style files plus only the selected source-owned TSX files and a generated barrel file.

The components use native HTML semantics first. They do not depend on Radix, shadcn, Headless UI, or another component system. More complex interaction primitives should not be added until their behavior contract and accessibility requirements justify the dependency or implementation complexity.

## CSS-only and Tailwind installs

~~~bash
npm run registry -- install --adapter css --out ./src/design-distillation
npm run registry -- install --adapter tailwind-v4 --out ./src/design-distillation
~~~

When `--entries` is omitted, metadata records all registry entries as selected. CSS remains shared because the source stylesheet is intentionally small at this stage.

## Validation

`npm run check` now verifies:

- every manifest entry exists and there are no unlisted JSON entries;
- registry IDs are unique;
- platforms and states come from canonical taxonomy;
- required/related UX patterns resolve;
- every declared semantic token dependency exists;
- React source files and declared exports exist;
- source CSS does not consume primitive token variables or hard-coded color literals;
- Tailwind aliases point to real canonical tokens;
- provenance remains source-owned with redistribution pending the repository license;
- adapters generate deterministic theme-aware output.

## Scope boundary

v0.6 does not attempt to become a full design system, npm package, shadcn registry, visual website, or auditor. It proves the reusable implementation layer and its adapter boundary. Additional primitives should be added only when recurring product needs and the canonical UX corpus justify them.
