# UX patterns

This directory contains the canonical machine-readable UX pattern corpus.

## Pattern selection

Do not retrieve every pattern for every app.

Select by the user task, product stage, pattern family, relevant states, platform constraints, accessibility requirements, consequence, and reversibility.

A pattern's use_when and decision.use_if describe positive context. avoid_when and decision.prefer_alternatives_if prevent the agent from turning guidance into a universal rule.

## Required shape

Every pattern must contain the normal corpus fields plus family, evidence, states, decision.use_if, decision.prefer_alternatives_if, accessibility.requirements, implementation.requirements, related.patterns, and related.anti_patterns.

See schemas/pattern-entry.schema.json and docs/ux-pattern-corpus.md.

## Contribution rule

Before creating a new pattern, search for an existing entry that solves the same user problem.

Prefer extending a canonical pattern with better decision rules, states, evidence, or accessibility guidance over creating a near-duplicate with different product vocabulary.

Run:

~~~bash
npm run check
~~~

A contribution that passes validation may still be rejected if it adds duplication without new design reasoning.
