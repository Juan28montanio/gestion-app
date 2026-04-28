export function buildOperationalSaleItemDetail(item) {
  const quantity = Number(item?.quantity || 0);
  const name = String(item?.name || "Producto").trim();
  const recipeMode = String(item?.recipe_mode || item?.recipeMode || "direct").trim();
  const preparationSummary = (item?.preparation_items || item?.preparationItems || [])
    .map((entry) => String(entry?.preparation_name || entry?.preparationName || "").trim())
    .filter(Boolean);

  if (recipeMode === "composed" && preparationSummary.length > 0) {
    return `${quantity}x ${name} · compuesto: ${preparationSummary.slice(0, 3).join(", ")}`;
  }

  return `${quantity}x ${name}`;
}
