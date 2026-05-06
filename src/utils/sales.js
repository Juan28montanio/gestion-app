export function buildOperationalSaleItemDetail(item) {
  const quantity = Number(item?.quantity || 0);
  const name = String(item?.name || "Producto").trim();

  return `${quantity}x ${name}`;
}
