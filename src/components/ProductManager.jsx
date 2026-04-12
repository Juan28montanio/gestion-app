import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  deleteProduct,
  subscribeToProducts,
  updateProduct,
} from "../services/productService";
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

export default function ProductManager({ businessId }) {
  const [products, setProducts] = useState([]);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

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
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleEdit = (product) => {
    setFormState(buildFormState(product));
    setEditingId(product.id);
    setFeedback({ type: "", message: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      const payload = parseProductForm(formState);

      if (editingId) {
        await updateProduct(editingId, businessId, payload);
        setFeedback({ type: "success", message: "Producto actualizado correctamente." });
      } else {
        await createProduct(businessId, payload);
        setFeedback({ type: "success", message: "Producto creado correctamente." });
      }

      resetForm();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible guardar el producto.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    setFeedback({ type: "", message: "" });

    try {
      await deleteProduct(productId);

      if (editingId === productId) {
        resetForm();
      }

      setFeedback({ type: "success", message: "Producto eliminado correctamente." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible eliminar el producto.",
      });
    }
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Gestion de Inventario</h2>
          <p className="text-sm text-slate-500">
            Crea, edita y elimina productos con sincronizacion inmediata en el POS.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">
          {products.length} producto{products.length === 1 ? "" : "s"} registrados
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? "Editar producto" : "Nuevo producto"}
              </h3>
              <p className="text-sm text-slate-500">
                El precio y el stock se guardan como valores numericos.
              </p>
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm text-slate-700">
              Nombre
              <input
                required
                name="name"
                value={formState.name}
                onChange={handleChange}
                placeholder="Ej. Capuccino 12 oz"
                className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-slate-400"
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
                className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-slate-400"
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
                  className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-slate-400"
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
                  className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-slate-400"
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

          <button
            type="submit"
            disabled={isSaving}
            className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : editingId ? "Actualizar producto" : "Crear producto"}
          </button>
        </form>

        <div className="rounded-3xl bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Productos existentes</h3>
            <p className="text-sm text-slate-500">
              La lista se actualiza en tiempo real y mantiene orden alfabetico.
            </p>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              Aun no hay productos cargados para este negocio.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Producto</th>
                    <th className="py-3 pr-4">Categoria</th>
                    <th className="py-3 pr-4">Precio</th>
                    <th className="py-3 pr-4">Stock</th>
                    <th className="py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100 text-slate-700">
                      <td className="py-3 pr-4 font-medium text-slate-900">{product.name}</td>
                      <td className="py-3 pr-4">{product.category}</td>
                      <td className="py-3 pr-4">{formatCOP(product.price)}</td>
                      <td className="py-3 pr-4">{product.stock}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="rounded-full bg-white px-3 py-1.5 font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="rounded-full bg-rose-50 px-3 py-1.5 font-medium text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
