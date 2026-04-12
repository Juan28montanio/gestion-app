import { useEffect, useMemo, useState } from "react";
import { Armchair, Coffee, DoorClosed, GlassWater, Pencil, Store, Trash2, UtensilsCrossed } from "lucide-react";
import {
  createTable,
  deleteTable,
  subscribeToTables,
  updateTable,
} from "../services/tableService";

const EMPTY_FORM = {
  number: "",
  name: "",
  icon: "UtensilsCrossed",
  capacity: "",
};

const TABLE_ICON_OPTIONS = [
  { value: "UtensilsCrossed", label: "Restaurante", icon: UtensilsCrossed },
  { value: "Coffee", label: "Cafe", icon: Coffee },
  { value: "Armchair", label: "Lounge", icon: Armchair },
  { value: "GlassWater", label: "Barra", icon: GlassWater },
  { value: "DoorClosed", label: "Privado", icon: DoorClosed },
  { value: "Store", label: "Terraza", icon: Store },
];

function formatTableStatus(status) {
  const normalizedStatus = String(status || "disponible").toLowerCase();

  const labels = {
    disponible: "Disponible",
    ocupada: "Ocupada",
    pagada: "Pagada",
    cuenta_solicitada: "Cuenta solicitada",
    free: "Disponible",
    occupied: "Ocupada",
    paid: "Paid",
    requested_bill: "Cuenta solicitada",
  };

  return labels[normalizedStatus] || normalizedStatus;
}

function getTableStatusClasses(status) {
  const normalizedStatus = String(status || "disponible").toLowerCase();

  const styles = {
    disponible: "bg-emerald-100 text-emerald-800",
    ocupada: "bg-rose-100 text-rose-800",
    pagada: "bg-sky-100 text-sky-800",
    cuenta_solicitada: "bg-amber-100 text-amber-800",
    free: "bg-emerald-100 text-emerald-800",
    occupied: "bg-rose-100 text-rose-800",
    paid: "bg-sky-100 text-sky-800",
    requested_bill: "bg-amber-100 text-amber-800",
  };

  return styles[normalizedStatus] || "bg-slate-100 text-slate-700";
}

export default function TableManager({ businessId, onNotify }) {
  const [tables, setTables] = useState([]);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToTables(businessId, (nextTables) => {
      setTables(nextTables.filter((table) => !table.deletedAt));
    });

    return () => unsubscribe();
  }, [businessId]);

  const sortedTables = useMemo(
    () => [...tables].sort((a, b) => Number(a.number || 0) - Number(b.number || 0)),
    [tables]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setFormState(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      if (editingId) {
        await updateTable(editingId, businessId, formState);
        setFeedback({ type: "success", message: "Mesa actualizada correctamente." });
        onNotify?.(`${formState.name || `Mesa ${formState.number}`} actualizada.`);
      } else {
        await createTable(businessId, formState);
        setFeedback({ type: "success", message: "Mesa creada correctamente." });
        onNotify?.(`${formState.name || `Mesa ${formState.number}`} creada correctamente.`);
      }

      resetForm();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible guardar la mesa.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (table) => {
    setEditingId(table.id);
    setFormState({
      number: String(table.number ?? ""),
      name: String(table.name ?? ""),
      icon: String(table.icon ?? "UtensilsCrossed"),
      capacity: String(table.capacity ?? table.seats ?? ""),
    });
    setFeedback({ type: "", message: "" });
  };

  const handleDelete = async (table) => {
    try {
      await deleteTable(table.id);
      if (editingId === table.id) {
        resetForm();
      }
      onNotify?.(`${table.name || `Mesa ${table.number}`} eliminada.`);
      setFeedback({ type: "success", message: "Mesa eliminada correctamente." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible eliminar la mesa.",
      });
    }
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Gestion de Mesas</h2>
        <p className="text-sm text-slate-500">
          Administra el salon y controla la capacidad operativa de cada mesa.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? "Editar mesa" : "Nueva mesa"}
              </h3>
              <p className="text-sm text-slate-500">
                Configura numero, nombre, icono y capacidad en una sola vista.
              </p>
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200"
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-sm text-slate-700">
              Numero
              <input
                required
                min="1"
                step="1"
                inputMode="numeric"
                type="number"
                name="number"
                value={formState.number}
                onChange={handleChange}
                className="block w-full rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-slate-400"
              />
            </label>

            <label className="grid min-w-0 gap-2 text-sm text-slate-700">
              Nombre
              <input
                required
                name="name"
                value={formState.name}
                onChange={handleChange}
                placeholder="Terraza 1, Barra, VIP..."
                className="block w-full rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-slate-400"
              />
            </label>

            <label className="grid min-w-0 gap-2 text-sm text-slate-700">
              Capacidad
              <input
                required
                min="1"
                step="1"
                inputMode="numeric"
                type="number"
                name="capacity"
                value={formState.capacity}
                onChange={handleChange}
                className="block w-full rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-slate-400"
              />
            </label>

            <label className="grid min-w-0 gap-2 text-sm text-slate-700">
              Icono
              <select
                name="icon"
                value={formState.icon}
                onChange={handleChange}
                className="block w-full rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:ring-slate-400"
              >
                {TABLE_ICON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {TABLE_ICON_OPTIONS.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormState((current) => ({ ...current, icon: option.value }))
                  }
                  className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition ${
                    formState.icon === option.value
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              );
            })}
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
            disabled={saving}
            className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Guardando..." : editingId ? "Actualizar mesa" : "Crear mesa"}
          </button>
        </form>

        <div className="rounded-3xl bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Salon</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              {sortedTables.length} mesa{sortedTables.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="h-[540px] overflow-y-auto pr-1">
            <div className="grid auto-rows-[220px] gap-4 md:grid-cols-2">
            {sortedTables.map((table) => {
              const Icon =
                TABLE_ICON_OPTIONS.find((option) => option.value === table.icon)?.icon ||
                UtensilsCrossed;

              return (
                <article
                  key={table.id}
                  className="flex h-[220px] flex-col justify-between rounded-3xl bg-white p-5 text-center shadow-lg ring-1 ring-slate-200 transition-shadow hover:shadow-xl"
                >
                  <div className="flex flex-1 flex-col items-center justify-center">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Icon size={16} />
                      <span className="truncate">{table.name || `Mesa ${table.number}`}</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-5xl font-black leading-none text-slate-900">
                        {table.capacity || table.seats}
                      </p>
                      <p className="mt-2 text-base text-slate-600">puestos</p>
                    </div>
                    <div className="mt-5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getTableStatusClasses(table.status)}`}
                      >
                        {formatTableStatus(table.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid w-full grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(table)}
                      className="flex min-h-10 items-center justify-center gap-x-2 rounded-2xl bg-slate-100 px-2 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200 sm:text-sm"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(table)}
                      className="flex min-h-10 items-center justify-center gap-x-2 rounded-2xl bg-rose-50 px-2 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100 sm:text-sm"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
