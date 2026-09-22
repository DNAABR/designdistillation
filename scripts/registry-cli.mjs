#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  buildRegistryArtifacts,
  installRegistryEntries,
  listRegistryEntries
} from "./registry-adapters.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const command = args[0] || "help";

try {
  if (command === "list") {
    for (const entry of listRegistryEntries({ root })) {
      console.log(entry.id.padEnd(18) + " " + entry.kind.padEnd(11) + " " + entry.title);
    }
  } else if (command === "build") {
    const outDir = path.resolve(root, option(args, "--out") || ".design-distillation/registry");
    const artifacts = buildRegistryArtifacts({ root });
    fs.mkdirSync(outDir, { recursive: true });
    for (const [name, content] of Object.entries(artifacts)) {
      fs.writeFileSync(path.join(outDir, name), content);
      console.log("wrote " + path.relative(root, path.join(outDir, name)).replaceAll("\\", "/"));
    }
  } else if (command === "install") {
    const outDir = path.resolve(root, option(args, "--out") || ".design-distillation/registry-install");
    const adapter = option(args, "--adapter") || "css";
    const ids = (option(args, "--entries") || "").split(",").map((value) => value.trim()).filter(Boolean);
    const result = installRegistryEntries({ root, outDir, adapter, ids });
    for (const file of result.written) console.log("wrote " + file);
    console.log("installed: " + result.entries.map((entry) => entry.id).join(", "));
    console.warn("license: " + result.licenseNote);
  } else {
    printHelp();
    if (command !== "help" && command !== "--help" && command !== "-h") process.exitCode = 1;
  }
} catch (error) {
  console.error("Registry command failed: " + error.message);
  process.exitCode = 1;
}

function option(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return "";
  return argv[index + 1] || "";
}

function printHelp() {
  console.log("Design Distillation registry");
  console.log("");
  console.log("npm run registry -- list");
  console.log("npm run registry -- build [--out <dir>]");
  console.log("npm run registry -- install [--entries id,id] [--adapter css|tailwind-v4|react] [--out <dir>]");
}
