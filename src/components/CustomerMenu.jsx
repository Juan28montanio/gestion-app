import { useEffect, useState } from "react";
import { subscribeToAvailableProducts } from "../services/productService";
import { formatCOP } from "../utils/formatters";

export default function CustomerMenu({ businessId, tableId }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToAvailableProducts(businessId, setProducts);
    return () => unsubscribe();
  }, [businessId]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0_55%,_#cbd5e1)] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-[2rem] bg-white/90 p-6 shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Menu digital</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Pacifica Control</h1>
          <p className="mt-3 text-sm text-slate-600">
            Mesa {tableId}. Explora los productos disponibles y consulta precios antes de pedir.
          </p>
        </header>

        <section className="mt-6 rounded-[2rem] bg-white/90 p-6 shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Productos disponibles</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {products.length} items
            </span>
          </div>

          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No hay productos disponibles en este momento.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="rounded-3xl bg-slate-50 p-5 shadow-sm ring-1 ring-slate-200"
                >
                  <p className="text-sm text-slate-500">{product.category}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-3 text-xl font-bold text-slate-950">
                    {formatCOP(product.price)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Disponible para mesa o pedido asistido.
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
