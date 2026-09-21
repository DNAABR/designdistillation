# Contributing

Design Distillation is intentionally stricter than a typical inspiration repository. The value comes from distillation, provenance, reusable intent, and consistency.

## Before contributing

Ask whether the proposal adds a reusable design decision that is meaningfully different from what already exists.

Do not submit a large collection of examples merely because they look good.

## Corpus contributions

A corpus contribution must contain:

1. **Problem** — the user/product problem the entry addresses.
2. **Use when** — contexts where it is appropriate.
3. **Avoid when** — contexts where it is a poor fit.
4. **Rationale** — the design reasoning behind it.
5. **Evidence / sources** — where the reasoning or implementation came from.
6. **Implementation notes** — when implementation guidance is relevant.
7. **License / redistribution status** — for externally sourced code or assets.

### Provenance classes

Use one of these source types:

- `internal` — original Design Distillation synthesis.
- `standard` — an open standard or normative specification.
- `design-system` — a published design system.
- `product-observation` — an observation about a product or website.
- `research` — academic/user research or other published evidence.
- `code` — externally authored implementation code.

For product observations, default to no redistribution of source code/assets unless a compatible license is explicitly documented.

### IDs

Use lowercase kebab-case IDs. IDs are globally unique across the corpus.

Good:

~~~text
intent-before-decoration
form-error-recovery
focused-saas
~~~

Avoid branding an abstract pattern with a company name when the actual concept can be described generically.

## UX pattern contributions

Patterns need more structure than generic corpus entries because future agents must be able to choose between them.

Every pattern must include:

- a declared pattern family;
- an evidence level;
- relevant interaction/product states;
- positive decision rules;
- explicit conditions where an alternative is preferable;
- accessibility requirements;
- implementation requirements;
- related pattern and anti-pattern IDs.

Before adding a new pattern, search for an existing entry that solves the same user problem. A new product name, component name, or visual treatment is not enough reason to create another pattern.

Evidence levels are provenance classifications, not quality scores. standard-backed entries need a standard source. design-system-backed entries need a design-system source. synthesis entries represent original Design Distillation synthesis.

When using external standards or design-system guidance, distill the principle and interaction contract. Do not copy example code or proprietary assets merely because the source is public.

## Design recipe contributions

A recipe should exist only when it captures a reusable product-design posture that cannot be represented well by an existing recipe's ranges and constraints.

Every recipe must:

- use one declared recipe category;
- define intent and trust level;
- cover every Design DNA axis;
- use approved foundation strategy values;
- reference canonical UX patterns and anti-patterns;
- separate hard constraints, strong defaults, and exceptions;
- define composition limits and protected dimensions;
- keep all brand-safety fields false.

Design DNA values are bounded decisions, not aesthetic scores. The target is the preferred center, min/max is the coherent range, and weight communicates how strongly the axis defines the recipe.

Do not submit a recipe whose primary purpose is to reproduce a named product, brand, visual trend, color palette, or component library. Abstract the reusable product logic instead.

When a new recipe overlaps heavily with an existing one, prefer refining the existing recipe or treating the new idea as an influence during recipe composition.

## Token contributions

Token files are infrastructure, not a palette gallery.

Before adding a token:

- decide whether it is a primitive value, semantic role, or theme mapping;
- reuse an existing finite scale where practical;
- use aliases instead of repeating values when the relationship is meaningful;
- preserve semantic color parity across every theme;
- add/update contrast pairs when a new foreground/background contract matters;
- document unusual or expressive values such as playful motion;
- avoid copying a third-party palette or token set without compatible licensing and provenance.

A new primitive should exist because the system needs a reusable value, not because one page needed a one-off tweak.

A new semantic token should describe stable intent that multiple components or patterns can understand.

## Review standard

A reviewer should be able to answer:

- Is this reusable across products?
- Is the reasoning clear?
- Are limits/context documented?
- Is provenance precise?
- Does it duplicate an existing entry/token?
- Does it preserve primitive -> semantic -> theme separation?
- Would an AI agent make better, more coherent design decisions after retrieving it?

## Validation

Run:

~~~bash
npm run check
~~~

CI runs the same validator on pull requests. Validation is necessary but not sufficient: a mechanically valid token or corpus entry can still be rejected for weak design reasoning.
