import { useEffect, useMemo, useState } from "react";
import { PackagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createProduct,
  deleteProduct,
  subscribeToProducts,
  updateProduct,
} from "../services/productService";
import ConfirmModal from "./ConfirmModal";
import { formatCOP } from "../utils/formatters";

const EMPTY_FORM = {
  name: "",
  category: "",
  price: "",
  stock: "",
};

function buildFormState(product) {
  if (!product) {
    return EMPTY_FORM;
  }

  return {
    name: product.name || "",
    category: product.category || "",
    price: String(product.price ?? ""),
    stock: String(product.stock ?? ""),
  };
}

function parseProductForm(formState) {
  return {
    name: formState.name.trim(),
    category: formState.category.trim(),
    price: Number(formState.price),
    stock: Number(formState.stock),
  };
}

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

export default function ProductManager({ businessId }) {
  const [products, setProducts] = useState([]);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(businessId, setProducts);
    return () => unsubscribe();
  }, [businessId]);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const resetForm = () => {
    setFormState(EMPTY_FORM);
    setEditingId(null);
    setFeedback({ type: "", message: "" });
  };

  const closeModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleEdit = (product) => {
    setFormState(buildFormState(product));
    setEditingId(product.id);
    setFeedback({ type: "", message: "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      const payload = parseProductForm(formState);

      if (editingId) {
        await updateProduct(editingId, businessId, payload);
      } else {
        await createProduct(businessId, payload);
      }

      closeModal();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible guardar el producto.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) {
      return;
    }

    setFeedback({ type: "", message: "" });

    try {
      await deleteProduct(productToDelete.id);

      if (editingId === productToDelete.id) {
        closeModal();
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible eliminar el producto.",
      });
    } finally {
      setProductToDelete(null);
    }
  };

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Gestion de inventario</h2>
          <p className="text-sm text-slate-500">
            Administra el catalogo con una vista ligera y mejor lectura de stock.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {products.length} producto{products.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Productos existentes</h3>
            <p className="text-sm text-slate-500">
              El listado se actualiza en tiempo real y conserva orden alfabetico.
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {products.map((product) => {
            const stockBadge = getStockBadge(Number(product.stock || 0));

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

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(product)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductToDelete(product)}
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
            onClick={openCreateModal}
            className="flex min-h-[240px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-300 bg-white/70 p-6 text-center text-slate-500 transition hover:border-slate-400 hover:bg-white hover:text-slate-700"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Plus size={28} />
            </div>
            <h4 className="mt-4 text-base font-semibold text-slate-700">Nuevo producto</h4>
            <p className="mt-1 text-sm text-slate-500">Agregar al inventario</p>
          </button>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <PackagePlus size={20} />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {editingId ? "Editar producto" : "Nuevo producto"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Precio y stock se almacenan como valores numericos.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm text-slate-700">
                  Nombre
                  <input
                    required
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    placeholder="Ej. Capuccino 12 oz"
                    className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-slate-400"
                  />
                </label>

                <label className="grid gap-2 text-sm text-slate-700">
                  Categoria
                  <input
                    required
                    list="product-categories"
                    name="category"
                    value={formState.category}
                    onChange={handleChange}
                    placeholder="Bebidas, panaderia, postres..."
                    className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-slate-400"
                  />
                </label>

                <datalist id="product-categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm text-slate-700">
                    Precio
                    <input
                      required
                      min="0"
                      step="1"
                      inputMode="numeric"
                      type="number"
                      name="price"
                      value={formState.price}
                      onChange={handleChange}
                      placeholder="0"
                      className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-slate-400"
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-slate-700">
                    Stock
                    <input
                      required
                      min="0"
                      step="1"
                      inputMode="numeric"
                      type="number"
                      name="stock"
                      value={formState.stock}
                      onChange={handleChange}
                      placeholder="0"
                      className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-slate-400"
                    />
                  </label>
                </div>
              </div>

              {feedback.message ? (
                <div
                  className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                    feedback.type === "error"
                      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  }`}
                >
                  {feedback.message}
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeModal}
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
                    : editingId
                      ? "Actualizar producto"
                      : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(productToDelete)}
        title="Eliminar producto"
        description={
          productToDelete
            ? `Se eliminara ${productToDelete.name} del inventario. Esta accion no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </section>
  );
}
