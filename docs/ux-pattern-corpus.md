# UX pattern corpus

v0.3 turns the corpus from a proof of structure into a reusable decision system for common product flows.

## What a pattern is

A Design Distillation pattern is not a screenshot, component, or visual recipe. It is a context-dependent design decision with enough information for a human or coding agent to decide whether it belongs in the current product.

Every pattern records the problem it solves, when to use it, when to prefer an alternative, rationale, pattern family, relevant states, accessibility requirements, implementation constraints, related patterns and anti-patterns, evidence level, and provenance.

## Families

The initial corpus covers ten families: navigation, forms, search, onboarding, permissions, feedback, destructive actions, data display, settings, and responsive behavior.

The family list is taxonomy, not a menu an agent should apply wholesale. Retrieval should select only patterns relevant to the current task.

## Evidence levels

standard-backed is used when a pattern depends materially on a standards body or normative accessibility model. At least one standard source is required.

design-system-backed is used when a mature public design system provides strong task-level guidance. At least one design-system source is required.

synthesis is used for Design Distillation's original cross-product synthesis when there is no single external source that should be treated as authoritative.

Evidence level describes provenance strength, not a score for how universally a pattern should be used.

## States

states identifies the interaction or product conditions an implementation must think through for that pattern, such as focus, keyboard, loading, error, empty, no-results, saved, unsaved, offline, permission denied, responsive breakpoints, and reduced motion.

A state appearing on a pattern means it is relevant to the implementation contract. It does not imply every component in the pattern needs a separate visual treatment for every state.

## Decision contract

decision.use_if and decision.prefer_alternatives_if exist specifically for AI retrieval and composition.

The goal is to prevent rules such as "always use a modal before delete" or "always use infinite scroll." The correct design choice depends on consequence, reversibility, task type, content volume, and platform behavior.

## Accessibility contract

Every UX pattern must contain explicit accessibility requirements.

Where a pattern maps to a known composite widget—such as a tablist, combobox, modal dialog, or interactive grid—the pattern can include keyboard and semantics guidance.

Prefer native platform or HTML semantics over custom ARIA behavior when native behavior already solves the task. WAI-ARIA APG examples are useful interaction references but are not automatically production-ready implementations.

## Related patterns and anti-patterns

Patterns are a graph, not a flat checklist. Validation recovery links to preserving form input and forgiving input; loading links to save status and error recovery; destructive confirmation links to undo; table-vs-grid links to data-table controls and bulk selection.

Anti-pattern links provide future auditor signals. All related IDs are validated in CI.

## Corpus quality rules

The validator rejects missing pattern fields, unknown families or states, duplicate states, duplicate normalized pattern titles, evidence labels without the required source type, missing accessibility or implementation requirements, broken related IDs, self-references, anti-patterns without audit signals, and taxonomy families with no corpus coverage.

This is intentionally stricter than storing prose in Markdown because later composer, retrieval, and auditor phases need dependable structured data.

## Current v0.3 coverage

The first canonical set contains 30 UX patterns across all 10 declared families and 9 anti-patterns in total.

The project should continue to prefer a smaller, deeply specified pattern over several variants that differ only cosmetically.
