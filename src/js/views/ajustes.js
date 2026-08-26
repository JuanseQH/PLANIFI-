import { icon } from "../components/icons.js";
import { formatMoney } from "../utils/format.js";
import { ACCOUNT_TYPES } from "../data/categories.js";
import { getState } from "../services/store.js";

export function renderAjustes() {
  const state = getState();
  const n = state.preferences.notifications;

  return `
    <section class="stack pb-nav">
      <article class="hero-card compact">
        <h3>PLANIFI Settings</h3>
        <p>Configura tu experiencia financiera</p>
      </article>

      <article class="card">
        <div class="card-head">
          <h3>${icon("card")} Cuentas bancarias</h3>
          <button class="btn btn-sm" type="button" data-sheet="account">${icon("plus", 14)} Agregar</button>
        </div>
        ${state.accounts
          .map(
            (account) => `
          <div class="account-row">
            <span class="row-ico">${icon("card")}</span>
            <div>
              <strong>${account.last4 ? `**** ${account.last4}` : account.name}</strong>
              <small>${account.bank} · ${ACCOUNT_TYPES.find((t) => t.id === account.type)?.name || account.type}</small>
              <b>${formatMoney(Math.abs(account.balance))}${account.balance < 0 ? " (Deuda)" : ""}</b>
            </div>
            <label class="switch">
              <input type="checkbox" data-toggle-account="${account.id}" ${account.connected ? "checked" : ""} />
              <span></span>
            </label>
            <button class="icon-btn" type="button" data-edit-account="${account.id}" aria-label="Editar cuenta">${icon("edit", 16)}</button>
          </div>`,
          )
          .join("")}
      </article>

      <article class="card">
        <div class="card-head"><h3>${icon("wallet")} Reglas de ahorro</h3></div>
        ${state.savingRules
          .map(
            (rule) => `
          <div class="rule-row">
            <div><strong>${rule.name}</strong><small>${rule.description}</small></div>
            <span class="chip">${rule.amount}</span>
            <label class="switch">
              <input type="checkbox" data-toggle-rule="${rule.id}" ${rule.active ? "checked" : ""} />
              <span></span>
            </label>
          </div>`,
          )
          .join("")}
      </article>

      <article class="card">
        <div class="card-head"><h3>${icon("bell")} Notificaciones</h3></div>
        ${[
          ["push", "Notificaciones push", "Alertas en la aplicación"],
          ["goalReminders", "Recordatorios de metas", "Progreso hacia tus objetivos"],
          ["spendingAlerts", "Alertas de gastos", "Avisos de gastos inusuales"],
          ["savingTips", "Consejos de ahorro", "Tips según tus movimientos"],
        ]
          .map(
            ([key, title, sub]) => `
          <div class="rule-row">
            <div><strong>${title}</strong><small>${sub}</small></div>
            <label class="switch">
              <input type="checkbox" data-pref="notifications.${key}" ${n[key] ? "checked" : ""} />
              <span></span>
            </label>
          </div>`,
          )
          .join("")}
      </article>

      <article class="card">
        <div class="card-head"><h3>${icon("shield")} Seguridad y privacidad</h3></div>
        <div class="rule-row">
          <div><strong>Ocultar balance</strong><small>Mostrar •••••• en el inicio</small></div>
          <label class="switch">
            <input type="checkbox" data-pref="hideBalance" ${state.preferences.hideBalance ? "checked" : ""} />
            <span></span>
          </label>
        </div>
        <button class="menu-row" type="button" data-toast="La biometría se activará con Capacitor en la siguiente etapa.">
          <span><strong>Autenticación biométrica</strong><small>Huella o Face ID en el dispositivo</small></span>${icon("chevron")}
        </button>
        <button class="menu-row" type="button" data-sheet="pin">
          <span><strong>Cambiar PIN</strong><small>Código local de 4 dígitos</small></span>${icon("chevron")}
        </button>
      </article>

      <article class="card">
        <div class="card-head"><h3>${icon("settings")} Preferencias</h3></div>
        <button class="menu-row" type="button" data-cycle-theme>
          <span><strong>Tema</strong><small>${state.preferences.theme === "oscuro" ? "Oscuro" : "Claro"}</small></span>${icon("chevron")}
        </button>
        <div class="menu-row static"><span><strong>Moneda principal</strong><small>Peso colombiano (COP)</small></span></div>
        <div class="menu-row static"><span><strong>Idioma</strong><small>Español (Colombia)</small></span></div>
      </article>

      <button class="btn btn-outline full" type="button" data-go="cuenta">${icon("user")} Mi cuenta</button>
      <button class="btn btn-danger-outline full" type="button" data-reset>Restablecer datos demo</button>
    </section>
  `;
}
