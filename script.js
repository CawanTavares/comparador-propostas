const state = {
  selectedCandidate: null,
  priorities: [],
  currentComparison: null,
  currentCategory: null,
  filters: {
    search: "",
    candidate: "",
    category: "",
    level: ""
  },
  highContrast: false
};

const scoreMap = {
  alta: 3,
  parcial: 2,
  divergencia: 0,
  sem_equivalente: 0,
  incerta: 0
};

const statusLabels = {
  alta: "Alta convergência",
  parcial: "Convergência parcial",
  divergencia: "Divergência",
  sem_equivalente: "Sem equivalente",
  incerta: "Convergência incerta"
};

let data = {
  candidates: [],
  categories: [],
  proposals: [],
  comparisons: []
};

// Dados embutidos usados quando o arquivo é aberto direto no navegador e o
// carregamento dos JSON locais é bloqueado.
const fallbackData = window.APP_DATA || { candidates: [], categories: [], proposals: [], comparisons: [] };

document.addEventListener("DOMContentLoaded", () => {
  loadData();
});

async function loadData() {
  try {
    const [candidates, categories, proposals, comparisons] = await Promise.all([
      fetch("data/candidatos.json").then((response) => response.json()),
      fetch("data/categorias.json").then((response) => response.json()),
      fetch("data/propostas.json").then((response) => response.json()),
      fetch("data/comparacoes.json").then((response) => response.json())
    ]);

    data = { candidates, categories, proposals, comparisons };
    renderCandidates();
    renderPriorities();
    renderResults();
    renderCandidateProposals();
    renderSources();
    renderFilterOptions();
    renderExplore();
  } catch (error) {
    data = fallbackData;
    renderCandidates();
    renderPriorities();
    renderResults();
    renderCandidateProposals();
    renderSources();
    renderFilterOptions();
    renderExplore();
    console.error(error);
  }
}

function selectCandidate(candidateId) {
  state.selectedCandidate = candidateId;
  state.currentComparison = null;
  renderCandidates();
  renderResults();
}

function selectPriority(categoryId) {
  const exists = state.priorities.includes(categoryId);
  if (exists) {
    removePriority(categoryId);
    return;
  }

  if (state.priorities.length >= 5) {
    return;
  }

  state.priorities.push(categoryId);
  if (!state.currentCategory) {
    state.currentCategory = categoryId;
  }
  renderPriorities();
  renderResults();
  renderExplore();
}

function removePriority(categoryId) {
  state.priorities = state.priorities.filter((priority) => priority !== categoryId);
  renderPriorities();
  renderResults();
  renderExplore();
}

function updateSearch(value) {
  state.filters.search = value.trim().toLowerCase();
  renderExplore();
}

function updateFilter(type, value) {
  state.filters[type] = value;
  if (type === "category" && value) {
    state.currentCategory = value;
  }
  renderExplore();
}

function toggleContrast() {
  state.highContrast = !state.highContrast;
  document.body.classList.toggle("high-contrast", state.highContrast);
}

function reorderPriorities(categoryId, direction) {
  const currentIndex = state.priorities.indexOf(categoryId);
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= state.priorities.length) return;

  const priorities = [...state.priorities];
  [priorities[currentIndex], priorities[nextIndex]] = [
    priorities[nextIndex],
    priorities[currentIndex]
  ];
  state.priorities = priorities;
  renderPriorities();
  renderResults();
  renderExplore();
}

function getCandidateProposals(candidateId, categoryId) {
  return data.proposals.filter(
    (proposal) =>
      proposal.candidate === candidateId && (!categoryId || proposal.category === categoryId)
  );
}

function compareProposals(baseCandidateId, targetCandidateId, categoryId) {
  const direct = data.comparisons.find(
    (comparison) =>
      comparison.baseCandidate === baseCandidateId &&
      comparison.targetCandidate === targetCandidateId &&
      comparison.category === categoryId
  );

  if (direct) return direct;

  const reverse = data.comparisons.find(
    (comparison) =>
      comparison.baseCandidate === targetCandidateId &&
      comparison.targetCandidate === baseCandidateId &&
      comparison.category === categoryId
  );

  if (reverse) {
    return {
      ...reverse,
      baseCandidate: baseCandidateId,
      targetCandidate: targetCandidateId
    };
  }

  return {
    baseCandidate: baseCandidateId,
    targetCandidate: targetCandidateId,
    category: categoryId,
    level: "sem_equivalente",
    explanation: "Não foi identificada uma proposta equivalente no programa analisado.",
    proposalIds: []
  };
}

function calculateScore(baseCandidateId, targetCandidateId) {
  return state.priorities.reduce((total, categoryId, index) => {
    const weight = 5 - index;
    const comparison = compareProposals(baseCandidateId, targetCandidateId, categoryId);
    return total + (scoreMap[comparison.level] || 0) * weight;
  }, 0);
}

function renderCandidates() {
  const container = document.querySelector("#candidate-list");
  container.innerHTML = data.candidates
    .map((candidate) => {
      const selected = state.selectedCandidate === candidate.id ? " is-selected" : "";
      return `
        <button
          class="candidate-card${selected}"
          type="button"
          aria-pressed="${state.selectedCandidate === candidate.id}"
          onclick="selectCandidate('${candidate.id}')"
        >
          <h3>${candidate.name}</h3>
          <span>${candidate.programTitle}</span>
        </button>
      `;
    })
    .join("");
}

function renderPriorities() {
  const list = document.querySelector("#priority-list");
  list.innerHTML = data.categories
    .map((category) => {
      const selected = state.priorities.includes(category.id) ? " is-selected" : "";
      const disabled =
        !selected && state.priorities.length >= 5 ? " disabled" : "";
      return `
        <button
          class="priority-chip${selected}"
          type="button"
          aria-pressed="${state.priorities.includes(category.id)}"
          ${disabled}
          onclick="selectPriority('${category.id}')"
        >
          ${category.name}
        </button>
      `;
    })
    .join("");

  const selected = document.querySelector("#selected-priorities");
  if (!state.priorities.length) {
    selected.innerHTML = `<div class="empty-state">Nenhuma prioridade selecionada ainda.</div>`;
    return;
  }

  selected.innerHTML = state.priorities
    .map((categoryId, index) => {
      const category = getCategory(categoryId);
      return `
        <div class="priority-row">
          <span class="priority-index">${index + 1}</span>
          <strong>${category.name}</strong>
          <div class="priority-actions">
            <button class="small-button" type="button" ${index === 0 ? "disabled" : ""} onclick="reorderPriorities('${categoryId}', -1)">Subir</button>
            <button class="small-button" type="button" ${index === state.priorities.length - 1 ? "disabled" : ""} onclick="reorderPriorities('${categoryId}', 1)">Descer</button>
            <button class="small-button" type="button" onclick="removePriority('${categoryId}')">Remover</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderResults() {
  const summary = document.querySelector("#comparison-summary");
  const matrix = document.querySelector("#matrix-container");
  const detail = document.querySelector("#comparison-detail");

  if (!state.selectedCandidate || !state.priorities.length) {
    summary.className = "empty-state";
    summary.textContent =
      "Escolha um candidato e ao menos uma prioridade para visualizar a comparação.";
    matrix.innerHTML = "";
    detail.innerHTML = "";
    return;
  }

  const selectedCandidate = getCandidate(state.selectedCandidate);
  const targets = data.candidates
    .filter((candidate) => candidate.id !== state.selectedCandidate)
    .map((candidate) => ({
      ...candidate,
      score: calculateScore(state.selectedCandidate, candidate.id)
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  summary.className = "results-grid";
  summary.innerHTML = targets.map(renderComparisonCard).join("");
  matrix.innerHTML = renderMatrix(targets);
  detail.innerHTML = `
    <div class="comparison-detail">
      <div class="notice">
        <strong>Candidato inicialmente selecionado</strong>
        <p>${selectedCandidate.name}</p>
        <strong>Suas prioridades</strong>
        <p>${state.priorities.map((id, index) => `${index + 1}. ${getCategory(id).name}`).join("<br>")}</p>
        <p>
          Entre os programas analisados, a ordenação abaixo representa somente a
          convergência encontrada nas prioridades selecionadas. Ela não é uma recomendação de voto.
        </p>
      </div>
      ${targets.map((target) => renderDetailedComparison(target)).join("")}
    </div>
  `;
}

function renderComparisonCard(candidate) {
  const comparisons = state.priorities.map((categoryId) =>
    compareProposals(state.selectedCandidate, candidate.id, categoryId)
  );
  const dominant = getDominantLevel(comparisons);
  const pages = comparisons.flatMap((comparison) => getComparisonSources(comparison)).slice(0, 4);

  return `
    <article class="comparison-card">
      <h3>${getCandidate(state.selectedCandidate).name} × ${candidate.name}</h3>
      ${statusBadge(dominant)}
      <div class="comparison-topics">
        ${comparisons
          .map(
            (comparison) => `
              <div class="topic-row">
                <span>${getCategory(comparison.category).name}</span>
                <strong>${statusLabels[comparison.level]}</strong>
              </div>
            `
          )
          .join("")}
      </div>
      ${
        pages.length
          ? `<p class="source-footprint">Fontes: ${pages
              .map((item) => `${item.candidate}, p. ${item.page}`)
              .join("; ")}</p>`
          : ""
      }
      <a class="button primary" href="#comparison-detail">Ver comparação</a>
    </article>
  `;
}

function renderMatrix(targets) {
  return `
    <div class="matrix-wrap">
      <table>
        <thead>
          <tr>
            <th>Tema</th>
            ${targets.map((target) => `<th>${target.name}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${state.priorities
            .map(
              (categoryId) => `
                <tr>
                  <td><strong>${getCategory(categoryId).name}</strong></td>
                  ${targets
                    .map((target) => {
                      const comparison = compareProposals(
                        state.selectedCandidate,
                        target.id,
                        categoryId
                      );
                      return `<td>${statusBadge(comparison.level)}</td>`;
                    })
                    .join("")}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderDetailedComparison(target) {
  return `
    <article class="comparison-card">
      <h3>${getCandidate(state.selectedCandidate).name} × ${target.name}</h3>
      ${state.priorities
        .map((categoryId) => {
          const comparison = compareProposals(state.selectedCandidate, target.id, categoryId);
          const proposals = (comparison.proposalIds || [])
            .map((proposalId) => data.proposals.find((proposal) => proposal.id === proposalId))
            .filter(Boolean);

          return `
            <div class="topic-detail">
              <div class="topic-detail-header">
                <div>
                  <p class="eyebrow">Tema analisado</p>
                  <h4>${getCategory(categoryId).name}</h4>
                </div>
                ${statusBadge(comparison.level)}
              </div>
              <div class="comparison-analysis">
                <strong>Leitura da comparação</strong>
                <p>${comparison.explanation}</p>
                <p>${buildComparisonDepth(comparison, proposals)}</p>
              </div>
              ${
                proposals.length
                  ? `
                    <div class="proposal-brief-grid">
                      ${proposals.map((proposal) => renderProposalBrief(proposal)).join("")}
                    </div>
                    <div class="proposal-list compact">
                      ${proposals.map((proposal) => renderProposal(proposal)).join("")}
                    </div>
                  `
                  : "<p>Sem proposta equivalente claramente identificável.</p>"
              }
            </div>
          `;
        })
        .join("")}
    </article>
  `;
}

function renderProposal(proposal) {
  const originalId = `original-${proposal.id}`;
  return `
    <article class="proposal-card">
      <div class="proposal-meta">
        <span>${getCandidate(proposal.candidate).name}</span>
        <span>${getCategory(proposal.category).name}</span>
        <span>${proposal.source.document}</span>
        <span>Página ${proposal.source.page}</span>
      </div>
      <h3>${proposal.title}</h3>
      <p>${proposal.summary}</p>
      <dl class="proposal-depth">
        <div>
          <dt>Objetivo declarado</dt>
          <dd>${proposal.objective || "Não foi identificado um objetivo específico além do resumo da proposta."}</dd>
        </div>
        <div>
          <dt>Mecanismo proposto</dt>
          <dd>${proposal.mechanism || "Não foi identificado um mecanismo específico no trecho catalogado."}</dd>
        </div>
        <div>
          <dt>Localização no documento</dt>
          <dd>${proposal.source.document}, página ${proposal.source.page}.</dd>
        </div>
      </dl>
      <button
        class="small-button"
        type="button"
        aria-expanded="false"
        aria-controls="${originalId}"
        onclick="toggleOriginal('${originalId}')"
      >
        Ver proposta original
      </button>
      <a href="${proposal.source.url}" target="_blank" rel="noopener" aria-label="Abrir documento completo: ${proposal.source.document}">
        Ver documento completo
      </a>
      <div id="${originalId}" class="proposal-original" hidden>
        <strong>Trecho original</strong>
        <p>${proposal.originalText}</p>
        <p>Fonte: ${proposal.source.document}, página ${proposal.source.page}.</p>
      </div>
    </article>
  `;
}

function renderCandidateProposals() {
  const container = document.querySelector("#candidate-proposals");
  container.innerHTML = data.candidates
    .map((candidate) => {
      const proposals = getCandidateProposals(candidate.id);
      const grouped = data.categories
        .map((category) => ({
          category,
          proposals: proposals.filter((proposal) => proposal.category === category.id)
        }))
        .filter((group) => group.proposals.length);

      return `
        <section class="candidate-proposal-group">
          <h3>${candidate.name}</h3>
          <p>${candidate.programTitle}</p>
          ${
            grouped.length
              ? grouped
                  .map(
                    (group) => `
                      <h3>${group.category.name}</h3>
                      <div class="proposal-list">
                        ${group.proposals.map((proposal) => renderProposal(proposal)).join("")}
                      </div>
                    `
                  )
                  .join("")
              : "<p>Não foi identificada proposta equivalente no programa analisado.</p>"
          }
        </section>
      `;
    })
    .join("");
}

function renderSources() {
  const container = document.querySelector("#sources-list");
  container.innerHTML = data.candidates
    .map(
      (candidate) => `
        <article class="source-card">
          <h3>${candidate.name}</h3>
          <p>${candidate.programTitle}</p>
          <a href="${candidate.sourceUrl}" target="_blank" rel="noopener">Ver documento</a>
        </article>
      `
    )
    .join("");
}

function renderFilterOptions() {
  const candidateFilter = document.querySelector("#candidate-filter");
  const categoryFilter = document.querySelector("#category-filter");

  if (candidateFilter) {
    candidateFilter.innerHTML = `
      <option value="">Todos</option>
      ${data.candidates.map((candidate) => `<option value="${candidate.id}">${candidate.name}</option>`).join("")}
    `;
  }

  if (categoryFilter) {
    categoryFilter.innerHTML = `
      <option value="">Todos</option>
      ${data.categories.map((category) => `<option value="${category.id}">${category.name}</option>`).join("")}
    `;
  }
}

function renderExplore() {
  renderCoverageStats();
  renderThemeView();
  renderFilteredProposals();
}

function renderCoverageStats() {
  const container = document.querySelector("#coverage-stats");
  if (!container) return;

  const totalComparisons = data.comparisons.length;
  const categoriesWithProposals = new Set(data.proposals.map((proposal) => proposal.category)).size;

  container.innerHTML = `
    <article class="metric-card">
      <strong>${data.proposals.length}</strong>
      <span>propostas catalogadas</span>
    </article>
    <article class="metric-card">
      <strong>${totalComparisons}</strong>
      <span>comparações registradas</span>
    </article>
    <article class="metric-card">
      <strong>${categoriesWithProposals}</strong>
      <span>temas com propostas</span>
    </article>
    <article class="metric-card">
      <strong>${data.candidates.length}</strong>
      <span>candidatos analisados</span>
    </article>
  `;
}

function renderThemeView() {
  const container = document.querySelector("#theme-view");
  if (!container) return;

  const themeCategories = getThemeCategories();
  if (!themeCategories.length) {
    container.innerHTML = `<div class="empty-state">Nenhuma categoria com proposta catalogada foi encontrada.</div>`;
    return;
  }

  const selectedCategory = resolveThemeCategoryId();
  const category = getCategory(selectedCategory);
  const currentIndex = themeCategories.findIndex((themeCategory) => themeCategory.id === selectedCategory);
  const proposals = data.candidates.map((candidate) => ({
    candidate,
    proposals: getCandidateProposals(candidate.id, selectedCategory)
  }));

  container.innerHTML = `
    <div class="theme-carousel" role="group" aria-roledescription="carrossel" aria-label="Visão por tema">
      <div class="theme-carousel-header">
        <div class="section-heading compact-heading">
          <p class="eyebrow">Visão por tema</p>
          <h3>${category.name}</h3>
          <p>Comparação lateral das propostas catalogadas para este tema. Use o carrossel para passar por todas as categorias principais. Quando não há item, a base ainda não identificou proposta equivalente nesse recorte.</p>
          <p class="theme-counter" aria-live="polite">Tema ${currentIndex + 1} de ${themeCategories.length}</p>
        </div>
        <div class="theme-carousel-controls" aria-label="Controles do carrossel de temas">
          <button class="small-button" type="button" onclick="moveTheme(-1)" aria-label="Ver tema anterior">Anterior</button>
          <button class="small-button" type="button" onclick="moveTheme(1)" aria-label="Ver próximo tema">Próximo</button>
        </div>
      </div>
      <div class="theme-track" aria-label="Categorias principais">
        ${themeCategories
          .map(
            (themeCategory) => `
              <button
                class="theme-tab${themeCategory.id === selectedCategory ? " is-active" : ""}"
                type="button"
                aria-current="${themeCategory.id === selectedCategory ? "true" : "false"}"
                onclick="selectThemeCategory('${themeCategory.id}')"
              >
                ${themeCategory.name}
              </button>
            `
          )
          .join("")}
      </div>
    </div>
    <div class="theme-grid">
      ${proposals
        .map(
          ({ candidate, proposals: candidateProposals }) => `
            <article class="theme-column">
              <h4>${candidate.name}</h4>
              ${
                candidateProposals.length
                  ? candidateProposals.map((proposal) => renderThemeProposal(proposal)).join("")
                  : `<p class="empty-inline">Não há proposta catalogada para ${category.name} nesta base inicial.</p>`
              }
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function getThemeCategories() {
  const categoriesWithProposals = new Set(data.proposals.map((proposal) => proposal.category));
  return data.categories.filter((category) => categoriesWithProposals.has(category.id));
}

function resolveThemeCategoryId() {
  const themeCategories = getThemeCategories();
  const availableIds = themeCategories.map((category) => category.id);
  const preferred = state.currentCategory || state.filters.category || state.priorities[0];
  const selected = availableIds.includes(preferred) ? preferred : availableIds[0];
  state.currentCategory = selected;
  return selected;
}

function syncCategoryFilter(categoryId) {
  state.currentCategory = categoryId;
  state.filters.category = categoryId;
  const categoryFilter = document.querySelector("#category-filter");
  if (categoryFilter) {
    categoryFilter.value = categoryId;
  }
}

function selectThemeCategory(categoryId) {
  syncCategoryFilter(categoryId);
  renderExplore();
}

function moveTheme(direction) {
  const themeCategories = getThemeCategories();
  if (!themeCategories.length) return;

  const currentCategory = resolveThemeCategoryId();
  const currentIndex = Math.max(
    0,
    themeCategories.findIndex((category) => category.id === currentCategory)
  );
  const nextIndex = (currentIndex + direction + themeCategories.length) % themeCategories.length;

  syncCategoryFilter(themeCategories[nextIndex].id);
  renderExplore();
}

function renderThemeProposal(proposal) {
  return `
    <div class="theme-proposal">
      <h5>${proposal.title}</h5>
      <p>${proposal.summary}</p>
      <p><strong>Mecanismo:</strong> ${proposal.mechanism || "Não detalhado no trecho catalogado."}</p>
      <p class="source-footprint">${proposal.source.document}, página ${proposal.source.page}.</p>
    </div>
  `;
}

function renderFilteredProposals() {
  const container = document.querySelector("#filtered-proposals");
  if (!container) return;

  const filtered = getFilteredProposals();

  container.innerHTML = `
    <div class="section-heading compact-heading">
      <p class="eyebrow">Resultado dos filtros</p>
      <h3>${filtered.length} proposta${filtered.length === 1 ? "" : "s"} encontrada${filtered.length === 1 ? "" : "s"}</h3>
      <p>Os resultados abaixo respeitam a busca e os filtros selecionados.</p>
    </div>
    ${
      filtered.length
        ? `<div class="proposal-list">${filtered.map((proposal) => renderProposal(proposal)).join("")}</div>`
        : `<div class="empty-state">Nenhuma proposta encontrada para os filtros atuais.</div>`
    }
  `;
}

function getFilteredProposals() {
  const { search, candidate, category, level } = state.filters;
  const proposalIdsByLevel = new Set(
    level
      ? data.comparisons
          .filter((comparison) => comparison.level === level)
          .flatMap((comparison) => comparison.proposalIds || [])
      : data.proposals.map((proposal) => proposal.id)
  );

  return data.proposals.filter((proposal) => {
    if (candidate && proposal.candidate !== candidate) return false;
    if (category && proposal.category !== category) return false;
    if (level && !proposalIdsByLevel.has(proposal.id)) return false;
    if (!search) return true;

    const searchable = [
      proposal.title,
      proposal.summary,
      proposal.objective,
      proposal.mechanism,
      proposal.originalText,
      getCandidate(proposal.candidate).name,
      getCategory(proposal.category).name
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(search);
  });
}

function toggleOriginal(id) {
  const panel = document.querySelector(`#${id}`);
  const button = document.querySelector(`[aria-controls="${id}"]`);
  const isOpen = !panel.hidden;

  panel.hidden = isOpen;
  panel.classList.toggle("is-open", !isOpen);

  if (button) {
    button.setAttribute("aria-expanded", String(!isOpen));
    button.textContent = isOpen ? "Ver proposta original" : "Ocultar proposta original";
  }
}

function statusBadge(level) {
  return `
    <span class="score-label" aria-label="${statusLabels[level] || statusLabels.sem_equivalente}">
      <span class="status-dot status-${statusClass(level)}" aria-hidden="true"></span>
      ${statusLabels[level] || statusLabels.sem_equivalente}
    </span>
  `;
}

function renderProposalBrief(proposal) {
  return `
    <article class="proposal-brief">
      <div class="proposal-meta">
        <span>${getCandidate(proposal.candidate).name}</span>
        <span>Página ${proposal.source.page}</span>
      </div>
      <h5>${proposal.title}</h5>
      <p><strong>Objetivo:</strong> ${proposal.objective || proposal.summary}</p>
      <p><strong>Mecanismo:</strong> ${proposal.mechanism || "Mecanismo não detalhado no trecho catalogado."}</p>
      <p class="source-footprint">${proposal.source.document}, página ${proposal.source.page}.</p>
    </article>
  `;
}

function buildComparisonDepth(comparison, proposals) {
  if (!proposals.length) {
    return "A base catalogada não localizou uma proposta equivalente com segurança suficiente para comparação detalhada neste tema.";
  }

  const mechanisms = proposals
    .map((proposal) => `${getCandidate(proposal.candidate).name}: ${proposal.mechanism || proposal.summary}`)
    .join(" ");

  if (comparison.level === "alta") {
    return `A classificação como alta convergência considera que os programas perseguem objetivos próximos e usam instrumentos comparáveis. Mecanismos identificados: ${mechanisms}`;
  }

  if (comparison.level === "parcial") {
    return `A classificação como convergência parcial indica que existe tema comum, mas os instrumentos ou a ênfase política são diferentes. Mecanismos identificados: ${mechanisms}`;
  }

  if (comparison.level === "divergencia") {
    return `A classificação como divergência indica diferença substancial nos mecanismos ou na direção da política pública. Mecanismos identificados: ${mechanisms}`;
  }

  return `A equivalência foi tratada com cautela porque os documentos usam estruturas ou níveis de detalhamento diferentes. Mecanismos identificados: ${mechanisms}`;
}

function getComparisonSources(comparison) {
  return (comparison.proposalIds || [])
    .map((proposalId) => data.proposals.find((proposal) => proposal.id === proposalId))
    .filter(Boolean)
    .map((proposal) => ({
      candidate: getCandidate(proposal.candidate).name,
      page: proposal.source.page
    }));
}

function statusClass(level) {
  if (level === "alta") return "high";
  if (level === "parcial") return "partial";
  if (level === "divergencia") return "divergent";
  return "none";
}

function getDominantLevel(comparisons) {
  const score = comparisons.reduce((total, comparison) => total + (scoreMap[comparison.level] || 0), 0);
  if (score >= comparisons.length * 2.4) return "alta";
  if (score >= comparisons.length * 1.3) return "parcial";
  if (comparisons.some((comparison) => comparison.level === "divergencia")) return "divergencia";
  return "sem_equivalente";
}

function getCandidate(candidateId) {
  return data.candidates.find((candidate) => candidate.id === candidateId) || {
    id: candidateId,
    name: candidateId,
    programTitle: ""
  };
}

function getCategory(categoryId) {
  return data.categories.find((category) => category.id === categoryId) || {
    id: categoryId,
    name: categoryId
  };
}
