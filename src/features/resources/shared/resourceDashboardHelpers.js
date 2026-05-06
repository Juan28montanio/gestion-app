import { Boxes, ClipboardList, Factory, Package, Sparkles } from "lucide-react";
import { formatCOP } from "../../../utils/formatters";
import { buildRecipeCostSnapshot } from "../recipes/recipeCostingShared";

export function createProductForm() {
  return {
    name: "",
    category: "",
    price: "",
    stock: "",
    productType: "standard",
    ticketEligible: false,
    ticketUnits: "10",
    ticketValidityDays: "30",
  };
}

export function createSupplyForm() {
  return {
    name: "",
    category: "",
    unit: "g",
    stock: "",
    stockMinAlert: "",
    averageCost: "",
  };
}

export const SUPPLY_FORM = createSupplyForm();

export const RESOURCE_TABS = [
  "suppliers",
  "ingredients",
  "purchases",
  "recipes",
  "products",
];

export const TABS = [
  { id: "suppliers", label: "Proveedores", icon: Factory },
  { id: "ingredients", label: "Insumos", icon: Boxes },
  { id: "purchases", label: "Compras", icon: ClipboardList },
  { id: "recipes", label: "Fichas Tecnicas", icon: Sparkles },
  { id: "products", label: "Catalogo", icon: Package },
];

export function buildProductForm(product) {
  if (!product) {
    return createProductForm();
  }

  return {
    name: product.name || "",
    category: product.category || "",
    price: String(product.price ?? ""),
    stock: String(product.stock ?? ""),
    productType: product.product_type || "standard",
    ticketEligible: Boolean(product.ticket_eligible),
    ticketUnits: String(product.ticket_units ?? 10),
    ticketValidityDays: String(product.ticket_validity_days ?? 30),
  };
}

export function buildSupplyForm(supply) {
  if (!supply) {
    return createSupplyForm();
  }

  return {
    name: supply.name || "",
    category: supply.category || "",
    unit: supply.unit || "g",
    stock: String(supply.stock ?? ""),
    stockMinAlert: String(supply.stock_min_alert ?? supply.stockMinAlert ?? ""),
    averageCost: String(
      supply.last_purchase_cost ?? supply.average_cost ?? supply.cost_per_unit ?? ""
    ),
  };
}

export function getSupplyHealth(supply) {
  const stock = Number(supply.stock || 0);
  const min = Number(supply.stock_min_alert || 0);
  const ratio = min > 0 ? stock / min : Number.POSITIVE_INFINITY;

  if (stock <= 0) {
    return { label: "Agotado", classes: "bg-rose-100 text-rose-700 ring-rose-200" };
  }

  if (stock <= min) {
    return { label: "Critico", classes: "bg-rose-100 text-rose-700 ring-rose-200" };
  }

  if (ratio <= 1.35) {
    return { label: "Atencion", classes: "bg-amber-100 text-amber-700 ring-amber-200" };
  }

  return { label: "Saludable", classes: "bg-emerald-100 text-emerald-700 ring-emerald-200" };
}

export function buildResourceStats({ purchases, recipeBooks, supplies }) {
  const lowStockCount = supplies.filter((supply) => {
    const stock = Number(supply.stock || 0);
    const min = Number(supply.stock_min_alert || 0);
    return stock <= 0 || stock <= min || stock <= min * 1.15;
  }).length;
  const latestPurchase = purchases[0];
  const latestPurchaseLabel = latestPurchase?.purchase_date ? latestPurchase.purchase_date : "Sin cargas";
  const averageMargin =
    recipeBooks.length > 0
      ? recipeBooks.reduce(
          (sum, recipeBook) => sum + Number(recipeBook.current_margin_pct || 0),
          0
        ) / recipeBooks.length
      : 0;

  return [
    {
      id: "ingredients",
      label: "Insumos",
      value: `${lowStockCount} con stock bajo`,
      hint: "Alertas activas",
    },
    {
      id: "purchases",
      label: "Compras",
      value: latestPurchaseLabel,
      hint: "Ultima carga",
    },
    {
      id: "recipes",
      label: "Fichas tecnicas",
      value: `${averageMargin.toFixed(0)}% de margen`,
      hint: "Promedio actual",
    },
  ];
}

export function buildResourceFlowInsights({
  purchases,
  recipeBooks,
  spendByCategory,
  suppliers,
  supplies,
}) {
  const recentPurchases = purchases.slice(0, 12);
  const supplierIdsWithPurchases = new Set(
    recentPurchases.map((purchase) => purchase.supplier_id).filter(Boolean)
  );
  const inactiveSuppliers = suppliers.filter(
    (supplier) => supplier.id && !supplierIdsWithPurchases.has(supplier.id)
  ).length;
  const criticalSupplies = supplies.filter((supply) => {
    const health = getSupplyHealth(supply).label;
    return health === "Critico" || health === "Agotado";
  });
  const criticalSupplyIds = new Set(criticalSupplies.map((supply) => supply.id));
  const recipesAtRisk = recipeBooks.filter((recipeBook) =>
    (recipeBook.ingredients || []).some((ingredient) =>
      criticalSupplyIds.has(ingredient.ingredient_id)
    )
  ).length;
  const biggestSpendCategory = spendByCategory[0];

  return [
    {
      title: "Abastecimiento a revisar",
      body:
        criticalSupplies.length > 0
          ? `${criticalSupplies.length} insumo(s) critico(s) ya pueden afectar ${recipesAtRisk} ficha(s) tecnica(s). Conviene comprar antes de tocar precios o prometer disponibilidad.`
          : "No hay insumos criticos en este momento. La operacion puede sostener ventas sin presion inmediata de reposicion.",
    },
    {
      title: "Relacion con proveedores",
      body:
        inactiveSuppliers > 0
          ? `${inactiveSuppliers} proveedor(es) aun no tienen compras recientes. Revisar continuidad ayuda a negociar mejor y reducir dependencia de ultimo minuto.`
          : "Todos los proveedores registrados ya tienen movimiento reciente. La base de abastecimiento se ve activa y utilizable.",
    },
    {
      title: "Impacto en margen",
      body: biggestSpendCategory
        ? `La categoria ${biggestSpendCategory.category} concentra ${biggestSpendCategory.sharePct.toFixed(0)}% del gasto cargado. Cruza esta categoria con fichas tecnicas y precios antes del siguiente cierre.`
        : "Cuando registres compras, aqui veras que categoria esta drenando mas presupuesto y donde conviene revisar margen.",
    },
  ];
}

export function buildResourceActionQueue({ purchases, recipeBooks, supplies }) {
  const criticalSupplies = supplies.filter((supply) => {
    const health = getSupplyHealth(supply).label;
    return health === "Critico" || health === "Agotado";
  });
  const criticalSupplyIds = new Set(criticalSupplies.map((supply) => supply.id));
  const recipesAtRisk = recipeBooks.filter((recipeBook) =>
    (recipeBook.ingredients || []).some((ingredient) =>
      criticalSupplyIds.has(ingredient.ingredient_id)
    )
  ).length;
  const lowMarginProducts = recipeBooks.filter((recipeBook) => {
    const margin = Number(recipeBook.current_margin_pct || 0);
    return margin > 0 && margin < 30;
  }).length;
  const purchasesThisWeek = purchases.filter((purchase) => {
    const purchaseDate = purchase.purchase_date ? new Date(`${purchase.purchase_date}T00:00:00`) : null;
    if (!purchaseDate || Number.isNaN(purchaseDate.getTime())) {
      return false;
    }

    const diffDays = (Date.now() - purchaseDate.getTime()) / 86400000;
    return diffDays <= 7;
  }).length;

  return [
    {
      title: "Reponer hoy",
      value: `${criticalSupplies.length} insumo(s)`,
      hint:
        criticalSupplies.length > 0
          ? `${recipesAtRisk} ficha(s) ya podrian quedarse sin soporte de stock.`
          : "No hay alertas de reposicion inmediata.",
      tone:
        criticalSupplies.length > 0
          ? "bg-rose-50 text-rose-900 ring-rose-200"
          : "bg-emerald-50 text-emerald-900 ring-emerald-200",
    },
    {
      title: "Compras recientes",
      value: `${purchasesThisWeek} esta semana`,
      hint:
        purchasesThisWeek > 0
          ? "Valida que esas cargas ya se reflejen en costo y abastecimiento."
          : "Todavia no hay compras recientes en el rango semanal.",
      tone: "bg-slate-50 text-slate-900 ring-slate-200",
    },
    {
      title: "Margen por revisar",
      value: `${lowMarginProducts} producto(s)`,
      hint:
        lowMarginProducts > 0
          ? "Estas fichas tecnicas ya piden ajuste de precio o receta."
          : "No hay productos con margen bajo en las fichas conectadas.",
      tone: "bg-[#fff7df] text-[#7a5500] ring-[#d4a72c]/25",
    },
  ];
}

export function buildResourceDecisionItems(resourceFlowInsights, resourceActionQueue) {
  return [
    ...resourceFlowInsights.map((insight) => ({
      title: insight.title,
      body: insight.body,
      tone: "bg-white text-slate-900 ring-slate-200",
      icon: "sparkles",
    })),
    ...resourceActionQueue.map((item) => ({
      title: `${item.title} · ${item.value}`,
      body: item.hint,
      tone: item.tone,
      icon: "lightbulb",
    })),
  ];
}

export function buildResourceDecisionSummary(supplies) {
  const criticalCount = supplies.filter((supply) => {
    const health = getSupplyHealth(supply).label;
    return health === "Critico" || health === "Agotado";
  }).length;

  if (criticalCount > 0) {
    return `${criticalCount} alerta(s) de reposicion y margen ya merecen seguimiento antes de la siguiente compra o cierre.`;
  }

  return "El modulo mantiene una lectura conectada de abastecimiento, margen y continuidad con proveedores.";
}

export function summarizeSupplies(supplies) {
  return supplies.reduce(
    (summary, supply) => {
      const status = getSupplyHealth(supply).label;
      if (status === "Agotado") {
        summary.depleted += 1;
      } else if (status === "Critico") {
        summary.critical += 1;
      } else if (status === "Atencion") {
        summary.attention += 1;
      } else {
        summary.healthy += 1;
      }
      return summary;
    },
    { healthy: 0, attention: 0, critical: 0, depleted: 0 }
  );
}

export function buildProductModalMetrics(currentProductRecipe, currentPrice) {
  return buildRecipeCostSnapshot(currentProductRecipe, currentPrice);
}

export function summarizeProducts(products, productRecipeMap) {
  return products.reduce(
    (summary, product) => {
      const recipeBook = productRecipeMap[product.id];

      if (recipeBook) {
        summary.connected += 1;
      } else {
        summary.withoutRecipe += 1;
      }

      if (recipeBook?.profitability_status === "healthy") {
        summary.healthy += 1;
      }

      if (recipeBook?.profitability_status === "critical") {
        summary.atRisk += 1;
      }

      if (String(product.product_type || "").toLowerCase() === "ticket_wallet") {
        summary.ticketPlans += 1;
      }

      return summary;
    },
    { connected: 0, withoutRecipe: 0, healthy: 0, atRisk: 0, ticketPlans: 0 }
  );
}

export function buildSpendByCategory(purchases) {
  const totals = purchases.reduce((acc, purchase) => {
    (purchase.items || []).forEach((item) => {
      const key = item.category || "Sin categoria";
      acc[key] =
        (acc[key] || 0) + Number(item.line_total ?? item.total_cost ?? item.total ?? 0);
    });
    return acc;
  }, {});

  const totalBudget = Object.values(totals).reduce((sum, value) => sum + Number(value || 0), 0);

  return Object.entries(totals)
    .map(([category, total]) => ({
      category,
      total,
      sharePct: totalBudget > 0 ? (Number(total) / totalBudget) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function buildSpendCategoryLabel(entry) {
  return `${entry.sharePct.toFixed(0)}% · ${formatCOP(entry.total)}`;
}
