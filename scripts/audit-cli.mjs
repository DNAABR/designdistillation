#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { auditProject, renderAuditMarkdown } from "./auditor.mjs";

const cwd = process.cwd();
const args = process.argv.slice(2);
try {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }
  const profilePath = option(args, "--profile");
  const sourcePath = option(args, "--root");
  if (!profilePath || !sourcePath) {
    printHelp();
    process.exitCode = 1;
  } else {
    const profile = readJson(path.resolve(cwd, profilePath));
    const exceptionsPath = option(args, "--exceptions");
    const exceptions = exceptionsPath ? (readJson(path.resolve(cwd, exceptionsPath)).exceptions ?? []) : [];
    const outDir = path.resolve(cwd, option(args, "--out") || ".design-distillation/audit");
    const report = auditProject({ root:cwd, sourceRoot:path.resolve(cwd, sourcePath), profile, exceptions });

    fs.mkdirSync(outDir, { recursive:true });
    fs.writeFileSync(path.join(outDir, "audit-report.json"), JSON.stringify(report, null, 2) + "\n");
    fs.writeFileSync(path.join(outDir, "AUDIT.md"), renderAuditMarkdown(report) + "\n");
    console.log("Audit complete: " + report.scannedFiles + " files; " + report.summary.error + " errors, " +
      report.summary.warning + " warnings, " + report.summary["style-deviation"] + " style deviations, " +
      report.summary["intentional-exception"] + " intentional exceptions.");
    if (report.summary.error > 0 && !args.includes("--no-fail")) process.exitCode = 1;
  }
} catch (error) {
  console.error("Audit failed: " + error.message);
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
  console.log("Design Distillation anti-slop auditor");
  console.log("");
  console.log("npm run audit -- --profile <design-profile.json> --root <source-dir> [options]");
  console.log("  --exceptions <file>  documented intentional exceptions");
  console.log("  --out <dir>          output directory");
  console.log("  --no-fail            keep zero exit status when error findings exist");
}
