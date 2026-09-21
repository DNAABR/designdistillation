#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { composeDesignContract } from "./composer.mjs";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

if (!args.input) {
  printHelp();
  process.exitCode = 1;
} else {
  try {
    const root = process.cwd();
    const inputFile = path.resolve(root, args.input);
    const outputDir = path.resolve(root, args.out || "design-distillation-output");
    const requirements = JSON.parse(fs.readFileSync(inputFile, "utf8"));
    const result = composeDesignContract({ root, requirements });

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(
      path.join(outputDir, "design-profile.json"),
      JSON.stringify(result.profile, null, 2) + "\n"
    );
    fs.writeFileSync(path.join(outputDir, "DESIGN.md"), result.designMarkdown + "\n");
    fs.writeFileSync(path.join(outputDir, "AGENTS.design.md"), result.agentInstructions + "\n");

    console.log("Design Distillation composer wrote:");
    console.log("- " + path.join(outputDir, "design-profile.json"));
    console.log("- " + path.join(outputDir, "DESIGN.md"));
    console.log("- " + path.join(outputDir, "AGENTS.design.md"));

    for (const warning of result.diagnostics.warnings) {
      console.warn("Warning: " + warning);
    }
  } catch (error) {
    console.error("Composer failed: " + error.message);
    process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const parsed = { input: "", out: "", help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--input" || arg === "-i") {
      parsed.input = argv[index + 1] || "";
      index += 1;
    } else if (arg === "--out" || arg === "-o") {
      parsed.out = argv[index + 1] || "";
      index += 1;
    } else {
      throw new Error('Unknown argument "' + arg + '".');
    }
  }
  return parsed;
}

function printHelp() {
  console.log("Usage: npm run compose -- --input <requirements.json> [--out <directory>]");
  console.log("");
  console.log("Outputs: design-profile.json, DESIGN.md, and AGENTS.design.md");
}
