import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { composeDesign } from "./composer.mjs";

const args = process.argv.slice(2);

if (!args.length || args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(args.length ? 0 : 1);
}

const inputPath = path.resolve(args[0]);
const outFlag = args.indexOf("--out");
const outputDir = path.resolve(
  outFlag >= 0 && args[outFlag + 1]
    ? args[outFlag + 1]
    : ".design-distillation"
);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputText = fs.readFileSync(inputPath, "utf8");
const input = JSON.parse(inputText.charCodeAt(0) === 0xFEFF ? inputText.slice(1) : inputText);
const result = composeDesign({ root, input });

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "design-profile.json"),
  JSON.stringify(result.profile, null, 2) + "\n"
);
fs.writeFileSync(path.join(outputDir, "DESIGN.md"), result.designMarkdown);
fs.writeFileSync(path.join(outputDir, "AGENTS.design.md"), result.agentInstructions);

console.log("Design Distillation composer completed.");
console.log("Base recipe: " + result.profile.selection.baseRecipe);
console.log(
  "Recipes: " +
  result.profile.selection.recipes
    .map((recipe) => recipe.id + " " + Math.round(recipe.weight * 100) + "%")
    .join(", ")
);
console.log("Output: " + outputDir);

function printHelp() {
  console.log("Usage: node scripts/compose.mjs <input.json> [--out <directory>]");
  console.log("");
  console.log("Generates:");
  console.log("  design-profile.json");
  console.log("  DESIGN.md");
  console.log("  AGENTS.design.md");
}
