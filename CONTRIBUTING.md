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

## Composer contributions

The Composer is a compiler over the canonical corpus, not a second design taxonomy.

When changing Composer behavior:

- keep input fields represented in `schemas/composer-input.schema.json`;
- keep generated output represented in `schemas/design-profile.schema.json`;
- put reusable selection, capability, platform, and accessibility configuration in `taxonomy/composer-signals.json`;
- reuse `composeRecipeBlend` instead of reproducing recipe composition logic;
- preserve protected dimensions and global/per-recipe influence limits;
- make automatic selection evidence transparent and deterministic;
- reject ambiguous intent instead of silently inventing a generic design;
- surface clamped or conflicting requirements as decisions/conflicts rather than hiding them;
- treat named-product references as inspiration only, never as a style-copying signal;
- add regression tests whenever selection, constraints, or generated artifacts change.

## Registry contributions

The registry is the source-owned reusable implementation layer. A new registry entry should exist only when it captures a recurring UI primitive or composition that benefits from a stable contract.

Every registry contribution must:

- document use and avoid conditions rather than only appearance;
- declare supported platforms, states, slots, and variants;
- reference canonical UX patterns when the implementation participates in those flows;
- declare every semantic token dependency;
- include accessibility requirements as part of the contract;
- keep source implementation under `registry/source/`;
- preserve `source_owned: true` and redistribution status `pending-repository-license` until the repository license is decided;
- add validation/tests when adapter behavior changes.

Source CSS should consume generated semantic variables. Do not introduce a second palette, spacing scale, radius system, or motion scale inside component CSS.

React source should prefer native platform semantics, work in ordinary React/Vite or Next.js projects, and avoid new dependencies unless a more complex interaction contract clearly requires them.

Adapters are transformations, not new design sources. A Tailwind alias may point to a semantic Design Distillation token; it should not redefine that token independently.

Do not publish the registry as an npm package or claim redistributable open-source licensing while the repository remains UNLICENSED.

## Auditor contributions

The auditor should make implementation drift easier to investigate without pretending static source inspection has runtime certainty.

When changing or adding an audit rule:

- give it a stable kebab-case ID and default category in `taxonomy/audit-rules.json`;
- choose `error` only when source evidence is strong enough to justify failing the audit;
- use `warning` for likely issues that need runtime or product-context review;
- use `style-deviation` for profile/token-contract drift rather than universal design prohibitions;
- report actionable file/line evidence;
- keep thresholds and pattern signals configurable and validated;
- add regression fixtures for both detection and false-positive boundaries;
- preserve deterministic output ordering;
- keep documented intentional exceptions visible instead of filtering findings away.

An auditor contribution must not claim that keywords or regexes prove accessibility, responsive behavior, or interaction quality. Those checks can direct review; browser/runtime adapters may strengthen evidence in later milestones.

## Explorer contributions

The explorer exists to make canonical Design Distillation data understandable without creating a parallel content store.

When changing the explorer:

- generate records from existing corpus/token/registry sources instead of copying content into browser-specific JSON;
- keep machine-source links intact;
- keep baseline profiles generated through the real Composer;
- constrain Design DNA controls to declared recipe ranges;
- distinguish preview overrides from canonical Composer output;
- keep the static build deterministic and dependency-light;
- preserve keyboard navigation, visible focus, responsive layout, and reduced-motion behavior;
- add regression tests when compilation, source linking, or preview behavior changes.

Do not add an editable CMS or browser-side design taxonomy. Changes to design knowledge belong in the canonical machine-readable sources.

## Retrieval / MCP contributions

Retrieval exists to reduce agent context cost while preserving access to canonical reasoning.

When changing retrieval or MCP behavior:

- keep search ranking deterministic and expose compact matched-field evidence;
- benchmark representative queries and protect recall/compactness thresholds;
- use focused search plus explicit fetch instead of returning entire corpus collections;
- reuse canonical Composer/auditor/registry/token functions rather than forking product logic;
- keep MCP schemas explicit and bounded;
- reserve stdout for the MCP wire protocol;
- keep audit inputs host-supplied rather than granting broad path browsing through MCP;
- add a real client/server integration test when the MCP surface changes;
- pin protocol dependencies deliberately and review protocol-version changes before upgrades.

Do not add a generic dump-everything tool merely to make one agent workflow easier.

## v1 compatibility and benchmark contributions

The v1 line treats schemas, documented CLI commands, and MCP tool names as compatibility surfaces listed in schemas/public-manifest.json.

When changing a public surface:

- decide whether the change is compatible, additive, deprecated, or breaking;
- update public API documentation and the compatibility manifest when needed;
- add a migration record for breaking or migration-relevant changes;
- update semantic baselines only with a written rationale for the behavior change;
- preserve prior benchmark expectations when implementation refactors do not intentionally change design behavior;
- keep visual fixtures deterministic and sourced from canonical tokens/registry styles;
- never auto-accept new benchmark output merely to make CI green.

The stable v1.0 release and repository license are explicit maintainer decisions and are not inferred from passing CI.

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
