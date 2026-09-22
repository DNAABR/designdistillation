import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { auditSources, renderAuditMarkdown } from "./auditor.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function auditPullRequest({
  root = packageRoot,
  repository = process.cwd(),
  profile,
  exceptions = [],
  base = "",
  head = "HEAD",
  env = process.env
} = {}) {
  if (!profile || typeof profile !== "object") throw new Error("PR auditor requires a design profile object.");

  const repoRoot = resolveGitRoot(repository);
  const resolvedHead = resolveCommitRef(repoRoot, head || "HEAD", "head");
  const resolvedBase = resolveBaseRef({ repository:repoRoot, base, env });
  const config = readJson(path.join(root, "taxonomy", "audit-rules.json"));
  const extensions = new Set(config.source_extensions ?? []);
  const ignoredDirectories = new Set(config.ignore_directories ?? []);

  const range = resolvedBase + "..." + resolvedHead;
  const changed = runGit(repoRoot, ["diff", "--name-only", "--diff-filter=ACMR", "-z", range, "--"]);
  const changedFiles = changed
    .split("\0")
    .filter(Boolean)
    .map(normalizeGitPath)
    .filter((file) => isAuditablePath(file, extensions, ignoredDirectories))
    .filter((file) => isSafeRegularFile(repoRoot, file))
    .sort((a, b) => a.localeCompare(b));

  const sources = changedFiles.map((relative) => ({
    relative,
    content:fs.readFileSync(path.join(repoRoot, ...relative.split("/")), "utf8")
  }));
  const report = auditSources({ root, profile, sources, exceptions });

  return {
    repository:repoRoot,
    base:resolvedBase,
    head:resolvedHead,
    range,
    changedFiles,
    report
  };
}

export function resolveBaseRef({ repository, base = "", env = process.env }) {
  if (base) return resolveCommitRef(repository, base, "base");

  const candidates = [];
  if (env?.GITHUB_BASE_REF) {
    candidates.push("origin/" + env.GITHUB_BASE_REF, env.GITHUB_BASE_REF);
  }

  const originHead = tryGit(repository, ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"]);
  if (originHead) candidates.push(originHead.trim());
  candidates.push("origin/main", "main", "origin/master", "master");

  for (const candidate of unique(candidates)) {
    if (refExists(repository, candidate)) return candidate;
  }
  throw new Error("Could not determine the PR base ref. Pass --base <ref>.");
}

export function renderPullRequestAuditMarkdown(result) {
  const { repository, base, head, range, changedFiles, report } = result;
  const lines = [
    "# Design Distillation PR Audit",
    "",
    "- Repository: " + path.basename(repository),
    "- Diff: \`" + range + "\`",
    "- Base: \`" + base + "\`",
    "- Head: \`" + head + "\`",
    "- Audited changed files: " + changedFiles.length,
    "- Errors: " + report.summary.error,
    "- Warnings: " + report.summary.warning,
    "- Style deviations: " + report.summary["style-deviation"],
    "- Intentional exceptions: " + report.summary["intentional-exception"],
    "",
    "This is a diff-scoped static audit. Cross-file/global heuristics see only the changed auditable files, so runtime behavior and unchanged implementation context still require normal review.",
    ""
  ];

  if (changedFiles.length) {
    lines.push("## Changed auditable files", "");
    for (const file of changedFiles) lines.push("- \`" + file + "\`");
    lines.push("");
  } else {
    lines.push("No auditable frontend/source files changed in this diff.", "");
  }

  const auditMarkdown = renderAuditMarkdown(report)
    .replace(/^# Design Distillation Audit\n/, "## Audit findings\n");
  lines.push(auditMarkdown.trimEnd(), "");
  return lines.join("\n");
}

function resolveGitRoot(repository) {
  const candidate = path.resolve(repository);
  if (!fs.existsSync(candidate)) throw new Error("Git repository path does not exist: " + candidate);
  const root = runGit(candidate, ["rev-parse", "--show-toplevel"]).trim();
  if (!root) throw new Error("Could not resolve Git repository root from " + candidate);
  return path.resolve(root);
}

function resolveCommitRef(repository, ref, label) {
  const value = String(ref || "").trim();
  if (!value) throw new Error("PR auditor requires a " + label + " ref.");
  if (!refExists(repository, value)) throw new Error('Unknown Git ' + label + ' ref "' + value + '".');
  return value;
}

function refExists(repository, ref) {
  try {
    execFileSync("git", ["-C", repository, "rev-parse", "--verify", "--quiet", ref + "^{commit}"], {
      encoding:"utf8",
      stdio:["ignore", "pipe", "ignore"],
      maxBuffer:1024 * 1024
    });
    return true;
  } catch {
    return false;
  }
}

function runGit(repository, args) {
  try {
    return execFileSync("git", ["-C", repository, ...args], {
      encoding:"utf8",
      stdio:["ignore", "pipe", "pipe"],
      maxBuffer:16 * 1024 * 1024
    });
  } catch (error) {
    const stderr = String(error.stderr ?? "").trim();
    throw new Error("Git command failed" + (stderr ? ": " + stderr : "."));
  }
}

function tryGit(repository, args) {
  try {
    return execFileSync("git", ["-C", repository, ...args], {
      encoding:"utf8",
      stdio:["ignore", "pipe", "ignore"],
      maxBuffer:1024 * 1024
    });
  } catch {
    return "";
  }
}

function isAuditablePath(file, extensions, ignoredDirectories) {
  const parts = file.split("/");
  if (parts.some((part) => ignoredDirectories.has(part))) return false;
  return extensions.has(path.extname(file).toLowerCase());
}

function isSafeRegularFile(repository, relative) {
  const absolute = path.resolve(repository, ...relative.split("/"));
  const inside = path.relative(repository, absolute);
  if (!inside || inside.startsWith("..") || path.isAbsolute(inside)) return false;
  if (!fs.existsSync(absolute)) return false;
  const stat = fs.lstatSync(absolute);
  return stat.isFile() && !stat.isSymbolicLink();
}

function normalizeGitPath(file) {
  return String(file).replaceAll("\\", "/").replace(/^\.\//, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function readJson(file) {
  const text = fs.readFileSync(file, "utf8");
  return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
}
