import fs from "node:fs";
import path from "node:path";
import { benchmarkRetrieval } from "./retrieval.mjs";

export function validateRetrieval({ root = process.cwd(), errors = [] } = {}) {
  const benchmarkPath = path.join(root, "benchmarks", "retrieval.json");
  if (!fs.existsSync(benchmarkPath)) {
    errors.push("benchmarks/retrieval.json: missing retrieval benchmark");
    return { caseCount:0, recall:0, compactRatio:0 };
  }
  const benchmark = readJson(benchmarkPath, root, errors);
  if (!benchmark) return { caseCount:0, recall:0, compactRatio:0 };

  const report = benchmarkRetrieval({ root, benchmark });
  if (report.recallAtRequestedLimit < benchmark.target_recall) {
    errors.push("retrieval benchmark: recall " + report.recallAtRequestedLimit + " is below target " + benchmark.target_recall);
  }
  if (report.averageCompactRatio > benchmark.max_average_compact_ratio) {
    errors.push("retrieval benchmark: compact ratio " + report.averageCompactRatio + " exceeds target " + benchmark.max_average_compact_ratio);
  }
  return { caseCount:report.caseCount, recall:report.recallAtRequestedLimit, compactRatio:report.averageCompactRatio };
}

function readJson(file, root, errors) {
  try {
    const text = fs.readFileSync(file, "utf8");
    return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
  } catch (error) {
    errors.push(path.relative(root, file).replaceAll("\\", "/") + ": invalid JSON (" + error.message + ")");
    return null;
  }
}
