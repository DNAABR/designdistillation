import fs from "node:fs";
import path from "node:path";
import { benchmarkRetrieval } from "./retrieval.mjs";

export function runRetrievalBenchmark({ root = process.cwd() } = {}) {
  const benchmark = readJson(path.join(root, "benchmarks", "retrieval.json"));
  return {
    config:benchmark,
    report:benchmarkRetrieval({ root, benchmark })
  };
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  const { config, report } = runRetrievalBenchmark();
  console.log(JSON.stringify(report, null, 2));
  if (
    report.recallAtRequestedLimit < config.target_recall ||
    report.averageCompactRatio > config.max_average_compact_ratio
  ) process.exitCode = 1;
}

function readJson(file) {
  const text = fs.readFileSync(file, "utf8");
  return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
}
