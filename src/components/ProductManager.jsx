import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  archiveProduct,
  createProductCategory,
  createProductModifier,
  seedDefaultProductCategories,
  subscribeToProductCategories,
  subscribeToProductCombos,
  subscribeToProductModifiers,
  subscribeToProducts,
  updateProductCategory,
  updateProductModifier,
  updateProductStatus,
  updateProduct,
} from "../services/productService";
import {
  createSupply,
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
import { buildProductFlowSummary } from "../features/resources/recipes/recipeCostingShared";
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

export default function ProductManager({ businessId, mode = "resources", initialTab, userProfile }) {
  const { publishSectionInsights, clearSectionInsights, openDecisionCenter } = useDecisionCenter();
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [recipeBooks, setRecipeBooks] = useState([]);
  const [productCategoryDocs, setProductCategoryDocs] = useState([]);
  const [productModifiers, setProductModifiers] = useState([]);
  const [productCombos, setProductCombos] = useState([]);
  const [supplierCategories, setSupplierCategories] = useState([]);
  const [ingredientCategories, setIngredientCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(
    mode === "catalog" ? initialTab || "products" : initialTab || "suppliers"
  );
  const [productForm, setProductForm] = useState(createProductForm);
  const [supplyForm, setSupplyForm] = useState(createSupplyForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingSupplyId, setEditingSupplyId] = useState(null);
  const [focusedRecipeProductId, setFocusedRecipeProductId] = useState("");
  const [productView, setProductView] = useState("grid");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [taxonomyModalScope, setTaxonomyModalScope] = useState("");
  const isCatalogMode = mode === "catalog";
  const currentProductRecipe = useMemo(
    () =>
      recipeBooks.find((recipeBook) => recipeBook.id === productForm.linkedTechnicalSheetId) ||
      recipeBooks.find((recipeBook) => recipeBook.product_id === editingProductId) ||
      null,
    [editingProductId, productForm.linkedTechnicalSheetId, recipeBooks]
  );
  useEffect(() => {
    setActiveTab(mode === "catalog" ? initialTab || "products" : initialTab || "suppliers");
  }, [initialTab, mode]);

  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts(businessId, setProducts);
    const unsubscribeSupplies = subscribeToSupplies(businessId, setSupplies);
    const unsubscribeSuppliers = subscribeToSuppliers(businessId, setSuppliers);
    const unsubscribePurchases = subscribeToPurchases(businessId, setPurchases);
    const unsubscribeRecipeBooks = subscribeToRecipeBooks(businessId, setRecipeBooks);
    const unsubscribeProductCategories = subscribeToProductCategories(businessId, setProductCategoryDocs);
    const unsubscribeProductModifiers = subscribeToProductModifiers(businessId, setProductModifiers);
    const unsubscribeProductCombos = subscribeToProductCombos(businessId, setProductCombos);

    return () => {
      unsubscribeProducts();
      unsubscribeSupplies();
      unsubscribeSuppliers();
      unsubscribePurchases();
      unsubscribeRecipeBooks();
      unsubscribeProductCategories();
      unsubscribeProductModifiers();
      unsubscribeProductCombos();
    };
  }, [businessId]);

  useEffect(() => {
    seedDefaultTaxonomies(businessId, "supplier_categories").catch(() => {});
    seedDefaultTaxonomies(businessId, "ingredient_categories").catch(() => {});
    seedDefaultProductCategories(businessId).catch(() => {});

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
  const productCategories = useMemo(() => {
    const fromDocs = productCategoryDocs.map((category) => category.name).filter(Boolean);
    const fromProducts = buildProductCategories(products);
    return [...new Set([...fromDocs, ...fromProducts])].sort((left, right) =>
      left.localeCompare(right, "es", { sensitivity: "base" })
    );
  }, [productCategoryDocs, products]);
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
    () => buildResourceStats({ purchases, recipeBooks, supplies }),
    [purchases, recipeBooks, supplies]
  );
  const resourceFlowInsights = useMemo(
    () =>
      buildResourceFlowInsights({
        purchases,
        recipeBooks,
        spendByCategory,
        suppliers,
        supplies,
      }),
    [purchases, recipeBooks, spendByCategory, suppliers, supplies]
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
    const hasValidTicketConfig =
        productForm.productType !== "ticket_wallet" ||
      (Number(productForm.ticketUnits) > 0 &&
        Number(productForm.ticketValidityDays) > 0);
    const needsTechnicalSheet =
      productForm.consumesInventory && productForm.inventoryImpactMode === "technical_sheet";
    const hasKitchenStation = !productForm.requiresKitchen || Boolean(productForm.kitchenStationId);

    return (
      Boolean(normalizedName) &&
      Boolean(normalizedCategory) &&
      Number.isFinite(normalizedPrice) &&
      normalizedPrice >= 0 &&
      Number.isFinite(normalizedStock) &&
      normalizedStock >= 0 &&
      hasValidTicketConfig &&
      (!needsTechnicalSheet || Boolean(productForm.linkedTechnicalSheetId)) &&
      hasKitchenStation
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
      purchaseUnit: current.purchaseUnit || latestReference.unit || current.purchaseUnit,
      inventoryUnit: current.inventoryUnit || latestReference.unit || current.inventoryUnit,
      averageCost: current.averageCost || latestReference.averageCost,
      currentCost: current.currentCost || latestReference.averageCost,
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
      const linkedTechnicalSheetId = String(productForm.linkedTechnicalSheetId || "").trim();
      const inventoryImpactMode =
        productForm.consumesInventory && linkedTechnicalSheetId
          ? "technical_sheet"
          : productForm.inventoryImpactMode;

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
        code: productForm.code.trim(),
        description: productForm.description.trim(),
        category: normalizedCategory,
        categoryId: productForm.categoryId,
        price: normalizedPrice,
        stock: normalizedStock,
        taxRate: Number(productForm.taxRate || 0),
        targetFoodCost: Number(productForm.targetFoodCost || 30),
        productType: productForm.productType,
        type: productForm.productType,
        status: productForm.status,
        tags: productForm.tags,
        linkedTechnicalSheetId,
        consumesInventory: Boolean(productForm.consumesInventory),
        inventoryImpactMode,
        allowSaleWhenStockLow: Boolean(productForm.allowSaleWhenStockLow),
        requiresKitchen: Boolean(productForm.requiresKitchen),
        kitchenStationId: productForm.kitchenStationId,
        kitchenStationName: productForm.kitchenStationName,
        preparationTime: Number(productForm.preparationTime || 0),
        availableForTables: Boolean(productForm.availableForTables),
        availableForQuickSale: Boolean(productForm.availableForQuickSale),
        availableForDelivery: Boolean(productForm.availableForDelivery),
        visibleInPOS: Boolean(productForm.visibleInPOS),
        visibleInMenu: Boolean(productForm.visibleInMenu),
        isFavorite: Boolean(productForm.isFavorite),
        sortOrder: Number(productForm.sortOrder || 0),
        color: productForm.color,
        icon: productForm.icon,
        recipeMode: productForm.productType === "combo" ? "composed" : "direct",
        ticketEligible:
          productForm.productType === "ticket_wallet" ? true : productForm.ticketEligible,
        ticketEligibilityType:
          productForm.ticketEligibilityType ||
          (productForm.ticketEligible || productForm.productType === "ticket_wallet" ? "meal" : ""),
        ticketValueReference: productForm.ticketValueReference,
        allowedTicketPlans: productForm.allowedTicketPlans,
        ticketUnits: normalizedTicketUnits,
        ticketValidityDays: normalizedTicketValidityDays,
      };

      let productId = editingProductId;
      if (editingProductId) {
        await updateProduct(editingProductId, businessId, payload);
      } else {
        productId = await createProduct(businessId, payload);
      }

      const existingRecipeBook = linkedTechnicalSheetId
        ? recipeBooks.find((recipeBook) => recipeBook.id === linkedTechnicalSheetId)
        : recipeBooks.find((recipeBook) => recipeBook.product_id === productId);
      if (existingRecipeBook) {
        await updateRecipeBook(existingRecipeBook.id, {
          ...existingRecipeBook,
          business_id: businessId,
          product_id: productId,
          product_name: payload.name,
          recipe_mode: payload.recipeMode,
          direct_ingredients: existingRecipeBook.direct_ingredients || existingRecipeBook.ingredients || [],
          sale_price: payload.price,
        });
      } else if (!linkedTechnicalSheetId) {
        await createRecipeBook({
          business_id: businessId,
          product_id: productId,
          product_name: payload.name,
          recipe_mode: payload.recipeMode,
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

  const handleSupplySubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      const payload = {
        name: supplyForm.name.trim(),
        code: supplyForm.code.trim(),
        category: supplyForm.category.trim(),
        subcategory: supplyForm.subcategory.trim(),
        description: supplyForm.description.trim(),
        type: supplyForm.type,
        status: supplyForm.status,
        baseUnit: supplyForm.unit,
        unit: supplyForm.unit,
        purchaseUnit: supplyForm.purchaseUnit,
        purchaseQuantity: Number(supplyForm.purchaseQuantity),
        conversionFactor: Number(supplyForm.conversionFactor),
        currentCost: Number(supplyForm.currentCost || supplyForm.averageCost || 0),
        lastPurchaseCost: Number(supplyForm.lastCost || supplyForm.currentCost || supplyForm.averageCost || 0),
        stock: Number(supplyForm.stock),
        stockMinAlert: Number(supplyForm.stockMinAlert),
        idealStock: Number(supplyForm.idealStock || 0),
        reorderPoint: Number(supplyForm.reorderPoint || 0),
        inventoryUnit: supplyForm.inventoryUnit || supplyForm.unit,
        location: supplyForm.location.trim(),
        wastePercent: Number(supplyForm.wastePercent || 0),
        usefulYield: Number(supplyForm.usefulYield || 0),
        wasteNotes: supplyForm.wasteNotes.trim(),
        storageType: supplyForm.storageType,
        shelfLifeClosed: Number(supplyForm.shelfLifeClosed || 0),
        shelfLifeOpened: Number(supplyForm.shelfLifeOpened || 0),
        timeUnit: supplyForm.timeUnit,
        supplierName: supplyForm.supplierName.trim(),
        notes: supplyForm.notes.trim(),
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
        await archiveProduct(itemToDelete.id);
      } else {
        await updateSupply(itemToDelete.id, businessId, {
          ...itemToDelete,
          status: "inactive",
        });
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
          userProfile={userProfile}
          suppliers={suppliers}
          purchases={purchases}
          supplies={supplies}
          recipeBooks={recipeBooks}
          ingredientCategoryOptions={ingredientCategoryOptions}
          supplierCategoryOptions={supplierCategoryOptions}
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
          supplySummary={supplySummary}
          priceHistoryBySupply={priceHistoryBySupply}
          recipeImpactBySupply={recipeImpactBySupply}
          spendByCategory={spendByCategory}
          onCreateSupply={openCreateSupplyModal}
          onEditSupply={openEditSupplyModal}
          onDeleteSupply={(supply) =>
            setItemToDelete({ ...supply, type: "supply", name: supply.name })
          }
          getSupplyHealth={getSupplyHealth}
        />
      ) : null}

      {activeTab === "products" || isCatalogMode ? (
        <ResourceProductsPanel
          isCatalogMode={isCatalogMode}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          productView={productView}
          onProductViewChange={setProductView}
          onCreateProduct={openCreateProductModal}
          products={products}
          categories={productCategoryDocs}
          modifiers={productModifiers}
          combos={productCombos}
          productRecipeMap={productRecipeMap}
          recipeBooks={recipeBooks}
          userProfile={userProfile}
          getProductFlowSummary={buildProductFlowSummary}
          onEditProduct={openEditProductModal}
          onOpenProductRecipes={openProductCostingContext}
          onDuplicateProduct={(product) => {
            setEditingProductId(null);
            setProductForm({
              ...buildProductForm(product),
              name: `${product.name} copia`,
              code: "",
              status: "inactive",
            });
            setIsProductModalOpen(true);
          }}
          onUpdateProductStatus={updateProductStatus}
          onCreateCategory={(category) =>
            createProductCategory(businessId, category, productCategoryDocs)
          }
          onUpdateCategory={(categoryId, category) =>
            updateProductCategory(categoryId, businessId, category, productCategoryDocs)
          }
          onCreateModifier={(productId, modifier) =>
            createProductModifier(businessId, productId, modifier)
          }
          onUpdateModifier={(modifierId, productId, modifier) =>
            updateProductModifier(modifierId, businessId, productId, modifier)
          }
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
        productCategoryDocs={productCategoryDocs}
        recipeBooks={recipeBooks}
        productModifiers={productModifiers}
        productModalMetrics={productModalMetrics}
        onOpenRecipe={() => {
          if (isCatalogMode) {
            return;
          }

          closeProductModal();
          openRecipeContext(editingProductId || "");
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
        title={itemToDelete?.type === "product" ? "Archivar producto" : "Desactivar insumo"}
        description={
          itemToDelete
            ? itemToDelete.type === "product"
              ? `${itemToDelete.name} quedara archivado para conservar ventas historicas.`
              : `${itemToDelete.name} quedara inactivo sin borrar historial ni romper fichas tecnicas.`
            : ""
        }
        confirmLabel={itemToDelete?.type === "product" ? "Archivar" : "Desactivar"}
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

