import { icon } from "./icons.js";
import { PRIMARY_ROUTES } from "../router.js";
import { unreadCount } from "../services/notifications.js";
import { getState } from "../services/store.js";
import { firstName } from "../utils/format.js";

const META = {
  inicio: { title: "PLANIFI", subtitle: "Finanzas personales" },
  analisis: { title: "Análisis", subtitle: "Tu panorama financiero" },
  ajustes: { title: "Configuración", subtitle: "Cuentas y preferencias" },
  cuenta: { title: "Mi cuenta", subtitle: "Perfil y sesión" },
  metas: { title: "Metas de ahorro", subtitle: "Progreso y objetivos" },
  movimientos: { title: "Movimientos", subtitle: "Historial y filtros" },
  cuentas: { title: "Cuentas", subtitle: "Saldos y transferencias" },
  inversiones: { title: "Inversiones", subtitle: "Portafolio local" },
  gamificacion: { title: "Logros", subtitle: "XP, rachas y retos" },
  chatbot: { title: "Asistente", subtitle: "Consultas con tus datos" },
  notificaciones: { title: "Notificaciones", subtitle: "Alertas inteligentes" },
};

export function renderHeader(route, { userOpen = false } = {}) {
  const state = getState();
  const meta = META[route] || META.inicio;
  const unread = unreadCount(state);
  const name = firstName(state.profile.name);
  const secondary = !PRIMARY_ROUTES.includes(route);

  return `
    <div class="app-header__inner">
      <div class="app-header__brand">
        ${
          secondary
            ? `<button class="icon-btn light" type="button" data-go="inicio" aria-label="Volver">${icon("home", 18)}</button>`
            : `<span class="logo-mark" aria-hidden="true">P</span>`
        }
        <div>
          <strong>${meta.title}</strong>
          <small>${meta.subtitle}</small>
        </div>
      </div>
      <div class="app-header__actions">
        <button class="icon-btn light badge-btn" type="button" data-go="notificaciones" aria-label="Notificaciones">
          ${icon("bell", 18)}
          ${unread ? `<span class="badge">${unread > 9 ? "9+" : unread}</span>` : ""}
        </button>
        <button class="avatar-btn" type="button" data-toggle-user aria-expanded="${userOpen}" aria-label="Menú de ${name}">
          ${name.slice(0, 1)}
        </button>
      </div>
    </div>
    ${
      userOpen
        ? `<div class="user-menu" role="menu">
            <button type="button" data-go="cuenta">${icon("user", 16)} Perfil</button>
            <button type="button" data-go="cuentas">${icon("card", 16)} Cuentas</button>
            <button type="button" data-go="ajustes">${icon("shield", 16)} Seguridad</button>
            <button type="button" data-go="chatbot">${icon("help", 16)} Ayuda</button>
            <button type="button" data-logout>${icon("logout", 16)} Cerrar sesión</button>
          </div>`
        : ""
    }
  `;
}
