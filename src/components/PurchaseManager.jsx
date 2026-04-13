import { useMemo, useState } from "react";
import { ClipboardList, Plus, Trash2, X } from "lucide-react";
import { createPurchase } from "../services/purchaseService";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import ModalWrapper from "./ModalWrapper";
import { formatCOP } from "../utils/formatters";

const EMPTY_HEADER = {
  supplierId: "",
  invoiceNumber: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
};

const EMPTY_ITEM = {
  ingredientId: "",
  quantity: "",
  unitPrice: "",
  ivaPct: "19",
};

export default function PurchaseManager({ businessId, suppliers, supplies, purchases }) {
  const [step, setStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [header, setHeader] = useState(EMPTY_HEADER);
  const [items, setItems] = useState([EMPTY_ITEM]);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const ivaPct = Number(item.ivaPct);
        if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
          return sum;
        }
        return sum + quantity * unitPrice * (1 + (Number.isFinite(ivaPct) ? ivaPct : 0) / 100);
      }, 0),
    [items]
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setStep(1);
    setHeader(EMPTY_HEADER);
    setItems([EMPTY_ITEM]);
    setFeedback({ type: "", message: "" });
  };

  const addItemRow = () => {
    setItems((current) => [...current, EMPTY_ITEM]);
  };

  const updateItemRow = (index, field, value) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItemRow = (index) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const getSupplyUnit = (ingredientId) =>
    supplies.find((supply) => supply.id === ingredientId)?.unit || "und";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      const supplier = suppliers.find((item) => item.id === header.supplierId);

      await createPurchase({
        business_id: businessId,
        supplier_id: header.supplierId,
        supplier_name: supplier?.name || "",
        invoice_number: header.invoiceNumber,
        purchase_date: header.purchaseDate,
        items: items.map((item) => {
          const ingredient = supplies.find((supply) => supply.id === item.ingredientId);
          return {
            ingredient_id: item.ingredientId,
            ingredient_name: ingredient?.name || "",
            category: ingredient?.category || "",
            quantity: Number(item.quantity),
            unit_price: Number(item.unitPrice),
            iva_pct: Number(item.ivaPct),
            unit: ingredient?.unit || "und",
          };
        }),
      });

      closeModal();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible registrar la compra.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Compras</h2>
          <p className="text-sm text-slate-500">
            Carga facturas para actualizar stock, CPP y costos de recetas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
        >
          <Plus size={16} />
          Nueva compra
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-[28px] bg-slate-50 p-5 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Resumen
          </p>
          <p className="mt-3 text-3xl font-black text-slate-950">{formatCOP(total)}</p>
          <p className="mt-2 text-sm text-slate-500">Total estimado de la factura actual.</p>
        </div>

        <div className="overflow-x-auto rounded-[28px] bg-slate-50 p-4 ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 pr-4">Factura</th>
                <th className="py-3 pr-4">Proveedor</th>
                <th className="py-3 pr-4">Fecha</th>
                <th className="py-3 pr-4">Items</th>
                <th className="py-3 pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-b border-slate-100 text-slate-700">
                  <td className="py-3 pr-4 font-semibold text-slate-900">
                    {purchase.invoice_number}
                  </td>
                  <td className="py-3 pr-4">{purchase.supplier_name}</td>
                  <td className="py-3 pr-4">{purchase.purchase_date}</td>
                  <td className="py-3 pr-4">{purchase.items?.length || 0}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-900">
                    {formatCOP(purchase.total || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalWrapper
        open={isModalOpen}
        onClose={closeModal}
        maxWidthClass="max-w-6xl"
        icon={{ main: <ClipboardList size={20} />, close: <X size={18} /> }}
        title="Registrar compra"
        description={`Paso ${step} de 2: ${
          step === 1 ? "cabecera de la factura." : "items de factura con total en tiempo real."
        }`}
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          {step === 1 ? (
            <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200 md:grid-cols-3">
              <FormSelect
                className="md:col-span-2"
                label="Proveedor"
                value={header.supplierId}
                onChange={(event) =>
                  setHeader((current) => ({ ...current, supplierId: event.target.value }))
                }
              >
                <option value="">Seleccionar proveedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                label="Fecha"
                type="date"
                value={header.purchaseDate}
                onChange={(event) =>
                  setHeader((current) => ({ ...current, purchaseDate: event.target.value }))
                }
              />

              <FormInput
                className="md:col-span-3"
                label="No. factura"
                value={header.invoiceNumber}
                onChange={(event) =>
                  setHeader((current) => ({ ...current, invoiceNumber: event.target.value }))
                }
              />
            </section>
          ) : (
            <section className="grid gap-4">
              <div className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="hidden gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 xl:grid xl:grid-cols-[1.3fr_0.65fr_0.5fr_0.65fr_0.45fr_auto]">
                  <span>Insumo</span>
                  <span>Cantidad</span>
                  <span>Unidad</span>
                  <span>Precio</span>
                  <span>IVA</span>
                  <span />
                </div>

                <div className="mt-4 grid gap-3">
                  {items.map((item, index) => (
                    <div
                      key={`purchase-item-${index}`}
                      className="grid gap-3 rounded-[24px] bg-white p-4 ring-1 ring-slate-200 xl:grid-cols-[1.3fr_0.65fr_0.5fr_0.65fr_0.45fr_auto]"
                    >
                      <FormSelect
                        label="Insumo"
                        value={item.ingredientId}
                        onChange={(event) =>
                          updateItemRow(index, "ingredientId", event.target.value)
                        }
                      >
                        <option value="">Seleccionar insumo</option>
                        {supplies.map((supply) => (
                          <option key={supply.id} value={supply.id}>
                            {supply.name}
                          </option>
                        ))}
                      </FormSelect>

                      <FormInput
                        label="Cantidad"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) => updateItemRow(index, "quantity", event.target.value)}
                      />

                      <FormInput label="Unidad" value={getSupplyUnit(item.ingredientId)} readOnly />

                      <FormInput
                        label="Precio"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) => updateItemRow(index, "unitPrice", event.target.value)}
                      />

                      <FormInput
                        label="IVA %"
                        type="number"
                        min="0"
                        step="1"
                        value={item.ivaPct}
                        onChange={(event) => updateItemRow(index, "ivaPct", event.target.value)}
                      />

                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="mt-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                <Plus size={16} />
                Agregar item
              </button>
            </section>
          )}

          {feedback.message ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              {feedback.message}
            </div>
          ) : null}

          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Total de factura
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">{formatCOP(total)}</p>
              </div>
              <p className="max-w-md text-sm text-slate-500">
                El total se recalcula en tiempo real con cantidad, precio e IVA de cada item.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(current - 1, 1))}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Volver
            </button>

            <div className="flex gap-3">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  {isSaving ? "Guardando..." : "Guardar compra"}
                </button>
              )}
            </div>
          </div>
        </form>
      </ModalWrapper>
    </section>
  );
}
