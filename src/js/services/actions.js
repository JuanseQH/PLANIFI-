import { uid } from "../utils/id.js";
import { nowIso } from "../utils/dates.js";
import { getState, patchState } from "./store.js";
import { roundupAmount } from "./finance.js";
import { grantXp, touchStreak } from "./gamification.js";
import { addNotification } from "./notifications.js";

function accountById(state, id) {
  return state.accounts.find((account) => account.id === id);
}

function bumpAccount(accounts, id, delta) {
  return accounts.map((account) =>
    account.id === id ? { ...account, balance: account.balance + delta } : account,
  );
}

export function addTransaction(input) {
  const state = getState();
  const tx = {
    id: uid("tx"),
    date: input.date || nowIso(),
    receipt: input.receipt || "",
    scheduled: Boolean(input.scheduled),
    frequency: input.frequency || "once",
    ...input,
  };

  let accounts = state.accounts;
  const primary = input.accountId || state.accounts.find((item) => item.connected)?.id;

  if (tx.type === "expense" && primary) {
    accounts = bumpAccount(accounts, primary, -tx.amount);
    tx.accountId = primary;
  }
  if (tx.type === "income" && primary) {
    accounts = bumpAccount(accounts, primary, tx.amount);
    tx.accountId = primary;
  }
  if (tx.type === "saving" && primary) {
    accounts = bumpAccount(accounts, primary, -tx.amount);
    tx.accountId = primary;
  }

  let goals = state.goals;
  if (tx.type === "saving" && tx.goalId) {
    goals = goals.map((goal) =>
      goal.id === tx.goalId
        ? {
            ...goal,
            current: goal.current + tx.amount,
            completed: goal.current + tx.amount >= goal.target,
          }
        : goal,
    );
  }

  let extra = [];
  if (tx.type === "expense" && state.preferences.roundup.enabled) {
    const extraAmount = roundupAmount(tx.amount, state.preferences.roundup.step);
    const savingsAccount = state.accounts.find((item) => item.type === "ahorros" && item.connected);
    const goal = state.goals.find((item) => !item.completed) || state.goals[0];
    if (extraAmount && savingsAccount) {
      extra.push({
        id: uid("tx"),
        type: "saving",
        amount: extraAmount,
        description: "Redondeo automático",
        category: "ahorro",
        accountId: primary,
        toAccountId: savingsAccount.id,
        goalId: goal?.id,
        date: tx.date,
      });
      accounts = bumpAccount(accounts, primary, -extraAmount);
      if (savingsAccount.id !== primary) {
        accounts = bumpAccount(accounts, savingsAccount.id, extraAmount);
      }
      if (goal) {
        goals = goals.map((item) =>
          item.id === goal.id
            ? {
                ...item,
                current: item.current + extraAmount,
                completed: item.current + extraAmount >= item.target,
              }
            : item,
        );
      }
    }
  }

  patchState((current) => ({
    ...current,
    accounts,
    goals,
    transactions: [tx, ...extra, ...current.transactions],
  }));

  touchStreak();
  if (tx.type === "expense") grantXp(15, "gasto");
  if (tx.type === "income") grantXp(20, "ingreso");
  if (tx.type === "saving") grantXp(25, "ahorro");

  const updatedGoal = getState().goals.find((goal) => goal.completed && goals.find((g) => g.id === goal.id && g.completed));
  if (updatedGoal) {
    grantXp(150, "meta");
    addNotification({
      type: "goal",
      title: "¡Meta alcanzada!",
      message: `Completaste ${updatedGoal.name}.`,
      action: { type: "navigate", route: "metas" },
    });
  }

  return tx;
}

export function updateTransaction(id, changes) {
  const state = getState();
  const previous = state.transactions.find((tx) => tx.id === id);
  if (!previous) return;
  removeTransaction(id);
  addTransaction({ ...previous, ...changes, id: uid("tx") });
}

export function removeTransaction(id) {
  patchState((state) => {
    const tx = state.transactions.find((item) => item.id === id);
    if (!tx) return state;
    let accounts = state.accounts;
    if (tx.type === "expense") accounts = bumpAccount(accounts, tx.accountId, tx.amount);
    if (tx.type === "income") accounts = bumpAccount(accounts, tx.accountId, -tx.amount);
    if (tx.type === "transfer") {
      accounts = bumpAccount(accounts, tx.accountId, tx.amount);
      accounts = bumpAccount(accounts, tx.toAccountId, -tx.amount);
    }
    if (tx.type === "saving") {
      accounts = bumpAccount(accounts, tx.accountId, tx.amount);
      if (tx.toAccountId && tx.toAccountId !== tx.accountId) {
        accounts = bumpAccount(accounts, tx.toAccountId, -tx.amount);
      }
    }
    let goals = state.goals;
    if (tx.type === "saving" && tx.goalId) {
      goals = goals.map((goal) =>
        goal.id === tx.goalId ? { ...goal, current: Math.max(0, goal.current - tx.amount), completed: false } : goal,
      );
    }
    return {
      ...state,
      accounts,
      goals,
      transactions: state.transactions.filter((item) => item.id !== id),
    };
  });
}

export function transfer({ fromId, toId, amount, description }) {
  if (fromId === toId || amount <= 0) return null;
  const from = accountById(getState(), fromId);
  if (!from || from.balance < amount) return null;

  patchState((state) => ({
    ...state,
    accounts: bumpAccount(bumpAccount(state.accounts, fromId, -amount), toId, amount),
    transactions: [
      {
        id: uid("tx"),
        type: "transfer",
        amount,
        description: description || "Transferencia",
        category: "transferencia",
        accountId: fromId,
        toAccountId: toId,
        date: nowIso(),
      },
      ...state.transactions,
    ],
  }));
  touchStreak();
  grantXp(10, "transferencia");
  return true;
}

export function upsertAccount(account) {
  patchState((state) => {
    if (account.id && state.accounts.some((item) => item.id === account.id)) {
      return {
        ...state,
        accounts: state.accounts.map((item) => (item.id === account.id ? { ...item, ...account } : item)),
      };
    }
    return { ...state, accounts: [...state.accounts, { connected: true, ...account, id: uid("acc") }] };
  });
}

export function removeAccount(id) {
  patchState((state) => ({
    ...state,
    accounts: state.accounts.filter((item) => item.id !== id),
  }));
}

export function upsertGoal(goal) {
  let created = false;
  patchState((state) => {
    if (goal.id && state.goals.some((item) => item.id === goal.id)) {
      return {
        ...state,
        goals: state.goals.map((item) => {
          if (item.id !== goal.id) return item;
          const next = { ...item, ...goal };
          next.completed = next.current >= next.target;
          return next;
        }),
      };
    }
    created = true;
    const createdGoal = {
      name: goal.name,
      target: Number(goal.target || 0),
      current: Number(goal.current || 0),
      deadline: goal.deadline,
      icon: goal.icon || "meta",
      id: uid("goal"),
      completed: Number(goal.current || 0) >= Number(goal.target || 0),
    };
    return { ...state, goals: [createdGoal, ...state.goals] };
  });
  if (created) grantXp(30, "meta-nueva");
}

export function contributeToGoal(id, amount, accountId) {
  if (amount <= 0) return;
  addTransaction({
    type: "saving",
    amount,
    description: "Depósito a meta",
    category: "ahorro",
    accountId,
    goalId: id,
  });
}

export function removeGoal(id) {
  patchState((state) => ({
    ...state,
    goals: state.goals.filter((item) => item.id !== id),
  }));
}

export function upsertInvestment(item) {
  patchState((state) => {
    if (item.id && state.investments.some((inv) => inv.id === item.id)) {
      return {
        ...state,
        investments: state.investments.map((inv) => (inv.id === item.id ? { ...inv, ...item } : inv)),
      };
    }
    return { ...state, investments: [{ ...item, id: uid("inv") }, ...state.investments] };
  });
}

export function removeInvestment(id) {
  patchState((state) => ({
    ...state,
    investments: state.investments.filter((item) => item.id !== id),
  }));
}

export function processScheduled() {
  const today = new Date().toISOString().slice(0, 10);
  const due = getState().scheduled.filter((item) => item.nextDate <= today);
  due.forEach((item) => {
    addTransaction({
      type: item.type,
      amount: item.amount,
      description: item.description,
      category: item.category,
      accountId: item.accountId,
    });
    patchState((state) => ({
      ...state,
      scheduled: state.scheduled
        .filter((row) => row.id !== item.id)
        .concat(
          item.frequency === "once"
            ? []
            : [
                {
                  ...item,
                  nextDate: nextDate(item.nextDate, item.frequency),
                },
              ],
        ),
    }));
  });
}

function nextDate(isoDate, frequency) {
  const date = new Date(isoDate);
  if (frequency === "weekly") date.setDate(date.getDate() + 7);
  if (frequency === "monthly") date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

export function scheduleTransaction(item) {
  patchState((state) => ({
    ...state,
    scheduled: [...state.scheduled, { id: uid("sch"), ...item }],
  }));
}
