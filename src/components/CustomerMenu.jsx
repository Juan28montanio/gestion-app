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
    <main className="min-h-screen bg-[#f5f6ef] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-lg border border-[#d8ddcf] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <img
                src="/smartprofit-wordmark-clean.png"
                alt="SmartProfit"
                className="h-12 w-auto object-contain"
              />
              <h1 className="mt-5 text-3xl font-black tracking-[-0.03em] text-slate-950">Menu digital</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Mesa {tableId}. Explora los productos disponibles y consulta precios antes de pedir.
              </p>
            </div>
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-[#f5f6ef] ring-1 ring-[#d8ddcf]">
              <img src="/smartprofit-mark-clean.png" alt="" className="h-16 w-16 object-contain" aria-hidden="true" />
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-lg border border-[#d8ddcf] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Productos disponibles</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {products.length} items
            </span>
          </div>

          {products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No hay productos disponibles en este momento.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="rounded-lg border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm"
                >
                  <p className="text-sm font-medium text-emerald-700">{product.category}</p>
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
