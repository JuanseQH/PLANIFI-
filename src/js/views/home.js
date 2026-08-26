import { icon } from "../components/icons.js";
import { html } from "../components/dom.js";
import { formatDeadline, formatTimeAgo } from "../utils/dates.js";
import { firstName, formatMoney } from "../utils/format.js";
import { categoryById } from "../data/categories.js";
import {
  getCurrentBalance,
  getGoalProgress,
  getInvestmentGain,
  getInvestedTotal,
  getMonthlySaved,
  getRecentActivity,
  getSavingsTotal,
  monthChange,
} from "../services/finance.js";
import { unreadCount } from "../services/notifications.js";
import { getState } from "../services/store.js";

function activityIcon(type) {
  if (type === "expense") return icon("arrowDown");
  if (type === "income") return icon("arrowUp");
  if (type === "transfer") return icon("card");
  return icon("piggy");
}

export function renderHome() {
  const state = getState();
  const hidden = state.preferences.hideBalance;
  const balance = getCurrentBalance(state);
  const change = monthChange(state);
  const savings = getSavingsTotal(state);
  const invested = getInvestedTotal(state);
  const invGain = state.investments[0] ? getInvestmentGain(state.investments[0]).rate : 0;
  const activities = getRecentActivity(state, 3);
  const goals = state.goals.map(getGoalProgress);
  const roundupOn = state.preferences.roundup.enabled;
  const unread = unreadCount(state);
  const name = firstName(state.profile.name);
  const dueGoal = goals.find((goal) => !goal.completed);

  return html`
    <section class="stack pb-nav">
      <article class="hero-card">
        <div class="hero-top">
          <div>
            <h2>¡Hola, ${name}! 👋</h2>
            <p>Tu resumen financiero</p>
          </div>
          <button class="icon-btn light" type="button" data-action="toggle-balance" aria-label="Ocultar o mostrar balance">
            ${hidden ? icon("eyeOff") : icon("eye")}
          </button>
        </div>
        <p class="hero-label">Balance total</p>
        <p class="hero-value">${hidden ? "••••••••" : formatMoney(balance)}</p>
        <span class="hero-badge">${icon("trend", 14)} ${change >= 0 ? "+" : ""}${change}% este mes</span>
      </article>

      <div>
        <h3 class="section-label">Acciones rápidas</h3>
        <div class="quick-grid">
          <button class="quick-btn quick-expense" type="button" data-sheet="expense">${icon("arrowDown")}<strong>Agregar gasto</strong><span>Registra un nuevo gasto</span></button>
          <button class="quick-btn quick-income" type="button" data-sheet="income">${icon("arrowUp")}<strong>Agregar ingreso</strong><span>Registra un nuevo ingreso</span></button>
          <button class="quick-btn quick-goal" type="button" data-sheet="goal">${icon("target")}<strong>Nueva meta</strong><span>Crear objetivo de ahorro</span></button>
          <button class="quick-btn quick-account" type="button" data-sheet="account">${icon("card")}<strong>Vincular cuenta</strong><span>Agregar cuenta local</span></button>
        </div>
      </div>

      <div>
        <h3 class="section-label">Resumen rápido</h3>
        <button class="row-card" type="button" data-go="metas">
          <span class="row-ico">${icon("piggy")}</span>
          <span><strong>Mis ahorros</strong><b>${hidden ? "••••" : formatMoney(savings)}</b></span>
          <em class="pos">${formatMoney(getMonthlySaved(state), { signed: true })}</em>
        </button>
        <button class="row-card" type="button" data-go="inversiones">
          <span class="row-ico">${icon("trend")}</span>
          <span><strong>Inversiones</strong><b>${hidden ? "••••" : formatMoney(invested)}</b></span>
          <em class="pos">${invGain >= 0 ? "+" : ""}${invGain.toFixed(1)}%</em>
        </button>
      </div>

      <article class="card">
        <div class="card-head"><h3>Funciones inteligentes</h3>${icon("zap")}</div>
        <button class="intel-row" type="button" data-sheet="roundup">
          <span class="intel-ico">${icon("zap")}</span>
          <span><strong>Redondeo automático</strong><small>${roundupOn ? `Activo · ahorraste ${formatMoney(getMonthlySaved(state))} este mes` : "Inactivo · actívalo para redondear compras"}</small></span>
          ${icon("settings", 16)}
        </button>
        <button class="intel-row" type="button" data-go="metas">
          <span class="intel-ico">${icon("target")}</span>
          <span><strong>Metas inteligentes</strong><small>${goals.filter((g) => !g.completed).length} metas en progreso</small></span>
          ${icon("settings", 16)}
        </button>
      </article>

      <article class="card">
        <div class="card-head">
          <h3>Actividad reciente</h3>
          <button class="text-link" type="button" data-go="movimientos">Ver todo</button>
        </div>
        ${
          activities.length
            ? activities
                .map(
                  (tx) => `
            <button class="activity-row" type="button" data-edit-tx="${tx.id}">
              <span class="activity-ico ${tx.type}">${activityIcon(tx.type)}</span>
              <span><strong>${tx.description}</strong><small>${categoryById(tx.category).name} · ${formatTimeAgo(tx.date)}</small></span>
              <b class="${tx.type === "expense" ? "neg" : "pos"}">${formatMoney(tx.type === "expense" || tx.type === "transfer" ? -tx.amount : tx.amount, { signed: true })}</b>
            </button>`,
                )
                .join("")
            : `<p class="empty">Aún no hay movimientos.</p>`
        }
      </article>

      <article class="card">
        <div class="card-head"><h3>${icon("calendar")} Próximos eventos</h3></div>
        ${
          dueGoal
            ? `<div class="event-row"><span class="activity-ico income">${icon("target")}</span><span><strong>Meta: ${dueGoal.name}</strong><small>${formatDeadline(dueGoal.deadline)}</small></span><b>${formatMoney(dueGoal.remaining)} restantes</b></div>`
            : `<p class="empty">No hay eventos próximos.</p>`
        }
        ${state.scheduled
          .slice(0, 2)
          .map(
            (item) =>
              `<div class="event-row"><span class="activity-ico expense">${icon("card")}</span><span><strong>${item.description}</strong><small>${item.nextDate}</small></span><b>${formatMoney(item.amount)}</b></div>`,
          )
          .join("")}
      </article>

      <div class="two-btns">
        <button class="btn btn-outline" type="button" data-go="gamificacion">${icon("users")} Logros</button>
        <button class="btn btn-outline" type="button" data-go="notificaciones">${icon("bell")} Notificaciones${unread ? ` (${unread})` : ""}</button>
      </div>
      <button class="btn btn-outline full" type="button" data-go="chatbot">${icon("bot")} Asistente financiero</button>
    </section>
  `;
}
