import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { auditPullRequest, renderPullRequestAuditMarkdown } from "./pr-auditor.mjs";

const root = process.cwd();

function profile() {
  return {
    product:{ name:"PR Fixture", type:"saas" },
    selection:{ baseRecipe:"focused-saas" },
    personality:{ colorfulness:20, "visual-complexity":30, depth:18 },
    accessibility:{ reducedMotion:"required" },
    patterns:{ prioritize:[], consider:[], avoid:[] },
    rules:{ avoid:["decorative gradients without product or brand rationale"] }
  };
}

function git(repository, args) {
  return execFileSync("git", ["-C", repository, ...args], { encoding:"utf8", stdio:["ignore", "pipe", "pipe"] });
}

function write(repository, relative, content) {
  const target = path.join(repository, ...relative.split("/"));
  fs.mkdirSync(path.dirname(target), { recursive:true });
  fs.writeFileSync(target, content);
}

function withRepo(run) {
  const repository = fs.mkdtempSync(path.join(os.tmpdir(), "dd-pr-audit-"));
  try {
    git(repository, ["init", "-b", "main"]);
    git(repository, ["config", "user.email", "fixture@example.com"]);
    git(repository, ["config", "user.name", "Fixture"]);
    write(repository, "src/Page.tsx", 'export const Page = () => <main><h1>Home</h1><img src="x.png" alt="" /></main>;\n');
    write(repository, "README.md", "# Fixture\n");
    git(repository, ["add", "."]);
    git(repository, ["commit", "-m", "base"]);
    git(repository, ["switch", "-c", "feature"]);
    return run(repository);
  } finally {
    fs.rmSync(repository, { recursive:true, force:true });
  }
}

test("PR auditor discovers changed auditable files and excludes docs", () => {
  withRepo((repository) => {
    write(repository, "src/Page.tsx", 'export const Page = () => <main><h1>Home</h1><img src="x.png" /></main>;\n');
    write(repository, "src/styles.css", ".card { color: #123456; }\n");
    write(repository, "README.md", "# Fixture changed\n");
    git(repository, ["add", "."]);
    git(repository, ["commit", "-m", "feature"]);

    const result = auditPullRequest({ root, repository, profile:profile(), base:"main" });
    assert.deepEqual(result.changedFiles, ["src/Page.tsx", "src/styles.css"]);
    assert.equal(result.report.scannedFiles, 2);
    const rules = new Set(result.report.findings.map((finding) => finding.rule));
    assert.ok(rules.has("image-missing-alt"));
    assert.ok(rules.has("arbitrary-color"));
    assert.match(renderPullRequestAuditMarkdown(result), /Design Distillation PR Audit/);
    assert.match(renderPullRequestAuditMarkdown(result), /main\.\.\.HEAD/);
  });
});

test("PR auditor auto-detects local main and returns a clean zero-file report for docs-only changes", () => {
  withRepo((repository) => {
    write(repository, "README.md", "# Docs only\n");
    git(repository, ["add", "."]);
    git(repository, ["commit", "-m", "docs"]);

    const result = auditPullRequest({ root, repository, profile:profile(), env:{} });
    assert.equal(result.base, "main");
    assert.deepEqual(result.changedFiles, []);
    assert.equal(result.report.scannedFiles, 0);
    assert.equal(result.report.summary.total, 0);
  });
});

test("PR auditor rejects unknown base refs with an actionable error", () => {
  withRepo((repository) => {
    assert.throws(
      () => auditPullRequest({ root, repository, profile:profile(), base:"does-not-exist" }),
      /Unknown Git base ref/
    );
  });
});
