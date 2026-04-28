import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  ClipboardList,
  LayoutGrid,
  List,
  PackagePlus,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
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
import ModalWrapper from "./ModalWrapper";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import SupplierManager from "./SupplierManager";
import PurchaseManager from "./PurchaseManager";
import PreparationManager from "./PreparationManager";
import RecipeBookManager from "./RecipeBookManager";
import { formatCOP } from "../utils/formatters";
import TaxonomyManagerModal from "./TaxonomyManagerModal";
import { buildSelectOptions, SUPPLY_UNITS } from "../utils/resourceOptions";
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
  getSupplyHealth,
  PRODUCT_FORM,
  RESOURCE_TABS,
  summarizeProducts,
  summarizeSupplies,
  SUPPLY_FORM,
  TABS,
} from "../features/resources/resourceDashboardHelpers";

function getProductFlowSummary({ product, recipeBook }) {
  const recipeMode = String(product?.recipe_mode || "direct").trim();
  const preparationCount = Array.isArray(product?.preparation_items)
    ? product.preparation_items.length
    : 0;

  if (recipeMode === "composed") {
    return {
      compact:
        preparationCount > 0
          ? `${preparationCount} preparacion(es) conectada(s)`
          : "Producto compuesto pendiente de bases",
      detail:
        preparationCount > 0
          ? `Producto compuesto con ${preparationCount} preparacion(es) conectada(s).`
          : "Producto compuesto aun sin preparaciones conectadas.",
      badge: "Compuesto",
    };
  }

  return {
    compact: recipeBook ? "Ficha conectada" : "Sin ficha conectada",
    detail: recipeBook
      ? "Este producto ya conecta precio, costo real y rentabilidad."
      : "Aun no tiene ficha tecnica conectada para leer utilidad real.",
    badge: "Directo",
  };
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
  const [productForm, setProductForm] = useState(PRODUCT_FORM);
  const [supplyForm, setSupplyForm] = useState(SUPPLY_FORM);
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
        label: `${preparation.name} · ${Number(preparation.yield_quantity || 0)} ${
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

  const priceHistoryBySupply = useMemo(() => {
    return purchases.reduce((acc, purchase) => {
      (purchase.items || []).forEach((item) => {
        const ingredientId = item.ingredient_id;
        if (!ingredientId) {
          return;
        }
        acc[ingredientId] = acc[ingredientId] || [];
        acc[ingredientId].push({
          date: purchase.purchase_date,
          unitCost: Number(item.landed_unit_cost || item.unit_price || 0),
        });
      });
      return acc;
    }, {});
  }, [purchases]);

  const spendByCategory = useMemo(() => buildSpendByCategory(purchases), [purchases]);

  const productRecipeMap = useMemo(() => {
    return recipeBooks.reduce((acc, recipeBook) => {
      acc[recipeBook.product_id] = recipeBook;
      return acc;
    }, {});
  }, [recipeBooks]);
  const recipeImpactBySupply = useMemo(() => {
    return recipeBooks.reduce((acc, recipeBook) => {
      (recipeBook.ingredients || []).forEach((ingredient) => {
        if (!ingredient.ingredient_id) {
          return;
        }

        acc[ingredient.ingredient_id] = (acc[ingredient.ingredient_id] || 0) + 1;
      });
      return acc;
    }, {});
  }, [recipeBooks]);
  const preparationImpactBySupply = useMemo(() => {
    return preparations.reduce((acc, preparation) => {
      (preparation.ingredients || []).forEach((ingredient) => {
        if (!ingredient.ingredient_id) {
          return;
        }

        acc[ingredient.ingredient_id] = (acc[ingredient.ingredient_id] || 0) + 1;
      });
      return acc;
    }, {});
  }, [preparations]);

  const productCategories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products]
  );
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
  const latestSupplyReferenceByName = useMemo(() => {
    const map = new Map();

    purchases.forEach((purchase) => {
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
  }, [purchases]);
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

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProductId(null);
    setProductForm(PRODUCT_FORM);
    setFeedback({ type: "", message: "" });
  };

  const closeSupplyModal = () => {
    setIsSupplyModalOpen(false);
    setEditingSupplyId(null);
    setSupplyForm(SUPPLY_FORM);
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
        current.unit && current.unit !== SUPPLY_FORM.unit
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
      const payload = {
        name: productForm.name.trim(),
        category: productForm.category.trim(),
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        productType: productForm.productType,
        recipeMode: productForm.recipeMode,
        preparationItems:
          productForm.recipeMode === "composed"
            ? productForm.preparationItems.map((item) => ({
                preparation_id: item.preparationId,
                preparation_name:
                  preparationMap[item.preparationId]?.name || item.preparationName || "",
                output_unit:
                  preparationMap[item.preparationId]?.output_unit || item.outputUnit || "",
                quantity: Number(item.quantity),
              }))
            : [],
        ticketEligible: productForm.ticketEligible,
        ticketUnits: Number(productForm.ticketUnits),
        ticketValidityDays: Number(productForm.ticketValidityDays),
      };

      if (payload.recipeMode === "composed" && payload.preparationItems.length === 0) {
        throw new Error("Agrega al menos una preparacion para guardar un producto compuesto.");
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
          <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Centro de recursos</h2>
                <p className="text-sm text-slate-500">
                  Organiza abastecimiento, compras y costeo sin mezclar el catalogo comercial.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Ingenieria del negocio
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {resourceStats.map((stat) => (
                <article
                  key={stat.id}
                  className="min-w-[220px] flex-1 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stat.hint}</p>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Centro de decisiones
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{resourceDecisionSummary}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${
                      resourceDecisionItems.length > 0
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {resourceDecisionItems.length} lectura{resourceDecisionItems.length === 1 ? "" : "s"} activa{resourceDecisionItems.length === 1 ? "" : "s"}
                  </div>
                  <button
                    type="button"
                    onClick={openDecisionCenter}
                    disabled={resourceDecisionItems.length === 0}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      resourceDecisionItems.length > 0
                        ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    Ver panel
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white/85 p-4 shadow-lg ring-1 ring-white/70 backdrop-blur">
            <div className="flex flex-wrap gap-2">
              {TABS.filter((tab) => RESOURCE_TABS.includes(tab.id)).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {activeTab === "suppliers" && !isCatalogMode ? (
        <SupplierManager
          businessId={businessId}
          suppliers={suppliers}
          purchases={purchases}
          categoryOptions={supplierCategoryOptions}
          onManageCategories={() => setTaxonomyModalScope("supplier_categories")}
        />
      ) : null}

      {activeTab === "purchases" && !isCatalogMode ? (
        <PurchaseManager
          businessId={businessId}
          suppliers={suppliers}
          supplies={supplies}
          purchases={purchases}
          recipeBooks={recipeBooks}
          categoryOptions={ingredientCategoryOptions}
          onManageCategories={() => setTaxonomyModalScope("ingredient_categories")}
        />
      ) : null}

      {activeTab === "preparations" && !isCatalogMode ? (
        <PreparationManager
          businessId={businessId}
          supplies={supplies}
          preparations={preparations}
        />
      ) : null}

      {activeTab === "recipes" && !isCatalogMode ? (
        <RecipeBookManager
          businessId={businessId}
          products={products}
          supplies={supplies}
          recipeBooks={recipeBooks}
          focusedProductId={focusedRecipeProductId}
          onFocusHandled={() => setFocusedRecipeProductId("")}
        />
      ) : null}

      {activeTab === "ingredients" && !isCatalogMode ? (
        <section className="space-y-6">
          <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Inventario de insumos</h2>
                <p className="text-sm text-slate-500">
                  Alterna entre lectura visual, tabla operativa y alertas para controlar stock y costo.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200">
                  <button
                    type="button"
                    onClick={() => setIngredientView("grid")}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${ingredientView === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIngredientView("list")}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${ingredientView === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIngredientView("alerts")}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${ingredientView === "alerts" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                  >
                    <ClipboardList size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSupplyId(null);
                    setSupplyForm(SUPPLY_FORM);
                    setIsSupplyModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
                >
                  <Plus size={16} />
                  Nuevo insumo
                </button>
              </div>
            </div>

            <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Saludables</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{supplySummary.healthy}</p>
              </article>
              <article className="rounded-[24px] bg-amber-50 p-4 ring-1 ring-amber-200">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Atencion</p>
                <p className="mt-2 text-2xl font-black text-amber-900">{supplySummary.attention}</p>
              </article>
              <article className="rounded-[24px] bg-rose-50 p-4 ring-1 ring-rose-200">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">Criticos</p>
                <p className="mt-2 text-2xl font-black text-rose-900">{supplySummary.critical}</p>
              </article>
              <article className="rounded-[24px] bg-slate-950 p-4 text-white ring-1 ring-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Agotados</p>
                <p className="mt-2 text-2xl font-black">{supplySummary.depleted}</p>
              </article>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className={ingredientView === "grid" ? "grid gap-4 md:grid-cols-2" : "grid gap-3"}>
                {supplies.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSupplyId(null);
                      setSupplyForm(SUPPLY_FORM);
                      setIsSupplyModalOpen(true);
                    }}
                    className="flex min-h-32 flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-300 bg-white px-5 py-6 text-center text-slate-500 transition hover:border-emerald-300 hover:text-slate-700"
                  >
                    <Boxes size={24} />
                    <p className="mt-3 text-base font-semibold text-slate-700">Crea tu primer insumo</p>
                    <p className="mt-1 text-sm">Define materias primas para costeo y compras.</p>
                  </button>
                ) : null}
                {ingredientView === "alerts" ? (
                  supplies
                    .filter((supply) => getSupplyHealth(supply).label !== "Saludable")
                    .map((supply) => {
                      const status = getSupplyHealth(supply);
                      const stock = Number(supply.stock || 0);
                      const min = Number(supply.stock_min_alert || 0);
                      const missing = Math.max(min - stock, 0);
                      const latestPurchase = (priceHistoryBySupply[supply.id] || [])[0];
                      const linkedRecipes = recipeImpactBySupply[supply.id] || 0;
                      const linkedPreparations = preparationImpactBySupply[supply.id] || 0;

                      return (
                        <article
                          key={supply.id}
                          className="rounded-[24px] bg-white p-5 shadow-lg ring-1 ring-slate-200"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                {supply.category || "Sin categoria"}
                              </p>
                              <h3 className="mt-2 text-lg font-semibold text-slate-900">{supply.name}</h3>
                              <p className="mt-2 text-sm text-slate-500">
                                {missing > 0
                                  ? `Faltan ${missing} ${supply.unit} para volver al minimo.`
                                  : "Revisa el nivel actual para evitar quiebres de stock."}
                              </p>
                              <p className="mt-2 text-sm text-slate-500">
                                {linkedPreparations + linkedRecipes > 0
                                  ? `${linkedPreparations} preparacion(es) y ${linkedRecipes} ficha(s) dependen de este insumo.`
                                  : "Aun no impacta preparaciones ni fichas tecnicas conectadas."}
                              </p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.classes}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Stock actual</p>
                              <p className="mt-2 font-semibold text-slate-900">{stock} {supply.unit}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Minimo</p>
                              <p className="mt-2 font-semibold text-slate-900">{min} {supply.unit}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Ultima compra</p>
                              <p className="mt-2 font-semibold text-slate-900">
                                {latestPurchase ? formatCOP(latestPurchase.unitCost) : "Sin registro"}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    })
                ) : supplies.map((supply) => {
                  const status = getSupplyHealth(supply);
                  const history = priceHistoryBySupply[supply.id] || [];
                  const stock = Number(supply.stock || 0);
                  const min = Number(supply.stock_min_alert || 0);
                  const missing = Math.max(min - stock, 0);
                  const linkedRecipes = recipeImpactBySupply[supply.id] || 0;
                  const linkedPreparations = preparationImpactBySupply[supply.id] || 0;

                  return (
                    <article
                      key={supply.id}
                      className={`rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200 ${ingredientView === "list" ? "flex flex-col gap-4 md:flex-row md:items-center md:justify-between" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {supply.category || "Sin categoria"}
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-900">{supply.name}</h3>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.classes}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Stock</p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {stock} {supply.unit}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CPP</p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {formatCOP(supply.average_cost)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Minimo</p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {supply.stock_min_alert || 0} {supply.unit}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 sm:col-span-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Uso en recetas</p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {linkedPreparations + linkedRecipes > 0
                              ? `${linkedPreparations} preparacion(es) y ${linkedRecipes} ficha(s) dependen de este insumo`
                              : "Todavia no afecta preparaciones ni fichas tecnicas conectadas"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lectura operativa</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Estado del minimo</span>
                            <span className="font-semibold text-slate-900">
                              {missing > 0 ? `Faltan ${missing} ${supply.unit}` : "Cobertura estable"}
                            </span>
                          </div>
                          {history.slice(0, 3).map((entry, index) => (
                            <div key={`${supply.id}-history-${index}`} className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">{entry.date}</span>
                              <span className="font-semibold text-slate-900">
                                {formatCOP(entry.unitCost)}
                              </span>
                            </div>
                          ))}
                          {history.length === 0 ? (
                            <p className="text-sm text-slate-500">Sin compras registradas todavia.</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSupplyId(supply.id);
                            setSupplyForm(buildSupplyForm(supply));
                            setIsSupplyModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete({ id: supply.id, type: "supply", name: supply.name })}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-[#d4a72c]/20 bg-[#fff7df] p-3 text-[#946200]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Gasto por categorias</h3>
                    <p className="text-sm text-slate-500">
                      Identifica donde se concentra el presupuesto de compras.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {spendByCategory.map((entry) => (
                    <div key={entry.category}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{entry.category}</span>
                        <span className="text-slate-500">
                          {entry.sharePct.toFixed(0)}% · {formatCOP(entry.total)}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-200">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-[#d4a72c]"
                          style={{ width: `${Math.max(entry.sharePct, 8)}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  {spendByCategory.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Registra compras para ver la distribucion real del presupuesto por categoria.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </section>
      ) : null}

      {activeTab === "products" ? (
        <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {isCatalogMode ? "Catalogo de productos" : "Productos"}
              </h2>
              <p className="text-sm text-slate-500">
                {isCatalogMode
                  ? "Gestiona el catalogo comercial sin mezclarlo con compras, recetas o costeo."
                  : "Cada producto puede conectarse con su ficha tecnica para utilidad neta automatica."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200">
                <button
                  type="button"
                  onClick={() => setProductView("grid")}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${productView === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setProductView("list")}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${productView === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  <List size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingProductId(null);
                  setProductForm(PRODUCT_FORM);
                  setIsProductModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
              >
                <Plus size={16} />
                Nuevo producto
              </button>
            </div>
          </div>

          <div className={productView === "grid" ? "grid gap-4 xl:grid-cols-2" : "grid gap-3"}>
            {products.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-5 py-6 shadow-sm xl:col-span-2">
                <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm(PRODUCT_FORM);
                      setIsProductModalOpen(true);
                    }}
                    className="flex min-h-32 flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center text-slate-500 transition hover:border-emerald-300 hover:text-slate-700"
                  >
                    <PackagePlus size={24} />
                    <p className="mt-3 text-base font-semibold text-slate-700">Crea tu primer producto</p>
                    <p className="mt-1 text-sm">Empieza tu catalogo comercial con una ficha limpia.</p>
                  </button>

                  <div className="rounded-[24px] bg-slate-50 px-5 py-5 ring-1 ring-slate-200">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Flujo inicial
                    </p>
                    <div className="mt-3 space-y-3 text-sm text-slate-600">
                      <p>1. Define nombre, categoria y precio de venta.</p>
                      <p>2. Si aplica, conecta la ficha tecnica o las preparaciones base.</p>
                      <p>3. Cuando el catalogo exista, el POS quedara listo para vender.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {products.map((product) => {
              const recipeBook = productRecipeMap[product.id];
              const margin = Number(recipeBook?.current_margin_pct || 0);
              const recipeMode = product.recipe_mode || "direct";
              const flowSummary = getProductFlowSummary({ product, recipeBook });
              const semaforoClasses =
                recipeBook?.profitability_status === "healthy"
                  ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                  : recipeBook?.profitability_status === "critical"
                    ? "bg-rose-100 text-rose-700 ring-rose-200"
                    : "bg-amber-100 text-amber-700 ring-amber-200";

              return (
                <article
                  key={product.id}
                  className={`group rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200 ${productView === "list" ? "flex flex-col gap-4 md:flex-row md:items-center md:justify-between" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {product.category}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{product.name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                            recipeMode === "composed"
                              ? "bg-[#fff7df] text-[#946200]"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {flowSummary.badge}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200 sm:hidden">
                          {flowSummary.compact}
                        </span>
                      </div>
                      <p className="mt-2 hidden text-sm text-slate-500 sm:block">
                        {flowSummary.detail}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${semaforoClasses}`}>
                      {recipeBook ? `${margin.toFixed(1)}% margen` : "Sin ficha"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tu precio actual</p>
                      <p className="mt-2 text-right font-mono text-lg font-black text-slate-950">
                        {formatCOP(product.price)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo conectado</p>
                      <p className="mt-2 text-right font-mono font-semibold text-slate-900">
                        {formatCOP(recipeBook?.real_cost || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[#d4a72c]/20">
                      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#946200]">
                        <Sparkles size={14} />
                        Precio recomendado
                      </p>
                      <p className="mt-2 text-right font-mono font-semibold text-slate-900">
                        {formatCOP(recipeBook?.suggested_price || product.price)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-5 grid gap-3 opacity-100 transition xl:opacity-0 xl:group-hover:opacity-100 xl:group-focus-within:opacity-100 ${isCatalogMode ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProductId(product.id);
                        setProductForm(buildProductForm(product));
                        setIsProductModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>
                    {!isCatalogMode ? (
                      recipeMode === "composed" ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab("preparations")}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-[#fff7df] px-4 py-3 text-sm font-semibold text-[#946200] ring-1 ring-[#d4a72c]/20"
                        >
                          <Sparkles size={16} />
                          Preparaciones
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openRecipeContext(product.id)}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-[#fff7df] px-4 py-3 text-sm font-semibold text-[#946200] ring-1 ring-[#d4a72c]/20"
                        >
                          <Sparkles size={16} />
                          Ficha
                        </button>
                      )
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setItemToDelete({ id: product.id, type: "product", name: product.name })}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <ModalWrapper
        open={isProductModalOpen}
        onClose={closeProductModal}
        maxWidthClass="max-w-5xl"
        icon={{ main: <PackagePlus size={20} />, close: <X size={18} /> }}
        title={editingProductId ? "Editar producto" : "Nuevo producto"}
        description="Gestiona el catalogo comercial con precios claros, categoria reutilizable y una lectura inmediata del costeo conectado."
      >
        <form onSubmit={handleProductSubmit} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-6">
            <div className="grid gap-3 rounded-[24px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] p-5 text-white ring-1 ring-slate-950/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Alta de producto
              </p>
              <h3 className="text-lg font-semibold">
                Define primero lo que vendes y deja que el sistema te ayude a defender el precio.
              </h3>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">Editable: nombre, categoria, precio y stock</span>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-200">Calculado: costo conectado</span>
                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-amber-200">Recomendado: precio sugerido</span>
              </div>
            </div>

            <div className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput
                  label="Nombre"
                  required
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
                <FormInput
                  label="Categoria"
                  required
                  list="product-category-options"
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, category: event.target.value }))
                  }
                  hint="Selecciona una categoria existente o crea una nueva."
                />
              </div>

              <datalist id="product-category-options">
                {productCategories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>

              <div className="grid gap-4 md:grid-cols-2">
                <FormInput
                  label="Tu precio actual"
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, price: event.target.value }))
                  }
                />
                <FormInput
                  label="Precio recomendado"
                  value={formatCOP(productModalMetrics.suggestedPrice || 0)}
                  readOnly
                  hint="Se calcula desde la ficha tecnica y el margen objetivo."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormInput
                  label="Stock comercial"
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.stock}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, stock: event.target.value }))
                  }
                />
                <div className="grid content-end">
                  <button
                    type="button"
                    onClick={() =>
                      setProductForm((current) => ({
                        ...current,
                        price: String(Math.round(productModalMetrics.suggestedPrice || 0)),
                      }))
                    }
                    disabled={!productModalMetrics.suggestedPrice}
                    className="rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Usar precio sugerido
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormSelect
                  label="Tipo de producto"
                  value={productForm.productType}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, productType: event.target.value }))
                  }
                  options={[
                    { value: "standard", label: "Producto normal" },
                    { value: "ticket_wallet", label: "Tiquetera prepaga" },
                  ]}
                />
                <FormInput
                  label="Tickets que otorga"
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.ticketUnits}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, ticketUnits: event.target.value }))
                  }
                  readOnly={productForm.productType !== "ticket_wallet"}
                />
                <FormInput
                  label="Vigencia (dias)"
                  type="number"
                  min="1"
                  step="1"
                  value={productForm.ticketValidityDays}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      ticketValidityDays: event.target.value,
                    }))
                  }
                  readOnly={productForm.productType !== "ticket_wallet"}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormSelect
                  label="Modo de costeo"
                  labelNote="Flujo"
                  value={productForm.recipeMode}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      recipeMode: event.target.value,
                      preparationItems:
                        event.target.value === "composed" ? current.preparationItems : [],
                    }))
                  }
                  options={[
                    { value: "direct", label: "Ficha tecnica directa" },
                    { value: "composed", label: "Producto compuesto por preparaciones" },
                  ]}
                  hint="Usa ficha directa para productos simples y preparaciones para platos armados."
                />
                <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-800">
                    {productForm.recipeMode === "composed"
                      ? "Este producto tomara su costo desde preparaciones base."
                      : "Este producto seguira usando una ficha tecnica editable por insumos."}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {productForm.recipeMode === "composed"
                      ? "Ideal para almuerzos, combos o platos que mezclan varias bases ya preparadas."
                      : "Ideal para productos simples como galletas, bebidas directas o recetas sin armado compuesto."}
                  </p>
                </div>
              </div>

              {productForm.recipeMode === "composed" ? (
                <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">
                        Preparaciones que componen el producto
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Define cuantas porciones o unidades de cada preparacion usa este plato.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={addPreparationRow}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Agregar preparacion
                      </button>
                      <button
                        type="button"
                        onClick={openPreparationContext}
                        className="rounded-2xl border border-[#d4a72c]/30 bg-[#fff7df] px-4 py-2 text-sm font-semibold text-[#946200] transition hover:brightness-95"
                      >
                        Ir a preparaciones base
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {productForm.preparationItems.length > 0 ? (
                      productForm.preparationItems.map((item, index) => {
                        const linkedPreparation = preparationMap[item.preparationId];

                        return (
                          <div
                            key={`product-preparation-${index}`}
                            className="grid gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:grid-cols-[minmax(0,1.6fr)_minmax(160px,0.8fr)_auto]"
                          >
                            <FormSelect
                              label={`Preparacion ${index + 1}`}
                              labelNote="Base"
                              value={item.preparationId}
                              onChange={(event) =>
                                updatePreparationRow(index, "preparationId", event.target.value)
                              }
                              className="min-w-0"
                            >
                              <option value="">Seleccionar preparacion</option>
                              {preparationOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </FormSelect>
                            <FormInput
                              label="Cantidad usada"
                              labelNote={linkedPreparation?.output_unit || "porcion"}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(event) =>
                                updatePreparationRow(index, "quantity", event.target.value)
                              }
                              className="min-w-0"
                            />
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removePreparationRow(index)}
                                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        Agrega las preparaciones base que componen este producto.
                      </div>
                    )}
                  </div>
                </section>
              ) : null}

              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <label className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
                  <div>
                    <span>Permite pago con ticket</span>
                    <p className="mt-1 text-xs text-slate-400">
                      Ideal para almuerzos o planes que el cliente puede redimir desde su monedero.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={productForm.ticketEligible}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        ticketEligible: event.target.checked,
                      }))
                    }
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>

            {feedback.message ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                {feedback.message}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeProductModal}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Guardando..." : editingProductId ? "Actualizar producto" : "Crear producto"}
              </button>
            </div>
          </div>

          <aside className="grid gap-4 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-5 shadow-inner">
            <div className="rounded-[24px] border border-slate-200 bg-white/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Ficha tecnica
              </p>
              <h4 className="mt-3 text-lg font-semibold text-slate-900">
                {currentProductRecipe
                  ? productForm.recipeMode === "composed"
                    ? "Costeo compuesto enlazado"
                    : "Costeo enlazado"
                  : "Aun sin costeo"}
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {currentProductRecipe
                  ? productForm.recipeMode === "composed"
                    ? "Este panel se alimenta desde las preparaciones conectadas y recalcula costo, margen y precio sugerido."
                    : "Este panel se alimenta automaticamente desde la receta estandar y el costo vigente de insumos."
                  : "Conecta este producto con una ficha tecnica o con preparaciones para medir costo real, margen y precio recomendado."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo conectado</p>
                <p className="mt-2 text-lg font-bold text-slate-950">
                  {formatCOP(productModalMetrics.realCost)}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Margen estimado</p>
                <p className="mt-2 text-lg font-bold text-slate-950">
                  {productModalMetrics.currentMarginPct.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/75 p-5">
              {currentProductRecipe ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {productForm.recipeMode === "composed"
                      ? `${productModalMetrics.preparationCount} preparacion(es) y ${productModalMetrics.ingredientsCount} insumo(s) derivados`
                      : `${productModalMetrics.ingredientsCount} insumos conectados`}
                  </p>
                  <p className="text-sm text-slate-500">
                    {productForm.recipeMode === "composed"
                      ? "El precio sugerido responde a la suma de preparaciones base y al margen objetivo activo."
                      : "El precio sugerido responde al margen objetivo configurado en la ficha."}
                  </p>
                  {!isCatalogMode ? (
                    productForm.recipeMode === "composed" ? (
                      <button
                        type="button"
                        onClick={openPreparationContext}
                        className="inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Abrir preparaciones
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          closeProductModal();
                          openRecipeContext(editingProductId);
                        }}
                        className="inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Abrir ficha tecnica
                      </button>
                    )
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCatalogMode) {
                        closeProductModal();
                        if (productForm.recipeMode === "composed") {
                          setActiveTab("preparations");
                        } else {
                          openRecipeContext(editingProductId || "");
                        }
                      }
                    }}
                    disabled={isCatalogMode}
                    className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus size={22} />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {productForm.recipeMode === "composed"
                        ? "Conecta preparaciones base"
                        : "Agrega una ficha tecnica"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {isCatalogMode
                        ? "Crea la receta desde Centro de Recursos para activar costos y rentabilidad."
                        : productForm.recipeMode === "composed"
                          ? "Compone el producto con preparaciones ya costeadas para calcular su rentabilidad."
                          : "Enlaza receta, merma y margen objetivo desde el modulo de fichas tecnicas."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </form>
      </ModalWrapper>

      <ModalWrapper
        open={isSupplyModalOpen}
        onClose={closeSupplyModal}
        maxWidthClass="max-w-3xl"
        icon={{ main: <Boxes size={20} />, close: <X size={18} /> }}
        title={editingSupplyId ? "Editar insumo" : "Nuevo insumo"}
        description="Registra materias primas con campos claros y una edicion comoda en cualquier tamano de pantalla."
      >
        <form onSubmit={handleSupplySubmit} className="grid gap-6">
          <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Flujo recomendado
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">1. Nombra para encontrar rapido</p>
                <p className="mt-1 text-sm text-slate-500">Usa el mismo nombre con que compras y costea el equipo.</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">2. Define una unidad unica</p>
                <p className="mt-1 text-sm text-slate-500">Evita duplicados con gramos, kilos o unidades mezcladas.</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">3. Deja listo el control</p>
                <p className="mt-1 text-sm text-slate-500">Minimo y costo base permiten leer riesgo antes del cierre.</p>
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Nombre"
              labelNote="Clave"
              required
              value={supplyForm.name}
              onChange={(event) => setSupplyForm((current) => ({ ...current, name: event.target.value }))}
              hint="Usa el nombre con el que luego lo buscaras en compras y fichas."
            />
            <div className="grid gap-2">
              <FormSelect
                label="Categoria"
                labelNote="Lectura"
                value={supplyForm.category}
                onChange={(event) =>
                  setSupplyForm((current) => ({ ...current, category: event.target.value }))
                }
                options={ingredientCategoryOptions}
                hint="Ayuda a ordenar compras y presupuesto por tipo de abastecimiento."
              />
              <button
                type="button"
                onClick={() => setTaxonomyModalScope("ingredient_categories")}
                className="justify-self-start rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Gestionar categorias
              </button>
            </div>
          </div>

          <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Con costeo conectado</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{productSummary.connected}</p>
              <p className="mt-1 text-sm text-slate-500">Productos que ya responden con costo real.</p>
            </article>
            <article className="rounded-[24px] bg-emerald-50 p-4 ring-1 ring-emerald-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Margen saludable</p>
              <p className="mt-2 text-2xl font-black text-emerald-900">{productSummary.healthy}</p>
              <p className="mt-1 text-sm text-emerald-800/80">Productos con lectura positiva de rentabilidad.</p>
            </article>
            <article className="rounded-[24px] bg-rose-50 p-4 ring-1 ring-rose-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">Margen en riesgo</p>
              <p className="mt-2 text-2xl font-black text-rose-900">{productSummary.atRisk}</p>
              <p className="mt-1 text-sm text-rose-800/80">Productos que conviene revisar cuanto antes.</p>
            </article>
            <article className="rounded-[24px] bg-[#fff7df] p-4 ring-1 ring-[#d4a72c]/25">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#946200]">Sin ficha o prepago</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {productSummary.withoutRecipe + productSummary.ticketPlans}
              </p>
              <p className="mt-1 text-sm text-slate-600">Productos pendientes de costeo o planes especiales.</p>
            </article>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormSelect
              label="Unidad"
              labelNote="Base"
              value={supplyForm.unit}
              onChange={(event) => setSupplyForm((current) => ({ ...current, unit: event.target.value }))}
              selectClassName="bg-[#fff7df] font-semibold text-[#946200] ring-[#d4a72c]/30"
              hint="Usa la misma unidad base que luego emplearas en compras y recetas."
            >
              {SUPPLY_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </FormSelect>
            <FormInput
              label="Stock"
              labelNote="Actual"
              type="number"
              min="0"
              step="0.01"
              value={supplyForm.stock}
              onChange={(event) => setSupplyForm((current) => ({ ...current, stock: event.target.value }))}
            />
            <FormInput
              label="Stock minimo"
              labelNote="Alerta"
              type="number"
              min="0"
              step="0.01"
              value={supplyForm.stockMinAlert}
              onChange={(event) =>
                setSupplyForm((current) => ({ ...current, stockMinAlert: event.target.value }))
              }
            />
            <FormInput
              label="Costo unidad"
              labelNote="Referencia"
              type="number"
              min="0"
              step="0.01"
              value={supplyForm.averageCost}
              onChange={(event) =>
                setSupplyForm((current) => ({ ...current, averageCost: event.target.value }))
              }
              hint="Si ya hubo compras, este valor se alinea con el ultimo costo registrado."
            />
          </div>

          {feedback.message ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              {feedback.message}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={closeSupplyModal}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Guardando..." : editingSupplyId ? "Actualizar" : "Crear insumo"}
            </button>
          </div>
        </form>
      </ModalWrapper>

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
