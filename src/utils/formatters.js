export const copCurrencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCOP(value) {
  return copCurrencyFormatter.format(Number(value) || 0);
}
