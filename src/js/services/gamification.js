import { getGoalProgress, getMonthlySummary, getSavingsTotal } from "./finance.js";
import { getState, patchState } from "./store.js";

export const ACHIEVEMENTS = [
  { id: "first-expense", name: "Primer registro", description: "Registra tu primer gasto", reward: "50 XP" },
  { id: "first-income", name: "Primer ingreso", description: "Registra un ingreso", reward: "50 XP" },
  { id: "first-million", name: "Primer millón ahorrado", description: "Acumula $1.000.000 en metas", reward: "150 XP" },
  { id: "goal-done", name: "Meta completada", description: "Completa una meta de ahorro", reward: "150 XP" },
  { id: "streak-7", name: "Racha de 7 días", description: "Registra movimientos 7 días seguidos", reward: "100 XP" },
  { id: "under-budget", name: "Bajo presupuesto", description: "Termina el mes con gastos menores a ingresos", reward: "120 XP" },
];

export const CHALLENGES = [
  { id: "challenge-spendless", title: "Semana sin gastos innecesarios", description: "Limita entretenimiento y compras 7 días", difficulty: "medium", reward: "200 XP" },
  { id: "challenge-save", title: "Ahorro express", description: "Ahorra $300.000 este mes", difficulty: "easy", reward: "150 XP" },
  { id: "challenge-budget", title: "Maestro del presupuesto", description: "Mantén gastos por debajo de ingresos", difficulty: "hard", reward: "500 XP" },
];

export function grantXp(amount, reason) {
  patchState((state) => {
    const xp = state.gamification.xp + amount;
    return {
      ...state,
      gamification: { ...state.gamification, xp, lastReason: reason },
    };
  });
}

export function touchStreak() {
  const today = new Date().toISOString().slice(0, 10);
  patchState((state) => {
    const last = state.gamification.lastActivityDate;
    let streak = state.gamification.streak || 0;
    if (last === today) return state;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streak = last === yesterday ? streak + 1 : 1;
    return {
      ...state,
      gamification: { ...state.gamification, streak, lastActivityDate: today },
    };
  });
}

export function achievementProgress(state = getState()) {
  const expenses = state.transactions.filter((tx) => tx.type === "expense").length;
  const incomes = state.transactions.filter((tx) => tx.type === "income").length;
  const savings = getSavingsTotal(state);
  const summary = getMonthlySummary(state);
  return ACHIEVEMENTS.map((item) => {
    let progress = 0;
    let max = 1;
    let completed = false;
    if (item.id === "first-expense") {
      progress = Math.min(1, expenses);
      completed = expenses > 0;
    }
    if (item.id === "first-income") {
      progress = Math.min(1, incomes);
      completed = incomes > 0;
    }
    if (item.id === "first-million") {
      max = 1000000;
      progress = Math.min(max, savings);
      completed = savings >= 1000000;
    }
    if (item.id === "goal-done") {
      progress = state.goals.filter((goal) => goal.completed || getGoalProgress(goal).pct >= 100).length;
      completed = progress > 0;
    }
    if (item.id === "streak-7") {
      max = 7;
      progress = Math.min(7, state.gamification.streak || 0);
      completed = progress >= 7;
    }
    if (item.id === "under-budget") {
      completed = summary.income > 0 && summary.expenses <= summary.income;
      progress = completed ? 1 : 0;
    }
    return { ...item, progress, maxProgress: max, completed };
  });
}

export function challengeProgress(state = getState()) {
  const summary = getMonthlySummary(state);
  const entertainment = state.transactions.filter(
    (tx) => tx.type === "expense" && ["entretenimiento", "compras"].includes(tx.category),
  );
  return CHALLENGES.map((item) => {
    let progress = 0;
    if (item.id === "challenge-save") progress = Math.min(100, Math.round((summary.saved / 300000) * 100));
    if (item.id === "challenge-budget") {
      progress = summary.income ? Math.min(100, Math.round((1 - summary.expenses / summary.income) * 100 + 50)) : 0;
      progress = Math.max(0, Math.min(100, progress));
    }
    if (item.id === "challenge-spendless") {
      progress = entertainment.length ? Math.max(10, 100 - entertainment.length * 12) : 40;
    }
    return {
      ...item,
      progress,
      joined: state.gamification.joinedChallenges.includes(item.id),
    };
  });
}

export function levelFromXp(xp) {
  return Math.max(1, Math.floor(xp / 400) + 1);
}

export function nextLevelXp(xp) {
  const level = levelFromXp(xp);
  return level * 400;
}
