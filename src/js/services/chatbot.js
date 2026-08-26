import { categoryById } from "../data/categories.js";
import { formatMoney } from "../utils/format.js";
import {
  getCurrentBalance,
  getExpensesByCategory,
  getGoalProgress,
  getMonthlySummary,
  getSavingsTotal,
  getTotalExpenses,
  getTotalIncome,
} from "./finance.js";
import { getState } from "./store.js";

function reply(content, suggestions = []) {
  return { content, suggestions };
}

export function answerChat(message) {
  const state = getState();
  const text = message.toLowerCase();
  const summary = getMonthlySummary(state);
  const top = getExpensesByCategory(state)[0];
  const goals = state.goals.map(getGoalProgress);
  const expenses = getTotalExpenses(state);
  const income = getTotalIncome(state);

  if (text.includes("gast")) {
    const topLine = top
      ? `Tu categoría con mayor gasto es ${top.name} con ${formatMoney(top.amount)}.`
      : "Aún no hay gastos categorizados este mes.";
    return reply(`Este mes has gastado ${formatMoney(expenses)}. ${topLine}`, [
      "¿En qué puedo ahorrar?",
      "¿Cómo van mis metas?",
    ]);
  }

  if (text.includes("ingres") || text.includes("cuánto dinero") || text.includes("cuanto dinero")) {
    return reply(`Este mes ingresaron ${formatMoney(income)}. El balance neto del mes es ${formatMoney(summary.net)}.`, [
      "¿Cuánto gasté este mes?",
    ]);
  }

  if (text.includes("puedo ahorrar") || text.includes("en qué puedo") || text.includes("en que puedo")) {
    const hint = top
      ? `Si reduces un 10% de ${top.name}, ahorrarías ${formatMoney(Math.round(top.amount * 0.1))} este mes.`
      : "Registra gastos unos días para detectar oportunidades.";
    const roundup = state.preferences.roundup.enabled
      ? "El redondeo automático ya está activo."
      : "También puedes activar el redondeo automático en Inicio.";
    return reply(`${hint} ${roundup}`);
  }

  if (text.includes("ahorr")) {
    const total = getSavingsTotal(state);
    const month = summary.saved;
    return reply(
      `Llevas ${formatMoney(total)} en metas de ahorro. Este mes has ahorrado ${formatMoney(month)} con redondeos y depósitos.`,
      ["¿Cómo van mis metas?", "¿En qué puedo ahorrar?"],
    );
  }

  if (text.includes("meta")) {
    if (!goals.length) return reply("Todavía no tienes metas. Crea una desde Inicio → Nueva Meta.", ["Nueva meta"]);
    const lines = goals
      .map((goal) => `• ${goal.name}: ${goal.pct}% (${formatMoney(goal.current)} de ${formatMoney(goal.target)})`)
      .join("\n");
    return reply(`Así van tus metas:\n${lines}`, ["¿Cuánto he ahorrado?"]);
  }

  if (text.includes("categoría") || text.includes("categoria") || text.includes("más gasto") || text.includes("mas gasto")) {
    if (!top) return reply("No hay suficientes gastos este mes para identificar una categoría líder.");
    return reply(`La categoría con más gastos es ${categoryById(top.id).name} con ${formatMoney(top.amount)} (${top.value}%).`);
  }

  if (text.includes("balance") || text.includes("tengo")) {
    return reply(`Tu balance total en cuentas conectadas es ${formatMoney(getCurrentBalance(state))}.`);
  }

  return reply(
    `Puedo consultar tus datos reales: gastos del mes, ingresos, metas, ahorros y categorías. ¿Qué quieres saber?`,
    ["¿Cuánto gasté este mes?", "¿Cuál es mi categoría con más gastos?", "¿Cómo van mis metas?"],
  );
}
