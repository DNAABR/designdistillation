import fs from "node:fs";
import path from "node:path";
import { composeDesign } from "./composer.mjs";

export function buildExplorerData({
  root = process.cwd(),
  repository = "DNAABR/designdistillation",
  sourceRef = "feat/v0.8-website-explorer"
} = {}) {
  const corpus = loadCorpus({ root, repository, sourceRef });
  const registry = loadRegistry({ root, repository, sourceRef });
  const tokens = loadTokens({ root, repository, sourceRef });
  const recipes = corpus.filter((entry) => entry.kind === "recipe");
  const profiles = {};

  for (const recipe of recipes) {
    const input = previewInputForRecipe(recipe);
    const result = composeDesign({ root, input });
    profiles[recipe.id] = {
      input,
      profile: result.profile
    };
  }

  return {
    version: "0.8.0",
    repository,
    sourceRef,
    generatedFrom: {
      corpus: "corpus/**/*.json",
      tokens: "tokens/manifest.json",
      registry: "registry/manifest.json",
      composer: "scripts/composer.mjs"
    },
    counts: {
      corpus: corpus.length,
      recipes: recipes.length,
      registry: registry.length,
      tokens: tokens.length,
      references: corpus.filter((entry) => entry.kind === "reference").length
    },
    taxonomy: readJson(path.join(root, "taxonomy", "taxonomy.json")),
    corpus,
    registry,
    tokens,
    profiles
  };
}

function loadCorpus({ root, repository, sourceRef }) {
  const base = path.join(root, "corpus");
  return walkJson(base).map((file) => {
    const entry = readJson(file);
    const sourcePath = relative(root, file);
    return {
      ...entry,
      collection: "corpus",
      sourcePath,
      sourceUrl: githubUrl(repository, sourceRef, sourcePath)
    };
  }).sort(sortEntries);
}

function loadRegistry({ root, repository, sourceRef }) {
  const manifest = readJson(path.join(root, "registry", "manifest.json"));
  return (manifest.entries ?? []).map((sourcePath) => {
    const entry = readJson(path.join(root, sourcePath));
    return {
      ...entry,
      collection: "registry",
      sourcePath,
      sourceUrl: githubUrl(repository, sourceRef, sourcePath)
    };
  }).sort(sortEntries);
}

function loadTokens({ root, repository, sourceRef }) {
  const manifest = readJson(path.join(root, "tokens", "manifest.json"));
  const records = [];

  for (const source of manifest.sources ?? []) {
    const sourcePath = "tokens/" + source;
    collectTokenLeaves(readJson(path.join(root, sourcePath)), [], undefined, (token) => {
      records.push({
        ...token,
        scope: sourcePath.includes("/primitive/") ? "primitive" : "semantic",
        theme: null,
        sourcePath,
        sourceUrl: githubUrl(repository, sourceRef, sourcePath)
      });
    });
  }

  for (const [theme, source] of Object.entries(manifest.themes ?? {})) {
    const sourcePath = "tokens/" + source;
    collectTokenLeaves(readJson(path.join(root, sourcePath)), [], undefined, (token) => {
      records.push({
        ...token,
        scope: "theme",
        theme,
        sourcePath,
        sourceUrl: githubUrl(repository, sourceRef, sourcePath)
      });
    });
  }

  return records.sort((a, b) =>
    a.path.localeCompare(b.path) ||
    String(a.theme ?? "").localeCompare(String(b.theme ?? "")) ||
    a.sourcePath.localeCompare(b.sourcePath)
  );
}

function collectTokenLeaves(node, segments, inheritedType, emit) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return;
  const type = node.$type ?? inheritedType ?? null;
  if (Object.prototype.hasOwnProperty.call(node, "$value")) {
    emit({
      path: segments.join("."),
      type,
      value: node.$value,
      description: node.$description ?? ""
    });
  }
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    collectTokenLeaves(value, [...segments, key], type, emit);
  }
}

function previewInputForRecipe(recipe) {
  const platform = normalizePlatform(recipe.platforms?.[0]);
  return {
    version: "0.5.0",
    product: {
      name: recipe.title + " Preview",
      type: recipe.category,
      description: recipe.summary,
      platform,
      audience: "general product users",
      primary_task: recipe.intent?.primary_outcomes?.[0] ?? "complete the primary product task",
      category_hints: [recipe.category],
      capabilities: []
    },
    personality: {},
    accessibility: {
      target: "WCAG 2.2 AA",
      reduced_motion: false
    },
    preferences: {
      theme: "light"
    },
    recipe_selection: {
      mode: "explicit",
      selections: [
        { id: recipe.id, weight: 1 }
      ]
    }
  };
}

function normalizePlatform(value) {
  return ["web", "responsive-web", "mobile", "desktop", "cross-platform"].includes(value)
    ? value
    : "cross-platform";
}

function walkJson(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkJson(full);
    return entry.isFile() && entry.name.endsWith(".json") ? [full] : [];
  });
}

function sortEntries(a, b) {
  return String(a.kind ?? "").localeCompare(String(b.kind ?? "")) ||
    String(a.title ?? a.id ?? "").localeCompare(String(b.title ?? b.id ?? ""));
}

function githubUrl(repository, sourceRef, sourcePath) {
  return "https://github.com/" + repository + "/blob/" + encodeURIComponent(sourceRef).replaceAll("%2F", "/") + "/" + sourcePath;
}

function relative(root, file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function readJson(file) {
  const text = fs.readFileSync(file, "utf8");
  return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
}
