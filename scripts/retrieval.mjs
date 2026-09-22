import fs from "node:fs";
import path from "node:path";
import { composeDesign, scoreRecipes } from "./composer.mjs";
import { auditSources } from "./auditor.mjs";
import { resolveTokenValue } from "./registry-adapters.mjs";

export function searchDesignKnowledge({
  root = process.cwd(),
  query,
  kinds = [],
  family,
  limit = 5
}) {
  const entries = loadCorpus(root);
  const allowedKinds = new Set(kinds.filter(Boolean));
  return searchEntries({
    entries: entries.filter((entry) =>
      (!allowedKinds.size || allowedKinds.has(entry.kind)) &&
      (!family || entry.family === family)
    ),
    query,
    limit
  });
}

export function searchPatterns({ root = process.cwd(), query, family, limit = 5 }) {
  return searchDesignKnowledge({ root, query, kinds:["pattern"], family, limit });
}

export function searchReferences({ root = process.cwd(), query, limit = 5 }) {
  return searchDesignKnowledge({ root, query, kinds:["reference"], limit });
}

export function getDesignEntry({ root = process.cwd(), id, kind }) {
  const entry = loadCorpus(root).find((candidate) =>
    candidate.id === id && (!kind || candidate.kind === kind)
  );
  if (!entry) throw new Error('Unknown design entry "' + id + '"' + (kind ? ' of kind "' + kind + '"' : "") + ".");
  return entry;
}

export function getDesignRecipe({ root = process.cwd(), id }) {
  return getDesignEntry({ root, id, kind:"recipe" });
}

export function searchRegistry({ root = process.cwd(), query, kind, limit = 5 }) {
  const manifest = readJson(path.join(root, "registry", "manifest.json"));
  const entries = (manifest.entries ?? []).map((sourcePath) => ({
    ...readJson(path.join(root, sourcePath)),
    sourcePath
  }));
  return searchEntries({
    entries: entries.filter((entry) => !kind || entry.kind === kind),
    query,
    limit
  });
}

export function getToken({ root = process.cwd(), tokenPath, theme = "light" }) {
  return {
    path: tokenPath,
    theme,
    value: resolveTokenValue({ root, theme, tokenPath }),
    manifest: "tokens/manifest.json"
  };
}

export function selectDesignRecipes({ root = process.cwd(), input, limit = 5 }) {
  const recipes = loadEntries(path.join(root, "corpus", "recipes"));
  const signals = readJson(path.join(root, "taxonomy", "composer-signals.json"));
  const scoring = scoreRecipes({ input, signals, recipes });
  const ranked = scoring.ranked.slice(0, clampLimit(limit)).map((result) => ({
    id: result.id,
    score: result.score,
    trustLevel: result.trustLevel,
    evidence: result.evidence.slice(0, 8)
  }));

  const composed = composeDesign({ root, input });
  return {
    selected: composed.profile.selection,
    ranked,
    rationale: composed.profile.rationale,
    conflicts: composed.profile.conflicts
  };
}

export function composeProfile({ root = process.cwd(), input }) {
  return composeDesign({ root, input });
}

export function auditSourceFiles({
  root = process.cwd(),
  sources,
  profile,
  exceptions = []
}) {
  return auditSources({ root, sources, profile, exceptions });
}

export function benchmarkRetrieval({ root = process.cwd(), benchmark }) {
  const cases = benchmark?.cases ?? [];
  const results = cases.map((testCase) => {
    const hits = searchDesignKnowledge({
      root,
      query:testCase.query,
      kinds:testCase.kinds ?? [],
      family:testCase.family,
      limit:testCase.limit ?? 3
    });
    const ids = hits.map((hit) => hit.id);
    const matched = (testCase.expected_any ?? []).some((id) => ids.includes(id));
    return {
      id:testCase.id,
      query:testCase.query,
      matched,
      expectedAny:testCase.expected_any ?? [],
      resultIds:ids
    };
  });

  const fullCorpusBytes = Buffer.byteLength(JSON.stringify(loadCorpus(root)));
  const sampleQueries = cases.slice(0, Math.min(5, cases.length));
  const compactBytes = sampleQueries.reduce((sum, testCase) => {
    const hits = searchDesignKnowledge({
      root,
      query:testCase.query,
      kinds:testCase.kinds ?? [],
      family:testCase.family,
      limit:testCase.limit ?? 3
    });
    return sum + Buffer.byteLength(JSON.stringify(hits));
  }, 0);
  const averageCompactBytes = sampleQueries.length
    ? Math.round(compactBytes / sampleQueries.length)
    : 0;

  return {
    caseCount:cases.length,
    passed:results.filter((result) => result.matched).length,
    recallAtRequestedLimit:cases.length
      ? results.filter((result) => result.matched).length / cases.length
      : 1,
    fullCorpusBytes,
    averageCompactBytes,
    averageCompactRatio:fullCorpusBytes ? averageCompactBytes / fullCorpusBytes : 0,
    results
  };
}

export function searchEntries({ entries, query, limit = 5 }) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) throw new Error("Search query is required.");
  const terms = unique(normalizedQuery.split(" ").filter(Boolean));
  const scored = [];

  for (const entry of entries) {
    const fields = searchFields(entry);
    let score = 0;
    const matchedFields = new Set();

    for (const [field, value, weight] of fields) {
      const normalizedValue = normalize(value);
      if (!normalizedValue) continue;
      if (normalizedValue.includes(normalizedQuery)) {
        score += weight * 3;
        matchedFields.add(field);
      }
      for (const term of terms) {
        if (containsToken(normalizedValue, term)) {
          score += weight;
          matchedFields.add(field);
        }
      }
    }

    if (score <= 0) continue;
    scored.push({
      id:entry.id,
      kind:entry.kind,
      title:entry.title,
      summary:entry.summary,
      family:entry.family,
      category:entry.category,
      platforms:entry.platforms,
      score,
      matchedFields:[...matchedFields].sort(),
      sourcePath:entry.sourcePath ?? inferSourcePath(entry)
    });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
    .slice(0, clampLimit(limit));
}

function searchFields(entry) {
  return [
    ["id", entry.id, 12],
    ["title", entry.title, 14],
    ["kind", entry.kind, 2],
    ["family", entry.family, 8],
    ["category", entry.category, 8],
    ["tags", (entry.tags ?? []).join(" "), 7],
    ["summary", entry.summary, 6],
    ["problem", entry.problem, 4],
    ["use_when", (entry.use_when ?? []).join(" "), 3],
    ["avoid_when", (entry.avoid_when ?? []).join(" "), 2],
    ["rationale", (entry.rationale ?? []).join(" "), 2],
    ["intent", JSON.stringify(entry.intent ?? {}), 2],
    ["patterns", JSON.stringify(entry.patterns ?? {}), 1]
  ];
}

function loadCorpus(root) {
  return walkJson(path.join(root, "corpus")).map((file) => ({
    ...readJson(file),
    sourcePath:path.relative(root, file).replaceAll("\\", "/")
  }));
}

function loadEntries(dir) {
  const map = new Map();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const entry = readJson(path.join(dir, file));
    map.set(entry.id, entry);
  }
  return map;
}

function walkJson(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes:true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory()
      ? walkJson(full)
      : (entry.isFile() && entry.name.endsWith(".json") ? [full] : []);
  });
}

function inferSourcePath(entry) {
  const plural = entry.kind === "anti-pattern" ? "anti-patterns" :
    entry.kind === "pattern" ? "patterns" :
    entry.kind === "recipe" ? "recipes" :
    entry.kind === "principle" ? "principles" :
    entry.kind === "reference" ? "references" : entry.kind + "s";
  return "corpus/" + plural + "/" + entry.id + ".json";
}

function containsToken(value, term) {
  return (" " + value + " ").includes(" " + term + " ") || value.includes(term);
}
function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function unique(values) { return [...new Set(values)]; }
function clampLimit(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(20, Math.floor(parsed))) : 5;
}
function readJson(file) {
  const text = fs.readFileSync(file, "utf8");
  return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
}
