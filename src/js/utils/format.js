const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatMoney(amount = 0, { signed = false } = {}) {
  const value = Number(amount) || 0;
  const formatted = cop.format(Math.abs(value));
  if (!signed) return formatted;
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

export function formatCompact(amount = 0) {
  const value = Number(amount) || 0;
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${value < 0 ? "−" : ""}$${(abs / 1_000_000).toFixed(1).replace(".", ",")} M`;
  }
  if (abs >= 1_000) return `${value < 0 ? "−" : ""}$${Math.round(abs / 1000)} mil`;
  return formatMoney(value);
}

export function parseAmount(raw) {
  return Number(String(raw).replace(/\D/g, "")) || 0;
}

export function formatAmountInput(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("es-CO");
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.max(0, Math.round((part / total) * 100));
}

export function firstName(fullName = "") {
  return fullName.trim().split(" ")[0] || "Juan";
}
