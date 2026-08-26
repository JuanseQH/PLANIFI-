import homeIcon from "../../assets/icons/home.svg?raw";
import pieChartIcon from "../../assets/icons/pie-chart.svg?raw";
import settingsIcon from "../../assets/icons/settings.svg?raw";
import { navigate } from "../router.js";

const TABS = [
  { id: "inicio", label: "Inicio", icon: homeIcon },
  { id: "analisis", label: "Análisis", icon: pieChartIcon },
  { id: "ajustes", label: "Ajustes", icon: settingsIcon },
];

const TAB_ROUTES = {
  inicio: "inicio",
  analisis: "analisis",
  ajustes: "ajustes",
  metas: "inicio",
  movimientos: "inicio",
  cuentas: "ajustes",
  cuenta: "ajustes",
  inversiones: "analisis",
  gamificacion: "inicio",
  chatbot: "inicio",
  notificaciones: "inicio",
};

function prepareIcon(svgMarkup) {
  const wrap = document.createElement("span");
  wrap.innerHTML = svgMarkup;
  const graphic = wrap.querySelector("svg");
  if (graphic) {
    graphic.setAttribute("width", "20");
    graphic.setAttribute("height", "20");
    graphic.removeAttribute("class");
    graphic.setAttribute("aria-hidden", "true");
    graphic.setAttribute("focusable", "false");
  }
  return wrap.innerHTML;
}

export function mountBottomNavigation(container) {
  if (!container) return;

  container.className = "bottom-nav";
  container.setAttribute("aria-label", "Navegación principal");

  const inner = document.createElement("div");
  inner.className = "bottom-nav__inner";

  TABS.forEach((tab) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bottom-nav__tab";
    button.dataset.tab = tab.id;
    button.setAttribute("aria-label", tab.label);
    button.innerHTML = `
      <span class="bottom-nav__icon" aria-hidden="true">${prepareIcon(tab.icon)}</span>
      <span class="bottom-nav__label">${tab.label}</span>
    `;
    button.addEventListener("click", () => navigate(tab.id));
    inner.appendChild(button);
  });

  container.replaceChildren(inner);
}

export function syncBottomNavigation(route) {
  const activeTab = TAB_ROUTES[route] || null;

  document.querySelectorAll(".bottom-nav__tab").forEach((button) => {
    const isActive = Boolean(activeTab) && button.dataset.tab === activeTab;
    button.classList.toggle("is-active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}
