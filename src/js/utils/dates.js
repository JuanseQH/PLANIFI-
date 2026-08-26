const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function nowIso() {
  return new Date().toISOString();
}

export function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameMonth(a, b = new Date()) {
  const da = toDate(a);
  const db = toDate(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
}

export function formatMonthLabel(date = new Date()) {
  return toDate(date).toLocaleDateString("es-CO", { month: "long" });
}

export function monthKey(date) {
  const d = toDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthShort(date) {
  return MONTHS[toDate(date).getMonth()];
}

export function formatTimeAgo(value) {
  const diff = Date.now() - toDate(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1h" : `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `${days}d`;
  return toDate(value).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export function formatDateInput(value = new Date()) {
  const d = toDate(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatLongDate(value) {
  return toDate(value).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function daysUntil(value) {
  const target = toDate(value);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

export function formatDeadline(value) {
  const days = daysUntil(value);
  if (days < 0) return "Vencida";
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days < 30) return `En ${days} días`;
  return formatLongDate(value);
}
