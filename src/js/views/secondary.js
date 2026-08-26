import { icon } from "../components/icons.js";
import { formatTimeAgo, formatDeadline } from "../utils/dates.js";
import { formatMoney } from "../utils/format.js";
import { ACCOUNT_TYPES, CATEGORIES, categoryById } from "../data/categories.js";
import { getGoalProgress, getInvestmentGain, getRecentActivity } from "../services/finance.js";
import { getState } from "../services/store.js";

export function renderMovimientos(filter = {}) {
  const state = getState();
  let items = getRecentActivity(state, 50);
  if (filter.type && filter.type !== "todos") items = items.filter((tx) => tx.type === filter.type);
  if (filter.category) items = items.filter((tx) => tx.category === filter.category);
  if (filter.q) {
    const q = filter.q.toLowerCase();
    items = items.filter((tx) => tx.description.toLowerCase().includes(q));
  }

  return `
    <section class="stack pb-nav">
      <div class="filters">
        ${["todos", "income", "expense", "saving", "transfer"]
          .map((type) => {
            const labels = { todos: "Todos", income: "Ingresos", expense: "Gastos", saving: "Ahorros", transfer: "Transfer." };
            return `<button type="button" class="chip-btn ${(filter.type || "todos") === type ? "is-on" : ""}" data-filter-type="${type}">${labels[type]}</button>`;
          })
          .join("")}
      </div>
      <label class="search">
        ${icon("search", 16)}
        <input type="search" id="tx-search" value="${filter.q || ""}" placeholder="Buscar descripción" />
      </label>
      <div class="filters wrap">
        ${CATEGORIES.map(
          (cat) =>
            `<button type="button" class="chip-btn ${filter.category === cat.id ? "is-on" : ""}" data-filter-cat="${cat.id}">${cat.name}</button>`,
        ).join("")}
      </div>
      <article class="card">
        ${
          items.length
            ? items
                .map(
                  (tx) => `
          <div class="activity-row">
            <span><strong>${tx.description}</strong><small>${categoryById(tx.category).name} · ${formatTimeAgo(tx.date)}</small></span>
            <b class="${tx.type === "expense" ? "neg" : "pos"}">${formatMoney(tx.type === "expense" ? -tx.amount : tx.amount, { signed: true })}</b>
            <button class="icon-btn" type="button" data-edit-tx="${tx.id}" aria-label="Editar">${icon("edit", 16)}</button>
            <button class="icon-btn" type="button" data-del-tx="${tx.id}" aria-label="Eliminar">${icon("trash", 16)}</button>
          </div>`,
                )
                .join("")
            : `<p class="empty">No hay movimientos con ese filtro.</p>`
        }
      </article>
    </section>
  `;
}

export function renderMetas() {
  const state = getState();
  const goals = state.goals.map(getGoalProgress);
  return `
    <section class="stack pb-nav">
      <button class="btn full" type="button" data-sheet="goal">${icon("plus")} Nueva meta</button>
      ${
        goals.length
          ? goals
              .map(
                (goal) => `
        <article class="card ${goal.completed ? "done" : ""}">
          <div class="spread"><h3>${goal.name}</h3>${goal.completed ? `<span class="chip">Completada</span>` : `<span class="pos">${goal.pct}%</span>`}</div>
          <p class="muted">${formatMoney(goal.current)} de ${formatMoney(goal.target)} · ${formatDeadline(goal.deadline)}</p>
          <div class="bar"><span style="width:${goal.pct}%"></span></div>
          <div class="row-actions">
            <button class="btn btn-sm" type="button" data-sheet="contribute" data-goal="${goal.id}">Añadir dinero</button>
            <button class="btn btn-outline btn-sm" type="button" data-edit-goal="${goal.id}">Editar</button>
            <button class="btn btn-danger-outline btn-sm" type="button" data-del-goal="${goal.id}">Eliminar</button>
          </div>
        </article>`,
              )
              .join("")
          : `<p class="empty">Crea tu primera meta de ahorro.</p>`
      }
    </section>
  `;
}

export function renderCuentas() {
  const state = getState();
  return `
    <section class="stack pb-nav">
      <button class="btn full" type="button" data-sheet="account">${icon("plus")} Vincular cuenta</button>
      <button class="btn btn-outline full" type="button" data-sheet="transfer">${icon("wallet")} Transferir</button>
      ${state.accounts
        .map(
          (account) => `
        <article class="card">
          <div class="spread"><h3>${account.bank}</h3><span class="chip">${account.connected ? "Conectada" : "Desconectada"}</span></div>
          <p>${ACCOUNT_TYPES.find((t) => t.id === account.type)?.name || account.type}${account.last4 ? ` · **** ${account.last4}` : ""}</p>
          <p class="hero-mini">${formatMoney(account.balance)}</p>
          <div class="row-actions">
            <button class="btn btn-outline btn-sm" type="button" data-edit-account="${account.id}">Editar</button>
            <button class="btn btn-danger-outline btn-sm" type="button" data-del-account="${account.id}">Eliminar</button>
          </div>
        </article>`,
        )
        .join("")}
    </section>
  `;
}

export function renderInversiones() {
  const state = getState();
  return `
    <section class="stack pb-nav">
      <button class="btn full" type="button" data-sheet="investment">${icon("plus")} Registrar inversión</button>
      ${
        state.investments.length
          ? state.investments
              .map((item) => {
                const { gain, rate } = getInvestmentGain(item);
                return `
            <article class="card">
              <div class="spread"><h3>${item.name}</h3><span class="${gain >= 0 ? "pos" : "neg"}">${rate.toFixed(1)}%</span></div>
              <p class="muted">Invertido ${formatMoney(item.invested)}</p>
              <p class="hero-mini">${formatMoney(item.current)}</p>
              <p>Ganancia ${formatMoney(gain, { signed: true })}</p>
              <div class="row-actions">
                <button class="btn btn-outline btn-sm" type="button" data-edit-inv="${item.id}">Editar</button>
                <button class="btn btn-danger-outline btn-sm" type="button" data-del-inv="${item.id}">Eliminar</button>
              </div>
            </article>`;
              })
              .join("")
          : `<p class="empty">Aún no registras inversiones.</p>`
      }
    </section>
  `;
}

export function renderCuenta() {
  const state = getState();
  return `
    <section class="stack pb-nav">
      <article class="hero-card">
        <h2>${state.profile.name}</h2>
        <p>${state.profile.email}</p>
        <span class="hero-badge">${state.profile.plan}</span>
      </article>
      <button class="menu-row" type="button" data-go="ajustes"><span><strong>Configuración</strong><small>Cuentas y preferencias</small></span>${icon("chevron")}</button>
      <button class="menu-row" type="button" data-go="cuentas"><span><strong>Mis cuentas</strong><small>Saldos y transferencias</small></span>${icon("chevron")}</button>
      <button class="menu-row" type="button" data-go="chatbot"><span><strong>Ayuda</strong><small>Asistente financiero local</small></span>${icon("chevron")}</button>
      <button class="btn btn-danger-outline full" type="button" data-logout>Cerrar sesión</button>
    </section>
  `;
}
