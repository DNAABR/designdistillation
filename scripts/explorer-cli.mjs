#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { buildExplorer } from "./explorer-build.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const command = args[0] || "help";

try {
  if (command === "build") {
    const outDir = path.resolve(root, option(args, "--out") || ".design-distillation/explorer");
    const result = buildExplorer({
      root,
      outDir,
      repository: option(args, "--repository") || "DNAABR/designdistillation",
      sourceRef: option(args, "--source-ref") || "feat/v0.8-website-explorer"
    });
    console.log("Explorer built: " + result.files.join(", "));
    console.log("Corpus: " + result.data.counts.corpus + ", registry: " + result.data.counts.registry + ", tokens: " + result.data.counts.tokens);
  } else if (command === "serve") {
    const outDir = path.resolve(root, option(args, "--out") || ".design-distillation/explorer");
    const port = Number(option(args, "--port") || 4173);
    buildExplorer({
      root,
      outDir,
      repository: option(args, "--repository") || "DNAABR/designdistillation",
      sourceRef: option(args, "--source-ref") || "feat/v0.8-website-explorer"
    });
    serve(outDir, port);
  } else {
    printHelp();
    if (!["help", "--help", "-h"].includes(command)) process.exitCode = 1;
  }
} catch (error) {
  console.error("Explorer command failed: " + error.message);
  process.exitCode = 1;
}

function serve(dir, port) {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8"
  };
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url || "/", "http://localhost").pathname;
    const target = path.resolve(dir, "." + (pathname === "/" ? "/index.html" : pathname));
    if (!target.startsWith(path.resolve(dir) + path.sep) && target !== path.join(path.resolve(dir), "index.html")) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": types[path.extname(target)] || "application/octet-stream" });
    fs.createReadStream(target).pipe(response);
  });
  server.listen(port, "127.0.0.1", () => {
    console.log("Design Distillation explorer: http://127.0.0.1:" + port);
  });
}

function option(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? "" : (argv[index + 1] || "");
}
function printHelp() {
  console.log("Design Distillation website explorer");
  console.log("");
  console.log("npm run explorer -- build [--out <dir>] [--source-ref <git-ref>]");
  console.log("npm run explorer -- serve [--out <dir>] [--port 4173] [--source-ref <git-ref>]");
}
