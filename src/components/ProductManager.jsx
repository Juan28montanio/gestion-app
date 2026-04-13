import { useEffect, useMemo, useState } from "react";
import {
  Beaker,
  ChevronDown,
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
import ConfirmModal from "./ConfirmModal";
import { formatCOP } from "../utils/formatters";

const PRODUCT_FORM = {
  name: "",
  category: "",
  price: "",
  stock: "",
  desiredMarginPct: "30",
  recipe: [],
};

const SUPPLY_FORM = {
  name: "",
  unit: "g",
  costPerUnit: "",
  stock: "",
};

const UNITS = ["g", "kg", "ml", "l", "und"];

function getStockBadge(stock) {
  if (stock <= 0) {
    return {
      label: "Agotado",
      classes: "bg-rose-100 text-rose-700 ring-rose-200",
    };
  }

  if (stock <= 5) {
    return {
      label: "Stock bajo",
      classes: "bg-amber-100 text-amber-700 ring-amber-200",
    };
  }

  return {
    label: "Disponible",
    classes: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  };
}

function buildProductForm(product) {
  if (!product) {
    return PRODUCT_FORM;
  }

  return {
    name: product.name || "",
    category: product.category || "",
    price: String(product.price ?? ""),
    stock: String(product.stock ?? ""),
    desiredMarginPct: String(
      product.desired_margin_pct ?? product.desiredMarginPct ?? 30
    ),
    recipe: Array.isArray(product.recipe)
      ? product.recipe.map((item) => ({
          supplyId: item.supplyId || item.supply_id || "",
          quantity: String(item.quantity ?? ""),
        }))
      : [],
  };
}

function buildSupplyForm(supply) {
  if (!supply) {
    return SUPPLY_FORM;
  }

  return {
    name: supply.name || "",
    unit: supply.unit || "g",
    costPerUnit: String(supply.cost_per_unit ?? supply.costPerUnit ?? ""),
    stock: String(supply.stock ?? ""),
  };
}

function resolveRecipeCost(recipe, supplies) {
  return recipe.reduce((sum, row) => {
    const quantity = Number(row.quantity);
    const supply = supplies.find((item) => item.id === row.supplyId);

    if (!supply || !Number.isFinite(quantity) || quantity <= 0) {
      return sum;
    }

    return sum + Number(supply.cost_per_unit || 0) * quantity;
  }, 0);
}

export default function ProductManager({ businessId }) {
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [activeTab, setActiveTab] = useState("products");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [productForm, setProductForm] = useState(PRODUCT_FORM);
  const [supplyForm, setSupplyForm] = useState(SUPPLY_FORM);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingSupplyId, setEditingSupplyId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts(businessId, setProducts);
    const unsubscribeSupplies = subscribeToSupplies(businessId, setSupplies);

    return () => {
      unsubscribeProducts();
      unsubscribeSupplies();
    };
  }, [businessId]);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const recipeCost = useMemo(
    () => resolveRecipeCost(productForm.recipe, supplies),
    [productForm.recipe, supplies]
  );

  const suggestedPrice = useMemo(() => {
    const marginPct = Number(productForm.desiredMarginPct);

    if (!Number.isFinite(recipeCost) || recipeCost <= 0) {
      return 0;
    }

    if (!Number.isFinite(marginPct)) {
      return recipeCost;
    }

    return recipeCost * (1 + marginPct / 100);
  }, [productForm.desiredMarginPct, recipeCost]);

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

  const handleProductChange = (event) => {
    const { name, value } = event.target;
    setProductForm((current) => ({ ...current, [name]: value }));
  };

  const handleSupplyChange = (event) => {
    const { name, value } = event.target;
    setSupplyForm((current) => ({ ...current, [name]: value }));
  };

  const addRecipeRow = () => {
    setProductForm((current) => ({
      ...current,
      recipe: [...current.recipe, { supplyId: "", quantity: "" }],
    }));
  };

  const updateRecipeRow = (index, field, value) => {
    setProductForm((current) => ({
      ...current,
      recipe: current.recipe.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  };

  const removeRecipeRow = (index) => {
    setProductForm((current) => ({
      ...current,
      recipe: current.recipe.filter((_, rowIndex) => rowIndex !== index),
    }));
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
        desiredMarginPct: Number(productForm.desiredMarginPct),
        suggestedPrice,
        recipe: productForm.recipe
          .map((row) => ({
            supplyId: row.supplyId,
            quantity: Number(row.quantity),
          }))
          .filter((row) => row.supplyId && Number.isFinite(row.quantity) && row.quantity > 0),
      };

      if (editingProductId) {
        await updateProduct(editingProductId, businessId, payload);
      } else {
        await createProduct(businessId, payload);
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
        unit: supplyForm.unit,
        costPerUnit: Number(supplyForm.costPerUnit),
        stock: Number(supplyForm.stock),
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

  const openEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm(buildProductForm(product));
    setIsProductModalOpen(true);
    setFeedback({ type: "", message: "" });
  };

  const openEditSupply = (supply) => {
    setEditingSupplyId(supply.id);
    setSupplyForm(buildSupplyForm(supply));
    setIsSupplyModalOpen(true);
    setFeedback({ type: "", message: "" });
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
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "No fue posible eliminar el registro.",
      });
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Productos e insumos</h2>
          <p className="text-sm text-slate-500">
            Administra catalogo, materias primas y fichas tecnicas con precio sugerido.
          </p>
        </div>

        <div className="inline-flex rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "products"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Productos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("supplies")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "supplies"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Insumos
          </button>
        </div>
      </div>

      {activeTab === "products" ? (
        <div className="rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Productos</h3>
              <p className="text-sm text-slate-500">
                Precio manual o sugerido a partir de la ficha tecnica.
              </p>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {products.length} producto{products.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {products.map((product) => {
              const stockBadge = getStockBadge(Number(product.stock || 0));
              const recipeCount = Array.isArray(product.recipe) ? product.recipe.length : 0;

              return (
                <article
                  key={product.id}
                  className="rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-slate-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {product.category}
                      </p>
                      <h4 className="mt-2 text-lg font-semibold text-slate-900">
                        {product.name}
                      </h4>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${stockBadge.classes}`}
                    >
                      {stockBadge.label}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Precio
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {formatCOP(product.price)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Stock
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {product.stock}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Ficha tecnica
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {recipeCount} insumo{recipeCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => openEditProduct(product)}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setItemToDelete({ id: product.id, type: "product", name: product.name })
                      }
                      className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setEditingProductId(null);
                setProductForm(PRODUCT_FORM);
                setFeedback({ type: "", message: "" });
                setIsProductModalOpen(true);
              }}
              className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-300 bg-white/70 p-6 text-center text-slate-500 transition hover:border-slate-400 hover:bg-white hover:text-slate-700"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Plus size={28} />
              </div>
              <h4 className="mt-4 text-base font-semibold text-slate-700">Nuevo producto</h4>
              <p className="mt-1 text-sm text-slate-500">Crear ficha comercial</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Insumos</h3>
              <p className="text-sm text-slate-500">
                Materias primas con costo por unidad y stock disponible.
              </p>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {supplies.length} insumo{supplies.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {supplies.map((supply) => {
              const stockBadge = getStockBadge(Number(supply.stock || 0));

              return (
                <article
                  key={supply.id}
                  className="rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-slate-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {supply.unit}
                      </p>
                      <h4 className="mt-2 text-lg font-semibold text-slate-900">
                        {supply.name}
                      </h4>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${stockBadge.classes}`}
                    >
                      {stockBadge.label}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Costo unitario
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {formatCOP(supply.cost_per_unit)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Stock
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {supply.stock} {supply.unit}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => openEditSupply(supply)}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setItemToDelete({ id: supply.id, type: "supply", name: supply.name })
                      }
                      className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setEditingSupplyId(null);
                setSupplyForm(SUPPLY_FORM);
                setFeedback({ type: "", message: "" });
                setIsSupplyModalOpen(true);
              }}
              className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-300 bg-white/70 p-6 text-center text-slate-500 transition hover:border-slate-400 hover:bg-white hover:text-slate-700"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Plus size={28} />
              </div>
              <h4 className="mt-4 text-base font-semibold text-slate-700">Nuevo insumo</h4>
              <p className="mt-1 text-sm text-slate-500">Registrar materia prima</p>
            </button>
          </div>
        </div>
      )}

      {isProductModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <PackagePlus size={20} />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {editingProductId ? "Editar producto" : "Nuevo producto"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Configura precio de venta y ficha tecnica desde una sola vista.
                </p>
              </div>

              <button
                type="button"
                onClick={closeProductModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit}>
              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm text-slate-700">
                    Nombre
                    <input
                      required
                      name="name"
                      value={productForm.name}
                      onChange={handleProductChange}
                      className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-slate-400"
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-slate-700">
                    Categoria
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                      <input
                        required
                        list="product-categories"
                        name="category"
                        value={productForm.category}
                        onChange={handleProductChange}
                        placeholder="Bebidas, panaderia, postres..."
                        className="block w-full bg-transparent outline-none"
                      />
                      <ChevronDown size={16} className="text-slate-400" />
                    </div>
                  </label>

                  <datalist id="product-categories">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm text-slate-700">
                      Precio de venta
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        name="price"
                        value={productForm.price}
                        onChange={handleProductChange}
                        className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-slate-400"
                      />
                    </label>

                    <label className="grid gap-2 text-sm text-slate-700">
                      Stock
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        name="stock"
                        value={productForm.stock}
                        onChange={handleProductChange}
                        className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-slate-400"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[28px] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">Ficha tecnica</h4>
                      <p className="text-sm text-slate-500">
                        Vincula insumos para calcular costo base y precio sugerido.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addRecipeRow}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                    >
                      <Plus size={16} />
                      Insumo
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {productForm.recipe.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
                        Aun no has agregado insumos a la receta.
                      </div>
                    ) : (
                      productForm.recipe.map((row, index) => (
                        <div
                          key={`recipe-${index}`}
                          className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 md:grid-cols-[1.2fr_0.7fr_auto]"
                        >
                          <label className="grid gap-2 text-sm text-slate-700">
                            Insumo
                            <select
                              value={row.supplyId}
                              onChange={(event) =>
                                updateRecipeRow(index, "supplyId", event.target.value)
                              }
                              className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200"
                            >
                              <option value="">Seleccionar insumo</option>
                              {supplies.map((supply) => (
                                <option key={supply.id} value={supply.id}>
                                  {supply.name} ({supply.unit})
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="grid gap-2 text-sm text-slate-700">
                            Cantidad
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.quantity}
                              onChange={(event) =>
                                updateRecipeRow(index, "quantity", event.target.value)
                              }
                              className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => removeRecipeRow(index)}
                            className="mt-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                    <label className="grid gap-2 text-sm text-slate-700">
                      Margen deseado (%)
                      <input
                        type="number"
                        min="0"
                        step="1"
                        name="desiredMarginPct"
                        value={productForm.desiredMarginPct}
                        onChange={handleProductChange}
                        className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-slate-400"
                      />
                    </label>

                    <div className="rounded-2xl bg-slate-950 p-4 text-white">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Sparkles size={16} />
                        Precio sugerido
                      </div>
                      <p className="mt-3 text-2xl font-bold">{formatCOP(suggestedPrice)}</p>
                      <p className="mt-2 text-xs text-slate-300">
                        Costo base estimado: {formatCOP(recipeCost)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setProductForm((current) => ({
                        ...current,
                        price: String(Math.round(suggestedPrice || 0)),
                      }))
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                  >
                    <Sparkles size={16} />
                    Usar precio sugerido
                  </button>
                </div>
              </div>

              {feedback.message ? (
                <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                  {feedback.message}
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "Guardando..."
                    : editingProductId
                      ? "Actualizar producto"
                      : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isSupplyModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Beaker size={20} />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {editingSupplyId ? "Editar insumo" : "Nuevo insumo"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Registra costo por unidad y existencias para la ficha tecnica.
                </p>
              </div>

              <button
                type="button"
                onClick={closeSupplyModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSupplySubmit}>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm text-slate-700">
                  Nombre
                  <input
                    required
                    name="name"
                    value={supplyForm.name}
                    onChange={handleSupplyChange}
                    className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-slate-400"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="grid gap-2 text-sm text-slate-700">
                    Unidad
                    <select
                      name="unit"
                      value={supplyForm.unit}
                      onChange={handleSupplyChange}
                      className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200"
                    >
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm text-slate-700">
                    Costo por unidad
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      name="costPerUnit"
                      value={supplyForm.costPerUnit}
                      onChange={handleSupplyChange}
                      className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200"
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-slate-700">
                    Stock
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      name="stock"
                      value={supplyForm.stock}
                      onChange={handleSupplyChange}
                      className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200"
                    />
                  </label>
                </div>
              </div>

              {feedback.message ? (
                <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                  {feedback.message}
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "Guardando..."
                    : editingSupplyId
                      ? "Actualizar insumo"
                      : "Crear insumo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(itemToDelete)}
        title={itemToDelete?.type === "supply" ? "Eliminar insumo" : "Eliminar producto"}
        description={
          itemToDelete
            ? `Se eliminara ${itemToDelete.name}. Esta accion no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </section>
  );
}
