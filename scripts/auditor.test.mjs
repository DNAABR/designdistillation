import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { auditProject, renderAuditMarkdown } from "./auditor.mjs";

const root = process.cwd();

function profile(overrides = {}) {
  return {
    product: { name:"Audit Fixture", type:"saas" },
    selection: { baseRecipe:"focused-saas" },
    personality: {
      colorfulness:20,
      "visual-complexity":30,
      depth:18
    },
    accessibility: { reducedMotion:"required" },
    patterns: { prioritize:[], consider:[], avoid:[] },
    rules: { avoid:["decorative gradients without product or brand rationale"] },
    ...overrides
  };
}

function withFixture(files, run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dd-audit-"));
  try {
    for (const [name, content] of Object.entries(files)) {
      const target = path.join(dir, name);
      fs.mkdirSync(path.dirname(target), { recursive:true });
      fs.writeFileSync(target, content);
    }
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive:true, force:true });
  }
}

test("auditor reports visual, accessibility, hierarchy, icon, surface, and motion failures", () => {
  withFixture({
    "styles.css": [
      ".card {",
      "  color: #123456;",
      "  padding: 13px;",
      "  border-radius: 13px;",
      "  font-size: 17px;",
      "  background: linear-gradient(#fff, #000);",
      "  box-shadow: 0 8px 24px #000;",
      "  transition: transform 200ms ease;",
      "}",
      ".card:focus {",
      "  outline: none;",
      "}"
    ].join("\n"),
    "App.tsx": [
      'import { Search } from "lucide-react";',
      'import { HomeIcon } from "@heroicons/react/24/outline";',
      "export function App() {",
      "  return <main>",
      '    <h1>Title</h1><h3>Skipped</h3>',
      '    <img src="x.png" />',
      '    <input id="email" />',
      '    <div className="card"><div className="panel"><div className="surface">nested</div></div></div>',
      "  </main>;",
      "}"
    ].join("\n")
  }, (dir) => {
    const report = auditProject({
      root,
      sourceRoot:dir,
      profile:profile({ patterns:{ prioritize:["loading-feedback"], consider:[], avoid:[] } })
    });
    const rules = new Set(report.findings.map((finding) => finding.rule));
    for (const expected of [
      "arbitrary-color","arbitrary-spacing","arbitrary-radius","arbitrary-typography",
      "unjustified-gradient","unjustified-shadow","focus-outline-suppressed",
      "missing-reduced-motion-path","image-missing-alt","input-accessible-name-review",
      "mixed-icon-families","excessive-surface-nesting","skipped-heading-level","missing-pattern-state"
    ]) assert.ok(rules.has(expected), "missing " + expected);
    assert.ok(report.summary.error >= 3);
    assert.ok(report.summary["style-deviation"] >= 5);
    assert.match(renderAuditMarkdown(report), /## Errors/);
  });
});

test("documented exceptions remain visible as intentional exceptions", () => {
  withFixture({ "styles.css": ".hero {\n  color: #123456;\n}\n" }, (dir) => {
    const report = auditProject({
      root,
      sourceRoot:dir,
      profile:profile(),
      exceptions:[{
        rule:"arbitrary-color",
        file:"styles.css",
        reason:"Approved campaign treatment is intentionally isolated to this fixture."
      }]
    });
    const finding = report.findings.find((item) => item.rule === "arbitrary-color");
    assert.equal(finding.category, "intentional-exception");
    assert.equal(finding.originalCategory, "style-deviation");
    assert.equal(report.summary["intentional-exception"], 1);
  });
});

test("semantic-token implementation with accessible markup and reduced motion stays clean", () => {
  withFixture({
    "styles.css": [
      ".control {",
      "  color: var(--dd-semantic-color-text-primary);",
      "  padding: var(--dd-semantic-space-inline-sm);",
      "  border-radius: var(--dd-semantic-radius-control);",
      "  font: var(--dd-semantic-type-body-medium);",
      "  transition: color var(--dd-semantic-motion-feedback-duration);",
      "}",
      "@media (prefers-reduced-motion: reduce) {",
      "  .control { transition: none; }",
      "}"
    ].join("\n"),
    "Page.tsx": [
      "export function Page() {",
      '  return <main><h1>Account</h1><h2>Contact</h2><label htmlFor="email">Email</label><input id="email" /><img src="x.png" alt="" /></main>;',
      "}"
    ].join("\n")
  }, (dir) => {
    const report = auditProject({ root, sourceRoot:dir, profile:profile() });
    assert.equal(report.summary.error, 0);
    assert.equal(report.summary["style-deviation"], 0);
  });
});

test("audit output is deterministic for identical source and profile", () => {
  withFixture({ "Page.tsx": "export const Page = () => <main><h2>Page</h2></main>;\n" }, (dir) => {
    const first = auditProject({ root, sourceRoot:dir, profile:profile() });
    const second = auditProject({ root, sourceRoot:dir, profile:profile() });
    assert.deepEqual(first, second);
  });
});

test("unknown exception rules are rejected instead of silently ignored", () => {
  withFixture({ "Page.tsx": "export const Page = () => <main />;\n" }, (dir) => {
    assert.throws(() => auditProject({
      root,
      sourceRoot:dir,
      profile:profile(),
      exceptions:[{ rule:"made-up-rule", reason:"This is a sufficiently long fake exception reason." }]
    }), /unknown rule/);
  });
});
