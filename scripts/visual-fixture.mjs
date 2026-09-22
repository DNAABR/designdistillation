import fs from "node:fs";
import path from "node:path";
import { buildRegistryArtifacts } from "./registry-adapters.mjs";

export function buildVisualFixture({ root = process.cwd(), outDir } = {}) {
  if (!outDir) throw new Error("Visual fixture build requires outDir.");
  const artifacts = buildRegistryArtifacts({ root });
  const html = fs.readFileSync(path.join(root, "benchmarks", "visual", "registry-gallery.html"), "utf8");
  fs.mkdirSync(outDir, { recursive:true });
  fs.writeFileSync(path.join(outDir, "index.html"), html);
  fs.writeFileSync(path.join(outDir, "design-tokens.css"), artifacts["design-tokens.css"]);
  fs.writeFileSync(path.join(outDir, "components.css"), artifacts["components.css"]);
  return {
    files:["index.html","design-tokens.css","components.css"],
    outDir
  };
}

const launchedDirectly = process.argv[1] &&
  import.meta.url === new URL("file://" + path.resolve(process.argv[1]).replaceAll("\\", "/")).href;
if (launchedDirectly) {
  const index = process.argv.indexOf("--out");
  const outDir = path.resolve(process.cwd(), index >= 0 ? process.argv[index + 1] : ".design-distillation/visual-fixture");
  const result = buildVisualFixture({ outDir });
  console.log("Visual fixture built: " + result.files.join(", "));
}
