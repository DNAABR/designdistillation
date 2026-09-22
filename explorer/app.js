(() => {
  const data = window.__DESIGN_DISTILLATION_EXPLORER__;
  if (!data) throw new Error("Explorer data is missing.");

  const state = {
    view: "library",
    libraryQuery: "",
    libraryKind: "",
    selectedEntry: null,
    tokenQuery: "",
    tokenScope: "",
    selectedToken: null,
    recipeId: "",
    theme: "light",
    personality: {}
  };

  const library = [...data.corpus, ...data.registry].sort((a, b) =>
    label(a).localeCompare(label(b))
  );
  const recipes = data.corpus.filter((entry) => entry.kind === "recipe").sort((a, b) => a.title.localeCompare(b.title));

  setupNavigation();
  setupLibrary();
  setupTokens();
  setupLab();
  document.getElementById("dataset-meta").textContent =
    "v" + data.version + " · " + data.counts.corpus + " corpus entries · " +
    data.counts.registry + " registry entries · " + data.counts.tokens + " token records · source " + data.sourceRef;

  function setupNavigation() {
    for (const button of document.querySelectorAll("[data-view]")) {
      button.addEventListener("click", () => {
        state.view = button.dataset.view;
        for (const candidate of document.querySelectorAll("[data-view]")) {
          candidate.classList.toggle("is-active", candidate === button);
        }
        for (const section of document.querySelectorAll(".view")) {
          section.hidden = section.id !== "view-" + state.view;
        }
      });
    }
  }

  function setupLibrary() {
    const kind = document.getElementById("library-kind");
    for (const value of [...new Set(library.map((entry) => entry.kind))].filter(Boolean).sort()) {
      kind.append(option(value, value));
    }
    document.getElementById("library-search").addEventListener("input", (event) => {
      state.libraryQuery = event.target.value.toLowerCase().trim();
      renderLibrary();
    });
    kind.addEventListener("change", (event) => {
      state.libraryKind = event.target.value;
      renderLibrary();
    });
    state.selectedEntry = library[0]?.id || null;
    renderLibrary();
  }

  function renderLibrary() {
    const matches = library.filter((entry) => {
      if (state.libraryKind && entry.kind !== state.libraryKind) return false;
      if (!state.libraryQuery) return true;
      return searchable(entry).includes(state.libraryQuery);
    });
    document.getElementById("library-count").textContent = matches.length + " results";
    const results = document.getElementById("library-results");
    results.innerHTML = "";
    for (const entry of matches) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "result-button" + (entry.id === state.selectedEntry ? " is-active" : "");
      button.innerHTML = '<span class="result-title">' + esc(label(entry)) + '</span>' +
        '<span class="result-meta">' + esc(entry.kind || entry.collection) + " · " + esc(entry.id) + "</span>";
      button.addEventListener("click", () => {
        state.selectedEntry = entry.id;
        renderLibrary();
      });
      results.append(button);
    }
    if (!matches.length) results.innerHTML = '<p class="empty-message">No matching entries.</p>';
    const selected = matches.find((entry) => entry.id === state.selectedEntry) || matches[0];
    if (selected) state.selectedEntry = selected.id;
    renderEntryDetail(selected);
  }

  function renderEntryDetail(entry) {
    const target = document.getElementById("library-detail");
    if (!entry) {
      target.innerHTML = '<p class="empty-message">Select an entry to inspect it.</p>';
      return;
    }
    const tags = [...(entry.tags || []), ...(entry.platforms || [])];
    const sourceSummary = (entry.sources || []).map((source) => source.type + ": " + source.title).join("\n");
    target.innerHTML =
      '<div class="preview-heading"><div><p class="eyebrow">' + esc(entry.kind) + '</p><h3>' + esc(label(entry)) + '</h3></div>' +
      '<a class="source-link" href="' + attr(entry.sourceUrl) + '" target="_blank" rel="noreferrer">Machine source ↗</a></div>' +
      '<p>' + esc(entry.summary || entry.problem || "Structured Design Distillation entry.") + '</p>' +
      (tags.length ? '<div class="pill-row">' + tags.map((tag) => '<span class="pill">' + esc(tag) + '</span>').join("") + '</div>' : "") +
      (entry.use_when?.length ? '<h4>Use when</h4>' + list(entry.use_when) : "") +
      (entry.avoid_when?.length ? '<h4>Avoid when</h4>' + list(entry.avoid_when) : "") +
      (entry.rationale?.length ? '<h4>Rationale</h4>' + list(entry.rationale) : "") +
      (sourceSummary ? '<h4>Provenance</h4><pre>' + esc(sourceSummary) + '</pre>' : "") +
      '<h4>Machine-readable entry</h4><pre>' + esc(JSON.stringify(stripExplorerMetadata(entry), null, 2)) + '</pre>';
  }

  function setupTokens() {
    document.getElementById("token-search").addEventListener("input", (event) => {
      state.tokenQuery = event.target.value.toLowerCase().trim();
      renderTokens();
    });
    document.getElementById("token-scope").addEventListener("change", (event) => {
      state.tokenScope = event.target.value;
      renderTokens();
    });
    state.selectedToken = tokenKey(data.tokens[0]);
    renderTokens();
  }

  function renderTokens() {
    const matches = data.tokens.filter((token) => {
      if (state.tokenScope && token.scope !== state.tokenScope) return false;
      if (!state.tokenQuery) return true;
      return (token.path + " " + token.type + " " + token.theme + " " + token.sourcePath).toLowerCase().includes(state.tokenQuery);
    });
    document.getElementById("token-count").textContent = matches.length + " token records";
    const results = document.getElementById("token-results");
    results.innerHTML = "";
    for (const token of matches.slice(0, 600)) {
      const key = tokenKey(token);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "result-button" + (key === state.selectedToken ? " is-active" : "");
      button.innerHTML = '<span class="result-title">' + esc(token.path) + '</span>' +
        '<span class="result-meta">' + esc(token.scope) + (token.theme ? " · " + esc(token.theme) : "") + (token.type ? " · " + esc(token.type) : "") + "</span>";
      button.addEventListener("click", () => {
        state.selectedToken = key;
        renderTokens();
      });
      results.append(button);
    }
    if (!matches.length) results.innerHTML = '<p class="empty-message">No matching tokens.</p>';
    const selected = matches.find((token) => tokenKey(token) === state.selectedToken) || matches[0];
    if (selected) state.selectedToken = tokenKey(selected);
    renderTokenDetail(selected);
  }

  function renderTokenDetail(token) {
    const target = document.getElementById("token-detail");
    if (!token) {
      target.innerHTML = '<p class="empty-message">Select a token to inspect it.</p>';
      return;
    }
    target.innerHTML =
      '<div class="preview-heading"><div><p class="eyebrow">' + esc(token.scope + (token.theme ? " · " + token.theme : "")) + '</p><h3>' + esc(token.path) + '</h3></div>' +
      '<a class="source-link" href="' + attr(token.sourceUrl) + '" target="_blank" rel="noreferrer">Machine source ↗</a></div>' +
      '<p class="muted">Type: ' + esc(token.type || "inherited/unspecified") + '</p>' +
      '<h4>Value</h4><pre>' + esc(JSON.stringify(token.value, null, 2)) + '</pre>' +
      (token.description ? '<h4>Description</h4><p>' + esc(token.description) + '</p>' : "") +
      '<h4>Source path</h4><pre>' + esc(token.sourcePath) + '</pre>';
  }

  function setupLab() {
    const recipeSelect = document.getElementById("lab-recipe");
    for (const recipe of recipes) recipeSelect.append(option(recipe.id, recipe.title));
    state.recipeId = recipes[0]?.id || "";
    recipeSelect.value = state.recipeId;
    recipeSelect.addEventListener("change", (event) => {
      state.recipeId = event.target.value;
      resetLab();
    });
    document.getElementById("lab-theme").addEventListener("change", (event) => {
      state.theme = event.target.value;
      renderLabPreview();
    });
    document.getElementById("download-input").addEventListener("click", () => {
      downloadJson("composer-input." + state.recipeId + ".json", buildComposerInput());
    });
    document.getElementById("download-preview").addEventListener("click", () => {
      downloadJson("design-profile.preview." + state.recipeId + ".json", buildPreviewProfile());
    });
    resetLab();
  }

  function resetLab() {
    const baseline = data.profiles[state.recipeId]?.profile;
    state.personality = { ...(baseline?.personality || {}) };
    state.theme = baseline?.foundations?.theme || "light";
    document.getElementById("lab-theme").value = state.theme;
    renderDnaControls();
    renderLabPreview();
  }

  function renderDnaControls() {
    const recipe = recipes.find((entry) => entry.id === state.recipeId);
    const container = document.getElementById("dna-controls");
    container.innerHTML = "";
    for (const [axis, contract] of Object.entries(recipe?.design_dna || {})) {
      const wrapper = document.createElement("label");
      wrapper.className = "dna-control";
      const value = state.personality[axis] ?? contract.target;
      wrapper.innerHTML =
        '<div class="dna-control__top"><span>' + esc(axis) + '</span><output data-output="' + attr(axis) + '">' + value + '</output></div>' +
        '<input type="range" min="' + contract.min + '" max="' + contract.max + '" value="' + value + '" data-axis="' + attr(axis) + '">' +
        '<div class="dna-range">Recipe range ' + contract.min + "–" + contract.max + " · target " + contract.target + "</div>";
      wrapper.querySelector("input").addEventListener("input", (event) => {
        const target = event.target;
        state.personality[target.dataset.axis] = Number(target.value);
        wrapper.querySelector("output").value = target.value;
        renderLabPreview();
      });
      container.append(wrapper);
    }
  }

  function renderLabPreview() {
    const recipe = recipes.find((entry) => entry.id === state.recipeId);
    const baseline = data.profiles[state.recipeId]?.profile;
    if (!recipe || !baseline) return;

    document.getElementById("preview-title").textContent = recipe.title;
    const source = document.getElementById("lab-source");
    source.href = recipe.sourceUrl;

    const summary = document.getElementById("lab-summary");
    const items = {
      layout: baseline.layout.strategy,
      typography: baseline.typography.strategy,
      color: baseline.color.strategy,
      shape: baseline.shape.strategy,
      motion: baseline.motion.strategy,
      theme: state.theme
    };
    summary.innerHTML = Object.entries(items).map(([key, value]) =>
      '<div class="strategy-card"><span>' + esc(key) + '</span><strong>' + esc(value) + '</strong></div>'
    ).join("");

    document.getElementById("profile-json").textContent = JSON.stringify(buildPreviewProfile(), null, 2);
  }

  function buildPreviewProfile() {
    const baseline = structuredClone(data.profiles[state.recipeId].profile);
    baseline.personality = { ...state.personality };
    baseline.foundations.theme = state.theme;
    baseline.provenance.composer = "explorer-preview-v0.8";
    const original = data.profiles[state.recipeId].profile.personality;
    const previewDecisions = Object.entries(state.personality)
      .filter(([axis, value]) => value !== original[axis])
      .map(([axis, value]) => ({
        type: "explorer-preview",
        field: axis,
        requested: value,
        applied: value,
        reason: "Interactive preview value stays inside the selected recipe range; compile the downloaded input for a canonical artifact."
      }));
    baseline.decisions = [
      ...baseline.decisions.filter((decision) => decision.type !== "explorer-preview"),
      ...previewDecisions
    ];
    baseline.foundations.overrides = [
      ...new Set([
        ...baseline.foundations.overrides,
        ...previewDecisions.map((decision) => decision.field + "=" + decision.applied)
      ])
    ];
    return baseline;
  }

  function buildComposerInput() {
    const input = structuredClone(data.profiles[state.recipeId].input);
    input.personality = { ...state.personality };
    input.preferences = { ...(input.preferences || {}), theme: state.theme };
    return input;
  }

  function downloadJson(filename, value) {
    const blob = new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function searchable(entry) {
    return JSON.stringify({
      id:entry.id, kind:entry.kind, title:entry.title, summary:entry.summary,
      problem:entry.problem, tags:entry.tags, platforms:entry.platforms, category:entry.category
    }).toLowerCase();
  }
  function stripExplorerMetadata(entry) {
    const clone = { ...entry };
    delete clone.collection;
    delete clone.sourcePath;
    delete clone.sourceUrl;
    return clone;
  }
  function label(entry) { return entry.title || entry.id || "Untitled"; }
  function tokenKey(token) { return token.sourcePath + "::" + token.path; }
  function list(values) { return "<ul>" + values.map((value) => "<li>" + esc(value) + "</li>").join("") + "</ul>"; }
  function option(value, text) {
    const node = document.createElement("option");
    node.value = value;
    node.textContent = text;
    return node;
  }
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    })[char]);
  }
  function attr(value) { return esc(value); }
})();
