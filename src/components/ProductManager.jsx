import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  ClipboardList,
  Factory,
  LayoutGrid,
  List,
  Package,
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
  createRecipeBook,
  subscribeToRecipeBooks,
  updateRecipeBook,
} from "../services/recipeBookService";
import { subscribeToPurchases } from "../services/purchaseService";
import ConfirmModal from "./ConfirmModal";
import FormModal from "./FormModal";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import SupplierManager from "./SupplierManager";
import PurchaseManager from "./PurchaseManager";
import RecipeBookManager from "./RecipeBookManager";
import { formatCOP } from "../utils/formatters";

const PRODUCT_FORM = {
  name: "",
  category: "",
  price: "",
  stock: "",
  productType: "standard",
  ticketEligible: false,
  ticketUnits: "10",
  ticketValidityDays: "30",
};

const SUPPLY_FORM = {
  name: "",
  category: "",
  unit: "g",
  stock: "",
  stockMinAlert: "",
  averageCost: "",
};

const ONBOARDING_STEPS = [
  { id: "suppliers", title: "Proveedores", description: "Registra a quien le compras.", icon: Factory },
  { id: "ingredients", title: "Insumos", description: "Define materias primas y unidades base.", icon: Boxes },
  { id: "purchases", title: "Compras", description: "Carga facturas para valorizar inventario.", icon: ClipboardList },
  { id: "recipes", title: "Fichas Tecnicas", description: "Mide costo, merma y rentabilidad.", icon: Sparkles },
  { id: "products", title: "Catalogo de Productos", description: "Conecta lo que vendes con tu costeo.", icon: Package },
];

const TABS = [
  { id: "suppliers", label: "Proveedores", icon: Factory },
  { id: "ingredients", label: "Insumos", icon: Boxes },
  { id: "purchases", label: "Compras", icon: ClipboardList },
  { id: "recipes", label: "Fichas Tecnicas", icon: Sparkles },
  { id: "products", label: "Catalogo", icon: Package },
];

const UNITS = ["g", "kg", "ml", "l", "oz", "und"];
const RESOURCE_TABS = ["suppliers", "ingredients", "purchases", "recipes", "products"];

function buildProductForm(product) {
  if (!product) {
    return PRODUCT_FORM;
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

function buildSupplyForm(supply) {
  if (!supply) {
    return SUPPLY_FORM;
  }

  return {
    name: supply.name || "",
    category: supply.category || "",
    unit: supply.unit || "g",
    stock: String(supply.stock ?? ""),
    stockMinAlert: String(supply.stock_min_alert ?? supply.stockMinAlert ?? ""),
    averageCost: String(supply.average_cost ?? supply.cost_per_unit ?? ""),
  };
}

function getSupplyHealth(supply) {
  const stock = Number(supply.stock || 0);
  const min = Number(supply.stock_min_alert || 0);

  if (stock <= 0) {
    return { label: "Agotado", classes: "bg-rose-100 text-rose-700 ring-rose-200" };
  }

  if (stock <= min || stock <= min * 1.15) {
    return { label: "Alerta", classes: "bg-amber-100 text-amber-700 ring-amber-200" };
  }

  return { label: "Sano", classes: "bg-emerald-100 text-emerald-700 ring-emerald-200" };
}

export default function ProductManager({ businessId, mode = "resources" }) {
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [recipeBooks, setRecipeBooks] = useState([]);
  const [activeTab, setActiveTab] = useState(mode === "catalog" ? "products" : "suppliers");
  const [productForm, setProductForm] = useState(PRODUCT_FORM);
  const [supplyForm, setSupplyForm] = useState(SUPPLY_FORM);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingSupplyId, setEditingSupplyId] = useState(null);
  const [productView, setProductView] = useState("grid");
  const [ingredientView, setIngredientView] = useState("grid");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const isCatalogMode = mode === "catalog";
  const currentProductRecipe = useMemo(
    () => recipeBooks.find((recipeBook) => recipeBook.product_id === editingProductId) || null,
    [editingProductId, recipeBooks]
  );

  useEffect(() => {
    setActiveTab(mode === "catalog" ? "products" : "suppliers");
  }, [mode]);

  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts(businessId, setProducts);
    const unsubscribeSupplies = subscribeToSupplies(businessId, setSupplies);
    const unsubscribeSuppliers = subscribeToSuppliers(businessId, setSuppliers);
    const unsubscribePurchases = subscribeToPurchases(businessId, setPurchases);
    const unsubscribeRecipeBooks = subscribeToRecipeBooks(businessId, setRecipeBooks);

    return () => {
      unsubscribeProducts();
      unsubscribeSupplies();
      unsubscribeSuppliers();
      unsubscribePurchases();
      unsubscribeRecipeBooks();
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

  const spendByCategory = useMemo(() => {
    const totals = purchases.reduce((acc, purchase) => {
      (purchase.items || []).forEach((item) => {
        const key = item.category || "Sin categoria";
        acc[key] = (acc[key] || 0) + Number(item.total_cost || 0);
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
  }, [purchases]);

  const productRecipeMap = useMemo(() => {
    return recipeBooks.reduce((acc, recipeBook) => {
      acc[recipeBook.product_id] = recipeBook;
      return acc;
    }, {});
  }, [recipeBooks]);

  const productCategories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products]
  );
  const resourceStats = useMemo(() => {
    const lowStockCount = supplies.filter((supply) => {
      const stock = Number(supply.stock || 0);
      const min = Number(supply.stock_min_alert || 0);
      return stock <= 0 || stock <= min || stock <= min * 1.15;
    }).length;
    const latestPurchase = purchases[0];
    const latestPurchaseLabel = latestPurchase?.purchase_date
      ? latestPurchase.purchase_date
      : "Sin cargas";
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
  }, [purchases, recipeBooks, supplies]);

  const productModalMetrics = useMemo(() => {
    if (!currentProductRecipe) {
      return {
        realCost: 0,
        currentMarginPct: 0,
        suggestedPrice: Number(productForm.price || 0),
        ingredientsCount: 0,
      };
    }

    return {
      realCost: Number(currentProductRecipe.real_cost || 0),
      currentMarginPct: Number(currentProductRecipe.current_margin_pct || 0),
      suggestedPrice: Number(currentProductRecipe.suggested_price || 0),
      ingredientsCount: Array.isArray(currentProductRecipe.ingredients)
        ? currentProductRecipe.ingredients.length
        : 0,
    };
  }, [currentProductRecipe, productForm.price]);

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
        ticketEligible: productForm.ticketEligible,
        ticketUnits: Number(productForm.ticketUnits),
        ticketValidityDays: Number(productForm.ticketValidityDays),
      };

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
          sale_price: payload.price,
        });
      } else {
        await createRecipeBook({
          business_id: businessId,
          product_id: productId,
          product_name: payload.name,
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
                  Separa el catalogo comercial de los insumos, compras y fichas tecnicas.
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
        <SupplierManager businessId={businessId} suppliers={suppliers} purchases={purchases} />
      ) : null}

      {activeTab === "purchases" && !isCatalogMode ? (
        <PurchaseManager
          businessId={businessId}
          suppliers={suppliers}
          supplies={supplies}
          purchases={purchases}
        />
      ) : null}

      {activeTab === "recipes" && !isCatalogMode ? (
        <RecipeBookManager
          businessId={businessId}
          products={products}
          supplies={supplies}
          recipeBooks={recipeBooks}
        />
      ) : null}

      {activeTab === "ingredients" && !isCatalogMode ? (
        <section className="space-y-6">
          <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Inventario de insumos</h2>
                <p className="text-sm text-slate-500">
                  Controla stock, costo promedio ponderado y alertas minimas.
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
                {supplies.map((supply) => {
                  const status = getSupplyHealth(supply);
                  const history = priceHistoryBySupply[supply.id] || [];

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
                            {supply.stock} {supply.unit}
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
                      </div>

                      <div className="mt-5 rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Historial de precios
                        </p>
                        <div className="mt-3 space-y-2">
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
                      Carga compras para ver la distribucion del presupuesto por categoria.
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
              <button
                type="button"
                onClick={() => {
                  setEditingProductId(null);
                  setProductForm(PRODUCT_FORM);
                  setIsProductModalOpen(true);
                }}
                className="flex min-h-32 flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-300 bg-white px-5 py-6 text-center text-slate-500 transition hover:border-emerald-300 hover:text-slate-700"
              >
                <PackagePlus size={24} />
                <p className="mt-3 text-base font-semibold text-slate-700">Crea tu primer producto</p>
                <p className="mt-1 text-sm">Empieza tu catálogo comercial con una ficha limpia.</p>
              </button>
            ) : null}
            {products.map((product) => {
              const recipeBook = productRecipeMap[product.id];
              const margin = Number(recipeBook?.current_margin_pct || 0);
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
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${semaforoClasses}`}>
                      {recipeBook ? `${margin.toFixed(1)}% margen` : "Sin ficha"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Precio</p>
                      <p className="mt-2 text-right font-mono text-lg font-black text-slate-950">
                        {formatCOP(product.price)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo real</p>
                      <p className="mt-2 text-right font-mono font-semibold text-slate-900">
                        {formatCOP(recipeBook?.real_cost || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[#d4a72c]/20">
                      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#946200]">
                        <Sparkles size={14} />
                        Sugerido
                      </p>
                      <p className="mt-2 text-right font-mono font-semibold text-slate-900">
                        {formatCOP(recipeBook?.suggested_price || product.price)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-5 grid gap-3 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 ${isCatalogMode ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
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
                      <button
                        type="button"
                        onClick={() => setActiveTab("recipes")}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-[#fff7df] px-4 py-3 text-sm font-semibold text-[#946200] ring-1 ring-[#d4a72c]/20"
                      >
                        <Sparkles size={16} />
                        Ficha
                      </button>
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

      <FormModal
        open={isProductModalOpen}
        onClose={closeProductModal}
        maxWidthClass="max-w-5xl"
        icon={{ main: <PackagePlus size={20} />, close: <X size={18} /> }}
        title={editingProductId ? "Editar producto" : "Nuevo producto"}
        description="Gestiona el catalogo comercial con precios claros, categoria reutilizable y una lectura inmediata del costeo conectado."
      >
        <form onSubmit={handleProductSubmit} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-6">
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
                  label="Precio de venta"
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, price: event.target.value }))
                  }
                />
                <FormInput
                  label="Precio sugerido"
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
                {currentProductRecipe ? "Costeo enlazado" : "Aun sin costeo"}
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {currentProductRecipe
                  ? "Este panel se alimenta automaticamente desde la receta estandar y el costo vigente de insumos."
                  : "Conecta este producto con una ficha tecnica para medir costo real, margen y precio sugerido."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo real</p>
                <p className="mt-2 text-lg font-bold text-slate-950">
                  {formatCOP(productModalMetrics.realCost)}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Margen actual</p>
                <p className="mt-2 text-lg font-bold text-slate-950">
                  {productModalMetrics.currentMarginPct.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/75 p-5">
              {currentProductRecipe ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {productModalMetrics.ingredientsCount} insumos conectados
                  </p>
                  <p className="text-sm text-slate-500">
                    El precio sugerido responde al margen objetivo configurado en la ficha.
                  </p>
                  {!isCatalogMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeProductModal();
                        setActiveTab("recipes");
                      }}
                      className="inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Abrir ficha tecnica
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCatalogMode) {
                        closeProductModal();
                        setActiveTab("recipes");
                      }
                    }}
                    disabled={isCatalogMode}
                    className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus size={22} />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Agrega una ficha tecnica</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {isCatalogMode
                        ? "Crea la receta desde Centro de Recursos para activar costos y rentabilidad."
                        : "Enlaza receta, merma y margen objetivo desde el modulo de fichas tecnicas."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </form>
      </FormModal>

      <FormModal
        open={isSupplyModalOpen}
        onClose={closeSupplyModal}
        maxWidthClass="max-w-3xl"
        icon={{ main: <Boxes size={20} />, close: <X size={18} /> }}
        title={editingSupplyId ? "Editar insumo" : "Nuevo insumo"}
        description="Registra materias primas con una grilla estable y scroll interno, sin que ningun campo se salga del viewport."
      >
        <form onSubmit={handleSupplySubmit} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Nombre"
              required
              value={supplyForm.name}
              onChange={(event) => setSupplyForm((current) => ({ ...current, name: event.target.value }))}
            />
            <FormInput
              label="Categoria"
              value={supplyForm.category}
              onChange={(event) =>
                setSupplyForm((current) => ({ ...current, category: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormSelect
              label="Unidad"
              value={supplyForm.unit}
              onChange={(event) => setSupplyForm((current) => ({ ...current, unit: event.target.value }))}
              selectClassName="bg-[#fff7df] font-semibold text-[#946200] ring-[#d4a72c]/30"
              hint="Base del costeo por unidad."
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </FormSelect>
            <FormInput
              label="Stock"
              type="number"
              min="0"
              step="0.01"
              value={supplyForm.stock}
              onChange={(event) => setSupplyForm((current) => ({ ...current, stock: event.target.value }))}
            />
            <FormInput
              label="Stock minimo"
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
              type="number"
              min="0"
              step="0.01"
              value={supplyForm.averageCost}
              onChange={(event) =>
                setSupplyForm((current) => ({ ...current, averageCost: event.target.value }))
              }
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
      </FormModal>

      <ConfirmModal
        open={Boolean(itemToDelete)}
        title={itemToDelete?.type === "product" ? "Eliminar producto" : "Eliminar insumo"}
        description={itemToDelete ? `Se eliminara ${itemToDelete.name} de SmartProfit.` : ""}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </section>
  );
}
