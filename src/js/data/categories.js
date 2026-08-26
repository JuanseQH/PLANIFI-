export const CATEGORIES = [
  { id: "alimentacion", name: "Alimentación", color: "#3b82f6" },
  { id: "transporte", name: "Transporte", color: "#60a5fa" },
  { id: "entretenimiento", name: "Entretenimiento", color: "#93c5fd" },
  { id: "compras", name: "Compras", color: "#f97316" },
  { id: "servicios", name: "Servicios", color: "#1d4ed8" },
  { id: "salud", name: "Salud", color: "#ec4899" },
  { id: "trabajo", name: "Trabajo", color: "#22c55e" },
  { id: "extra", name: "Ingreso extra", color: "#16a34a" },
  { id: "otro", name: "Otro", color: "#64748b" },
  { id: "ahorro", name: "Ahorro", color: "#0ea5e9" },
  { id: "transferencia", name: "Transferencia", color: "#6366f1" },
  { id: "inversion", name: "Inversión", color: "#8b5cf6" },
];

export const ACCOUNT_TYPES = [
  { id: "ahorros", name: "Cuenta de ahorros" },
  { id: "corriente", name: "Cuenta corriente" },
  { id: "efectivo", name: "Efectivo" },
  { id: "tarjeta", name: "Tarjeta" },
  { id: "billetera", name: "Billetera digital" },
];

export const EXPENSE_CATEGORIES = CATEGORIES.filter((item) =>
  ["alimentacion", "transporte", "entretenimiento", "compras", "servicios", "salud"].includes(item.id),
);

export const INCOME_CATEGORIES = [
  { id: "trabajo", name: "Trabajo" },
  { id: "extra", name: "Ingreso extra" },
  { id: "otro", name: "Otro" },
];

export function categoryById(id) {
  return CATEGORIES.find((item) => item.id === id) || CATEGORIES[0];
}
