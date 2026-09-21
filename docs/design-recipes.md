# Design recipes

v0.4 converts product archetypes into bounded, machine-readable starting design languages.

A recipe is not a theme, brand clone, component library, or fixed screenshot target. It describes a coherent region of the design space that a future composer can adapt to the product's audience, tasks, platform, and brand.

## Recipe anatomy

Every recipe defines product intent and trust level, all 24 Design DNA axes, foundation strategies, UX pattern guidance, content posture, hard constraints, strong defaults, exceptions, blending limits, protected dimensions, and brand-safety rules.

Each Design DNA axis has a target, min, max, and weight. The target is the preferred center, the min/max values bound the coherent range, and the weight indicates how strongly the axis defines the recipe. This is intentionally different from a fixed CSS theme.

## Hard constraints versus strong defaults

Hard constraints protect qualities that should not be traded away during composition, such as transaction clarity or accessible state.

Strong defaults normally hold but can be changed when product evidence or an explicit design decision justifies the deviation.

Exceptions document contexts where the base recipe should intentionally relax.

## Canonical categories

v0.4 contains one canonical starting recipe for each current category: focused SaaS, serious fintech, friendly education, developer tooling, consumer social, commerce conversion, editorial content, calm health and wellness, gaming companion, creative software, and public service.

These are product archetypes, not industries with one correct visual style. Add another recipe only when it represents meaningfully different design decisions rather than a cosmetic variant.

## Composition

Explicit recipe blending is defined by taxonomy/recipe-composition.json and implemented by scripts/recipe-blender.mjs.

The first recipe is the base. Additional recipes are bounded influences.

Current rules:

- no more than 3 recipes in a blend;
- the base retains at least 50% weight, and individual recipes can require more;
- total influence cannot exceed 50%;
- individual influences obey both global and recipe-specific limits;
- numeric Design DNA targets are weight-averaged;
- acceptable ranges are intersected where possible;
- incompatible ranges fall back to the base range and emit a conflict;
- Design DNA axes protected by the base recipe are not blended;
- categorical foundation strategies remain those of the base recipe unless a later composer explicitly justifies an override;
- pattern guidance and constraints are merged and deduplicated;
- hard constraints and brand-safety rules are never averaged away.

See examples/recipe-blend.saas-education.json for an example request.

## Why base-wins exists

Literal style averaging creates incoherent design. Design Distillation treats one recipe as the product's primary design logic and other recipes as controlled influences.

A learning-focused business tool, for example, can remain structurally focused SaaS while borrowing a limited amount of warmth and playfulness from friendly education.

## Brand safety

Recipes describe abstract decisions such as density, hierarchy, typography posture, information prominence, motion intensity, product-flow patterns, and content voice.

They do not authorize copying a named product's assets, source code, exact trade dress, or proprietary implementation. Every recipe hard-codes copy_brand_assets, copy_proprietary_code, and imitate_named_product to false.

## What v0.4 does not do

v0.4 does not infer recipes from natural-language product requirements and does not emit DESIGN.md, final tokens, or a complete design-profile.json. Those are v0.5 composer responsibilities.
