#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { auditPullRequest, renderPullRequestAuditMarkdown } from "./pr-auditor.mjs";

const cwd = process.cwd();
const args = process.argv.slice(2);

try {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const profilePath = option(args, "--profile");
  if (!profilePath) {
    printHelp();
    process.exitCode = 1;
  } else {
    const profile = readJson(path.resolve(cwd, profilePath));
    const exceptionsPath = option(args, "--exceptions");
    const exceptions = exceptionsPath ? (readJson(path.resolve(cwd, exceptionsPath)).exceptions ?? []) : [];
    const repository = path.resolve(cwd, option(args, "--repo") || ".");
    const outDir = path.resolve(cwd, option(args, "--out") || ".design-distillation/pr-audit");

    const result = auditPullRequest({
      repository,
      profile,
      exceptions,
      base:option(args, "--base"),
      head:option(args, "--head") || "HEAD"
    });

    fs.mkdirSync(outDir, { recursive:true });
    fs.writeFileSync(path.join(outDir, "audit-report.json"), JSON.stringify(result.report, null, 2) + "\n");
    fs.writeFileSync(path.join(outDir, "PR_AUDIT.md"), renderPullRequestAuditMarkdown(result) + "\n");

    console.log("PR audit complete: " + result.range + "; " + result.changedFiles.length + " changed auditable files; " +
      result.report.summary.error + " errors, " + result.report.summary.warning + " warnings, " +
      result.report.summary["style-deviation"] + " style deviations, " +
      result.report.summary["intentional-exception"] + " intentional exceptions.");

    if (result.report.summary.error > 0 && !args.includes("--no-fail")) process.exitCode = 1;
  }
} catch (error) {
  console.error("PR audit failed: " + error.message);
  process.exitCode = 1;
}

function option(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? "" : (argv[index + 1] || "");
}

function readJson(file) {
  const text = fs.readFileSync(file, "utf8");
  return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
}

function printHelp() {
  console.log("Design Distillation PR auditor");
  console.log("");
  console.log("npm run audit-pr -- --profile <design-profile.json> [options]");
  console.log("  --repo <git-repo>    repository containing the PR branch (default: current directory)");
  console.log("  --base <ref>         PR base ref; auto-detects GitHub base/origin main/main/master");
  console.log("  --head <ref>         PR head ref (default: HEAD)");
  console.log("  --exceptions <file>  documented intentional exceptions");
  console.log("  --out <dir>          output directory (default: .design-distillation/pr-audit)");
  console.log("  --no-fail            keep zero exit status when error findings exist");
}
