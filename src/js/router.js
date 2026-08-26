export const ROUTES = [
  "inicio",
  "analisis",
  "ajustes",
  "cuenta",
  "metas",
  "movimientos",
  "cuentas",
  "inversiones",
  "gamificacion",
  "chatbot",
  "notificaciones",
];

export const PRIMARY_ROUTES = ["inicio", "analisis", "ajustes"];

export function parseHash() {
  const hash = location.hash.replace(/^#\/?/, "").split("?")[0];
  return ROUTES.includes(hash) ? hash : "inicio";
}

export function toHash(route) {
  return `#/${route}`;
}

let onRouteChange = null;

export function navigate(route, { replace = false } = {}) {
  if (!ROUTES.includes(route)) return;
  const next = toHash(route);
  if (replace || location.hash === next) {
    history.replaceState(null, "", next);
    onRouteChange?.(parseHash());
    return;
  }
  location.hash = next;
}

export function initRouter(onChange) {
  onRouteChange = onChange;
  window.addEventListener("hashchange", () => onChange(parseHash()));
  if (!location.hash) {
    history.replaceState(null, "", toHash("inicio"));
  }
  onChange(parseHash());
}
