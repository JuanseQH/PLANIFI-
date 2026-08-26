import { uid } from "../utils/id.js";
import { nowIso } from "../utils/dates.js";
import {
  averageCategorySpend,
  getExpensesByCategory,
  getGoalProgress,
  getMonthlySummary,
  getTotalExpenses,
} from "./finance.js";
import { getState, patchState } from "./store.js";

export function addNotification({ type, title, message, action }) {
  const item = {
    id: uid("nt"),
    type,
    title,
    message,
    action: action || null,
    read: false,
    createdAt: nowIso(),
  };
  patchState((state) => ({
    ...state,
    notifications: [item, ...state.notifications].slice(0, 30),
  }));
  return item;
}

export function unreadCount(state = getState()) {
  return state.notifications.filter((item) => !item.read).length;
}

export function markRead(id) {
  patchState((state) => ({
    ...state,
    notifications: state.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
  }));
}

export function markAllRead() {
  patchState((state) => ({
    ...state,
    notifications: state.notifications.map((item) => ({ ...item, read: true })),
  }));
}

export function dismissNotification(id) {
  patchState((state) => ({
    ...state,
    notifications: state.notifications.filter((item) => item.id !== id),
  }));
}

export function refreshInsights() {
  const state = getState();
  if (!state.preferences.notifications.push) return;

  const existing = new Set(state.notifications.map((item) => item.title));
  const summary = getMonthlySummary(state);
  const top = getExpensesByCategory(state)[0];
  const nearGoal = state.goals.map(getGoalProgress).find((goal) => goal.pct >= 80 && goal.pct < 100);
  const roundup = state.preferences.roundup;

  if (state.preferences.notifications.goalReminders && nearGoal && !existing.has("Meta casi lista")) {
    addNotification({
      type: "goal",
      title: "Meta casi lista",
      message: `${nearGoal.name} está al ${nearGoal.pct}%. Faltan ${nearGoal.remaining.toLocaleString("es-CO")} COP.`,
      action: { type: "navigate", route: "metas" },
    });
  }

  if (state.preferences.notifications.spendingAlerts && top) {
    const avg = averageCategorySpend(state, top.id);
    const latest = state.transactions.find((tx) => tx.type === "expense" && tx.category === top.id);
    if (latest && avg && latest.amount > avg * 1.4 && !existing.has("Gasto inusual detectado")) {
      addNotification({
        type: "warning",
        title: "Gasto inusual detectado",
        message: `Has gastado más de lo habitual en ${top.name} este mes (${top.value}% del total).`,
        action: { type: "navigate", route: "analisis" },
      });
    }
  }

  if (state.preferences.notifications.savingTips && !roundup.enabled && !existing.has("Oportunidad de ahorro")) {
    addNotification({
      type: "info",
      title: "Oportunidad de ahorro",
      message: "Puedes ahorrar más este mes activando el redondeo automático.",
      action: { type: "enable-roundup" },
    });
  }

  const completed = state.goals.find((goal) => goal.completed);
  if (completed && !existing.has("¡Meta alcanzada!")) {
    addNotification({
      type: "goal",
      title: "¡Meta alcanzada!",
      message: `Completaste ${completed.name}.`,
      action: { type: "navigate", route: "metas" },
    });
  }

  const gain = state.investments[0];
  if (gain && gain.current > gain.invested && !existing.has("Inversión en positivo")) {
    addNotification({
      type: "success",
      title: "Inversión en positivo",
      message: `${gain.name} está por encima del monto invertido.`,
      action: { type: "navigate", route: "inversiones" },
    });
  }

  if (summary.expenses > summary.income && summary.income > 0 && !existing.has("Presupuesto superado")) {
    addNotification({
      type: "warning",
      title: "Presupuesto superado",
      message: `Este mes los gastos (${getTotalExpenses(state).toLocaleString("es-CO")}) superan los ingresos.`,
      action: { type: "navigate", route: "analisis" },
    });
  }
}
