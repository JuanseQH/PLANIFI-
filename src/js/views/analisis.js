import { icon } from "../components/icons.js";
import { formatMonthLabel } from "../utils/dates.js";
import { formatCompact, formatMoney, percent } from "../utils/format.js";
import {
  getCurrentBalance,
  getExpensesByCategory,
  getGoalProgress,
  getMonthlySummary,
  getSavingsTotal,
  getSavingsTrend,
  monthChange,
} from "../services/finance.js";
import { getState } from "../services/store.js";

function pieGradient(slices) {
  if (!slices.length) return "#dbeafe";
  let cursor = 0;
  return slices
    .map((slice) => {
      const start = cursor;
      cursor += slice.value;
      return `${slice.color} ${start}% ${cursor}%`;
    })
    .join(", ");
}

function lineChart(points) {
  const w = 320;
  const h = 140;
  const max = Math.max(...points.map((p) => p.amount), 1);
  const coords = points.map((p, i) => {
    const x = points.length === 1 ? w / 2 : (i / (points.length - 1)) * (w - 24) + 12;
    const y = h - 20 - (p.amount / max) * (h - 40);
    return `${x},${y}`;
  });
  const dots = points
    .map((p, i) => {
      const [x, y] = coords[i].split(",");
      return `<circle cx="${x}" cy="${y}" r="4" fill="#1d4ed8" />`;
    })
    .join("");
  const labels = points
    .map((p, i) => {
      const x = coords[i].split(",")[0];
      return `<text x="${x}" y="${h - 4}" text-anchor="middle" font-size="10" fill="#64748b">${p.month}</text>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${w} ${h}" class="line-chart" role="img" aria-label="Tendencia de ahorros"><polyline fill="none" stroke="#3b82f6" stroke-width="3" points="${coords.join(" ")}"/>${dots}${labels}</svg>`;
}

export function renderAnalisis() {
  const state = getState();
  const hidden = state.preferences.hideBalance;
  const money = (value) => (hidden ? "••••" : formatMoney(value));
  const summary = getMonthlySummary(state);
  const slices = getExpensesByCategory(state);
  const goals = state.goals.map(getGoalProgress);
  const trend = getSavingsTrend(state);
  const change = monthChange(state);
  const primaryGoal = goals[0];
  const month = formatMonthLabel();

  return `
    <section class="stack pb-nav">
      <div class="kpi-grid">
        <article class="kpi kpi-dark">
          <span>${icon("wallet", 16)} Balance total</span>
          <strong>${money(getCurrentBalance(state))}</strong>
          <small>${icon("trend", 12)} ${change >= 0 ? "+" : ""}${change}% este mes</small>
        </article>
        <article class="kpi kpi-soft">
          <span>${icon("target", 16)} Meta ahorro</span>
          <strong>${money(primaryGoal ? primaryGoal.current : getSavingsTotal(state))}</strong>
          <small class="pos">${primaryGoal ? `${primaryGoal.pct}% completado` : "Sin metas"}</small>
        </article>
      </div>

      <article class="hero-card compact">
        <div class="hero-brand">
          <div>
            <h3>PLANIFI Analytics</h3>
            <p>Análisis inteligente de tus finanzas</p>
          </div>
          <small>Actualizado ahora</small>
        </div>
      </article>

      <article class="card">
        <div class="card-head"><h3>Progreso de metas</h3><small>${month}</small></div>
        ${
          goals.length
            ? goals
                .map(
                  (goal) => `
          <button class="goal-block" type="button" data-go="metas">
            <div class="spread"><strong>${goal.name}</strong><span class="pos">${goal.pct}%</span></div>
            <div class="spread muted"><span>${formatMoney(goal.current)}</span><span>${formatMoney(goal.target)}</span></div>
            <div class="bar"><span style="width:${goal.pct}%"></span></div>
          </button>`,
                )
                .join("")
            : `<p class="empty">Crea una meta para ver el progreso.</p>`
        }
      </article>

      <article class="card">
        <div class="card-head"><h3>Distribución de gastos</h3><span class="pos">${month}</span></div>
        ${
          slices.length
            ? `<div class="pie" style="background: conic-gradient(${pieGradient(slices)})" role="img" aria-label="Distribución de gastos"></div>
               <div class="legend">${slices.map((s) => `<span><i style="background:${s.color}"></i>${s.name} ${s.value}%</span>`).join("")}</div>`
            : `<p class="empty">Registra gastos para ver el gráfico.</p>`
        }
      </article>

      <article class="card">
        <div class="card-head"><h3>Tendencia de ahorros</h3><span class="pos">COP</span></div>
        ${lineChart(trend)}
      </article>

      <article class="card">
        <h3>Resumen mensual</h3>
        <div class="summary-row"><span>Ingresos</span><b class="pos">${money(summary.income)}</b></div>
        <div class="summary-row"><span>Gastos</span><b class="neg">${money(summary.expenses)}</b></div>
        <div class="summary-row"><span>Ahorrado</span><b class="pos">${money(summary.saved)}</b></div>
        <div class="summary-row"><span>Invertido</span><b>${money(summary.invested)}</b></div>
        <div class="summary-row net"><span>Balance neto</span><b>${money(summary.net)}</b></div>
      </article>

      <article class="card">
        <h3>Acciones rápidas</h3>
        <div class="mini-actions">
          <button type="button" data-sheet="expense">${icon("wallet")} Agregar gasto</button>
          <button type="button" data-sheet="goal">${icon("target")} Nueva meta</button>
          <button type="button" data-sheet="account">${icon("card")} Vincular cuenta</button>
          <button type="button" data-sheet="transfer">${icon("wallet")} Transferir</button>
        </div>
      </article>
    </section>
  `;
}

void percent;
void formatCompact;
