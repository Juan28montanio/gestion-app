import { useState } from "react";
import TableView from "./components/TableView";
import POSOrder from "./components/POSOrder";
import AdminDashboard from "./components/AdminDashboard";
import { CartProvider } from "./context/CartContext";

const BUSINESS_ID = "demo_restaurant_business";

export default function App() {
  const [selectedTable, setSelectedTable] = useState(null);

  return (
    <CartProvider>
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
              Restaurant OS
            </p>
            <h1 className="mt-2 text-3xl font-bold">POS + Finanzas para Restaurante</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              MVP SPA con arquitectura modular, snapshots en tiempo real y base
              preparada para un futuro SaaS multi-tenant.
            </p>
          </header>

          <TableView
            businessId={BUSINESS_ID}
            selectedTableId={selectedTable?.id}
            onSelectTable={setSelectedTable}
          />

          <POSOrder
            businessId={BUSINESS_ID}
            selectedTable={selectedTable}
            onOrderPaid={() => setSelectedTable(null)}
          />

          <AdminDashboard businessId={BUSINESS_ID} />
        </div>
      </main>
    </CartProvider>
  );
}
