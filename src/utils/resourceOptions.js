export const SUPPLIER_CATEGORY_DEFAULTS = [
  "Lacteos",
  "Carnicos",
  "Bebidas",
  "Panaderia",
  "Abarrotes",
  "Limpieza",
  "Empaques",
  "Verduras",
];

export const INGREDIENT_CATEGORY_DEFAULTS = [
  "Proteinas",
  "Verduras",
  "Lacteos",
  "Bebidas",
  "Salsas",
  "Panaderia",
  "Abarrotes",
  "Limpieza",
  "Empaques",
];

export const SUPPLY_UNITS = ["g", "kg", "ml", "l", "oz", "und"];

export function normalizeOptionLabel(value) {
  return String(value || "").trim();
}

export function buildSelectOptions(values = [], emptyLabel = "Seleccionar opcion") {
  const normalizedValues = [...new Set(values.map(normalizeOptionLabel).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "es")
  );

  return [
    { value: "", label: emptyLabel },
    ...normalizedValues.map((value) => ({ value, label: value })),
  ];
}
