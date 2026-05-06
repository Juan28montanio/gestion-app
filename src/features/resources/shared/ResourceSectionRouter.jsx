import PurchaseManager from "../../../components/PurchaseManager";
import RecipeBookManager from "../../../components/RecipeBookManager";
import SupplierManager from "../../../components/SupplierManager";

export default function ResourceSectionRouter({
  activeTab,
  businessId,
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
        suppliers={suppliers}
        purchases={purchases}
        categoryOptions={supplierCategoryOptions}
        onManageCategories={onManageSupplierCategories}
      />
    );
  }

  if (activeTab === "purchases") {
    return (
      <PurchaseManager
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
      <RecipeBookManager
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
