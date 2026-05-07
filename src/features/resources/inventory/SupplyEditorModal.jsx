import { Boxes, Calculator, Leaf, PackageCheck, Snowflake, X } from "lucide-react";
import { useMemo, useState } from "react";
import ModalWrapper from "../../../components/ModalWrapper";
import FormInput from "../../../components/FormInput";
import FormSelect from "../../../components/FormSelect";
import { formatCOP } from "../../../utils/formatters";
import {
  BASE_UNIT_OPTIONS,
  STORAGE_TYPE_OPTIONS,
  SUPPLY_STATUS_OPTIONS,
  SUPPLY_TYPE_OPTIONS,
  SUPPLY_UNITS,
  TIME_UNIT_OPTIONS,
} from "../../../utils/resourceOptions";
import {
  calculateConversionFactor,
  calculateCostPerBaseUnit,
  calculateRealCost,
  calculateReorderPoint,
  calculateUsefulYield,
} from "./supplyCalculations";

const TABS = [
  { id: "general", label: "General", icon: Boxes },
  { id: "inventory", label: "Inventario", icon: PackageCheck },
  { id: "costs", label: "Costos", icon: Calculator },
  { id: "waste", label: "Merma", icon: Leaf },
  { id: "storage", label: "Conservacion", icon: Snowflake },
];

function Metric({ label, value, hint }) {
  return (
    <article className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </article>
  );
}

export default function SupplyEditorModal({
  open,
  onClose,
  onSubmit,
  editingSupplyId,
  isSaving,
  supplyForm,
  setSupplyForm,
  ingredientCategoryOptions,
  onManageCategories,
  feedbackMessage,
}) {
  const [activeTab, setActiveTab] = useState("general");
  const preview = useMemo(() => {
    const conversionFactor = calculateConversionFactor({
      purchaseUnit: supplyForm.purchaseUnit,
      baseUnit: supplyForm.unit,
      purchaseQuantity: Number(supplyForm.purchaseQuantity || 1),
      conversionFactor: Number(supplyForm.conversionFactor || 0),
    });
    const currentCost = Number(supplyForm.currentCost || supplyForm.averageCost || 0);
    const baseUnits = Number(supplyForm.purchaseQuantity || 1) * conversionFactor;
    const costPerBaseUnit = calculateCostPerBaseUnit({
      currentCost,
      purchaseQuantity: Number(supplyForm.purchaseQuantity || 1),
      conversionFactor,
    });
    const usefulYield =
      Number(supplyForm.usefulYield || 0) ||
      calculateUsefulYield(baseUnits, Number(supplyForm.wastePercent || 0));
    const realCost = calculateRealCost({ currentCost, usefulYield });
    const reorderPoint =
      Number(supplyForm.reorderPoint || 0) ||
      calculateReorderPoint({
        minimumStock: Number(supplyForm.stockMinAlert || 0),
        idealStock: Number(supplyForm.idealStock || 0),
      });

    return {
      conversionFactor,
      baseUnits,
      costPerBaseUnit,
      usefulYield,
      realCost,
      reorderPoint,
    };
  }, [supplyForm]);

  const setField = (field, value) => {
    setSupplyForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-6xl"
      icon={{ main: <Boxes size={20} />, close: <X size={18} /> }}
      title={editingSupplyId ? "Editar insumo profesional" : "Nuevo insumo profesional"}
      description="Define materia prima, produccion base o recurso operativo con costeo, inventario, conversiones y merma listos para fichas tecnicas."
    >
      <form onSubmit={onSubmit} className="grid gap-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Costo unidad base" value={formatCOP(preview.costPerBaseUnit)} hint={`Por ${supplyForm.unit || "unidad base"}`} />
          <Metric label="Equivalencia compra" value={`${preview.baseUnits || 0} ${supplyForm.unit}`} hint={`1 ${supplyForm.purchaseUnit} convertido a base`} />
          <Metric label="Rendimiento util" value={`${preview.usefulYield.toFixed(2)} ${supplyForm.unit}`} hint="Despues de merma natural" />
          <Metric label="Costo real util" value={formatCOP(preview.realCost)} hint="Costo ajustado por rendimiento" />
        </section>

        {activeTab === "general" ? (
          <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormInput label="Nombre" required value={supplyForm.name} onChange={(event) => setField("name", event.target.value)} />
              <FormInput label="Codigo interno" value={supplyForm.code} onChange={(event) => setField("code", event.target.value)} />
              <FormSelect label="Tipo de insumo" required value={supplyForm.type} onChange={(event) => setField("type", event.target.value)} options={SUPPLY_TYPE_OPTIONS} />
              <FormSelect label="Estado" value={supplyForm.status} onChange={(event) => setField("status", event.target.value)} options={SUPPLY_STATUS_OPTIONS} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <FormSelect label="Categoria" required value={supplyForm.category} onChange={(event) => setField("category", event.target.value)} options={ingredientCategoryOptions} />
                <button type="button" onClick={onManageCategories} className="justify-self-start rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                  Gestionar categorias
                </button>
              </div>
              <FormInput label="Subcategoria" value={supplyForm.subcategory} onChange={(event) => setField("subcategory", event.target.value)} />
              <FormInput label="Proveedor principal" value={supplyForm.supplierName} onChange={(event) => setField("supplierName", event.target.value)} />
            </div>
            <FormInput label="Descripcion" multiline rows={3} value={supplyForm.description} onChange={(event) => setField("description", event.target.value)} />
            <FormInput label="Notas internas" multiline rows={3} value={supplyForm.notes} onChange={(event) => setField("notes", event.target.value)} />
          </section>
        ) : null}

        {activeTab === "inventory" ? (
          <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <FormInput label="Stock actual" required type="number" min="0" step="0.01" value={supplyForm.stock} onChange={(event) => setField("stock", event.target.value)} />
              <FormInput label="Stock minimo" required type="number" min="0" step="0.01" value={supplyForm.stockMinAlert} onChange={(event) => setField("stockMinAlert", event.target.value)} />
              <FormInput label="Stock ideal" type="number" min="0" step="0.01" value={supplyForm.idealStock} onChange={(event) => setField("idealStock", event.target.value)} />
              <FormInput label="Punto reposicion" type="number" min="0" step="0.01" value={supplyForm.reorderPoint} onChange={(event) => setField("reorderPoint", event.target.value)} hint={`Sugerido: ${preview.reorderPoint.toFixed(2)}`} />
              <FormSelect label="Unidad inventario" value={supplyForm.inventoryUnit} onChange={(event) => setField("inventoryUnit", event.target.value)}>
                {SUPPLY_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </FormSelect>
            </div>
            <FormInput label="Ubicacion" value={supplyForm.location} onChange={(event) => setField("location", event.target.value)} hint="Bodega, nevera, congelador, barra o estacion de produccion." />
          </section>
        ) : null}

        {activeTab === "costs" ? (
          <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormSelect label="Unidad base" required value={supplyForm.unit} onChange={(event) => setField("unit", event.target.value)} options={BASE_UNIT_OPTIONS} />
              <FormSelect label="Unidad compra" value={supplyForm.purchaseUnit} onChange={(event) => setField("purchaseUnit", event.target.value)}>
                {SUPPLY_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </FormSelect>
              <FormInput label="Cantidad compra" required type="number" min="0.0001" step="0.01" value={supplyForm.purchaseQuantity} onChange={(event) => setField("purchaseQuantity", event.target.value)} />
              <FormInput label="Factor conversion" required type="number" min="0.0001" step="0.01" value={supplyForm.conversionFactor} onChange={(event) => setField("conversionFactor", event.target.value)} hint="Ej: 1 kg a g = 1000; 1 caja a und = cantidad de unidades." />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FormInput label="Costo actual" required type="number" min="0" step="0.01" value={supplyForm.currentCost} onChange={(event) => setField("currentCost", event.target.value)} />
              <FormInput label="Ultimo costo" type="number" min="0" step="0.01" value={supplyForm.lastCost} onChange={(event) => setField("lastCost", event.target.value)} />
              <FormInput label="Costo promedio" type="number" min="0" step="0.01" value={supplyForm.averageCost} onChange={(event) => setField("averageCost", event.target.value)} />
            </div>
          </section>
        ) : null}

        {activeTab === "waste" ? (
          <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="grid gap-4 md:grid-cols-3">
              <FormInput label="Merma natural" labelNote="%" type="number" min="0" max="100" step="0.01" value={supplyForm.wastePercent} onChange={(event) => setField("wastePercent", event.target.value)} />
              <FormInput label="Rendimiento util" type="number" min="0" step="0.01" value={supplyForm.usefulYield} onChange={(event) => setField("usefulYield", event.target.value)} hint={`Calculado: ${preview.usefulYield.toFixed(2)} ${supplyForm.unit}`} />
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Costo con merma</p>
                <p className="mt-2 text-lg font-black text-slate-950">{formatCOP(preview.realCost)}</p>
              </div>
            </div>
            <FormInput label="Notas de merma" multiline rows={4} value={supplyForm.wasteNotes} onChange={(event) => setField("wasteNotes", event.target.value)} />
          </section>
        ) : null}

        {activeTab === "storage" ? (
          <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormSelect label="Conservacion" value={supplyForm.storageType} onChange={(event) => setField("storageType", event.target.value)} options={STORAGE_TYPE_OPTIONS} />
              <FormInput label="Vida util cerrado" type="number" min="0" step="1" value={supplyForm.shelfLifeClosed} onChange={(event) => setField("shelfLifeClosed", event.target.value)} />
              <FormInput label="Vida util abierto" type="number" min="0" step="1" value={supplyForm.shelfLifeOpened} onChange={(event) => setField("shelfLifeOpened", event.target.value)} />
              <FormSelect label="Unidad tiempo" value={supplyForm.timeUnit} onChange={(event) => setField("timeUnit", event.target.value)} options={TIME_UNIT_OPTIONS} />
            </div>
          </section>
        ) : null}

        {feedbackMessage ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{feedbackMessage}</div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
            Cancelar
          </button>
          <button type="submit" disabled={isSaving} className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70">
            {isSaving ? "Guardando..." : editingSupplyId ? "Actualizar insumo" : "Crear insumo"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
