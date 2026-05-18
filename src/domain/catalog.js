function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeCatalogProduct(product) {
  const price = toNumber(product?.price ?? product?.pricing?.basePrice, 0);
  const category = normalizeText(product?.category || product?.categoryName || "General");
  const status = normalizeText(product?.status || "active");
  const normalized = {
    ...product,
    id: product?.id || "",
    productId: product?.id || product?.productId || "",
    business_id: product?.business_id || product?.businessId || "",
    businessId: product?.businessId || product?.business_id || "",
    name: normalizeText(product?.name),
    category,
    categoryName: category,
    categoryId: product?.categoryId || product?.category_id || "",
    price,
    unitPrice: price,
    status,
    product_type: product?.product_type || product?.type || "standard",
    recipe_mode: product?.recipe_mode || "direct",
    operation: {
      ...(product?.operation || {}),
      visibleInPOS: product?.operation?.visibleInPOS ?? product?.visible_in_pos ?? true,
    },
  };

  return {
    ...normalized,
    availableForSale: status === "active" && normalized.operation.visibleInPOS !== false,
  };
}

export function normalizeCatalogProducts(products = []) {
  return products.map(normalizeCatalogProduct);
}

export function normalizePosProducts(products = []) {
  return products.map(normalizeCatalogProduct);
}

export function normalizeCatalogCategory(category = {}) {
  return {
    ...category,
    id: category.id || "",
    business_id: category.business_id || category.businessId || "",
    businessId: category.businessId || category.business_id || "",
    name: String(category.name || "").trim(),
    sortOrder: Number(category.sortOrder ?? category.sort_order ?? 0),
    sort_order: Number(category.sort_order ?? category.sortOrder ?? 0),
    active: category.active ?? category.status !== "inactive",
    status: category.status || (category.active === false ? "inactive" : "active"),
    visibleInPOS: category.visibleInPOS ?? category.status !== "inactive",
    visibleInReports: category.visibleInReports ?? true,
  };
}

export function normalizeCatalogCategories(categories = []) {
  return categories.map(normalizeCatalogCategory);
}
