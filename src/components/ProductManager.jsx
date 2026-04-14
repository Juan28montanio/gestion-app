import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  ChevronRight,
  ClipboardList,
  Factory,
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
import SupplierManager from "./SupplierManager";
import PurchaseManager from "./PurchaseManager";
import RecipeBookManager from "./RecipeBookManager";
import { formatCOP } from "../utils/formatters";

const PRODUCT_FORM = {
  name: "",
  category: "",
  price: "",
  stock: "",
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
  { id: "ingredients", title: "Insumos", description: "Define materias primas, unidades y alertas.", icon: Boxes },
  { id: "purchases", title: "Compras", description: "Carga facturas para valorizar inventario.", icon: ClipboardList },
  { id: "recipes", title: "Fichas Tecnicas", description: "Mide costo, merma y rentabilidad.", icon: Sparkles },
  { id: "products", title: "Ventas", description: "SmartProfit descuenta inventario automaticamente.", icon: PackagePlus },
];

const TABS = [
  { id: "suppliers", label: "Proveedores" },
  { id: "ingredients", label: "Insumos" },
  { id: "purchases", label: "Compras" },
  { id: "recipes", label: "Fichas Tecnicas" },
  { id: "products", label: "Productos" },
];

const UNITS = ["g", "kg", "ml", "l", "oz", "und"];

function buildProductForm(product) {
  if (!product) {
    return PRODUCT_FORM;
  }

  return {
    name: product.name || "",
    category: product.category || "",
    price: String(product.price ?? ""),
    stock: String(product.stock ?? ""),
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

export default function ProductManager({ businessId }) {
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [recipeBooks, setRecipeBooks] = useState([]);
  const [activeTab, setActiveTab] = useState("suppliers");
  const [productForm, setProductForm] = useState(PRODUCT_FORM);
  const [supplyForm, setSupplyForm] = useState(SUPPLY_FORM);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingSupplyId, setEditingSupplyId] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

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
      <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Centro de recursos</h2>
          <p className="text-sm text-slate-500">
            SmartProfit te guia desde la compra hasta la rentabilidad del plato.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-5">
          {ONBOARDING_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeTab === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveTab(step.id)}
                className={`rounded-[26px] p-5 text-left ring-1 transition ${
                  isActive
                    ? "bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] text-white shadow-lg ring-slate-950/10"
                    : "bg-white text-slate-700 ring-slate-200 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`rounded-2xl p-3 ${isActive ? "bg-white/10" : "bg-slate-100"}`}>
                    <Icon size={18} className={isActive ? "text-emerald-300" : "text-slate-500"} />
                  </div>
                  {index < ONBOARDING_STEPS.length - 1 ? (
                    <ChevronRight size={16} className={isActive ? "text-slate-300" : "text-slate-400"} />
                  ) : null}
                </div>
                <h3 className="mt-6 text-base font-semibold">{step.title}</h3>
                <p className={`mt-2 text-sm ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                  {step.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] bg-white/85 p-4 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "suppliers" ? (
        <SupplierManager businessId={businessId} suppliers={suppliers} purchases={purchases} />
      ) : null}

      {activeTab === "purchases" ? (
        <PurchaseManager
          businessId={businessId}
          suppliers={suppliers}
          supplies={supplies}
          purchases={purchases}
        />
      ) : null}

      {activeTab === "recipes" ? (
        <RecipeBookManager
          businessId={businessId}
          products={products}
          supplies={supplies}
          recipeBooks={recipeBooks}
        />
      ) : null}

      {activeTab === "ingredients" ? (
        <section className="space-y-6">
          <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Inventario de insumos</h2>
                <p className="text-sm text-slate-500">
                  Controla stock, costo promedio ponderado y alertas minimas.
                </p>
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

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-4 md:grid-cols-2">
                {supplies.map((supply) => {
                  const status = getSupplyHealth(supply);
                  const history = priceHistoryBySupply[supply.id] || [];

                  return (
                    <article
                      key={supply.id}
                      className="rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200"
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
              <h2 className="text-xl font-semibold text-slate-900">Productos</h2>
              <p className="text-sm text-slate-500">
                Cada producto puede conectarse con su ficha tecnica para utilidad neta automatica.
              </p>
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

          <div className="grid gap-4 xl:grid-cols-2">
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
                  className="rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200"
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
                      <p className="mt-2 font-semibold text-slate-900">{formatCOP(product.price)}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo real</p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {formatCOP(recipeBook?.real_cost || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[#d4a72c]/20">
                      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#946200]">
                        <Sparkles size={14} />
                        Sugerido
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {formatCOP(recipeBook?.suggested_price || product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
                    <button
                      type="button"
                      onClick={() => setActiveTab("recipes")}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-[#fff7df] px-4 py-3 text-sm font-semibold text-[#946200] ring-1 ring-[#d4a72c]/20"
                    >
                      <Sparkles size={16} />
                      Ficha
                    </button>
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
        maxWidthClass="max-w-3xl"
        icon={{ main: <PackagePlus size={20} />, close: <X size={18} /> }}
        title={editingProductId ? "Editar producto" : "Nuevo producto"}
        description="Mantiene una estructura compacta, con el mismo lenguaje visual de los modales del sistema."
      >
        <form onSubmit={handleProductSubmit} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Nombre
              <input
                required
                value={productForm.name}
                onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-300"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Categoria
              <input
                required
                list="product-category-options"
                value={productForm.category}
                onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
                className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-300"
              />
            </label>
          </div>

          <datalist id="product-category-options">
            {productCategories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Precio de venta
              <input
                type="number"
                min="0"
                step="1"
                value={productForm.price}
                onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
                className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-300"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Stock comercial
              <input
                type="number"
                min="0"
                step="1"
                value={productForm.stock}
                onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))}
                className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-300"
              />
            </label>
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
              {isSaving ? "Guardando..." : editingProductId ? "Actualizar" : "Crear producto"}
            </button>
          </div>
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
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Nombre
              <input
                required
                value={supplyForm.name}
                onChange={(event) => setSupplyForm((current) => ({ ...current, name: event.target.value }))}
                className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-300"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Categoria
              <input
                value={supplyForm.category}
                onChange={(event) => setSupplyForm((current) => ({ ...current, category: event.target.value }))}
                className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-300"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Unidad
              <select
                value={supplyForm.unit}
                onChange={(event) => setSupplyForm((current) => ({ ...current, unit: event.target.value }))}
                className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-300"
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Stock
              <input
                type="number"
                min="0"
                step="0.01"
                value={supplyForm.stock}
                onChange={(event) => setSupplyForm((current) => ({ ...current, stock: event.target.value }))}
                className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-300"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Stock minimo
              <input
                type="number"
                min="0"
                step="0.01"
                value={supplyForm.stockMinAlert}
                onChange={(event) =>
                  setSupplyForm((current) => ({ ...current, stockMinAlert: event.target.value }))
                }
                className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-300"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Costo unidad
              <input
                type="number"
                min="0"
                step="0.01"
                value={supplyForm.averageCost}
                onChange={(event) =>
                  setSupplyForm((current) => ({ ...current, averageCost: event.target.value }))
                }
                className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-300"
              />
            </label>
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
