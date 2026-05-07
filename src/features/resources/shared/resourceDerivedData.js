export function buildProductRecipeMap(recipeBooks = []) {
  return recipeBooks.reduce((accumulator, recipeBook) => {
    accumulator[recipeBook.product_id] = recipeBook;
    return accumulator;
  }, {});
}

export function buildUsageCountBySupply(items = [], collectionKey = "ingredients") {
  return items.reduce((accumulator, entry) => {
    (entry[collectionKey] || []).forEach((ingredient) => {
      if (!ingredient.ingredient_id) {
        return;
      }

      accumulator[ingredient.ingredient_id] = (accumulator[ingredient.ingredient_id] || 0) + 1;
    });

    (entry.components || []).forEach((component) => {
      if (component.sourceType !== "raw_item" || !component.sourceId) {
        return;
      }

      accumulator[component.sourceId] = (accumulator[component.sourceId] || 0) + 1;
    });

    return accumulator;
  }, {});
}

export function buildProductCategories(products = []) {
  return [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
}

function isActivePurchase(purchase) {
  const status = String(purchase?.status || "confirmada").trim().toLowerCase();
  return !["anulada", "cancelada", "canceled", "cancelled"].includes(status);
}

export function buildLatestSupplyReferenceByName(purchases = []) {
  const map = new Map();

  purchases.filter(isActivePurchase).forEach((purchase) => {
    (purchase.items || []).forEach((item) => {
      const searchName = String(item.ingredient_name || "").trim().toLocaleLowerCase("es");
      if (!searchName || map.has(searchName)) {
        return;
      }

      map.set(searchName, {
        category: item.category || "",
        unit: item.unit || "und",
        averageCost: String(item.landed_unit_cost ?? item.unit_price ?? ""),
      });
    });
  });

  return map;
}

export function buildPriceHistoryBySupply(purchases = []) {
  return purchases.filter(isActivePurchase).reduce((accumulator, purchase) => {
    (purchase.items || []).forEach((item) => {
      const ingredientId = item.ingredient_id;
      if (!ingredientId) {
        return;
      }

      accumulator[ingredientId] = accumulator[ingredientId] || [];
      accumulator[ingredientId].push({
        date: purchase.purchase_date,
        unitCost: Number(item.landed_unit_cost || item.unit_price || 0),
      });
    });

    return accumulator;
  }, {});
}
