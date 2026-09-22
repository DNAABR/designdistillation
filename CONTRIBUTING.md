# Contributing

Design Distillation is intentionally stricter than a typical inspiration repository. The value comes from distillation, provenance, and useful reasoning.

## Before contributing

Ask whether the proposed entry adds a reusable design decision that is meaningfully different from what already exists.

Do not submit a large collection of examples merely because they look good.

## Required content

A corpus contribution must contain:

1. Problem — the user/product problem the entry addresses.
2. Use when — contexts where it is appropriate.
3. Avoid when — contexts where it is a poor fit.
4. Rationale — the design reasoning behind it.
5. Evidence / sources — where the reasoning or implementation came from.
6. Implementation notes — when implementation guidance is relevant.
7. License / redistribution status — for any externally sourced code or assets.

## Provenance classes

Use one of these source types:

- internal — original Design Distillation synthesis.
- standard — an open standard or normative specification.
- design-system — a published design system.
- product-observation — an observation about a product or website.
- research — academic/user research or other published evidence.
- code — externally authored implementation code.

For product observations, default to no redistribution of source code/assets unless a compatible license is explicitly documented.

## IDs

Use lowercase kebab-case IDs. IDs are globally unique across the corpus.

Good examples:

~~~text
intent-before-decoration
form-error-recovery
focused-saas
~~~

Avoid branding an abstract pattern with a company name when the actual concept can be described generically.

## Review standard

A reviewer should be able to answer:

- Is this reusable across products?
- Is the reasoning clear?
- Are limits/context documented?
- Is provenance precise?
- Does it duplicate an existing entry?
- Would an AI agent make better design decisions after retrieving this entry?

## Validation

Run npm run validate.

CI runs the same validator on pull requests.
