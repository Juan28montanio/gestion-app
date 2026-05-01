import { Boxes, X } from "lucide-react";
import ModalWrapper from "../../../components/ModalWrapper";
import FormInput from "../../../components/FormInput";
import FormSelect from "../../../components/FormSelect";
import { SUPPLY_UNITS } from "../../../utils/resourceOptions";

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
  productSummary,
  feedbackMessage,
}) {
  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      icon={{ main: <Boxes size={20} />, close: <X size={18} /> }}
      title={editingSupplyId ? "Editar insumo" : "Nuevo insumo"}
      description="Registra materias primas con campos claros y una edicion comoda en cualquier tamano de pantalla."
    >
      <form onSubmit={onSubmit} className="grid gap-6">
        <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Flujo recomendado
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-900">1. Nombra para encontrar rapido</p>
              <p className="mt-1 text-sm text-slate-500">Usa el mismo nombre con que compras y costea el equipo.</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-900">2. Define una unidad unica</p>
              <p className="mt-1 text-sm text-slate-500">Evita duplicados con gramos, kilos o unidades mezcladas.</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-900">3. Deja listo el control</p>
              <p className="mt-1 text-sm text-slate-500">Minimo y costo base permiten leer riesgo antes del cierre.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Nombre"
            labelNote="Clave"
            required
            value={supplyForm.name}
            onChange={(event) => setSupplyForm((current) => ({ ...current, name: event.target.value }))}
            hint="Usa el nombre con el que luego lo buscaras en compras y fichas."
          />
          <div className="grid gap-2">
            <FormSelect
              label="Categoria"
              labelNote="Lectura"
              value={supplyForm.category}
              onChange={(event) =>
                setSupplyForm((current) => ({ ...current, category: event.target.value }))
              }
              options={ingredientCategoryOptions}
              hint="Ayuda a ordenar compras y presupuesto por tipo de abastecimiento."
            />
            <button
              type="button"
              onClick={onManageCategories}
              className="justify-self-start rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Gestionar categorias
            </button>
          </div>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Con costeo conectado</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{productSummary.connected}</p>
            <p className="mt-1 text-sm text-slate-500">Productos que ya responden con costo real.</p>
          </article>
          <article className="rounded-[24px] bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Margen saludable</p>
            <p className="mt-2 text-2xl font-black text-emerald-900">{productSummary.healthy}</p>
            <p className="mt-1 text-sm text-emerald-800/80">Productos con lectura positiva de rentabilidad.</p>
          </article>
          <article className="rounded-[24px] bg-rose-50 p-4 ring-1 ring-rose-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">Margen en riesgo</p>
            <p className="mt-2 text-2xl font-black text-rose-900">{productSummary.atRisk}</p>
            <p className="mt-1 text-sm text-rose-800/80">Productos que conviene revisar cuanto antes.</p>
          </article>
          <article className="rounded-[24px] bg-[#fff7df] p-4 ring-1 ring-[#d4a72c]/25">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#946200]">Sin ficha o prepago</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {productSummary.withoutRecipe + productSummary.ticketPlans}
            </p>
            <p className="mt-1 text-sm text-slate-600">Productos pendientes de costeo o planes especiales.</p>
          </article>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FormSelect
            label="Unidad"
            labelNote="Base"
            value={supplyForm.unit}
            onChange={(event) => setSupplyForm((current) => ({ ...current, unit: event.target.value }))}
            selectClassName="bg-[#fff7df] font-semibold text-[#946200] ring-[#d4a72c]/30"
            hint="Usa la misma unidad base que luego emplearas en compras y recetas."
          >
            {SUPPLY_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </FormSelect>
          <FormInput
            label="Stock"
            labelNote="Actual"
            type="number"
            min="0"
            step="0.01"
            value={supplyForm.stock}
            onChange={(event) => setSupplyForm((current) => ({ ...current, stock: event.target.value }))}
          />
          <FormInput
            label="Stock minimo"
            labelNote="Alerta"
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
            labelNote="Referencia"
            type="number"
            min="0"
            step="0.01"
            value={supplyForm.averageCost}
            onChange={(event) =>
              setSupplyForm((current) => ({ ...current, averageCost: event.target.value }))
            }
            hint="Si ya hubo compras, este valor se alinea con el ultimo costo registrado."
          />
        </div>

        {feedbackMessage ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
            {feedbackMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
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
    </ModalWrapper>
  );
}
