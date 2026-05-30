const STORAGE_KEY = "game-traffic-command-center-v1-1";
const ARTICLE_TYPES = ["Beginner Guide", "Achievement Guide", "Best Settings", "Worth It", "Comparison", "FAQ"];
const CONTENT_STATUSES = ["Draft", "Ready", "Published", "Monitoring", "Updating", "Dead"];
const PERFORMANCE_STATUSES = ["Winner", "Growing", "Watch", "Dead"];

const stages = [
  "Traffic Scout",
  "Opportunity Scoring",
  "Battlefield Selection",
  "Content Factory",
  "Article Structure",
  "Image Strategy",
  "SEO Optimization",
  "Publishing",
  "Monitoring",
  "Resource Allocation",
  "Intelligence Center",
];

const defaultSources = [
  { name: "Steam", signal: "Trending games", value: 92, accent: "#1d8f6f" },
  { name: "Reddit", signal: "Question velocity", value: 84, accent: "#c94d3c" },
  { name: "YouTube", signal: "Tutorial demand", value: 76, accent: "#246bba" },
  { name: "Google", signal: "PAA growth", value: 88, accent: "#c6862d" },
];

const defaultOpportunities = [
  {
    id: "seed-arc-raiders",
    keyword: "arc raiders best class",
    intent: "Decision Guide",
    growth: 92,
    traffic: 9,
    competition: 3,
    monetization: 8,
    production: 9,
    source: "manual",
    contentStatus: "Draft",
    tags: ["newRelease", "redditBurst", "googleUp"],
  },
  {
    id: "seed-where-winds-meet",
    keyword: "where winds meet beginner guide",
    intent: "Beginner Guide",
    growth: 81,
    traffic: 8,
    competition: 4,
    monetization: 7,
    production: 8,
    source: "manual",
    contentStatus: "Draft",
    tags: ["newRelease", "googleUp"],
  },
  {
    id: "seed-helldivers",
    keyword: "helldivers 2 best loadout update",
    intent: "Best Build",
    growth: 67,
    traffic: 7,
    competition: 6,
    monetization: 8,
    production: 7,
    source: "manual",
    contentStatus: "Draft",
    tags: ["majorUpdate", "redditBurst"],
  },
  {
    id: "seed-manor-lords",
    keyword: "manor lords best settings",
    intent: "Best Settings",
    growth: 44,
    traffic: 6,
    competition: 5,
    monetization: 6,
    production: 9,
    source: "manual",
    contentStatus: "Draft",
    tags: ["googleUp"],
  },
  {
    id: "seed-palworld",
    keyword: "palworld is it worth it 2026",
    intent: "Worth It",
    growth: 36,
    traffic: 6,
    competition: 7,
    monetization: 7,
    production: 8,
    source: "manual",
    contentStatus: "Draft",
    tags: ["majorUpdate"],
  },
];

const monitoringViews = {
  winning: [42, 58, 61, 70, 86, 93, 106, 118, 132, 148, 163, 181],
  growing: [18, 20, 23, 29, 34, 41, 49, 59, 72, 84, 98, 114],
  dead: [61, 59, 54, 48, 42, 39, 35, 31, 28, 25, 23, 21],
};

const defaultState = {
  opportunities: defaultOpportunities,
  sources: defaultSources,
  brief: {
    game: "Arc Raiders",
    articleType: "Beginner Guide",
  },
  monitor: {
    view: "winning",
    records: [],
  },
  imports: [],
  gscImports: [],
  gscRows: [],
};

let state = loadState();
let currentExportItemId = null;
let currentExportBundle = null;
let currentEditorialItemId = null;

const stageNav = document.querySelector("#stageNav");
const sourceGrid = document.querySelector("#sourceGrid");
const keywordTable = document.querySelector("#keywordTable");
const battlefieldResult = document.querySelector("#battlefieldResult");
const briefOutput = document.querySelector("#briefOutput");
const trendChart = document.querySelector("#trendChart");
const allocation = document.querySelector("#allocation");
const keywordForm = document.querySelector("#keywordForm");
const exportDialog = document.querySelector("#exportDialog");
const exportText = document.querySelector("#exportText");
const saveState = document.querySelector("#saveState");
const importLog = document.querySelector("#importLog");
const gscImportLog = document.querySelector("#gscImportLog");
const editorialDialog = document.querySelector("#editorialDialog");
const editorialSummary = document.querySelector("#editorialSummary");
const checklistOutput = document.querySelector("#checklistOutput");

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored || !Array.isArray(stored.opportunities)) {
      return {
        ...structuredClone(defaultState),
        opportunities: normalizeStoredOpportunities(structuredClone(defaultOpportunities)),
      };
    }
    return {
      ...structuredClone(defaultState),
      ...stored,
      opportunities: normalizeStoredOpportunities(
        Array.isArray(stored.opportunities) ? stored.opportunities : structuredClone(defaultOpportunities),
      ),
      sources: stored.sources || structuredClone(defaultSources),
      brief: { ...defaultState.brief, ...(stored.brief || {}) },
      monitor: { ...defaultState.monitor, ...(stored.monitor || {}) },
      imports: stored.imports || [],
      gscImports: stored.gscImports || [],
      gscRows: Array.isArray(stored.gscRows) ? stored.gscRows : [],
    };
  } catch (error) {
    return {
      ...structuredClone(defaultState),
      opportunities: normalizeStoredOpportunities(structuredClone(defaultOpportunities)),
    };
  }
}

state.brief.articleType = normalizeArticleType(state.brief.articleType);

function normalizeStoredOpportunities(items) {
  return items.map((item) => ({
    ...item,
    id: item.id || uid("stored"),
    contentStatus: normalizeContentStatus(item.contentStatus),
    statusTimestamps: item.statusTimestamps || { [normalizeContentStatus(item.contentStatus)]: nowStamp() },
    publishedUrl: item.publishedUrl || "",
    publishDate: item.publishDate || "",
    lastUpdatedDate: item.lastUpdatedDate || "",
    tags: Array.isArray(item.tags) ? item.tags : [],
  }));
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (!saveState) return;
  saveState.textContent = "Saved locally";
  saveState.style.color = "#1d8f6f";
  window.clearTimeout(persistState.timer);
  persistState.timer = window.setTimeout(() => {
    saveState.style.color = "";
  }, 900);
}

function uid(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clampScore(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(10, Math.max(1, Math.round(number)));
}

function normalizeGrowth(value, fallback = 45) {
  const number = Number(String(value ?? "").replace("%", ""));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(300, Math.max(1, Math.round(number)));
}

function opportunityScore(item) {
  return Number(((item.traffic + item.monetization + item.production) / item.competition).toFixed(1));
}

function scoreColor(score) {
  if (score >= 8) return "#1d8f6f";
  if (score >= 5) return "#c6862d";
  return "#c94d3c";
}

function statusFor(score) {
  if (score >= 8) return "Attack";
  if (score >= 5) return "Test";
  return "Watch";
}

function normalizeArticleType(value) {
  if (ARTICLE_TYPES.includes(value)) return value;
  if (value === "Settings") return "Best Settings";
  if (value === "Worth It") return "Worth It";
  if (value === "FAQ") return "FAQ";
  if (value === "Achievement Guide") return "Achievement Guide";
  if (value === "Comparison") return "Comparison";
  return "Beginner Guide";
}

function normalizeContentStatus(value) {
  return CONTENT_STATUSES.includes(value) ? value : "Draft";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowStamp() {
  return new Date().toLocaleString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "untitled";
}

function uniqueSlug(base, usedSlugs) {
  const cleanBase = slugify(base);
  let candidate = cleanBase;
  let index = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${cleanBase}-${index}`;
    index += 1;
  }
  usedSlugs.add(candidate);
  return candidate;
}

function articlePackageMeta(item, items = state.opportunities) {
  const usedArticleSlugs = new Set();
  const sortedItems = sortedOpportunitiesFrom(items);
  let articleSlug = "";

  sortedItems.forEach((candidate) => {
    const gameSlug = slugify(articleGame(candidate));
    const base = `${articleCategory(candidate)}-${candidate.keyword}`;
    const nextSlug = uniqueSlug(base, usedArticleSlugs);
    if (candidate.id === item.id) {
      articleSlug = nextSlug;
    }
  });

  const game = articleGame(item);
  const gameSlug = slugify(game);
  articleSlug = articleSlug || uniqueSlug(`${articleCategory(item)}-${item.keyword}`, usedArticleSlugs);

  return {
    game,
    gameSlug,
    articleSlug,
    contentDir: `content/${gameSlug}/${articleSlug}`,
    articlePath: `content/${gameSlug}/${articleSlug}/index.md`,
    imageDir: `content/${gameSlug}/${articleSlug}/images`,
    coverPath: `content/${gameSlug}/${articleSlug}/images/cover.webp`,
    gameplayPath: `content/${gameSlug}/${articleSlug}/images/gameplay.webp`,
  };
}

function baseArticleSlug(item) {
  return slugify(`${articleCategory(item)}-${item.keyword}`);
}

function articleTitle(item) {
  return `${articleGame(item)} ${articleCategory(item)}: ${titleCase(item.keyword)}`;
}

function duplicateWarnings(item) {
  const keywordKey = item.keyword.toLowerCase().trim();
  const slugKey = baseArticleSlug(item);
  const titleKey = articleTitle(item).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const similarTitleKey = titleKey.split(" ").slice(0, 7).join(" ");
  const warnings = [];

  const sameKeyword = state.opportunities.filter((candidate) => candidate.id !== item.id && candidate.keyword.toLowerCase().trim() === keywordKey);
  const sameSlug = state.opportunities.filter((candidate) => candidate.id !== item.id && baseArticleSlug(candidate) === slugKey);
  const similarTitle = state.opportunities.filter((candidate) => {
    if (candidate.id === item.id) return false;
    const candidateTitle = articleTitle(candidate).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return candidateTitle.startsWith(similarTitleKey) || titleKey.startsWith(candidateTitle.split(" ").slice(0, 7).join(" "));
  });

  if (sameKeyword.length) warnings.push("Duplicate keyword");
  if (sameSlug.length) warnings.push("Duplicate slug");
  if (similarTitle.length) warnings.push("Similar title");
  return [...new Set(warnings)];
}

function parseNumber(value) {
  const number = Number(String(value ?? "").replace("%", "").replace(/,/g, "").trim());
  return Number.isFinite(number) ? number : 0;
}

function normalizeCtr(value) {
  const raw = String(value ?? "").trim();
  const number = parseNumber(raw);
  if (!number) return 0;
  return raw.includes("%") || number > 1 ? number / 100 : number;
}

function normalizeGscRow(row) {
  const query = row.Query || row.query || row.queries || "";
  const page = row.Page || row.page || row.url || row.URL || "";
  if (!query && !page) return null;
  return {
    id: uid("gsc"),
    query: String(query).trim(),
    page: String(page).trim(),
    clicks: parseNumber(row.Clicks || row.clicks),
    impressions: parseNumber(row.Impressions || row.impressions),
    ctr: normalizeCtr(row.CTR || row.ctr),
    position: parseNumber(row.Position || row.position || row["Average position"]),
    importedAt: new Date().toISOString(),
  };
}

function itemMatchTokens(item) {
  const meta = articlePackageMeta(item);
  return [
    item.publishedUrl,
    meta.articleSlug,
    meta.articlePath,
    item.keyword,
    slugify(item.keyword),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
}

function rowMatchesItem(row, item) {
  const page = row.page.toLowerCase();
  const query = row.query.toLowerCase();
  return itemMatchTokens(item).some((token) => {
    if (!token) return false;
    return page.includes(token) || query.includes(token);
  });
}

function performanceForItem(item) {
  const rows = state.gscRows.filter((row) => rowMatchesItem(row, item));
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const ctr = impressions ? clicks / impressions : 0;
  const averagePosition = rows.length
    ? rows.reduce((sum, row) => sum + (row.position || 0), 0) / rows.length
    : 0;
  const topQueries = [...rows]
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, 5)
    .map((row) => row.query)
    .filter(Boolean);
  const latestImport = state.gscImports[0]?.date || "";
  const importedThirtyDaysAgo = latestImport
    ? (Date.now() - new Date(latestImport).getTime()) / (1000 * 60 * 60 * 24) >= 30
    : false;

  let status = "Dead";
  if (clicks > 50 || impressions > 1000) status = "Winner";
  else if (isGrowing(item)) status = "Growing";
  else if (impressions > 0 && clicks === 0) status = "Watch";
  else if (!impressions && importedThirtyDaysAgo) status = "Dead";
  else if (!impressions) status = "Dead";

  return {
    rows,
    clicks,
    impressions,
    ctr,
    averagePosition,
    topQueries,
    status,
    recommendation: updateRecommendation(status, { clicks, impressions, ctr, averagePosition, topQueries }),
  };
}

function isGrowing(item) {
  const imports = [...state.gscImports].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (imports.length < 2) return false;
  const totals = imports.map((batch) =>
    state.gscRows
      .filter((row) => row.batchId === batch.id && rowMatchesItem(row, item))
      .reduce((sum, row) => sum + row.impressions, 0),
  );
  const lastTwo = totals.slice(-2);
  return lastTwo[0] > 0 && lastTwo[1] > lastTwo[0];
}

function updateRecommendation(status, perf) {
  if (status === "Winner") return "Expand Article";
  if (status === "Growing") return perf.ctr < 0.03 ? "Improve Title" : "Build Internal Links";
  if (status === "Watch") return perf.topQueries.length < 3 ? "Add FAQ" : "Improve Title";
  return "Stop Updating";
}

function perfColor(status) {
  if (status === "Winner") return "#1d8f6f";
  if (status === "Growing") return "#246bba";
  if (status === "Watch") return "#c6862d";
  return "#c94d3c";
}

function editorialChecklist(item) {
  const md = astroArticleMarkdown(item);
  const faqCount = (md.match(/^### /gm) || []).length;
  const imageCount = (md.match(/!\[[^\]]+\]\(\.\/images\/[^)]+\)/g) || []).length;
  const linkCount = (md.match(/^- \/content\//gm) || []).length;
  const title = articleTitle(item);
  const description = metaDescription(item, articleGame(item), articleCategory(item));

  return [
    { key: "title", label: "Clear English title", passed: title.length >= 24 && title.includes(":") },
    { key: "quickAnswer", label: "Quick Answer answers the question", passed: md.includes("## Quick Answer") && md.includes(item.keyword) },
    { key: "faq", label: "5 FAQ entries", passed: faqCount >= 5 },
    { key: "images", label: "2 image placeholders", passed: imageCount >= 2 },
    { key: "links", label: "Internal link suggestions", passed: linkCount >= 5 },
    { key: "description", label: "Meta description", passed: description.length >= 80 && md.includes("description:") },
  ];
}

function qualityAssessment(item) {
  const md = astroArticleMarkdown(item);
  const checklist = editorialChecklist(item);
  const title = articleTitle(item);
  const description = metaDescription(item, articleGame(item), articleCategory(item));
  const faqCount = (md.match(/^### /gm) || []).length;
  const linkCount = (md.match(/^- \/content\//gm) || []).length;
  const imageCount = (md.match(/!\[[^\]]+\]\(\.\/images\/[^)]+\)/g) || []).length;
  const words = md.split(/\s+/).filter(Boolean).length;

  const parts = {
    searchIntentMatch: item.keyword && md.toLowerCase().includes(item.keyword.toLowerCase()) ? 18 : 8,
    titleQuality: title.length >= 24 && title.length <= 90 ? 15 : 8,
    faqQuality: Math.min(20, faqCount * 4),
    internalLinks: Math.min(15, linkCount * 3),
    imageCompleteness: Math.min(15, imageCount * 7.5),
    readability: words >= 450 && words <= 1800 && description.length <= 170 ? 17 : 10,
  };
  const score = Math.round(Object.values(parts).reduce((sum, value) => sum + value, 0));
  return {
    score,
    parts,
    checklist,
    passed: score >= 70 && checklist.every((item) => item.passed),
  };
}

function qualityColor(score) {
  if (score >= 85) return "#1d8f6f";
  if (score >= 70) return "#c6862d";
  return "#c94d3c";
}

function timestampFor(item) {
  const status = normalizeContentStatus(item.contentStatus);
  return item.statusTimestamps?.[status] || "No timestamp";
}

function sortedOpportunitiesFrom(items) {
  return [...items].sort((a, b) => opportunityScore(b) - opportunityScore(a));
}

function sortedOpportunities() {
  return sortedOpportunitiesFrom(state.opportunities);
}

function renderStages() {
  stageNav.innerHTML = stages
    .map(
      (stage, index) => `
        <button class="${index === 0 ? "active" : ""}" type="button">
          ${stage}
          <span>${String(index + 1).padStart(2, "0")}</span>
        </button>
      `,
    )
    .join("");
}

function renderSources() {
  sourceGrid.innerHTML = state.sources
    .map(
      (source) => `
        <article class="source-card" style="--accent: ${source.accent}">
          <span>${escapeHtml(source.name)}</span>
          <strong>${escapeHtml(source.value)}</strong>
          <span>${escapeHtml(source.signal)}</span>
        </article>
      `,
    )
    .join("");
}

function renderKeywords() {
  const rows = sortedOpportunities()
    .slice(0, 100)
    .map((item) => {
      const score = opportunityScore(item);
      const quality = qualityAssessment(item);
      const warnings = duplicateWarnings(item);
      const perf = performanceForItem(item);
      return `
        <tr>
          <td>${escapeHtml(item.keyword)}</td>
          <td>${escapeHtml(item.intent)}</td>
          <td>+${item.growth}%</td>
          <td>${item.traffic}/10</td>
          <td>${item.competition}/10</td>
          <td><span class="score-pill" style="background:${scoreColor(score)}">${score}</span></td>
          <td><span class="quality-pill" style="background:${qualityColor(quality.score)}">${quality.score}</span></td>
          <td><span class="warning-pill ${warnings.length ? "warn" : ""}" title="${escapeHtml(warnings.join(", ") || "No duplicate warnings")}">${warnings.length ? "Warning" : "Clear"}</span></td>
          <td>
            <div class="traffic-cell" title="${escapeHtml(perf.topQueries.join(", ") || "No matched queries")}">
              <span>${perf.clicks} clicks / ${perf.impressions} impr.</span>
              <small>CTR ${(perf.ctr * 100).toFixed(1)}% · Pos ${perf.averagePosition ? perf.averagePosition.toFixed(1) : "-"}</small>
            </div>
          </td>
          <td><span class="perf-pill" style="background:${perfColor(perf.status)}">${perf.status}</span></td>
          <td>${escapeHtml(perf.recommendation)}</td>
          <td><span class="status-pill">${statusFor(score)}</span></td>
          <td>
            <div class="timestamp-stack">
              <select class="status-select" data-status-id="${item.id}" aria-label="Content status for ${escapeHtml(item.keyword)}">
                ${CONTENT_STATUSES.map(
                  (status) => `<option value="${status}" ${normalizeContentStatus(item.contentStatus) === status ? "selected" : ""}>${status}</option>`,
                ).join("")}
              </select>
              <small>${escapeHtml(timestampFor(item))}</small>
            </div>
          </td>
          <td>
            <div class="row-actions">
              <button class="mini-button" type="button" data-export-id="${item.id}">Open</button>
              <button class="mini-button" type="button" data-download-all="${item.id}">Files</button>
              <button class="mini-button" type="button" data-generate-astro="${item.id}">Generate Astro Article</button>
              <button class="mini-button" type="button" data-download-astro="${item.id}">Astro .md</button>
              <button class="mini-button" type="button" data-package-astro="${item.id}">Package</button>
              <button class="mini-button" type="button" data-review-id="${item.id}">Review</button>
            </div>
          </td>
        </tr>
      `;
    });

  keywordTable.innerHTML = rows.join("");
  document.querySelector("#queueCount").textContent = Math.min(state.opportunities.length * 4, 999);
  renderBattlefield();
}

function selectedFilters() {
  return [...document.querySelectorAll("[data-filter]:checked")].map((input) => input.dataset.filter);
}

function renderBattlefield() {
  if (!state.opportunities.length) {
    battlefieldResult.innerHTML = "<strong>No battlefield selected</strong><p>Import data or add a keyword to start scoring opportunities.</p>";
    return;
  }

  const filters = selectedFilters();
  const candidates = sortedOpportunities().filter((item) => item.tags.some((tag) => filters.includes(tag)));
  const top = candidates[0] || sortedOpportunities()[0];
  const score = opportunityScore(top);

  battlefieldResult.innerHTML = `
    <strong>${escapeHtml(top.keyword)}</strong>
    <p>Priority: ${statusFor(score)}. Score ${score}, growth +${top.growth}%, competition ${top.competition}/10.</p>
    <p>Ship one focused article within 24 hours, then watch impressions, CTR, sessions, bounce rate, and average time daily.</p>
  `;
}

function renderBrief() {
  document.querySelector("#gameInput").value = state.brief.game;
  document.querySelector("#articleType").value = state.brief.articleType;

  const top = sortedOpportunities()[0];
  const keyword = top ? top.keyword : "no keyword selected";
  const slug = slugify(`${state.brief.game} ${state.brief.articleType}`);

  briefOutput.innerHTML = `
    <h3>${escapeHtml(state.brief.game)}: ${escapeHtml(state.brief.articleType)}</h3>
    <p><strong>Quick answer:</strong> Target the player decision in the first 80 words, then move directly into steps, best options, mistakes, and FAQ.</p>
    <code>title: ${escapeHtml(state.brief.game)} ${escapeHtml(state.brief.articleType)}: Best Choices, Steps, and Common Mistakes<br>slug: ${slug}<br>category: ${escapeHtml(state.brief.articleType)}<br>primary_keyword: ${escapeHtml(keyword)}</code>
    <p><strong>Images:</strong> 1 cover image, 1 gameplay screenshot, 1 comparison table. Keep production fast and functional.</p>
    <p><strong>Internal links:</strong> beginner guide, settings guide, achievement guide, worth-it review.</p>
  `;
}

function renderImportLog() {
  const last = state.imports[0];
  if (!last) {
    importLog.textContent = "No imports yet.";
    return;
  }
  importLog.textContent = `Last import: ${last.count} ${last.source} rows from ${last.fileName} at ${last.time}.`;
}

function renderGscImportLog() {
  const last = state.gscImports[0];
  if (!last) {
    gscImportLog.textContent = "No Search Console imports yet.";
    return;
  }
  gscImportLog.textContent = `Last GSC import: ${last.count} rows from ${last.fileName} at ${last.time}.`;
}

function renderChart(view = state.monitor.view) {
  state.monitor.view = view;
  const values = monitoringViews[view] || monitoringViews.winning;
  const max = Math.max(...values);
  trendChart.innerHTML = values
    .map((value) => `<div class="bar" title="${value} sessions" style="height:${(value / max) * 100}%"></div>`)
    .join("");

  const rule =
    view === "dead"
      ? "No growth for 60 days: stop updates and recycle the topic only if a new patch changes demand."
      : view === "growing"
        ? "Growth streak under 30 days: keep testing title, FAQ, and internal links before scaling."
        : "Top 20% trajectory: increase content investment and build a dedicated topic cluster.";

  allocation.innerHTML = `
    <div class="allocation-item">
      <strong>${view[0].toUpperCase() + view.slice(1)} Pages</strong>
      <span>${rule}</span>
    </div>
    <div class="allocation-item">
      <strong>Monitoring Record</strong>
      <span>${state.monitor.records.length} saved events. Current view: ${view}.</span>
    </div>
    <div class="allocation-item">
      <strong>Escalation</strong>
      <span>Top 10% becomes a brand site. Top 1% becomes a tool site.</span>
    </div>
  `;
}

function buildOpportunityFromInput(keyword, intent, growth, source = "manual") {
  const normalizedGrowth = normalizeGrowth(growth);
  return {
    id: uid(source),
    keyword,
    intent,
    growth: normalizedGrowth,
    traffic: Math.min(10, Math.max(3, Math.round(normalizedGrowth / 12))),
    competition: Math.min(10, Math.max(2, Math.round(11 - normalizedGrowth / 18))),
    monetization: intent === "Worth It" ? 9 : 7,
    production: intent === "FAQ" || intent === "Best Settings" ? 9 : 8,
    source,
    contentStatus: "Draft",
    statusTimestamps: { Draft: nowStamp() },
    publishedUrl: "",
    publishDate: "",
    lastUpdatedDate: "",
    tags: ["googleUp", normalizedGrowth > 65 ? "redditBurst" : "majorUpdate"],
  };
}

function inferIntent(source, text) {
  const lower = text.toLowerCase();
  if (lower.includes("worth") || lower.includes("buy")) return "Worth It";
  if (lower.includes("setting")) return "Best Settings";
  if (lower.includes("build") || lower.includes("loadout") || lower.includes("weapon")) return "Best Build";
  if (lower.includes("achievement")) return "Achievement Guide";
  if (source === "reddit") return "FAQ";
  return "Beginner Guide";
}

function normalizeImportedItem(raw, source) {
  const row = typeof raw === "string" ? { keyword: raw } : raw || {};
  const baseText = row.keyword || row.query || row.title || row.game || row.name || row.topic;
  if (!baseText) return null;

  const text = String(baseText).trim();
  const keyword =
    source === "steam" && !/guide|best|settings|worth|faq/i.test(text) ? `${text} beginner guide` : text.toLowerCase();
  const growth = normalizeGrowth(row.growth || row.growthRate || row.trend || row.score, source === "steam" ? 70 : 55);
  const intent = row.intent || row.searchIntent || inferIntent(source, keyword);

  return {
    id: uid(source),
    keyword,
    intent,
    growth,
    traffic: clampScore(row.traffic || row.trafficScore, Math.min(10, Math.max(4, Math.round(growth / 11)))),
    competition: clampScore(row.competition || row.competitionScore, Math.min(10, Math.max(2, Math.round(11 - growth / 20)))),
    monetization: clampScore(row.monetization || row.monetizationScore, intent === "Worth It" ? 9 : 7),
    production: clampScore(row.production || row.aiProduction || row.aiProductionScore, intent === "FAQ" ? 9 : 8),
    source,
    contentStatus: normalizeContentStatus(row.contentStatus || row.status),
    statusTimestamps: { [normalizeContentStatus(row.contentStatus || row.status)]: nowStamp() },
    publishedUrl: row.publishedUrl || row.url || "",
    publishDate: row.publishDate || "",
    lastUpdatedDate: row.lastUpdatedDate || "",
    tags: tagsForSource(source, growth),
  };
}

function tagsForSource(source, growth) {
  const tags = ["googleUp"];
  if (source === "steam") tags.push("newRelease");
  if (source === "reddit" || growth > 65) tags.push("redditBurst");
  if (source !== "steam" && growth <= 65) tags.push("majorUpdate");
  return [...new Set(tags)];
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (!rows.length) return [];

  const knownHeaders = ["keyword", "query", "title", "game", "name", "growth", "traffic", "competition", "intent"];
  const firstRow = rows[0].map((value) => value.toLowerCase());
  const hasHeader = firstRow.some((value) => knownHeaders.includes(value));

  if (!hasHeader) {
    return rows.map((values) => ({ keyword: values[0], growth: values[1] }));
  }

  const headers = firstRow;
  return rows.slice(1).map((values) =>
    headers.reduce((record, header, index) => {
      record[header] = values[index];
      return record;
    }, {}),
  );
}

function parseJsonImport(text, selectedSource) {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return [{ source: selectedSource, rows: data }];
  if (!data || typeof data !== "object") return [];

  const groups = [];
  ["steam", "reddit", "google"].forEach((source) => {
    if (Array.isArray(data[source])) groups.push({ source, rows: data[source] });
  });

  if (groups.length) return groups;
  return [{ source: selectedSource, rows: Object.values(data) }];
}

async function importData() {
  const file = document.querySelector("#importFile").files[0];
  const pastedText = document.querySelector("#importText").value.trim();
  const selectedSource = document.querySelector("#importSource").value;
  if (!file && !pastedText) {
    importLog.textContent = "Choose a CSV/JSON file or paste CSV/JSON text first.";
    return;
  }

  try {
    const text = file ? await file.text() : pastedText;
    const sourceName = file ? file.name : "pasted input";
    const trimmed = text.trim();
    const isJson = (file && file.name.toLowerCase().endsWith(".json")) || trimmed.startsWith("{") || trimmed.startsWith("[");
    const groups = isJson
      ? parseJsonImport(text, selectedSource)
      : [{ source: selectedSource, rows: parseCsv(text) }];
    const imported = groups.flatMap((group) =>
      group.rows.map((row) => normalizeImportedItem(row, group.source)).filter(Boolean),
    );

    state.opportunities = dedupeOpportunities([...imported, ...state.opportunities]);
    state.imports = [
      {
        source: groups.map((group) => group.source).join(", "),
        fileName: sourceName,
        count: imported.length,
        time: new Date().toLocaleString(),
      },
      ...state.imports,
    ].slice(0, 20);

    document.querySelector("#importFile").value = "";
    document.querySelector("#importText").value = "";
    persistState();
    renderAll();
    importLog.textContent = `Imported ${imported.length} rows from ${sourceName}.`;
  } catch (error) {
    importLog.textContent = `Import failed: ${error.message}`;
  }
}

async function importGscData() {
  const file = document.querySelector("#gscFile").files[0];
  const pastedText = document.querySelector("#gscText").value.trim();
  if (!file && !pastedText) {
    gscImportLog.textContent = "Choose or paste a Search Console CSV first.";
    return;
  }

  try {
    const text = file ? await file.text() : pastedText;
    const fileName = file ? file.name : "pasted GSC CSV";
    const batchId = uid("gsc-batch");
    const rows = parseCsv(text)
      .map(normalizeGscRow)
      .filter(Boolean)
      .map((row) => ({ ...row, batchId }));

    state.gscRows = [...rows, ...state.gscRows].slice(0, 5000);
    state.gscImports = [
      {
        id: batchId,
        fileName,
        count: rows.length,
        date: new Date().toISOString(),
        time: new Date().toLocaleString(),
      },
      ...state.gscImports,
    ].slice(0, 30);

    document.querySelector("#gscFile").value = "";
    document.querySelector("#gscText").value = "";
    persistState();
    renderAll();
    gscImportLog.textContent = `Imported ${rows.length} GSC rows from ${fileName}.`;
  } catch (error) {
    gscImportLog.textContent = `GSC import failed: ${error.message}`;
  }
}

function dedupeOpportunities(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.keyword.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function markdownBundle(item) {
  const score = opportunityScore(item);
  const game = state.brief.game || titleCase(item.keyword.split(" ").slice(0, 3).join(" "));
  const articleType = normalizeArticleType(state.brief.articleType || item.intent);
  const slug = slugify(`${game} ${articleType}`);

  const traffic = `# Traffic_Report.md

## Keyword
${item.keyword}

## Search Intent
${item.intent}

## Opportunity Score
${score}

## Inputs
| Metric | Value |
| --- | --- |
| Growth Rate | +${item.growth}% |
| Traffic Score | ${item.traffic}/10 |
| Competition Score | ${item.competition}/10 |
| Monetization Score | ${item.monetization}/10 |
| AI Production Score | ${item.production}/10 |
| Source | ${item.source || "manual"} |

## Decision
Priority: ${statusFor(score)}

## Monitoring
Track Google ranking, impressions, CTR, sessions, bounce rate, and average time daily.`;

  const brief = `# Article_Brief.md

---
title: ${game} ${articleType}: Best Choices, Steps, and Common Mistakes
slug: ${slug}
game: ${game}
category: ${articleType}
primary_keyword: ${item.keyword}
publish_date: ${new Date().toISOString().slice(0, 10)}
---

# ${game} ${articleType}

## Quick Answer
Answer the exact player decision behind "${item.keyword}" in the first 80 words.

## Table of Contents
- Overview
- Step-by-Step Guide
- Best Options
- Common Mistakes
- FAQ
- Final Recommendation

## Required Assets
- cover.webp
- gameplay.webp
- comparison table

## Production Notes
Write in English, stay practical, avoid filler, and optimize for search intent.`;

  const seo = `# SEO_Plan.md

## Meta Title
${game} ${articleType}: ${titleCase(item.keyword)}

## Meta Description
Fast, practical guide for ${item.keyword}. Learn the best options, common mistakes, and final recommendation before you spend time in-game.

## Slug
${slug}

## Tags
${[item.intent, item.source || "manual", statusFor(score), ...item.tags].join(", ")}

## Internal Links
- /content/${slugify(game)}-beginner-guide/
- /content/${slugify(game)}-best-settings/
- /content/${slugify(game)}-worth-it/

## Schema Markup
Article schema, Breadcrumb schema, FAQ schema.

## FAQ Schema Questions
- What is the best option for ${item.keyword}?
- Is ${game} beginner friendly?
- What mistakes should new players avoid?`;

  return { traffic, brief, seo, astro: astroArticleMarkdown(item) };
}

function titleCase(value) {
  return String(value).replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

function yamlString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function yamlList(values) {
  return `[${values.map((value) => yamlString(value)).join(", ")}]`;
}

function articleGame(item) {
  return state.brief.game || titleCase(item.keyword.split(" ").slice(0, 3).join(" "));
}

function articleCategory(item) {
  return normalizeArticleType(state.brief.articleType || item.intent);
}

function metaDescription(item, game, category) {
  return `A practical ${category.toLowerCase()} for ${item.keyword}, with quick answers, best options, common mistakes, FAQ, and publishing-ready recommendations.`;
}

function buildFaq(item, game) {
  return [
    {
      question: `What is the fastest answer for ${item.keyword}?`,
      answer: `Start with the option that solves the player's immediate blocker, then adjust after one or two in-game tests.`,
    },
    {
      question: `Is ${game} beginner friendly?`,
      answer: `${game} is easier to approach when players follow a focused route instead of trying every system at once.`,
    },
    {
      question: `What should new players avoid first?`,
      answer: `Avoid spending resources before you understand the core loop, the strongest early choices, and the common traps.`,
    },
    {
      question: `How often should this guide be updated?`,
      answer: `Review it after major patches, balance changes, new seasons, or a visible jump in search demand.`,
    },
    {
      question: `What is the best next guide to read?`,
      answer: `Move to settings, beginner routes, build choices, achievement cleanup, or a worth-it review depending on the player's next decision.`,
    },
  ];
}

function internalLinks(game) {
  const base = slugify(game);
  return [
    `/content/${base}/beginner-guide/`,
    `/content/${base}/best-settings/`,
    `/content/${base}/achievement-guide/`,
    `/content/${base}/worth-it/`,
    `/content/${base}/faq/`,
  ];
}

function sectionForCategory(category, item, game) {
  if (category === "Best Settings") {
    return `Focus on stable performance first, then tune visuals. Use the table below as a first-pass setup and adjust after one session.\n\n| Setting Area | Recommended Starting Point | Why It Matters |\n| --- | --- | --- |\n| Display | Native resolution, fullscreen | Reduces avoidable input and scaling issues |\n| Graphics | Medium baseline | Keeps performance stable while preserving readability |\n| Controls | Lower sensitivity, clear bindings | Makes repeated actions easier to learn |\n| Accessibility | Enable readable UI options | Prevents missed prompts and combat information |`;
  }
  if (category === "Worth It") {
    return `The game is worth considering if the player's main goal matches the current content loop. If the keyword is driven by a sale, patch, or streamer spike, answer the buying question quickly and separate short-term hype from durable value.`;
  }
  if (category === "Comparison") {
    return `Compare the player decision directly. Do not compare every feature; compare the parts that change the outcome for someone searching "${item.keyword}".\n\n| Option | Best For | Weakness |\n| --- | --- | --- |\n| Safer choice | First-time players | Lower ceiling |\n| High ceiling choice | Experienced players | More mistakes early |\n| Flexible choice | Unsure players | Needs more testing |`;
  }
  if (category === "FAQ") {
    return `Answer the most repeated questions first. Keep each answer short enough for search snippets, then point readers to the section that solves the larger decision.`;
  }
  if (category === "Achievement Guide") {
    return `Prioritize achievements by unlock difficulty and time cost. Players should clear simple unlocks while learning the core loop, then return for skill-gated or grind-heavy achievements later.`;
  }
  return `Start with the safest path through ${game}. A beginner should understand what to do first, what to ignore, and when to change plans. The goal is not perfect play; the goal is avoiding early wasted time.`;
}

function astroArticleMarkdown(item, packageItems = state.opportunities) {
  const packageMeta = articlePackageMeta(item, packageItems);
  const game = packageMeta.game;
  const category = articleCategory(item);
  const title = `${game} ${category}: ${titleCase(item.keyword)}`;
  const description = metaDescription(item, game, category);
  const slug = packageMeta.articleSlug;
  const tags = [category, item.intent, item.source || "manual", statusFor(opportunityScore(item)), ...item.tags];
  const faqs = buildFaq(item, game);
  const links = internalLinks(game);

  return `---
title: ${yamlString(title)}
description: ${yamlString(description)}
slug: ${yamlString(slug)}
game: ${yamlString(game)}
category: ${yamlString(category)}
keyword: ${yamlString(item.keyword)}
intent: ${yamlString(item.intent)}
publishDate: ${yamlString(new Date().toISOString().slice(0, 10))}
tags: ${yamlList([...new Set(tags)])}
contentStatus: ${yamlString(normalizeContentStatus(item.contentStatus))}
publishedUrl: ${yamlString(item.publishedUrl || "")}
lastUpdatedDate: ${yamlString(item.lastUpdatedDate || "")}
---

# ${title}

![Cover image](./images/cover.webp)

## Quick Answer

For "${item.keyword}", the best first move is to solve the player's immediate decision before adding advanced detail. Use the recommendation below as the starting point, then adjust based on patch notes, community discoveries, and your own testing.

## Overview

This ${category.toLowerCase()} is built for players who want a direct answer without sorting through scattered forum threads. The keyword is currently rated ${opportunityScore(item)} by the traffic system, with +${item.growth}% growth, ${item.traffic}/10 traffic potential, and ${item.competition}/10 competition.

![Gameplay screenshot](./images/gameplay.webp)

## Step-by-Step Guide

1. Confirm what the player is trying to decide when searching for "${item.keyword}".
2. Start with the safest recommendation and explain when it changes.
3. Add one table or checklist that helps the reader act immediately.
4. Mention the common mistake that wastes the most time.
5. Close with a final recommendation and link to the next useful guide.

${sectionForCategory(category, item, game)}

## Best Options

| Option | When To Use It | Why It Works |
| --- | --- | --- |
| Safe pick | First run or early testing | Low risk and easy to correct |
| Aggressive pick | Confident players | Faster progress when executed well |
| Flexible pick | Unknown patch or meta | Gives room to adapt without restarting |

## Common Mistakes

- Following old advice after a major patch or balance update.
- Treating a high-skill option as the best option for every player.
- Ignoring settings, economy, or progression requirements that make the recommendation work.
- Spending too much time optimizing before the core loop is understood.
- Reading comparison content without checking whether it matches the current game version.

## FAQ

${faqs.map((faq) => `### ${faq.question}\n\n${faq.answer}`).join("\n\n")}

## Internal Link Suggestions

${links.map((link) => `- ${link}`).join("\n")}

## Final Recommendation

Use the safest recommendation first, then move to the higher-ceiling option once the player understands the tradeoffs. This article should be updated whenever ${game} gets a major patch, a new season, or a visible increase in search traffic for "${item.keyword}".`;
}

function openExportDialog(item) {
  currentExportItemId = item.id;
  currentExportBundle = markdownBundle(item);
  exportText.value = [
    currentExportBundle.traffic,
    "\n\n---\n\n",
    currentExportBundle.brief,
    "\n\n---\n\n",
    currentExportBundle.seo,
    "\n\n---\n\n",
    currentExportBundle.astro,
  ].join("");
  exportDialog.showModal();
}

function openAstroDialog(item) {
  currentExportItemId = item.id;
  currentExportBundle = markdownBundle(item);
  exportText.value = currentExportBundle.astro;
  exportDialog.showModal();
}

function downloadFile(fileName, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadMarkdown(fileName, content) {
  downloadFile(fileName, content, "text/markdown;charset=utf-8");
}

function downloadAllMarkdown(item) {
  const bundle = markdownBundle(item);
  const prefix = slugify(item.keyword);
  downloadMarkdown(`${prefix}_Traffic_Report.md`, bundle.traffic);
  window.setTimeout(() => downloadMarkdown(`${prefix}_Article_Brief.md`, bundle.brief), 150);
  window.setTimeout(() => downloadMarkdown(`${prefix}_SEO_Plan.md`, bundle.seo), 300);
}

function downloadAstroArticle(item) {
  const meta = articlePackageMeta(item);
  downloadMarkdown(`${meta.gameSlug}__${meta.articleSlug}__index.md`, astroArticleMarkdown(item));
}

function downloadArticleBatch(items) {
  items.forEach((item, index) => {
    window.setTimeout(() => downloadAstroArticle(item), index * 180);
  });
}

function packageManifest(items) {
  return {
    packageVersion: "mvp-v1.4",
    generatedAt: new Date().toISOString(),
    astroTargetRoot: "src/content",
    fallbackExportLayout: ["manifest.json", "articles/", "images-placeholder/", "README_IMPORT.md"],
    articles: sortedOpportunitiesFrom(items).map((item) => {
      const meta = articlePackageMeta(item, items);
      const perf = performanceForItem(item);
      return {
        id: item.id,
        keyword: item.keyword,
        status: normalizeContentStatus(item.contentStatus),
        statusTimestamps: item.statusTimestamps || {},
        qualityScore: qualityAssessment(item).score,
        duplicateWarnings: duplicateWarnings(item),
        publishedUrl: item.publishedUrl || "",
        publishDate: item.publishDate || "",
        lastUpdatedDate: item.lastUpdatedDate || "",
        performanceStatus: perf.status,
        updateRecommendation: perf.recommendation,
        traffic: {
          clicks: perf.clicks,
          impressions: perf.impressions,
          ctr: perf.ctr,
          averagePosition: perf.averagePosition,
          topQueries: perf.topQueries,
        },
        score: opportunityScore(item),
        game: meta.game,
        gameSlug: meta.gameSlug,
        articleSlug: meta.articleSlug,
        targetDirectory: meta.contentDir,
        articlePath: meta.articlePath,
        imagesDirectory: meta.imageDir,
        requiredImages: [
          { name: "cover.webp", targetPath: meta.coverPath },
          { name: "gameplay.webp", targetPath: meta.gameplayPath },
        ],
      };
    }),
  };
}

function readmeImportMarkdown(items) {
  const manifest = packageManifest(items);
  const articleLines = manifest.articles
    .map((article) => `- ${article.articlePath} (${article.status}, score ${article.score})`)
    .join("\n");

  return `# README_IMPORT.md

## Astro Import Target

Copy each generated article into your Astro content directory under:

\`\`\`text
src/content/
\`\`\`

The manifest target paths use this structure:

\`\`\`text
content/
  game-name/
    article-slug/
      index.md
      images/
        cover.webp
        gameplay.webp
\`\`\`

If your Astro project stores content directly under \`content/\`, copy paths exactly as shown in \`manifest.json\`. If it stores content under \`src/content/\`, place the same folders inside \`src/content/\`.

## Articles In This Package

${articleLines || "- No articles exported."}

## Images

Each article expects:

- \`./images/cover.webp\`
- \`./images/gameplay.webp\`

The browser export includes image placeholder notes only. Add real screenshots or generated images before publishing.

## Frontmatter Fields

- \`title\`: English article title.
- \`description\`: Meta description for SEO snippets.
- \`slug\`: unique, lowercase, safe URL slug.
- \`game\`: game or topic cluster name.
- \`category\`: article type.
- \`keyword\`: primary SEO keyword.
- \`intent\`: source search intent.
- \`publishDate\`: planned publication date.
- \`tags\`: Astro-ready tag array.
- \`contentStatus\`: Draft, Ready, Published, Monitoring, Updating, or Dead.

## Recommended Publishing Flow

1. Copy every article into its target directory from \`manifest.json\`.
2. Add \`cover.webp\` and \`gameplay.webp\` in each article's \`images/\` folder.
3. Run your Astro build locally.
4. Review frontmatter and internal links.
5. Mark ready articles as \`Ready\`, publish, change status to \`Published\`, then move winners into \`Monitoring\` in the command center.`;
}

function imagePlaceholderMarkdown(items) {
  const manifest = packageManifest(items);
  return `# images-placeholder

Create these files before publishing:

${manifest.articles
  .flatMap((article) => article.requiredImages.map((image) => `- ${image.targetPath}`))
  .join("\n")}
`;
}

function downloadAstroPackage(items, label = "astro-content-package") {
  const exportItems = sortedOpportunitiesFrom(items);
  const manifest = packageManifest(exportItems);
  const prefix = slugify(label);

  downloadFile(`${prefix}_manifest.json`, JSON.stringify(manifest, null, 2), "application/json;charset=utf-8");
  window.setTimeout(() => downloadMarkdown(`${prefix}_README_IMPORT.md`, readmeImportMarkdown(exportItems)), 160);
  window.setTimeout(() => downloadMarkdown(`${prefix}_images-placeholder.md`, imagePlaceholderMarkdown(exportItems)), 320);
  exportItems.forEach((item, index) => {
    const meta = articlePackageMeta(item, exportItems);
    const fileName = `${prefix}_articles_${meta.gameSlug}__${meta.articleSlug}__index.md`;
    window.setTimeout(() => downloadMarkdown(fileName, astroArticleMarkdown(item, exportItems)), 480 + index * 180);
  });
}

function performanceReportMarkdown(items = state.opportunities) {
  const rows = sortedOpportunitiesFrom(items).map((item) => ({ item, perf: performanceForItem(item) }));
  return `# Performance_Report.md

Generated: ${new Date().toLocaleString()}

| Keyword | Status | Clicks | Impressions | CTR | Position | Recommendation |
| --- | --- | ---: | ---: | ---: | ---: | --- |
${rows
  .map(
    ({ item, perf }) =>
      `| ${item.keyword} | ${perf.status} | ${perf.clicks} | ${perf.impressions} | ${(perf.ctr * 100).toFixed(1)}% | ${
        perf.averagePosition ? perf.averagePosition.toFixed(1) : "-"
      } | ${perf.recommendation} |`,
  )
  .join("\n")}

## Top Queries

${rows
  .map(({ item, perf }) => `### ${item.keyword}\n\n${perf.topQueries.map((query) => `- ${query}`).join("\n") || "- No matched queries."}`)
  .join("\n\n")}`;
}

function winnersMarkdown() {
  const winners = sortedOpportunities().filter((item) => performanceForItem(item).status === "Winner");
  return `# Winners.md

${winners
  .map((item) => {
    const perf = performanceForItem(item);
    return `## ${item.keyword}

- Clicks: ${perf.clicks}
- Impressions: ${perf.impressions}
- CTR: ${(perf.ctr * 100).toFixed(1)}%
- Average Position: ${perf.averagePosition ? perf.averagePosition.toFixed(1) : "-"}
- Next Action: ${perf.recommendation}`;
  })
  .join("\n\n") || "No winners yet."}`;
}

function deadPagesMarkdown() {
  const dead = sortedOpportunities().filter((item) => performanceForItem(item).status === "Dead");
  return `# Dead_Pages.md

${dead
  .map((item) => {
    const perf = performanceForItem(item);
    return `## ${item.keyword}

- Clicks: ${perf.clicks}
- Impressions: ${perf.impressions}
- Recommendation: ${perf.recommendation}`;
  })
  .join("\n\n") || "No dead pages detected."}`;
}

function demoKeyword(keyword, intent, growth, traffic, competition, status, urlSuffix) {
  const id = `demo-${slugify(keyword)}`;
  return {
    id,
    keyword,
    intent,
    growth,
    traffic,
    competition,
    monetization: intent === "Worth It" ? 9 : 7,
    production: intent === "FAQ" || intent === "Best Settings" ? 9 : 8,
    source: "demo",
    contentStatus: status,
    statusTimestamps: { [status]: nowStamp() },
    publishedUrl: ["Published", "Monitoring", "Updating"].includes(status)
      ? `https://example.com/content/arc-raiders/${urlSuffix}/`
      : "",
    publishDate: ["Published", "Monitoring", "Updating"].includes(status) ? todayIso() : "",
    lastUpdatedDate: status === "Updating" ? todayIso() : "",
    tags: growth > 70 ? ["googleUp", "redditBurst"] : ["googleUp", "majorUpdate"],
  };
}

function demoDataset() {
  const opportunities = [
    demoKeyword("arc raiders best class", "Beginner Guide", 92, 9, 3, "Monitoring", "beginner-guide-arc-raiders-best-class"),
    demoKeyword("dune awakening best base location", "Beginner Guide", 88, 9, 4, "Published", "beginner-guide-dune-awakening-best-base-location"),
    demoKeyword("marathon extraction beginner guide", "Beginner Guide", 86, 8, 4, "Published", "beginner-guide-marathon-extraction-beginner-guide"),
    demoKeyword("where winds meet beginner guide", "Beginner Guide", 81, 8, 4, "Published", "beginner-guide-where-winds-meet-beginner-guide"),
    demoKeyword("subnautica 2 co-op settings", "Best Settings", 74, 7, 5, "Published", "best-settings-subnautica-2-co-op-settings"),
    demoKeyword("elden ring nightreign best relics", "Best Settings", 68, 7, 5, "Draft", "best-settings-elden-ring-nightreign-best-relics"),
    demoKeyword("hades 2 true ending guide", "FAQ", 58, 6, 5, "Draft", "faq-hades-2-true-ending-guide"),
    demoKeyword("manor lords best settings", "Best Settings", 44, 6, 5, "Draft", "best-settings-manor-lords-best-settings"),
    demoKeyword("palworld is it worth it 2026", "Worth It", 36, 6, 7, "Draft", "worth-it-palworld-is-it-worth-it-2026"),
    demoKeyword("helldivers 2 best loadout update", "Comparison", 67, 7, 6, "Updating", "comparison-helldivers-2-best-loadout-update"),
  ];
  const batchOld = "demo-gsc-old";
  const batchNew = "demo-gsc-new";
  const gscRows = [
    ["arc raiders best class", opportunities[0].publishedUrl, 80, 1600, 0.05, 4.8, batchNew],
    ["best class arc raiders", opportunities[0].publishedUrl, 24, 510, 0.047, 6.2, batchNew],
    ["dune awakening base", opportunities[1].publishedUrl, 63, 1200, 0.052, 5.7, batchNew],
    ["marathon extraction guide", opportunities[2].publishedUrl, 55, 980, 0.056, 7.1, batchNew],
    ["where winds meet beginner guide", opportunities[3].publishedUrl, 0, 260, 0, 18.4, batchNew],
    ["subnautica 2 co op settings", opportunities[4].publishedUrl, 0, 190, 0, 21.2, batchNew],
    ["helldivers 2 loadout update", opportunities[9].publishedUrl, 8, 300, 0.026, 12.1, batchOld],
    ["helldivers 2 loadout update", opportunities[9].publishedUrl, 18, 720, 0.025, 10.4, batchNew],
    ["elden ring nightreign relics", "https://example.com/content/arc-raiders/best-settings-elden-ring-nightreign-best-relics/", 4, 180, 0.022, 15.8, batchOld],
    ["elden ring nightreign relics", "https://example.com/content/arc-raiders/best-settings-elden-ring-nightreign-best-relics/", 9, 410, 0.022, 13.2, batchNew],
  ].map(([query, page, clicks, impressions, ctr, position, batchId], index) => ({
    id: `demo-gsc-${index}`,
    query,
    page,
    clicks,
    impressions,
    ctr,
    position,
    importedAt: new Date().toISOString(),
    batchId,
  }));

  return {
    ...structuredClone(defaultState),
    opportunities,
    sources: [
      { name: "Steam", signal: "Demo hot games", value: 10, accent: "#1d8f6f" },
      { name: "Reddit", signal: "Demo discussion heat", value: 84, accent: "#c94d3c" },
      { name: "YouTube", signal: "Demo tutorial demand", value: 76, accent: "#246bba" },
      { name: "Google", signal: "Demo query growth", value: "+31%", accent: "#c6862d" },
    ],
    brief: { game: "Arc Raiders", articleType: "Beginner Guide" },
    gscRows,
    gscImports: [
      { id: batchNew, fileName: "demo-gsc-new.csv", count: 8, date: new Date().toISOString(), time: nowStamp() },
      { id: batchOld, fileName: "demo-gsc-old.csv", count: 2, date: new Date(Date.now() - 86400000).toISOString(), time: nowStamp() },
    ],
    imports: [{ source: "demo", fileName: "demo-dataset", count: opportunities.length, time: nowStamp() }],
  };
}

function gscSampleCsv() {
  return `Query,Page,Clicks,Impressions,CTR,Position
arc raiders best class,https://example.com/content/arc-raiders/beginner-guide-arc-raiders-best-class/,66,1400,4.7%,5.2
where winds meet beginner guide,https://example.com/content/arc-raiders/beginner-guide-where-winds-meet-beginner-guide/,0,220,0%,18.4
helldivers 2 loadout update,https://example.com/content/arc-raiders/comparison-helldivers-2-best-loadout-update/,18,720,2.5%,10.4`;
}

function backupPayload() {
  const manifests = packageManifest(state.opportunities);
  return {
    backupVersion: "mvp-v1.6",
    exportedAt: new Date().toISOString(),
    keywords: state.opportunities,
    articles: state.opportunities.map((item) => ({
      id: item.id,
      keyword: item.keyword,
      article: astroArticleMarkdown(item),
      quality: qualityAssessment(item),
      performance: performanceForItem(item),
    })),
    statuses: state.opportunities.map((item) => ({
      id: item.id,
      keyword: item.keyword,
      contentStatus: item.contentStatus,
      statusTimestamps: item.statusTimestamps,
      publishedUrl: item.publishedUrl,
      publishDate: item.publishDate,
      lastUpdatedDate: item.lastUpdatedDate,
    })),
    qualityScores: state.opportunities.map((item) => ({ id: item.id, keyword: item.keyword, score: qualityAssessment(item).score })),
    packageManifests: manifests,
    performanceData: {
      gscRows: state.gscRows,
      gscImports: state.gscImports,
      report: performanceReportMarkdown(),
    },
    rawState: state,
  };
}

function restoreBackup(data) {
  const restored = data.rawState || data;
  if (!restored || !Array.isArray(restored.opportunities)) {
    throw new Error("Backup JSON does not contain opportunities.");
  }
  state = {
    ...structuredClone(defaultState),
    ...restored,
    opportunities: normalizeStoredOpportunities(restored.opportunities),
    gscRows: Array.isArray(restored.gscRows) ? restored.gscRows : restored.performanceData?.gscRows || [],
    gscImports: Array.isArray(restored.gscImports) ? restored.gscImports : restored.performanceData?.gscImports || [],
    imports: restored.imports || [],
  };
  persistState();
  renderAll();
}

function systemHealthMarkdown() {
  const checks = [];
  const add = (name, passed, detail) => checks.push({ name, passed, detail });
  let storageOk = false;
  try {
    localStorage.setItem("__gtcc_health", "ok");
    storageOk = localStorage.getItem("__gtcc_health") === "ok";
    localStorage.removeItem("__gtcc_health");
  } catch (error) {
    storageOk = false;
  }

  const manifest = packageManifest(state.opportunities);
  const slugs = state.opportunities.map((item) => baseArticleSlug(item));
  const duplicateSlugs = [...new Set(slugs.filter((slug, index) => slugs.indexOf(slug) !== index))];
  const missingUrls = state.opportunities.filter((item) => ["Published", "Monitoring", "Updating"].includes(item.contentStatus) && !item.publishedUrl);
  const matchedPerformance = state.opportunities.filter((item) => performanceForItem(item).rows.length > 0);
  const structureOk = Array.isArray(state.opportunities) && Array.isArray(state.gscRows) && state.brief && state.monitor;

  add("localStorage available", storageOk, storageOk ? "Read/write succeeded." : "Browser storage unavailable.");
  add("Data structure complete", structureOk, `Keywords: ${state.opportunities.length}, GSC rows: ${state.gscRows.length}.`);
  add("No duplicate slugs", duplicateSlugs.length === 0, duplicateSlugs.length ? duplicateSlugs.join(", ") : "All package slugs are unique.");
  add("Published URLs present", missingUrls.length === 0, missingUrls.length ? missingUrls.map((item) => item.keyword).join(", ") : "No published article is missing a URL.");
  add("Performance matched", matchedPerformance.length > 0, `${matchedPerformance.length} articles have matched Search Console rows.`);
  add("Package manifest generated", Boolean(manifest.articles), `${manifest.articles.length} manifest article entries generated.`);

  return `# System_Health_Report.md

Generated: ${new Date().toLocaleString()}

| Check | Result | Detail |
| --- | --- | --- |
${checks.map((check) => `| ${check.name} | ${check.passed ? "PASS" : "FAIL"} | ${check.detail} |`).join("\n")}

## Duplicate Slug Details

${duplicateSlugs.length ? duplicateSlugs.map((slug) => `- ${slug}`).join("\n") : "- None"}

## Missing Published URLs

${missingUrls.length ? missingUrls.map((item) => `- ${item.keyword}`).join("\n") : "- None"}

## Performance Matches

${matchedPerformance.map((item) => `- ${item.keyword}: ${performanceForItem(item).status}`).join("\n") || "- None"}`;
}

function applyStatus(item, nextStatus) {
  const normalizedStatus = normalizeContentStatus(nextStatus);
  const quality = qualityAssessment(item);
  if (normalizedStatus === "Ready" && !quality.passed) {
    window.alert(`Cannot mark Ready. Quality score is ${quality.score}/100 and all editorial checks must pass.`);
    return false;
  }

  item.contentStatus = normalizedStatus;
  item.statusTimestamps = {
    ...(item.statusTimestamps || {}),
    [normalizedStatus]: nowStamp(),
  };

  if (normalizedStatus === "Published" && !item.publishDate) item.publishDate = todayIso();
  if (normalizedStatus === "Updating") item.lastUpdatedDate = todayIso();
  return true;
}

function renderEditorialDialog(item) {
  currentEditorialItemId = item.id;
  const quality = qualityAssessment(item);
  const warnings = duplicateWarnings(item);
  const parts = quality.parts;

  document.querySelector("#publishedUrlInput").value = item.publishedUrl || "";
  document.querySelector("#publishDateInput").value = item.publishDate || "";
  document.querySelector("#lastUpdatedDateInput").value = item.lastUpdatedDate || "";

  editorialSummary.innerHTML = `
    <strong>${escapeHtml(articleTitle(item))}</strong>
    <p>Quality score: <span class="quality-pill" style="background:${qualityColor(quality.score)}">${quality.score}</span></p>
    <p>Pipeline: Draft -> Ready -> Published -> Monitoring -> Updating / Dead</p>
    <p>Current status: ${escapeHtml(normalizeContentStatus(item.contentStatus))} (${escapeHtml(timestampFor(item))})</p>
    <p>Duplicate check: ${warnings.length ? escapeHtml(warnings.join(", ")) : "Clear"}</p>
    <p>Performance: ${performanceForItem(item).status} · ${performanceForItem(item).recommendation}</p>
    <ul class="quality-breakdown">
      <li><span>Search Intent Match</span><strong>${parts.searchIntentMatch}/18</strong></li>
      <li><span>Title Quality</span><strong>${parts.titleQuality}/15</strong></li>
      <li><span>FAQ Quality</span><strong>${parts.faqQuality}/20</strong></li>
      <li><span>Internal Links</span><strong>${parts.internalLinks}/15</strong></li>
      <li><span>Image Completeness</span><strong>${parts.imageCompleteness}/15</strong></li>
      <li><span>Readability</span><strong>${parts.readability}/17</strong></li>
    </ul>
  `;

  checklistOutput.innerHTML = `
    <strong>Editorial Checklist</strong>
    <ul class="checklist-list">
      ${quality.checklist
        .map((check) => `<li><span>${escapeHtml(check.label)}</span><strong>${check.passed ? "Pass" : "Fail"}</strong></li>`)
        .join("")}
    </ul>
  `;

  editorialDialog.showModal();
}

function recordMonitorView(view) {
  state.monitor.records = [
    {
      view,
      opportunities: state.opportunities.length,
      time: new Date().toLocaleString(),
    },
    ...state.monitor.records,
  ].slice(0, 100);
}

function renderAll() {
  renderStages();
  renderSources();
  renderKeywords();
  renderBrief();
  renderImportLog();
  renderGscImportLog();
  renderChart(state.monitor.view);
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.monitor.view);
  });
}

keywordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const keyword = document.querySelector("#keywordInput").value.trim();
  const intent = document.querySelector("#intentInput").value;
  const growth = document.querySelector("#growthInput").value;
  if (!keyword) return;

  state.opportunities = dedupeOpportunities([
    buildOpportunityFromInput(keyword, intent, growth, "manual"),
    ...state.opportunities,
  ]);

  keywordForm.reset();
  document.querySelector("#growthInput").value = 45;
  persistState();
  renderKeywords();
  renderBrief();
});

keywordTable.addEventListener("click", (event) => {
  const exportButton = event.target.closest("[data-export-id]");
  const downloadButton = event.target.closest("[data-download-all]");
  const generateAstroButton = event.target.closest("[data-generate-astro]");
  const downloadAstroButton = event.target.closest("[data-download-astro]");
  const packageAstroButton = event.target.closest("[data-package-astro]");
  const reviewButton = event.target.closest("[data-review-id]");
  if (!exportButton && !downloadButton && !generateAstroButton && !downloadAstroButton && !packageAstroButton && !reviewButton) return;

  const targetButton = exportButton || downloadButton || generateAstroButton || downloadAstroButton || packageAstroButton || reviewButton;
  const id =
    targetButton.dataset.exportId ||
    targetButton.dataset.downloadAll ||
    targetButton.dataset.generateAstro ||
    targetButton.dataset.downloadAstro ||
    targetButton.dataset.packageAstro ||
    targetButton.dataset.reviewId;
  const item = state.opportunities.find((opportunity) => opportunity.id === id);
  if (!item) return;

  if (exportButton) openExportDialog(item);
  if (downloadButton) downloadAllMarkdown(item);
  if (generateAstroButton) openAstroDialog(item);
  if (downloadAstroButton) downloadAstroArticle(item);
  if (packageAstroButton) downloadAstroPackage([item], item.keyword);
  if (reviewButton) renderEditorialDialog(item);
});

keywordTable.addEventListener("change", (event) => {
  const statusSelect = event.target.closest("[data-status-id]");
  if (!statusSelect) return;
  const item = state.opportunities.find((opportunity) => opportunity.id === statusSelect.dataset.statusId);
  if (!item) return;
  const previousStatus = normalizeContentStatus(item.contentStatus);
  if (!applyStatus(item, statusSelect.value)) {
    statusSelect.value = previousStatus;
    return;
  }
  persistState();
  renderKeywords();
});

document.querySelector("#addKeywordBtn").addEventListener("click", () => {
  document.querySelector("#keywordInput").focus();
});

document.querySelector("#generateBriefBtn").addEventListener("click", () => {
  state.brief.game = document.querySelector("#gameInput").value.trim() || "Untitled Game";
  state.brief.articleType = normalizeArticleType(document.querySelector("#articleType").value);
  persistState();
  renderBrief();
});

document.querySelector("#saveEditorialBtn").addEventListener("click", () => {
  const item = state.opportunities.find((opportunity) => opportunity.id === currentEditorialItemId);
  if (!item) return;
  item.publishedUrl = document.querySelector("#publishedUrlInput").value.trim();
  item.publishDate = document.querySelector("#publishDateInput").value;
  item.lastUpdatedDate = document.querySelector("#lastUpdatedDateInput").value;
  persistState();
  renderKeywords();
  renderEditorialDialog(item);
});

document.querySelector("#articleType").addEventListener("change", () => {
  state.brief.articleType = normalizeArticleType(document.querySelector("#articleType").value);
  persistState();
  renderBrief();
});

document.querySelector("#gameInput").addEventListener("change", () => {
  state.brief.game = document.querySelector("#gameInput").value.trim() || "Untitled Game";
  persistState();
  renderBrief();
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const top = sortedOpportunities()[0];
  if (top) openExportDialog(top);
});

document.querySelector("#loadDemoBtn").addEventListener("click", () => {
  state.sources = state.sources.map((source) => {
    if (source.name === "Steam") return { ...source, value: Math.floor(12 + Math.random() * 22) };
    if (source.name === "Reddit") return { ...source, value: Math.floor(70 + Math.random() * 25) };
    if (source.name === "Google") return { ...source, value: `+${Math.floor(18 + Math.random() * 45)}%` };
    return source;
  });
  persistState();
  renderSources();
});

document.querySelector("#exportTopArticlesBtn").addEventListener("click", () => {
  downloadAstroPackage(sortedOpportunities().slice(0, 10), "top-10-astro-content-package");
});

document.querySelector("#exportWinningArticlesBtn").addEventListener("click", () => {
  downloadAstroPackage(
    sortedOpportunities().filter((item) => opportunityScore(item) >= 8),
    "winning-astro-content-package",
  );
});

document.querySelector("#clearDataBtn").addEventListener("click", () => {
  if (!window.confirm("Clear all saved keywords, imports, briefs, and monitoring records?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = {
    ...structuredClone(defaultState),
    opportunities: [],
    imports: [],
    gscImports: [],
    gscRows: [],
    monitor: { view: "winning", records: [] },
  };
  persistState();
  renderAll();
});

document.querySelector("#importBtn").addEventListener("click", importData);
document.querySelector("#gscImportBtn").addEventListener("click", importGscData);

document.querySelector("#loadDemoDatasetBtn").addEventListener("click", () => {
  state = demoDataset();
  persistState();
  renderAll();
});

document.querySelector("#downloadGscSampleBtn").addEventListener("click", () => {
  downloadFile("gsc_sample.csv", gscSampleCsv(), "text/csv;charset=utf-8");
});

document.querySelector("#exportBackupBtn").addEventListener("click", () => {
  downloadFile("Game_Traffic_Backup.json", JSON.stringify(backupPayload(), null, 2), "application/json;charset=utf-8");
});

document.querySelector("#backupFile").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    restoreBackup(JSON.parse(await file.text()));
    event.target.value = "";
  } catch (error) {
    window.alert(`Backup restore failed: ${error.message}`);
  }
});

document.querySelector("#healthCheckBtn").addEventListener("click", () => {
  downloadMarkdown("System_Health_Report.md", systemHealthMarkdown());
});

document.querySelector("#exportPerformanceBtn").addEventListener("click", () => {
  downloadMarkdown("Performance_Report.md", performanceReportMarkdown());
});

document.querySelector("#exportWinnersBtn").addEventListener("click", () => {
  downloadMarkdown("Winners.md", winnersMarkdown());
});

document.querySelector("#exportDeadPagesBtn").addEventListener("click", () => {
  downloadMarkdown("Dead_Pages.md", deadPagesMarkdown());
});

document.querySelectorAll("[data-filter]").forEach((input) => {
  input.addEventListener("change", renderBattlefield);
});

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    recordMonitorView(button.dataset.view);
    renderChart(button.dataset.view);
    persistState();
  });
});

document.querySelectorAll("[data-download]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!currentExportBundle || !currentExportItemId) return;
    const item = state.opportunities.find((opportunity) => opportunity.id === currentExportItemId);
    const prefix = slugify(item ? item.keyword : "traffic-plan");
    const type = button.dataset.download;
    const fileName =
      type === "traffic"
        ? `${prefix}_Traffic_Report.md`
        : type === "brief"
          ? `${prefix}_Article_Brief.md`
          : type === "seo"
            ? `${prefix}_SEO_Plan.md`
            : `${prefix}.md`;
    downloadMarkdown(fileName, currentExportBundle[type]);
  });
});

document.querySelector("[data-download-package]").addEventListener("click", () => {
  if (!currentExportItemId) return;
  const item = state.opportunities.find((opportunity) => opportunity.id === currentExportItemId);
  if (!item) return;
  downloadAstroPackage([item], item.keyword);
});

window.__gtcc = {
  importGscCsv(text, fileName = "debug-gsc.csv") {
    const batchId = uid("gsc-batch");
    const rows = parseCsv(text)
      .map(normalizeGscRow)
      .filter(Boolean)
      .map((row) => ({ ...row, batchId }));
    state.gscRows = [...rows, ...state.gscRows].slice(0, 5000);
    state.gscImports = [
      {
        id: batchId,
        fileName,
        count: rows.length,
        date: new Date().toISOString(),
        time: new Date().toLocaleString(),
      },
      ...state.gscImports,
    ].slice(0, 30);
    persistState();
    renderAll();
    return rows.length;
  },
  performanceReportMarkdown,
  winnersMarkdown,
  deadPagesMarkdown,
  demoDataset,
  loadDemoDataset() {
    state = demoDataset();
    persistState();
    renderAll();
    return state.opportunities.length;
  },
  gscSampleCsv,
  backupPayload,
  restoreBackup,
  systemHealthMarkdown,
  performanceForKeyword(keyword) {
    const item = state.opportunities.find((opportunity) => opportunity.keyword === keyword);
    return item ? performanceForItem(item) : null;
  },
};

renderAll();
