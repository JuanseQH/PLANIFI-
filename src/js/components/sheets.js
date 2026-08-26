import { icon } from "./icons.js";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, ACCOUNT_TYPES } from "../data/categories.js";
import { formatDateInput } from "../utils/dates.js";
import { getState } from "../services/store.js";

function accountOptions(selectedId) {
  return getState()
    .accounts.map((a) => `<option value="${a.id}" ${a.id === selectedId ? "selected" : ""}>${a.bank}</option>`)
    .join("");
}

export function expenseSheet(tx = null) {
  const state = getState();
  const value = tx || {
    amount: "",
    description: "",
    category: "",
    accountId: state.accounts[0]?.id,
    date: formatDateInput(),
  };
  return `
    <div class="sheet-card bottom" role="dialog" aria-labelledby="sheet-title">
      <div class="sheet-head">
        <h3 id="sheet-title">${tx ? "Editar gasto" : "Agregar gasto rápido"}</h3>
        <button class="icon-btn" type="button" data-close-sheet aria-label="Cerrar">${icon("x")}</button>
      </div>
      <form id="form-expense" class="sheet-body" data-id="${tx?.id || ""}">
        <label>Monto
          <input name="amount" inputmode="numeric" required value="${value.amount ? Number(value.amount).toLocaleString("es-CO") : ""}" placeholder="0" autocomplete="off" />
        </label>
        <label>Descripción
          <div class="with-action">
            <input name="description" value="${value.description || ""}" placeholder="¿En qué gastaste?" autocomplete="off" />
            <button class="icon-btn" type="button" data-voice="description" aria-label="Dictar">${icon("mic")}</button>
          </div>
          <small class="voice-status" hidden></small>
        </label>
        <p class="field-caption">Categoría</p>
        <div class="cat-grid">
          ${EXPENSE_CATEGORIES.map(
            (cat) =>
              `<label class="cat ${value.category === cat.id ? "is-on" : ""}"><input type="radio" name="category" value="${cat.id}" ${value.category === cat.id ? "checked" : ""} /><span>${cat.name}</span></label>`,
          ).join("")}
        </div>
        <label>Cuenta
          <select name="accountId">${accountOptions(value.accountId)}</select>
        </label>
        <label>Fecha
          <input type="date" name="date" value="${value.date?.slice?.(0, 10) || formatDateInput()}" />
        </label>
        <div class="row-actions">
          <label class="btn btn-outline file-btn">${icon("camera")} Foto recibo<input type="file" name="receipt" accept="image/*" capture="environment" hidden /></label>
          <button class="btn btn-outline" type="button" data-show-schedule>${icon("calendar")} Programar</button>
        </div>
        <img class="receipt-preview" alt="Vista previa del recibo" hidden />
        <div class="schedule-box" hidden>
          <label>Frecuencia
            <select name="frequency">
              <option value="once">Una vez</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </label>
          <p class="muted">Se registrará en la fecha elegida al abrir la app. No envía notificaciones del sistema.</p>
        </div>
        <div class="row-actions">
          <button class="btn btn-outline" type="button" data-close-sheet>Cancelar</button>
          <button class="btn" type="submit">Guardar gasto</button>
        </div>
      </form>
    </div>
  `;
}

export function incomeSheet(tx = null) {
  const state = getState();
  const value = tx || {
    amount: "",
    description: "",
    category: "trabajo",
    accountId: state.accounts[0]?.id,
    date: formatDateInput(),
  };
  return `
    <div class="sheet-card bottom" role="dialog" aria-labelledby="sheet-title">
      <div class="sheet-head">
        <h3 id="sheet-title">${tx ? "Editar ingreso" : "Agregar ingreso"}</h3>
        <button class="icon-btn" type="button" data-close-sheet aria-label="Cerrar">${icon("x")}</button>
      </div>
      <form id="form-income" class="sheet-body" data-id="${tx?.id || ""}">
        <label>Monto
          <input name="amount" inputmode="numeric" required value="${value.amount ? Number(value.amount).toLocaleString("es-CO") : ""}" placeholder="0" autocomplete="off" />
        </label>
        <label>Fuente / descripción
          <input name="description" value="${value.description || ""}" placeholder="Ej. Nómina" autocomplete="off" />
        </label>
        <p class="field-caption">Categoría</p>
        <div class="cat-grid">
          ${INCOME_CATEGORIES.map(
            (cat) =>
              `<label class="cat ${value.category === cat.id ? "is-on" : ""}"><input type="radio" name="category" value="${cat.id}" ${value.category === cat.id ? "checked" : ""} /><span>${cat.name}</span></label>`,
          ).join("")}
        </div>
        <label>Cuenta
          <select name="accountId">${accountOptions(value.accountId)}</select>
        </label>
        <label>Fecha
          <input type="date" name="date" value="${value.date?.slice?.(0, 10) || formatDateInput()}" />
        </label>
        <button class="btn full" type="submit">Guardar ingreso</button>
      </form>
    </div>
  `;
}

export function goalSheet(goal = null) {
  return `
    <div class="sheet-card bottom" role="dialog">
      <div class="sheet-head">
        <h3>${goal ? "Editar meta" : "Nueva meta"}</h3>
        <button class="icon-btn" type="button" data-close-sheet aria-label="Cerrar">${icon("x")}</button>
      </div>
      <form id="form-goal" class="sheet-body" data-id="${goal?.id || ""}">
        <label>Nombre<input name="name" required value="${goal?.name || ""}" placeholder="Ej. Vacaciones" /></label>
        <label>Objetivo<input name="target" inputmode="numeric" required value="${goal ? Number(goal.target).toLocaleString("es-CO") : ""}" /></label>
        <label>Cantidad inicial<input name="current" inputmode="numeric" value="${goal ? Number(goal.current).toLocaleString("es-CO") : "0"}" /></label>
        <label>Fecha límite<input type="date" name="deadline" value="${goal?.deadline?.slice(0, 10) || ""}" /></label>
        <button class="btn full" type="submit">Guardar meta</button>
      </form>
    </div>
  `;
}

export function contributeSheet(goalId) {
  const state = getState();
  return `
    <div class="sheet-card bottom" role="dialog">
      <div class="sheet-head">
        <h3>Añadir a la meta</h3>
        <button class="icon-btn" type="button" data-close-sheet aria-label="Cerrar">${icon("x")}</button>
      </div>
      <form id="form-contribute" class="sheet-body" data-goal="${goalId}">
        <label>Monto<input name="amount" inputmode="numeric" required /></label>
        <label>Desde
          <select name="accountId">
            ${state.accounts.map((a) => `<option value="${a.id}">${a.bank} (${a.balance.toLocaleString("es-CO")})</option>`).join("")}
          </select>
        </label>
        <button class="btn full" type="submit">Depositar</button>
      </form>
    </div>
  `;
}

export function accountSheet(account = null) {
  return `
    <div class="sheet-card bottom" role="dialog">
      <div class="sheet-head">
        <h3>${account ? "Editar cuenta" : "Vincular cuenta"}</h3>
        <button class="icon-btn" type="button" data-close-sheet aria-label="Cerrar">${icon("x")}</button>
      </div>
      <form id="form-account" class="sheet-body" data-id="${account?.id || ""}">
        <label>Entidad<input name="bank" required value="${account?.bank || ""}" placeholder="Bancolombia" /></label>
        <label>Nombre<input name="name" value="${account?.name || ""}" placeholder="Cuenta ahorro" /></label>
        <label>Tipo
          <select name="type">
            ${ACCOUNT_TYPES.map((t) => `<option value="${t.id}" ${account?.type === t.id ? "selected" : ""}>${t.name}</option>`).join("")}
          </select>
        </label>
        <label>Saldo inicial<input name="balance" inputmode="numeric" required value="${account ? Number(account.balance).toLocaleString("es-CO") : ""}" /></label>
        <label>Últimos 4 dígitos<input name="last4" maxlength="4" inputmode="numeric" value="${account?.last4 || ""}" /></label>
        <button class="btn full" type="submit">Guardar cuenta</button>
      </form>
    </div>
  `;
}

export function transferSheet() {
  const state = getState();
  const options = state.accounts.map((a) => `<option value="${a.id}">${a.bank}</option>`).join("");
  return `
    <div class="sheet-card bottom" role="dialog">
      <div class="sheet-head">
        <h3>Transferir</h3>
        <button class="icon-btn" type="button" data-close-sheet aria-label="Cerrar">${icon("x")}</button>
      </div>
      <form id="form-transfer" class="sheet-body">
        <label>Origen<select name="fromId">${options}</select></label>
        <label>Destino<select name="toId">${options}</select></label>
        <label>Monto<input name="amount" inputmode="numeric" required /></label>
        <label>Descripción<input name="description" placeholder="Transferencia" /></label>
        <button class="btn full" type="submit">Transferir</button>
      </form>
    </div>
  `;
}

export function investmentSheet(item = null) {
  return `
    <div class="sheet-card bottom" role="dialog">
      <div class="sheet-head">
        <h3>${item ? "Editar inversión" : "Nueva inversión"}</h3>
        <button class="icon-btn" type="button" data-close-sheet aria-label="Cerrar">${icon("x")}</button>
      </div>
      <form id="form-investment" class="sheet-body" data-id="${item?.id || ""}">
        <label>Nombre<input name="name" required value="${item?.name || ""}" /></label>
        <label>Monto invertido<input name="invested" inputmode="numeric" required value="${item ? Number(item.invested).toLocaleString("es-CO") : ""}" /></label>
        <label>Valor actual<input name="current" inputmode="numeric" required value="${item ? Number(item.current).toLocaleString("es-CO") : ""}" /></label>
        <label>Fecha<input type="date" name="date" value="${item?.date?.slice(0, 10) || formatDateInput()}" /></label>
        <button class="btn full" type="submit">Guardar</button>
      </form>
    </div>
  `;
}

export function roundupSheet() {
  const r = getState().preferences.roundup;
  return `
    <div class="sheet-card bottom" role="dialog">
      <div class="sheet-head">
        <h3>Redondeo automático</h3>
        <button class="icon-btn" type="button" data-close-sheet aria-label="Cerrar">${icon("x")}</button>
      </div>
      <form id="form-roundup" class="sheet-body">
        <label class="rule-row">
          <span>Activar redondeo</span>
          <label class="switch"><input type="checkbox" name="enabled" ${r.enabled ? "checked" : ""} /><span></span></label>
        </label>
        <label>Redondear al siguiente
          <select name="step">
            <option value="1000" ${r.step === 1000 ? "selected" : ""}>$1.000</option>
            <option value="5000" ${r.step === 5000 ? "selected" : ""}>$5.000</option>
            <option value="10000" ${r.step === 10000 ? "selected" : ""}>$10.000</option>
          </select>
        </label>
        <p class="muted">Ejemplo: una compra de $8.600 se redondea a $10.000 si eliges $10.000. La diferencia se ahorra.</p>
        <button class="btn full" type="submit">Guardar</button>
      </form>
    </div>
  `;
}

export function pinSheet() {
  return `
    <div class="sheet-card bottom" role="dialog">
      <div class="sheet-head">
        <h3>PIN local</h3>
        <button class="icon-btn" type="button" data-close-sheet aria-label="Cerrar">${icon("x")}</button>
      </div>
      <form id="form-pin" class="sheet-body">
        <label>Nuevo PIN (4 dígitos)<input name="pin" inputmode="numeric" maxlength="4" required autocomplete="off" /></label>
        <p class="muted">Se guarda solo en este dispositivo. No es un PIN bancario real.</p>
        <button class="btn full" type="submit">Guardar PIN</button>
      </form>
    </div>
  `;
}

export function fabMenu() {
  return `
    <div class="fab-menu">
      <button type="button" data-sheet="expense">${icon("arrowDown", 16)} Gasto</button>
      <button type="button" data-sheet="income">${icon("arrowUp", 16)} Ingreso</button>
      <button type="button" data-sheet="goal">${icon("target", 16)} Meta</button>
    </div>
  `;
}
