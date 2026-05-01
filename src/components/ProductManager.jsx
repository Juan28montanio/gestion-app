import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  deleteProduct,
  subscribeToProducts,
  updateProduct,
} from "../services/productService";
import {
  createSupply,
  deleteSupply,
  subscribeToSupplies,
  updateSupply,
} from "../services/supplyService";
import { subscribeToSuppliers } from "../services/supplierService";
import {
  seedDefaultTaxonomies,
  subscribeToTaxonomies,
} from "../services/taxonomyService";
import {
  createRecipeBook,
  subscribeToRecipeBooks,
  updateRecipeBook,
} from "../services/recipeBookService";
import { subscribeToPreparations } from "../services/preparationService";
import { subscribeToPurchases } from "../services/purchaseService";
import ConfirmModal from "./ConfirmModal";
import TaxonomyManagerModal from "./TaxonomyManagerModal";
import { buildSelectOptions } from "../utils/resourceOptions";
import { useDecisionCenter } from "../app/decision-center/DecisionCenterContext";
import {
  buildProductForm,
  buildProductModalMetrics,
  buildResourceActionQueue,
  buildResourceDecisionItems,
  buildResourceDecisionSummary,
  buildResourceFlowInsights,
  buildResourceStats,
  buildSpendByCategory,
  buildSupplyForm,
  createProductForm,
  createSupplyForm,
  getSupplyHealth,
  RESOURCE_TABS,
  summarizeProducts,
  summarizeSupplies,
  TABS,
} from "../features/resources/shared/resourceDashboardHelpers";
import {
  buildLatestSupplyReferenceByName,
  buildPriceHistoryBySupply,
  buildProductCategories,
  buildProductRecipeMap,
  buildUsageCountBySupply,
} from "../features/resources/shared/resourceDerivedData";
import { buildProductFlowSummary, isComposedRecipeMode } from "../features/resources/recipes/recipeCostingShared";
import ProductEditorModal from "../features/resources/catalog/ProductEditorModal";
import ResourceInventoryPanel from "../features/resources/inventory/ResourceInventoryPanel";
import ResourceProductsPanel from "../features/resources/catalog/ResourceProductsPanel";
import ResourceWorkspaceHeader from "../features/resources/shared/ResourceWorkspaceHeader";
import ResourceSectionRouter from "../features/resources/shared/ResourceSectionRouter";
import SupplyEditorModal from "../features/resources/inventory/SupplyEditorModal";

function normalizeComparableValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function ProductManager({ businessId, mode = "resources" }) {
  const { publishSectionInsights, clearSectionInsights, openDecisionCenter } = useDecisionCenter();
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [preparations, setPreparations] = useState([]);
  const [recipeBooks, setRecipeBooks] = useState([]);
  const [supplierCategories, setSupplierCategories] = useState([]);
  const [ingredientCategories, setIngredientCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(mode === "catalog" ? "products" : "suppliers");
  const [productForm, setProductForm] = useState(createProductForm);
  const [supplyForm, setSupplyForm] = useState(createSupplyForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingSupplyId, setEditingSupplyId] = useState(null);
  const [focusedRecipeProductId, setFocusedRecipeProductId] = useState("");
  const [productView, setProductView] = useState("grid");
  const [ingredientView, setIngredientView] = useState("grid");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [taxonomyModalScope, setTaxonomyModalScope] = useState("");
  const isCatalogMode = mode === "catalog";
  const currentProductRecipe = useMemo(
    () => recipeBooks.find((recipeBook) => recipeBook.product_id === editingProductId) || null,
    [editingProductId, recipeBooks]
  );
  const preparationOptions = useMemo(
    () =>
      preparations.map((preparation) => ({
        value: preparation.id,
        label: `${preparation.name} - ${Number(preparation.yield_quantity || 0)} ${
          preparation.output_unit || "porcion"
        }`,
      })),
    [preparations]
  );
  const preparationMap = useMemo(
    () =>
      preparations.reduce((acc, preparation) => {
        acc[preparation.id] = preparation;
        return acc;
      }, {}),
    [preparations]
  );

  useEffect(() => {
    setActiveTab(mode === "catalog" ? "products" : "suppliers");
  }, [mode]);

  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts(businessId, setProducts);
    const unsubscribeSupplies = subscribeToSupplies(businessId, setSupplies);
    const unsubscribeSuppliers = subscribeToSuppliers(businessId, setSuppliers);
    const unsubscribePurchases = subscribeToPurchases(businessId, setPurchases);
    const unsubscribePreparations = subscribeToPreparations(businessId, setPreparations);
    const unsubscribeRecipeBooks = subscribeToRecipeBooks(businessId, setRecipeBooks);

    return () => {
      unsubscribeProducts();
      unsubscribeSupplies();
      unsubscribeSuppliers();
      unsubscribePurchases();
      unsubscribePreparations();
      unsubscribeRecipeBooks();
    };
  }, [businessId]);

  useEffect(() => {
    seedDefaultTaxonomies(businessId, "supplier_categories").catch(() => {});
    seedDefaultTaxonomies(businessId, "ingredient_categories").catch(() => {});

    const unsubscribeSupplierCategories = subscribeToTaxonomies(
      businessId,
      "supplier_categories",
      setSupplierCategories
    );
    const unsubscribeIngredientCategories = subscribeToTaxonomies(
      businessId,
      "ingredient_categories",
      setIngredientCategories
    );

    return () => {
      unsubscribeSupplierCategories();
      unsubscribeIngredientCategories();
    };
  }, [businessId]);

  const priceHistoryBySupply = useMemo(() => buildPriceHistoryBySupply(purchases), [purchases]);

  const spendByCategory = useMemo(() => buildSpendByCategory(purchases), [purchases]);

  const productRecipeMap = useMemo(() => buildProductRecipeMap(recipeBooks), [recipeBooks]);
  const recipeImpactBySupply = useMemo(() => buildUsageCountBySupply(recipeBooks), [recipeBooks]);
  const preparationImpactBySupply = useMemo(
    () => buildUsageCountBySupply(preparations),
    [preparations]
  );

  const productCategories = useMemo(() => buildProductCategories(products), [products]);
  const supplierCategoryOptions = useMemo(
    () =>
      buildSelectOptions(
        supplierCategories.map((category) => category.label),
        "Seleccionar categoria"
      ),
    [supplierCategories]
  );
  const ingredientCategoryOptions = useMemo(
    () =>
      buildSelectOptions(
        ingredientCategories.map((category) => category.label),
        "Seleccionar categoria"
      ),
    [ingredientCategories]
  );
  const latestSupplyReferenceByName = useMemo(
    () => buildLatestSupplyReferenceByName(purchases),
    [purchases]
  );
  const resourceStats = useMemo(
    () => buildResourceStats({ purchases, preparations, recipeBooks, supplies }),
    [preparations, purchases, recipeBooks, supplies]
  );
  const resourceFlowInsights = useMemo(
    () =>
      buildResourceFlowInsights({
        purchases,
        preparations,
        recipeBooks,
        spendByCategory,
        suppliers,
        supplies,
      }),
    [preparations, purchases, recipeBooks, spendByCategory, suppliers, supplies]
  );
  const resourceActionQueue = useMemo(
    () => buildResourceActionQueue({ purchases, recipeBooks, supplies }),
    [purchases, recipeBooks, supplies]
  );
  const resourceDecisionItems = useMemo(
    () => buildResourceDecisionItems(resourceFlowInsights, resourceActionQueue),
    [resourceActionQueue, resourceFlowInsights]
  );
  const resourceDecisionSummary = useMemo(() => buildResourceDecisionSummary(supplies), [supplies]);
  useEffect(() => {
    if (isCatalogMode) {
      return undefined;
    }

    publishSectionInsights("resources", {
      eyebrow: "Centro de recursos",
      title: "Decisiones de abastecimiento y margen",
      summary: resourceDecisionSummary,
      items: resourceDecisionItems,
    });

    return () => clearSectionInsights("resources");
  }, [
    clearSectionInsights,
    isCatalogMode,
    publishSectionInsights,
    resourceDecisionItems,
    resourceDecisionSummary,
  ]);
  const supplySummary = useMemo(() => summarizeSupplies(supplies), [supplies]);

  const productModalMetrics = useMemo(
    () => buildProductModalMetrics(currentProductRecipe, productForm.price),
    [currentProductRecipe, productForm.price]
  );
  const productSummary = useMemo(
    () => summarizeProducts(products, productRecipeMap),
    [productRecipeMap, products]
  );
  const canSaveProduct = useMemo(() => {
    const normalizedName = String(productForm.name || "").trim();
    const normalizedCategory = String(productForm.category || "").trim();
    const normalizedPrice = Number(productForm.price);
    const normalizedStock = Number(productForm.stock);
    const composedRows =
      productForm.recipeMode === "composed" ? productForm.preparationItems : [];
    const hasValidPreparations =
      productForm.recipeMode !== "composed" ||
      (composedRows.length > 0 &&
        composedRows.every(
          (item) => item.preparationId && Number(item.quantity) > 0
        ));
    const hasValidTicketConfig =
      productForm.productType !== "ticket_wallet" ||
      (Number(productForm.ticketUnits) > 0 &&
        Number(productForm.ticketValidityDays) > 0);

    return (
      Boolean(normalizedName) &&
      Boolean(normalizedCategory) &&
      Number.isFinite(normalizedPrice) &&
      normalizedPrice >= 0 &&
      Number.isFinite(normalizedStock) &&
      normalizedStock >= 0 &&
      hasValidPreparations &&
      hasValidTicketConfig
    );
  }, [productForm]);

  const productDuplicates = useMemo(() => {
    const currentName = normalizeComparableValue(productForm.name);
    const currentCategory = normalizeComparableValue(productForm.category);
    const currentProductType = normalizeComparableValue(productForm.productType || "standard");

    if (!currentName) {
      return { exactMatch: null, nameMatches: [] };
    }

    const candidates = products.filter((product) => product.id !== editingProductId);
    const nameMatches = candidates.filter(
      (product) => normalizeComparableValue(product.name) === currentName
    );

    const exactMatch =
      candidates.find(
        (product) =>
          normalizeComparableValue(product.name) === currentName &&
          normalizeComparableValue(product.category) === currentCategory &&
          normalizeComparableValue(product.product_type || "standard") === currentProductType
      ) || null;

    return { exactMatch, nameMatches };
  }, [
    editingProductId,
    productForm.category,
    productForm.name,
    productForm.productType,
    products,
  ]);

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProductId(null);
    setProductForm(createProductForm());
    setFeedback({ type: "", message: "" });
  };

  const closeSupplyModal = () => {
    setIsSupplyModalOpen(false);
    setEditingSupplyId(null);
    setSupplyForm(createSupplyForm());
    setFeedback({ type: "", message: "" });
  };

  const openRecipeContext = (productId = "") => {
    setFocusedRecipeProductId(productId);
    setActiveTab("recipes");
  };
  const openPreparationContext = () => {
    setActiveTab("preparations");
    setIsProductModalOpen(false);
  };

  const openCreateSupplyModal = () => {
    setEditingSupplyId(null);
    setSupplyForm(createSupplyForm());
    setFeedback({ type: "", message: "" });
    setIsSupplyModalOpen(true);
  };

  const openEditSupplyModal = (supply) => {
    setEditingSupplyId(supply.id);
    setSupplyForm(buildSupplyForm(supply));
    setIsSupplyModalOpen(true);
  };

  const openCreateProductModal = () => {
    setEditingProductId(null);
    setProductForm(createProductForm());
    setFeedback({ type: "", message: "" });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProductId(product.id);
    setProductForm(buildProductForm(product));
    setIsProductModalOpen(true);
  };

  const openProductCostingContext = (product) => {
    if (isComposedRecipeMode(product.recipe_mode)) {
      setActiveTab("preparations");
      return;
    }

    openRecipeContext(product.id);
  };

  useEffect(() => {
    if (!isSupplyModalOpen || editingSupplyId) {
      return;
    }

    const searchName = String(supplyForm.name || "").trim().toLocaleLowerCase("es");
    if (!searchName) {
      return;
    }

    const latestReference = latestSupplyReferenceByName.get(searchName);
    if (!latestReference) {
      return;
    }

    setSupplyForm((current) => ({
      ...current,
      category: current.category || latestReference.category,
      unit:
        current.unit && current.unit !== createSupplyForm().unit
          ? current.unit
          : latestReference.unit || current.unit || "und",
      averageCost: current.averageCost || latestReference.averageCost,
    }));
  }, [
    editingSupplyId,
    isSupplyModalOpen,
    latestSupplyReferenceByName,
    supplyForm.name,
  ]);

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      const normalizedName = String(productForm.name || "").trim();
      const normalizedCategory = String(productForm.category || "").trim();
      const normalizedPrice = Number(productForm.price);
      const normalizedStock = Number(productForm.stock);
      const normalizedTicketUnits = Number(productForm.ticketUnits);
      const normalizedTicketValidityDays = Number(productForm.ticketValidityDays);
      const normalizedPreparationItems =
        productForm.recipeMode === "composed"
          ? productForm.preparationItems.map((item) => ({
              preparation_id: item.preparationId,
              preparation_name:
                preparationMap[item.preparationId]?.name || item.preparationName || "",
              output_unit:
                preparationMap[item.preparationId]?.output_unit || item.outputUnit || "",
              quantity: Number(item.quantity),
            }))
          : [];

      if (!normalizedName || !normalizedCategory) {
        throw new Error("Completa nombre y categoria antes de guardar el producto.");
      }

      if (productDuplicates.exactMatch) {
        throw new Error(
          `Ya existe un producto muy similar: ${productDuplicates.exactMatch.name}. Ajusta categoria o edita el registro existente antes de duplicarlo.`
        );
      }

      if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
        throw new Error("El precio del producto debe ser un numero valido mayor o igual a cero.");
      }

      if (!Number.isFinite(normalizedStock) || normalizedStock < 0) {
        throw new Error("El stock comercial debe ser un numero valido mayor o igual a cero.");
      }

      if (productForm.productType === "ticket_wallet") {
        if (!Number.isFinite(normalizedTicketUnits) || normalizedTicketUnits <= 0) {
          throw new Error("Una ticketera debe entregar una cantidad valida de tickets.");
        }

        if (
          !Number.isFinite(normalizedTicketValidityDays) ||
          normalizedTicketValidityDays <= 0
        ) {
          throw new Error("La vigencia de la ticketera debe ser mayor a cero.");
        }
      }

      const payload = {
        name: normalizedName,
        category: normalizedCategory,
        price: normalizedPrice,
        stock: normalizedStock,
        productType: productForm.productType,
        recipeMode: productForm.recipeMode,
        preparationItems: normalizedPreparationItems,
        ticketEligible:
          productForm.productType === "ticket_wallet" ? true : productForm.ticketEligible,
        ticketUnits: normalizedTicketUnits,
        ticketValidityDays: normalizedTicketValidityDays,
      };

      if (payload.recipeMode === "composed" && payload.preparationItems.length === 0) {
        throw new Error("Agrega al menos una preparacion para guardar un producto compuesto.");
      }

      if (
        payload.recipeMode === "composed" &&
        payload.preparationItems.some(
          (item) => !item.preparation_id || !Number.isFinite(item.quantity) || item.quantity <= 0
        )
      ) {
        throw new Error(
          "Cada preparacion del producto compuesto debe tener una base seleccionada y una cantidad valida."
        );
      }

      let productId = editingProductId;
      if (editingProductId) {
        await updateProduct(editingProductId, businessId, payload);
      } else {
        productId = await createProduct(businessId, payload);
      }

      const existingRecipeBook = recipeBooks.find((recipeBook) => recipeBook.product_id === productId);
      if (existingRecipeBook) {
        await updateRecipeBook(existingRecipeBook.id, {
          ...existingRecipeBook,
          business_id: businessId,
          product_id: productId,
          product_name: payload.name,
          recipe_mode: payload.recipeMode,
          preparation_items: payload.preparationItems,
          direct_ingredients:
            payload.recipeMode === "direct"
              ? existingRecipeBook.direct_ingredients || existingRecipeBook.ingredients || []
              : [],
          sale_price: payload.price,
        });
      } else {
        await createRecipeBook({
          business_id: businessId,
          product_id: productId,
          product_name: payload.name,
          recipe_mode: payload.recipeMode,
          preparation_items: payload.preparationItems,
          sale_price: payload.price,
          waste_pct: 0,
          target_margin_pct: 30,
          prep_time_minutes: 0,
          preparation_steps: [],
          ingredients: [],
        });
      }

      closeProductModal();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible guardar el producto.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addPreparationRow = () => {
    setProductForm((current) => ({
      ...current,
      preparationItems: [...current.preparationItems, { preparationId: "", quantity: "" }],
    }));
  };

  const updatePreparationRow = (index, field, value) => {
    setProductForm((current) => ({
      ...current,
      preparationItems: current.preparationItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removePreparationRow = (index) => {
    setProductForm((current) => ({
      ...current,
      preparationItems: current.preparationItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSupplySubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      const payload = {
        name: supplyForm.name.trim(),
        category: supplyForm.category.trim(),
        unit: supplyForm.unit,
        stock: Number(supplyForm.stock),
        stockMinAlert: Number(supplyForm.stockMinAlert),
        averageCost: Number(supplyForm.averageCost),
      };

      if (editingSupplyId) {
        await updateSupply(editingSupplyId, businessId, payload);
      } else {
        await createSupply(businessId, payload);
      }

      closeSupplyModal();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible guardar el insumo.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) {
      return;
    }

    try {
      if (itemToDelete.type === "product") {
        await deleteProduct(itemToDelete.id);
      } else {
        await deleteSupply(itemToDelete.id);
      }
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <section className="space-y-6">
      {!isCatalogMode ? (
        <>
          <ResourceWorkspaceHeader
            resourceStats={resourceStats}
            resourceDecisionSummary={resourceDecisionSummary}
            resourceDecisionItems={resourceDecisionItems}
            onOpenDecisionCenter={openDecisionCenter}
            tabs={TABS.filter((tab) => RESOURCE_TABS.includes(tab.id))}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />
        </>
      ) : null}

      {!isCatalogMode ? (
        <ResourceSectionRouter
          activeTab={activeTab}
          businessId={businessId}
          suppliers={suppliers}
          purchases={purchases}
          supplies={supplies}
          recipeBooks={recipeBooks}
          ingredientCategoryOptions={ingredientCategoryOptions}
          supplierCategoryOptions={supplierCategoryOptions}
          preparations={preparations}
          products={products}
          focusedRecipeProductId={focusedRecipeProductId}
          onFocusHandled={() => setFocusedRecipeProductId("")}
          onManageSupplierCategories={() => setTaxonomyModalScope("supplier_categories")}
          onManageIngredientCategories={() => setTaxonomyModalScope("ingredient_categories")}
        />
      ) : null}

      {activeTab === "ingredients" && !isCatalogMode ? (
        <ResourceInventoryPanel
          supplies={supplies}
          ingredientView={ingredientView}
          onIngredientViewChange={setIngredientView}
          supplySummary={supplySummary}
          priceHistoryBySupply={priceHistoryBySupply}
          recipeImpactBySupply={recipeImpactBySupply}
          preparationImpactBySupply={preparationImpactBySupply}
          spendByCategory={spendByCategory}
          onCreateSupply={openCreateSupplyModal}
          onEditSupply={openEditSupplyModal}
          onDeleteSupply={(supply) => setItemToDelete({ id: supply.id, type: "supply", name: supply.name })}
          getSupplyHealth={getSupplyHealth}
        />
      ) : null}

      {activeTab === "products" ? (
        <ResourceProductsPanel
          isCatalogMode={isCatalogMode}
          productView={productView}
          onProductViewChange={setProductView}
          onCreateProduct={openCreateProductModal}
          products={products}
          productRecipeMap={productRecipeMap}
          getProductFlowSummary={buildProductFlowSummary}
          onEditProduct={openEditProductModal}
          onOpenProductRecipes={openProductCostingContext}
          onDeleteProduct={(product) =>
            setItemToDelete({ id: product.id, type: "product", name: product.name })
          }
        />
      ) : null}

      <ProductEditorModal
        open={isProductModalOpen}
        onClose={closeProductModal}
        onSubmit={handleProductSubmit}
        editingProductId={editingProductId}
        isSaving={isSaving}
        canSaveProduct={canSaveProduct}
        productDuplicates={productDuplicates}
        productForm={productForm}
        setProductForm={setProductForm}
        productCategories={productCategories}
        productModalMetrics={productModalMetrics}
        preparationOptions={preparationOptions}
        preparationMap={preparationMap}
        addPreparationRow={addPreparationRow}
        updatePreparationRow={updatePreparationRow}
        removePreparationRow={removePreparationRow}
        onOpenPreparations={openPreparationContext}
        onOpenRecipe={() => {
          if (isCatalogMode) {
            return;
          }

          closeProductModal();
          if (productForm.recipeMode === "composed") {
            setActiveTab("preparations");
          } else {
            openRecipeContext(editingProductId || "");
          }
        }}
        feedbackMessage={feedback.message}
        isCatalogMode={isCatalogMode}
        currentProductRecipe={currentProductRecipe}
      />

      <SupplyEditorModal
        open={isSupplyModalOpen}
        onClose={closeSupplyModal}
        onSubmit={handleSupplySubmit}
        editingSupplyId={editingSupplyId}
        isSaving={isSaving}
        supplyForm={supplyForm}
        setSupplyForm={setSupplyForm}
        ingredientCategoryOptions={ingredientCategoryOptions}
        onManageCategories={() => setTaxonomyModalScope("ingredient_categories")}
        productSummary={productSummary}
        feedbackMessage={feedback.message}
      />

      <ConfirmModal
        open={Boolean(itemToDelete)}
        title={itemToDelete?.type === "product" ? "Eliminar producto" : "Eliminar insumo"}
        description={itemToDelete ? `Se eliminara ${itemToDelete.name} de SmartProfit.` : ""}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      <TaxonomyManagerModal
        open={Boolean(taxonomyModalScope)}
        onClose={() => setTaxonomyModalScope("")}
        businessId={businessId}
        scope={taxonomyModalScope}
        title={
          taxonomyModalScope === "supplier_categories"
            ? "Categorias de proveedores"
            : "Categorias de insumos"
        }
        description={
          taxonomyModalScope === "supplier_categories"
            ? "Gestiona una sola lista para proveedores y directorio estrategico."
            : "Gestiona las categorias compartidas por insumos, compras y costeo."
        }
      />
    </section>
  );
}

