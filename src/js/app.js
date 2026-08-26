import { initRouter, navigate, parseHash } from "./router.js";
import { mountBottomNavigation, syncBottomNavigation } from "./components/bottom-navigation.js";
import { closeSheet, isSheetOpen, openSheetMarkup } from "./components/sheet.js";
import {
  accountSheet,
  contributeSheet,
  expenseSheet,
  fabMenu,
  goalSheet,
  incomeSheet,
  investmentSheet,
  pinSheet,
  roundupSheet,
  transferSheet,
} from "./components/sheets.js";
import { bindAmountInput, confirmAction, startVoice } from "./components/dom.js";
import { icon } from "./components/icons.js";
import { renderHeader } from "./components/header.js";
import { showToast } from "./components/toast.js";
import { renderHome } from "./views/home.js";
import { renderAnalisis } from "./views/analisis.js";
import { renderAjustes } from "./views/ajustes.js";
import { renderCuenta, renderCuentas, renderInversiones, renderMetas, renderMovimientos } from "./views/secondary.js";
import { pushChat, renderChatbot, renderGamificacion, renderNotificaciones } from "./views/extra.js";
import {
  addTransaction,
  contributeToGoal,
  processScheduled,
  removeAccount,
  removeGoal,
  removeInvestment,
  removeTransaction,
  scheduleTransaction,
  transfer,
  updateTransaction,
  upsertAccount,
  upsertGoal,
  upsertInvestment,
} from "./services/actions.js";
import { getState, patchState, resetState, subscribe } from "./services/store.js";
import { dismissNotification, markAllRead, markRead, refreshInsights } from "./services/notifications.js";
import { parseAmount } from "./utils/format.js";
import { formatDateInput } from "./utils/dates.js";

let currentRoute = "inicio";
let userMenuOpen = false;
let fabOpen = false;
let eventsBound = false;
let pendingReceipt = "";
let txFilter = { type: "todos", category: "", q: "" };

function applyTheme(theme = getState().preferences.theme) {
  document.documentElement.dataset.theme = theme === "oscuro" ? "oscuro" : "claro";
}

function renderMain() {
  const main = document.getElementById("app-main");
  if (!main) return;
  const views = {
    inicio: renderHome,
    analisis: renderAnalisis,
    ajustes: renderAjustes,
    cuenta: renderCuenta,
    metas: renderMetas,
    movimientos: () => renderMovimientos(txFilter),
    cuentas: renderCuentas,
    inversiones: renderInversiones,
    gamificacion: renderGamificacion,
    chatbot: renderChatbot,
    notificaciones: renderNotificaciones,
  };
  main.innerHTML = (views[currentRoute] || renderHome)();
}

function renderChrome() {
  const header = document.getElementById("app-header");
  if (header) header.innerHTML = renderHeader(currentRoute, { userOpen: userMenuOpen });
  syncBottomNavigation(currentRoute);
  renderFab();
}

function renderFab() {
  const root = document.getElementById("fab-root");
  if (!root) return;
  const hide = currentRoute === "chatbot";
  root.hidden = hide;
  if (hide) return;
  root.innerHTML = `
    ${fabOpen ? fabMenu() : ""}
    <button class="fab" type="button" data-toggle-fab aria-label="Agregar" aria-expanded="${fabOpen}">
      ${icon("plus")}
    </button>
  `;
}

function renderApp() {
  const activeId = document.activeElement?.id;
  applyTheme();
  renderChrome();
  renderMain();
  if (activeId) {
    const el = document.getElementById(activeId);
    if (el && typeof el.focus === "function") {
      el.focus();
      if (el.tagName === "INPUT" && "setSelectionRange" in el) {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
  }
}

function showScreen(route) {
  currentRoute = route;
  userMenuOpen = false;
  fabOpen = false;
  closeSheet();
  renderApp();
}

function openNamedSheet(name, payload) {
  const state = getState();
  const markup = {
    expense: () => expenseSheet(),
    income: () => incomeSheet(),
    goal: () => goalSheet(),
    account: () => accountSheet(),
    transfer: () => transferSheet(),
    investment: () => investmentSheet(),
    roundup: () => roundupSheet(),
    pin: () => pinSheet(),
    contribute: () => contributeSheet(payload),
  }[name];
  if (!markup) return;
  pendingReceipt = "";
  fabOpen = false;
  renderFab();
  openSheetMarkup(markup());
  document.querySelectorAll('#sheet input[inputmode="numeric"]').forEach(bindAmountInput);
  void state;
}

function bindSheetExtras() {
  document.querySelectorAll('#sheet input[inputmode="numeric"]').forEach(bindAmountInput);
}

function formValues(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function isoFromDate(value) {
  if (!value) return new Date().toISOString();
  return new Date(`${value}T12:00:00`).toISOString();
}

function handleExpenseSubmit(form) {
  const values = formValues(form);
  const amount = parseAmount(values.amount);
  if (!amount) {
    showToast("Ingresa un monto válido.");
    return;
  }
  if (!values.category) {
    showToast("Selecciona una categoría.");
    return;
  }
  const payload = {
    type: "expense",
    amount,
    description: values.description?.trim() || "Gasto",
    category: values.category,
    accountId: values.accountId,
    date: isoFromDate(values.date),
    receipt: pendingReceipt,
  };
  const editId = form.dataset.id;
  const scheduleBox = form.querySelector(".schedule-box");
  const scheduled = scheduleBox && !scheduleBox.hidden;
  const today = formatDateInput();
  if (scheduled && (values.frequency !== "once" || values.date > today)) {
    if (values.date <= today) {
      if (editId) updateTransaction(editId, payload);
      else addTransaction(payload);
    }
    scheduleTransaction({
      type: "expense",
      amount,
      description: payload.description,
      category: payload.category,
      accountId: payload.accountId,
      frequency: values.frequency,
      nextDate:
        values.frequency === "once" || values.date > today
          ? values.date
          : nextOccurrence(values.date, values.frequency),
    });
    closeSheet();
    showToast(values.frequency === "once" ? "Gasto programado." : "Gasto guardado y programado.");
    return;
  }
  if (editId) updateTransaction(editId, payload);
  else addTransaction(payload);
  closeSheet();
  showToast("✓ Gasto registrado");
}

function nextOccurrence(date, frequency) {
  const d = new Date(`${date}T12:00:00`);
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function handleIncomeSubmit(form) {
  const values = formValues(form);
  const amount = parseAmount(values.amount);
  if (!amount) {
    showToast("Ingresa un monto válido.");
    return;
  }
  const payload = {
    type: "income",
    amount,
    description: values.description?.trim() || "Ingreso",
    category: values.category || "trabajo",
    accountId: values.accountId,
    date: isoFromDate(values.date),
  };
  const editId = form.dataset.id;
  if (editId) updateTransaction(editId, payload);
  else addTransaction(payload);
  closeSheet();
  showToast("✓ Ingreso registrado");
}

function handleGoalSubmit(form) {
  const values = formValues(form);
  const target = parseAmount(values.target);
  if (!values.name?.trim() || !target) {
    showToast("Completa el nombre y el objetivo.");
    return;
  }
  upsertGoal({
    id: form.dataset.id || undefined,
    name: values.name.trim(),
    target,
    current: parseAmount(values.current),
    deadline: values.deadline ? isoFromDate(values.deadline) : isoFromDate(formatDateInput()),
  });
  closeSheet();
  showToast(form.dataset.id ? "✓ Meta actualizada" : "✓ Meta creada");
}

function handleNoteAction(id) {
  const note = getState().notifications.find((item) => item.id === id);
  if (!note?.action) return;
  markRead(id);
  if (note.action.type === "navigate") navigate(note.action.route);
  if (note.action.type === "enable-roundup") {
    patchState((state) => ({
      ...state,
      preferences: { ...state.preferences, roundup: { ...state.preferences.roundup, enabled: true } },
    }));
    showToast("Redondeo automático activado.");
  }
}

function setNestedPref(path, value) {
  patchState((state) => {
    const preferences = structuredClone(state.preferences);
    const keys = path.split(".");
    let cursor = preferences;
    keys.slice(0, -1).forEach((key) => {
      cursor = cursor[key];
    });
    cursor[keys.at(-1)] = value;
    return { ...state, preferences };
  });
}

async function handleClick(event) {
  const target = event.target.closest("[data-go], [data-sheet], [data-close-sheet], [data-toggle-fab], [data-toggle-user], [data-action], [data-filter-type], [data-filter-cat], [data-edit-tx], [data-del-tx], [data-edit-goal], [data-del-goal], [data-edit-account], [data-del-account], [data-edit-inv], [data-del-inv], [data-logout], [data-reset], [data-read-all], [data-note-action], [data-note-read], [data-note-del], [data-cycle-theme], [data-toast], [data-voice], [data-show-schedule], [data-suggest]");
  if (!target) {
    if (!event.target.closest(".user-menu") && !event.target.closest("[data-toggle-user]")) {
      if (userMenuOpen) {
        userMenuOpen = false;
        renderChrome();
      }
    }
    if (!event.target.closest("#fab-root") && fabOpen) {
      fabOpen = false;
      renderFab();
    }
    return;
  }

  if (target.dataset.go) {
    event.preventDefault();
    userMenuOpen = false;
    navigate(target.dataset.go);
    return;
  }

  if (target.dataset.sheet) {
    event.preventDefault();
    openNamedSheet(target.dataset.sheet, target.dataset.goal);
    bindSheetExtras();
    return;
  }

  if (target.closest("[data-close-sheet]")) {
    closeSheet();
    return;
  }

  if (target.dataset.toggleFab != null) {
    fabOpen = !fabOpen;
    renderFab();
    return;
  }

  if (target.dataset.toggleUser != null) {
    userMenuOpen = !userMenuOpen;
    renderChrome();
    return;
  }

  if (target.dataset.action === "toggle-balance") {
    patchState((state) => ({
      ...state,
      preferences: { ...state.preferences, hideBalance: !state.preferences.hideBalance },
    }));
    return;
  }

  if (target.dataset.filterType) {
    txFilter = { ...txFilter, type: target.dataset.filterType };
    renderMain();
    return;
  }

  if (target.dataset.filterCat) {
    txFilter = {
      ...txFilter,
      category: txFilter.category === target.dataset.filterCat ? "" : target.dataset.filterCat,
    };
    renderMain();
    return;
  }

  if (target.dataset.editTx) {
    const tx = getState().transactions.find((item) => item.id === target.dataset.editTx);
    if (!tx) return;
    if (tx.type === "income") openSheetMarkup(incomeSheet(tx));
    else openSheetMarkup(expenseSheet(tx));
    bindSheetExtras();
    return;
  }

  if (target.dataset.delTx) {
    const ok = await confirmAction("¿Eliminar este movimiento? Los saldos se recalcularán.");
    if (!ok) return;
    removeTransaction(target.dataset.delTx);
    showToast("Movimiento eliminado.");
    return;
  }

  if (target.dataset.editGoal) {
    const goal = getState().goals.find((item) => item.id === target.dataset.editGoal);
    if (goal) {
      openSheetMarkup(goalSheet(goal));
      bindSheetExtras();
    }
    return;
  }

  if (target.dataset.delGoal) {
    const ok = await confirmAction("¿Eliminar esta meta? Esta acción no se puede deshacer.");
    if (!ok) return;
    removeGoal(target.dataset.delGoal);
    showToast("Meta eliminada.");
    return;
  }

  if (target.dataset.editAccount) {
    const account = getState().accounts.find((item) => item.id === target.dataset.editAccount);
    if (account) {
      openSheetMarkup(accountSheet(account));
      bindSheetExtras();
    }
    return;
  }

  if (target.dataset.delAccount) {
    const ok = await confirmAction("¿Eliminar esta cuenta? Las transacciones asociadas se conservan.");
    if (!ok) return;
    removeAccount(target.dataset.delAccount);
    showToast("Cuenta eliminada.");
    return;
  }

  if (target.dataset.editInv) {
    const item = getState().investments.find((inv) => inv.id === target.dataset.editInv);
    if (item) {
      openSheetMarkup(investmentSheet(item));
      bindSheetExtras();
    }
    return;
  }

  if (target.dataset.delInv) {
    const ok = await confirmAction("¿Eliminar esta inversión?");
    if (!ok) return;
    removeInvestment(target.dataset.delInv);
    showToast("Inversión eliminada.");
    return;
  }

  if (target.dataset.logout != null) {
    userMenuOpen = false;
    showToast("Sesión cerrada en este dispositivo.");
    navigate("inicio");
    return;
  }

  if (target.dataset.reset != null) {
    const ok = await confirmAction("¿Restablecer los datos de demostración? Se perderán los cambios locales.");
    if (!ok) return;
    resetState();
    showToast("Datos demo restaurados.");
    return;
  }

  if (target.dataset.readAll != null) {
    markAllRead();
    return;
  }

  if (target.dataset.noteAction) {
    handleNoteAction(target.dataset.noteAction);
    return;
  }

  if (target.dataset.noteRead) {
    markRead(target.dataset.noteRead);
    return;
  }

  if (target.dataset.noteDel) {
    dismissNotification(target.dataset.noteDel);
    return;
  }

  if (target.dataset.cycleTheme != null) {
    const next = getState().preferences.theme === "oscuro" ? "claro" : "oscuro";
    patchState((state) => ({
      ...state,
      preferences: { ...state.preferences, theme: next },
    }));
    showToast(`Tema ${next}.`);
    return;
  }

  if (target.dataset.toast) {
    showToast(target.dataset.toast);
    return;
  }

  if (target.dataset.voice) {
    const input = target.closest("label")?.querySelector("input[name='description']");
    const status = target.closest("label")?.querySelector(".voice-status");
    startVoice(
      (text) => {
        if (input) input.value = text;
      },
      (state) => {
        if (!status) return;
        if (state === "unavailable") {
          status.hidden = false;
          status.textContent = "El reconocimiento de voz no está disponible en este navegador.";
          return;
        }
        status.hidden = state === "idle";
        status.textContent = state === "listening" ? "Escuchando…" : state === "error" ? "No se pudo escuchar. Intenta de nuevo." : "";
      },
    );
    return;
  }

  if (target.dataset.showSchedule != null) {
    const box = document.querySelector(".schedule-box");
    if (box) box.hidden = !box.hidden;
    return;
  }

  if (target.dataset.suggest) {
    pushChat(target.dataset.suggest);
    renderMain();
    document.getElementById("chat-log")?.scrollTo(0, 9999);
  }
}

function handleChange(event) {
  const accountToggle = event.target.closest("[data-toggle-account]");
  if (accountToggle) {
    const id = accountToggle.dataset.toggleAccount;
    patchState((state) => ({
      ...state,
      accounts: state.accounts.map((account) =>
        account.id === id ? { ...account, connected: accountToggle.checked } : account,
      ),
    }));
    return;
  }

  const ruleToggle = event.target.closest("[data-toggle-rule]");
  if (ruleToggle) {
    const id = ruleToggle.dataset.toggleRule;
    patchState((state) => {
      const savingRules = state.savingRules.map((rule) =>
        rule.id === id ? { ...rule, active: ruleToggle.checked } : rule,
      );
      const roundupRule = savingRules.find((rule) => rule.type === "roundup");
      return {
        ...state,
        savingRules,
        preferences: {
          ...state.preferences,
          roundup: {
            ...state.preferences.roundup,
            enabled: roundupRule ? roundupRule.active : state.preferences.roundup.enabled,
          },
        },
      };
    });
    return;
  }

  const pref = event.target.closest("[data-pref]");
  if (pref) {
    setNestedPref(pref.dataset.pref, pref.checked);
    return;
  }

  const receipt = event.target.closest('input[name="receipt"]');
  if (receipt?.files?.[0]) {
    const file = receipt.files[0];
    if (file.size > 350000) {
      showToast("La foto es grande; se muestra vista previa pero no se guarda completa.");
    }
    const reader = new FileReader();
    reader.onload = () => {
      pendingReceipt = file.size > 350000 ? "" : String(reader.result || "");
      const preview = document.querySelector(".receipt-preview");
      if (preview) {
        preview.src = String(reader.result || "");
        preview.hidden = false;
      }
    };
    reader.readAsDataURL(file);
  }
}

function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  if (form.id === "chat-form") {
    event.preventDefault();
    const input = form.querySelector("#chat-input");
    const text = input?.value.trim();
    if (!text) return;
    pushChat(text);
    input.value = "";
    renderMain();
    document.getElementById("chat-log")?.scrollTo(0, 9999);
    return;
  }

  if (!form.closest("#sheet")) return;
  event.preventDefault();

  if (form.id === "form-expense") handleExpenseSubmit(form);
  if (form.id === "form-income") handleIncomeSubmit(form);
  if (form.id === "form-goal") handleGoalSubmit(form);
  if (form.id === "form-contribute") {
    const amount = parseAmount(form.amount.value);
    if (!amount) {
      showToast("Ingresa un monto válido.");
      return;
    }
    contributeToGoal(form.dataset.goal, amount, form.accountId.value);
    closeSheet();
    showToast("✓ Ahorro registrado");
  }
  if (form.id === "form-account") {
    const balance = parseAmount(form.balance.value);
    upsertAccount({
      id: form.dataset.id || undefined,
      bank: form.bank.value.trim(),
      name: form.name.value.trim() || form.bank.value.trim(),
      type: form.type.value,
      balance,
      last4: form.last4.value.trim(),
      connected: true,
    });
    closeSheet();
    showToast("✓ Cuenta vinculada");
  }
  if (form.id === "form-transfer") {
    const amount = parseAmount(form.amount.value);
    const ok = transfer({
      fromId: form.fromId.value,
      toId: form.toId.value,
      amount,
      description: form.description.value.trim(),
    });
    if (!ok) {
      showToast("Revisa cuentas y saldo disponible.");
      return;
    }
    closeSheet();
    showToast("✓ Transferencia realizada");
  }
  if (form.id === "form-investment") {
    upsertInvestment({
      id: form.dataset.id || undefined,
      name: form.name.value.trim(),
      invested: parseAmount(form.invested.value),
      current: parseAmount(form.current.value),
      date: isoFromDate(form.date.value),
    });
    closeSheet();
    showToast("✓ Inversión guardada");
  }
  if (form.id === "form-roundup") {
    patchState((state) => ({
      ...state,
      preferences: {
        ...state.preferences,
        roundup: { enabled: form.enabled.checked, step: Number(form.step.value) },
      },
      savingRules: state.savingRules.map((rule) =>
        rule.type === "roundup"
          ? { ...rule, active: form.enabled.checked, amount: `$${Number(form.step.value).toLocaleString("es-CO")}` }
          : rule,
      ),
    }));
    closeSheet();
    showToast("Preferencia de redondeo guardada.");
  }
  if (form.id === "form-pin") {
    const pin = form.pin.value.trim();
    if (!/^\d{4}$/.test(pin)) {
      showToast("El PIN debe tener 4 dígitos.");
      return;
    }
    patchState((state) => ({
      ...state,
      preferences: { ...state.preferences, pin },
    }));
    closeSheet();
    showToast("PIN local guardado.");
  }
}

function handleInput(event) {
  if (event.target.id === "tx-search") {
    txFilter = { ...txFilter, q: event.target.value };
    const active = document.getElementById("tx-search");
    const start = active?.selectionStart;
    renderMain();
    const next = document.getElementById("tx-search");
    if (next) {
      next.focus();
      if (typeof start === "number") next.setSelectionRange(start, start);
    }
  }
}

function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;
  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("input", handleInput);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (isSheetOpen()) closeSheet();
    else if (userMenuOpen || fabOpen) {
      userMenuOpen = false;
      fabOpen = false;
      renderChrome();
    }
  });
}

export function initApp() {
  getState();
  processScheduled();
  refreshInsights();
  applyTheme();
  mountBottomNavigation(document.getElementById("bottom-nav"));
  bindEvents();
  subscribe(() => {
    applyTheme();
    renderChrome();
    renderMain();
  });
  initRouter(showScreen);
}
