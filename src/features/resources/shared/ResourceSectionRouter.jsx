import SupplierManager from "../../../components/SupplierManager";
import CostingWorkspace from "../costing/CostingWorkspace";
import PurchaseWorkspace from "../purchase/PurchaseWorkspace";

export default function ResourceSectionRouter({
  activeTab,
  businessId,
  userProfile,
  suppliers,
  purchases,
  supplies,
  recipeBooks,
  ingredientCategoryOptions,
  supplierCategoryOptions,
  products,
  focusedRecipeProductId,
  onFocusHandled,
  onManageSupplierCategories,
  onManageIngredientCategories,
}) {
  if (activeTab === "suppliers") {
    return (
      <SupplierManager
        businessId={businessId}
        userProfile={userProfile}
        suppliers={suppliers}
        purchases={purchases}
        categoryOptions={supplierCategoryOptions}
        onManageCategories={onManageSupplierCategories}
      />
    );
  }

  if (activeTab === "purchases") {
    return (
      <PurchaseWorkspace
        businessId={businessId}
        suppliers={suppliers}
        supplies={supplies}
        purchases={purchases}
        recipeBooks={recipeBooks}
        categoryOptions={ingredientCategoryOptions}
        onManageCategories={onManageIngredientCategories}
      />
    );
  }

  if (activeTab === "recipes") {
    return (
      <CostingWorkspace
        businessId={businessId}
        products={products}
        supplies={supplies}
        recipeBooks={recipeBooks}
        focusedProductId={focusedRecipeProductId}
        onFocusHandled={onFocusHandled}
      />
    );
  }

  return null;
}
