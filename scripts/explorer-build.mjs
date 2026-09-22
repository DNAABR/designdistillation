import fs from "node:fs";
import path from "node:path";
import { buildExplorerData } from "./explorer-data.mjs";

export function buildExplorer({
  root = process.cwd(),
  outDir,
  repository = "DNAABR/designdistillation",
  sourceRef = "feat/v0.8-website-explorer"
}) {
  if (!outDir) throw new Error("Explorer build requires outDir.");
  const sourceDir = path.join(root, "explorer");
  for (const required of ["index.html", "styles.css", "app.js"]) {
    if (!fs.existsSync(path.join(sourceDir, required))) throw new Error("Missing explorer source: " + required);
  }

  const data = buildExplorerData({ root, repository, sourceRef });
  fs.mkdirSync(outDir, { recursive: true });
  for (const file of ["index.html", "styles.css", "app.js"]) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(outDir, file));
  }
  fs.writeFileSync(
    path.join(outDir, "data.js"),
    "window.__DESIGN_DISTILLATION_EXPLORER__ = " + JSON.stringify(data) + ";\n"
  );

  return {
    outDir,
    files: ["index.html", "styles.css", "app.js", "data.js"],
    data
  };
}
