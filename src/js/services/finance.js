import { categoryById } from "../data/categories.js";
import { isSameMonth, monthKey, monthShort, startOfMonth } from "../utils/dates.js";
import { percent } from "../utils/format.js";
import { getState } from "./store.js";

export function getConnectedAccounts(state = getState()) {
  return state.accounts.filter((account) => account.connected);
}

export function getCurrentBalance(state = getState()) {
  return getConnectedAccounts(state).reduce((sum, account) => sum + Number(account.balance || 0), 0);
}

export function getSavingsTotal(state = getState()) {
  return state.goals.reduce((sum, goal) => sum + Number(goal.current || 0), 0);
}

export function getInvestedTotal(state = getState()) {
  return state.investments.reduce((sum, item) => sum + Number(item.current || 0), 0);
}

export function getInvestmentGain(item) {
  const invested = Number(item.invested || 0);
  const current = Number(item.current || 0);
  const gain = current - invested;
  const rate = invested ? (gain / invested) * 100 : 0;
  return { gain, rate };
}

export function monthTransactions(state = getState(), date = new Date()) {
  return state.transactions.filter((tx) => isSameMonth(tx.date, date));
}

export function getTotalIncome(state = getState(), date = new Date()) {
  return monthTransactions(state, date)
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function getTotalExpenses(state = getState(), date = new Date()) {
  return monthTransactions(state, date)
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function getMonthlySaved(state = getState(), date = new Date()) {
  return monthTransactions(state, date)
    .filter((tx) => tx.type === "saving")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function getMonthlyInvested(state = getState(), date = new Date()) {
  return monthTransactions(state, date)
    .filter((tx) => tx.type === "investment")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function getNetBalance(state = getState(), date = new Date()) {
  return getTotalIncome(state, date) - getTotalExpenses(state, date);
}

export function getMonthlySummary(state = getState(), date = new Date()) {
  const income = getTotalIncome(state, date);
  const expenses = getTotalExpenses(state, date);
  const saved = getMonthlySaved(state, date);
  const invested = getMonthlyInvested(state, date);
  return {
    income,
    expenses,
    saved,
    invested,
    net: income - expenses,
  };
}

export function getExpensesByCategory(state = getState(), date = new Date()) {
  const expenses = monthTransactions(state, date).filter((tx) => tx.type === "expense");
  const total = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  const grouped = new Map();
  expenses.forEach((tx) => {
    const current = grouped.get(tx.category) || 0;
    grouped.set(tx.category, current + tx.amount);
  });
  return [...grouped.entries()]
    .map(([id, amount]) => {
      const category = categoryById(id);
      return {
        id,
        name: category.name,
        color: category.color,
        amount,
        value: percent(amount, total),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function getSavingsTrend(state = getState(), months = 6) {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(date);
    const amount = state.transactions
      .filter((tx) => tx.type === "saving" && monthKey(tx.date) === key)
      .reduce((sum, tx) => sum + tx.amount, 0);
    buckets.push({ month: monthShort(date), amount, key });
  }
  return buckets;
}

export function getGoalProgress(goal) {
  const pct = Math.min(100, percent(goal.current, goal.target));
  return { ...goal, pct, remaining: Math.max(0, goal.target - goal.current) };
}

export function getRecentActivity(state = getState(), limit = 8) {
  return [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
}

export function monthChange(state = getState()) {
  const current = getNetBalance(state);
  const previousDate = new Date();
  previousDate.setMonth(previousDate.getMonth() - 1);
  const previous = getNetBalance(state, previousDate);
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

export function roundupAmount(amount, step = 1000) {
  if (!amount || amount % step === 0) return 0;
  return step - (amount % step);
}

export function topExpenseCategory(state = getState()) {
  return getExpensesByCategory(state)[0] || null;
}

export function averageCategorySpend(state, category, weeks = 4) {
  const cutoff = Date.now() - weeks * 7 * 86400000;
  const items = state.transactions.filter(
    (tx) => tx.type === "expense" && tx.category === category && new Date(tx.date).getTime() >= cutoff,
  );
  if (!items.length) return 0;
  return items.reduce((sum, tx) => sum + tx.amount, 0) / items.length;
}

export { startOfMonth };
