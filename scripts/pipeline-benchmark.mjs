import fs from "node:fs";
import path from "node:path";
import { composeDesign } from "./composer.mjs";
import { validateCorpus } from "./corpus-validator.mjs";
import { validateTokens } from "./token-validator.mjs";
import { validateRegistry } from "./registry-validator.mjs";
import { validateAuditorConfig } from "./auditor-validator.mjs";
import { buildExplorerData } from "./explorer-data.mjs";
import {
  auditSourceFiles,
  benchmarkRetrieval,
  getToken,
  searchRegistry
} from "./retrieval.mjs";

export function runPipelineBenchmark({ root = process.cwd() } = {}) {
  const config = readJson(path.join(root, "benchmarks", "pipeline.json"));
  const baseline = readJson(path.join(root, config.baseline));
  const retrievalConfig = readJson(path.join(root, "benchmarks", "retrieval.json"));

  const validationErrors = [];
  const corpus = validateCorpus({ root, errors:validationErrors });
  const tokens = validateTokens({ root, errors:validationErrors });
  const registry = validateRegistry({ root, errors:validationErrors });
  const auditor = validateAuditorConfig({ root, errors:validationErrors });
  const explorer = buildExplorerData({ root, sourceRef:"benchmark" });
  const retrieval = benchmarkRetrieval({ root, benchmark:retrievalConfig });

  const composerResults = {};
  const composedById = new Map();
  for (const testCase of config.composer_cases) {
    const input = testCase.input_file
      ? readJson(path.join(root, testCase.input_file))
      : testCase.input;
    const result = composeDesign({ root, input });
    composedById.set(testCase.id, result);
    composerResults[testCase.baseline_key] = summarizeProfile(result.profile);
  }

  const registryHits = searchRegistry({
    root,
    query:config.registry_case.query,
    limit:config.registry_case.limit
  });
  const token = getToken({
    root,
    tokenPath:config.token_case.path,
    theme:config.token_case.theme
  });
  const auditProfile = composedById.get(config.audit_case.profile_from)?.profile;
  if (!auditProfile) throw new Error("Pipeline benchmark audit profile source is missing.");
  const audit = auditSourceFiles({
    root,
    profile:auditProfile,
    sources:config.audit_case.sources
  });

  const current = {
    version:config.version,
    minimums:{
      corpus_entries:corpus.entryCount,
      patterns:corpus.patternCount,
      anti_patterns:corpus.antiPatternCount,
      recipes:corpus.recipeCount,
      token_paths:tokens.tokenCount,
      themes:tokens.themeCount,
      registry_entries:registry.entryCount,
      audit_rules:auditor.ruleCount,
      explorer_token_records:explorer.tokens.length,
      explorer_profiles:Object.keys(explorer.profiles).length
    },
    retrieval:{
      case_count:retrieval.caseCount,
      recall_at_requested_limit:retrieval.recallAtRequestedLimit,
      average_compact_ratio:retrieval.averageCompactRatio
    },
    composer:composerResults,
    registry:{
      labeled_input_query_first:registryHits[0]?.id ?? null
    },
    token:{
      dark_primary_text_hex:token.value?.hex ?? null
    },
    audit:{
      rules:[...new Set(audit.findings.map((finding) => finding.rule))].sort(),
      summary:audit.summary
    },
    validation_errors:validationErrors
  };

  const comparisons = compareToBaseline({ baseline, current });
  return {
    baselineVersion:baseline.version,
    current,
    comparisons,
    passed:comparisons.every((item) => item.passed) && validationErrors.length === 0
  };
}

export function compareToBaseline({ baseline, current }) {
  const checks = [];
  for (const [key, minimum] of Object.entries(baseline.minimums ?? {})) {
    checks.push(check(
      "minimum:" + key,
      Number(current.minimums?.[key]) >= Number(minimum),
      current.minimums?.[key],
      ">=" + minimum
    ));
  }

  checks.push(check(
    "retrieval:case-count",
    current.retrieval.case_count >= baseline.retrieval.case_count,
    current.retrieval.case_count,
    ">=" + baseline.retrieval.case_count
  ));
  checks.push(check(
    "retrieval:recall",
    current.retrieval.recall_at_requested_limit >= baseline.retrieval.recall_at_requested_limit,
    current.retrieval.recall_at_requested_limit,
    ">=" + baseline.retrieval.recall_at_requested_limit
  ));
  checks.push(check(
    "retrieval:compactness",
    current.retrieval.average_compact_ratio <= baseline.retrieval.max_average_compact_ratio,
    current.retrieval.average_compact_ratio,
    "<=" + baseline.retrieval.max_average_compact_ratio
  ));

  for (const [caseId, expected] of Object.entries(baseline.composer ?? {})) {
    const actual = current.composer?.[caseId];
    checks.push(check("composer:" + caseId + ":base", actual?.base_recipe === expected.base_recipe, actual?.base_recipe, expected.base_recipe));
    if (expected.influence_recipe) {
      checks.push(check("composer:" + caseId + ":influence", actual?.influence_recipe === expected.influence_recipe, actual?.influence_recipe, expected.influence_recipe));
      checks.push(check("composer:" + caseId + ":weight", actual?.influence_weight === expected.influence_weight, actual?.influence_weight, expected.influence_weight));
    }
    if (expected.reduced_motion) {
      checks.push(check("composer:" + caseId + ":reduced-motion", actual?.reduced_motion === expected.reduced_motion, actual?.reduced_motion, expected.reduced_motion));
    }
    for (const pattern of expected.required_patterns ?? []) {
      checks.push(check("composer:" + caseId + ":pattern:" + pattern, actual?.patterns?.includes(pattern), actual?.patterns ?? [], "contains " + pattern));
    }
  }

  checks.push(check(
    "registry:labeled-input",
    current.registry.labeled_input_query_first === baseline.registry.labeled_input_query_first,
    current.registry.labeled_input_query_first,
    baseline.registry.labeled_input_query_first
  ));
  checks.push(check(
    "token:dark-primary-text",
    current.token.dark_primary_text_hex === baseline.token.dark_primary_text_hex,
    current.token.dark_primary_text_hex,
    baseline.token.dark_primary_text_hex
  ));
  for (const rule of baseline.audit.required_fixture_rules ?? []) {
    checks.push(check("audit:rule:" + rule, current.audit.rules.includes(rule), current.audit.rules, "contains " + rule));
  }
  return checks;
}

function summarizeProfile(profile) {
  return {
    base_recipe:profile.selection?.baseRecipe ?? null,
    influence_recipe:profile.selection?.recipes?.[1]?.id ?? null,
    influence_weight:profile.selection?.recipes?.[1]?.weight ?? null,
    patterns:profile.patterns?.prioritize ?? [],
    reduced_motion:profile.accessibility?.reducedMotion ?? null,
    personality:profile.personality
  };
}

function check(id, passed, actual, expected) {
  return { id, passed:Boolean(passed), actual, expected };
}

function readJson(file) {
  const text = fs.readFileSync(file, "utf8");
  return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
}

const launchedDirectly = process.argv[1] &&
  import.meta.url === new URL("file://" + path.resolve(process.argv[1]).replaceAll("\\", "/")).href;
if (launchedDirectly) {
  const report = runPipelineBenchmark();
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}
