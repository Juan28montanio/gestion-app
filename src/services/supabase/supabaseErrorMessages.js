const MESSAGE_RULES = [
  {
    pattern: /insufficient stock for supply\s+(.+)/i,
    build: (match) =>
      `Stock insuficiente para ${match[1]}. Compra insumo, ajusta inventario o habilita stock negativo desde configuracion.`,
  },
  {
    pattern: /technical sheet must include at least one component/i,
    message: "La ficha tecnica debe tener al menos un componente antes de guardarse.",
  },
  {
    pattern: /technical sheet component quantity must be positive/i,
    message: "Cada componente de la ficha tecnica debe tener una cantidad mayor a cero.",
  },
  {
    pattern: /supply not found for technical sheet component/i,
    message: "Uno de los componentes no corresponde a un insumo valido del negocio.",
  },
  {
    pattern: /active source technical sheet not found for component/i,
    message: "Una ficha base usada como componente no existe o no esta activa.",
  },
  {
    pattern: /open cash session not found|debes abrir caja/i,
    message: "Debes abrir caja antes de registrar la venta.",
  },
  {
    pattern: /could not find the function public\.(create_or_update_technical_sheet|close_sale_with_inventory_explosion|reverse_inventory_explosion)/i,
    build: (match) =>
      `La RPC ${match[1]} no esta desplegada en Supabase. Aplica la migracion de rentabilidad antes de probar este flujo.`,
  },
  {
    pattern: /insufficient role/i,
    message: "Tu rol no tiene permisos para modificar costos, fichas tecnicas o inventario.",
  },
];

export function getBusinessErrorMessage(error, fallback = "No fue posible completar la operacion.") {
  const rawMessage = String(error?.message || error || "").trim();

  if (!rawMessage) {
    return fallback;
  }

  const matchingRule = MESSAGE_RULES.find((rule) => rule.pattern.test(rawMessage));
  if (!matchingRule) {
    return rawMessage;
  }

  const match = rawMessage.match(matchingRule.pattern);
  return matchingRule.build ? matchingRule.build(match) : matchingRule.message;
}

export function toBusinessError(error, fallback) {
  const businessError = new Error(getBusinessErrorMessage(error, fallback));
  businessError.cause = error;
  businessError.code = error?.code;
  return businessError;
}
