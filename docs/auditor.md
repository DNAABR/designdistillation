# Anti-slop auditor

v0.7 adds a deterministic source auditor that compares implementation evidence to a generated Design Distillation profile.

It is intentionally a static heuristic layer, not a claim that regex/source inspection can prove usability or accessibility. Findings identify the rule, file, line, and observed evidence so a human or coding agent can decide whether to fix, investigate, or document an exception.

## Run an audit

From the Design Distillation repository:

~~~bash
npm run audit -- \
  --profile ./generated-design/design-profile.json \
  --root ../my-app/src \
  --out ./audit-output
~~~

The command writes:

~~~text
audit-report.json
AUDIT.md
~~~

By default the CLI exits non-zero only when error findings exist. Warnings and style deviations remain visible without automatically failing the command. Use \`--no-fail\` when the report is informational.

## Finding categories

- **error** — a concrete contract/accessibility failure with sufficiently strong static evidence.
- **warning** — a likely issue that needs review because static inspection cannot establish the full runtime context.
- **style-deviation** — implementation appears to drift from the selected design language or token contract.
- **intentional-exception** — a matching finding was explicitly acknowledged with a documented reason. The finding stays in the report rather than disappearing.

## Checks in v0.7

The first rule set covers:

- primitive token variable consumption;
- literal/arbitrary colors;
- raw spacing, radius, and typography dimensions;
- gradients, backdrop effects, and raw shadows when the profile does not support them;
- multiple icon-library families;
- excessive nested card/panel/surface wrappers;
- static heading hierarchy issues;
- recognizable implementation signals for selected high-value UX patterns;
- static images without alt;
- focus-outline suppression;
- inputs with no detectable label or ARIA accessible name;
- motion declarations without a reduced-motion path.

The auditor also ignores common generated/build directories and only scans configured source extensions.

## Profile-aware checks

The auditor uses the generated design profile rather than enforcing one universal aesthetic.

For example, a gradient is not inherently an error. It becomes a style deviation when the profile explicitly avoids gradients or its colorfulness/visual-complexity posture is restrained. Raw shadows are treated similarly against the profile's depth axis.

Reduced motion is severity-aware: if the profile says reduced motion is required, detectable motion without a reduced-motion media path becomes an error. Otherwise it is a warning.

## Pattern-state heuristics

Some prioritized UX patterns have recognizable source signals. v0.7 checks a small configured set such as loading feedback, empty states, error recovery, save status, and offline resilience.

These are warnings only. Absence of a keyword does not prove the state is missing, and presence does not prove it is implemented well. The purpose is to catch obvious omissions before human/runtime review.

## Intentional exceptions

Exceptions use \`schemas/audit-exceptions.schema.json\`.

~~~json
{
  "version": "0.7.0",
  "exceptions": [
    {
      "rule": "unjustified-gradient",
      "file": "src/marketing/Hero.tsx",
      "reason": "Approved campaign art direction uses one isolated marketing gradient."
    }
  ]
}
~~~

The optional \`file\` field supports \`*\` and \`**\` wildcards. Omitting it applies the exception to every finding with that rule.

Run with:

~~~bash
npm run audit -- \
  --profile ./generated-design/design-profile.json \
  --root ../my-app/src \
  --exceptions ./audit-exceptions.json
~~~

Unknown rule IDs and empty/weak exception reasons are rejected instead of silently suppressing findings.

## What v0.7 does not claim

The source auditor does not replace:

- browser/runtime accessibility testing;
- keyboard and assistive-technology testing;
- visual regression;
- computed-style inspection;
- responsive/device testing;
- product-design review.

Those can become later audit adapters. The v0.7 layer is a deterministic first pass over source evidence and the project's own design contract.
