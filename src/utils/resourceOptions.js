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

export const SUPPLY_UNITS = ["g", "kg", "ml", "L", "und", "caja", "paquete"];

export const BASE_UNIT_OPTIONS = [
  { value: "g", label: "Gramos (g)" },
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "L", label: "Litros (L)" },
  { value: "und", label: "Unidades (und)" },
];

export const SUPPLY_TYPE_OPTIONS = [
  { value: "", label: "Seleccionar tipo" },
  { value: "raw_material", label: "Materia prima" },
  { value: "base_production", label: "Produccion base" },
  { value: "operational", label: "Insumo operativo" },
  { value: "indirect", label: "Insumo indirecto" },
];

export const SUPPLY_STATUS_OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
];

export const STORAGE_TYPE_OPTIONS = [
  { value: "", label: "Seleccionar conservacion" },
  { value: "refrigerated", label: "Refrigerado" },
  { value: "frozen", label: "Congelado" },
  { value: "dry", label: "Seco" },
  { value: "ambient", label: "Ambiente" },
];

export const TIME_UNIT_OPTIONS = [
  { value: "days", label: "Dias" },
  { value: "hours", label: "Horas" },
  { value: "months", label: "Meses" },
];

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
