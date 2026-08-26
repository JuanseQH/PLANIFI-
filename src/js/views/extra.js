import { icon } from "../components/icons.js";
import { formatTimeAgo } from "../utils/dates.js";
import { answerChat } from "../services/chatbot.js";
import { achievementProgress, challengeProgress, levelFromXp, nextLevelXp } from "../services/gamification.js";
import { getState } from "../services/store.js";
import { unreadCount } from "../services/notifications.js";

export function renderGamificacion() {
  const state = getState();
  const xp = state.gamification.xp;
  const level = levelFromXp(xp);
  const next = nextLevelXp(xp);
  const pct = Math.min(100, Math.round((xp / next) * 100));
  const achievements = achievementProgress(state);
  const challenges = challengeProgress(state);

  return `
    <section class="stack pb-nav">
      <article class="hero-card">
        <div class="spread">
          <div><h2>Nivel ${level}</h2><p>Ahorrador PLANIFI</p></div>
          <div class="streak">${icon("flame")} ${state.gamification.streak} días</div>
        </div>
        <div class="spread muted"><span>XP ${xp.toLocaleString("es-CO")}</span><span>Siguiente ${next.toLocaleString("es-CO")}</span></div>
        <div class="bar light"><span style="width:${pct}%"></span></div>
      </article>
      <div class="tabs">
        <button class="chip-btn is-on" type="button">Logros</button>
      </div>
      ${achievements
        .map(
          (item) => `
        <article class="card ${item.completed ? "done" : ""}">
          <div class="spread"><strong>${item.name}</strong>${item.completed ? `<span class="chip">Completado</span>` : `<span>${item.reward}</span>`}</div>
          <p class="muted">${item.description}</p>
          ${item.completed ? "" : `<div class="bar"><span style="width:${Math.round((item.progress / item.maxProgress) * 100)}%"></span></div>`}
        </article>`,
        )
        .join("")}
      <h3 class="section-label">Retos</h3>
      ${challenges
        .map(
          (item) => `
        <article class="card">
          <div class="spread"><strong>${item.title}</strong><span class="chip">${item.difficulty}</span></div>
          <p class="muted">${item.description}</p>
          <div class="bar"><span style="width:${item.progress}%"></span></div>
          <p class="muted">${item.reward} · ${item.progress}%</p>
        </article>`,
        )
        .join("")}
      <article class="card">
        <h3>Ranking local</h3>
        <p class="muted">El ranking entre usuarios requiere red. Aquí ves tu XP real: ${xp.toLocaleString("es-CO")}.</p>
      </article>
    </section>
  `;
}

export function renderChatbot() {
  const log = window.__planifiChat || [
    {
      type: "bot",
      content: "¡Hola! Soy el asistente local de PLANIFI. Pregúntame por tus gastos, ingresos, metas o ahorros.",
      suggestions: ["¿Cuánto gasté este mes?", "¿Cómo van mis metas?", "¿En qué puedo ahorrar?"],
    },
  ];
  window.__planifiChat = log;
  return `
    <section class="stack pb-nav chat-view">
      <article class="card">
        <div class="spread"><div><h3>PLANIFI Assistant</h3><p class="muted">Consultas con tus datos reales, sin internet</p></div>${icon("bot")}</div>
      </article>
      <div class="chat-log" id="chat-log">
        ${log
          .map(
            (msg) => `
          <div class="bubble ${msg.type}">
            <p>${msg.content.replaceAll("\n", "<br>")}</p>
            ${
              msg.suggestions
                ? `<div class="suggest">${msg.suggestions.map((s) => `<button type="button" data-suggest="${s}">${s}</button>`).join("")}</div>`
                : ""
            }
          </div>`,
          )
          .join("")}
      </div>
      <form class="chat-form" id="chat-form">
        <input id="chat-input" type="text" placeholder="Escribe tu consulta financiera..." autocomplete="off" />
        <button class="btn" type="submit" aria-label="Enviar">${icon("send")}</button>
      </form>
    </section>
  `;
}

export function pushChat(text) {
  const log = window.__planifiChat || [];
  log.push({ type: "user", content: text });
  const answer = answerChat(text);
  log.push({ type: "bot", content: answer.content, suggestions: answer.suggestions });
  window.__planifiChat = log;
}

export function renderNotificaciones() {
  const state = getState();
  const unread = unreadCount(state);
  return `
    <section class="stack pb-nav">
      <div class="spread">
        <h3>Notificaciones ${unread ? `(${unread} sin leer)` : ""}</h3>
        <button class="text-link" type="button" data-read-all>Marcar todo</button>
      </div>
      ${
        state.notifications.length
          ? state.notifications
              .map(
                (item) => `
          <article class="card note ${item.read ? "read" : ""}">
            <div class="spread"><strong>${item.title}</strong><small>${formatTimeAgo(item.createdAt)}</small></div>
            <p>${item.message}</p>
            <div class="row-actions">
              ${item.action ? `<button class="btn btn-sm" type="button" data-note-action="${item.id}">Ver</button>` : ""}
              <button class="btn btn-outline btn-sm" type="button" data-note-read="${item.id}">Leída</button>
              <button class="icon-btn" type="button" data-note-del="${item.id}" aria-label="Eliminar">${icon("x", 16)}</button>
            </div>
          </article>`,
              )
              .join("")
          : `<div class="empty-block">${icon("bell", 32)}<p>No hay notificaciones nuevas</p></div>`
      }
    </section>
  `;
}
