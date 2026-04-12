import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pencil, Printer, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  createTable,
  deleteTable,
  subscribeToTables,
  updateTable,
} from "../services/tableService";

const EMPTY_FORM = {
  number: "",
  capacity: "",
};

function buildTableUrl(businessId, tableId) {
  return `${window.location.origin}/menu/${businessId}/${tableId}`;
}

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
  const qrRefs = useRef({});

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
        await updateTable(editingId, businessId, formState.number, formState.capacity);
        setFeedback({ type: "success", message: "Mesa actualizada correctamente." });
        onNotify?.(`Mesa ${formState.number} actualizada.`);
      } else {
        await createTable(businessId, formState.number, formState.capacity);
        setFeedback({ type: "success", message: "Mesa creada correctamente." });
        onNotify?.(`Mesa ${formState.number} creada correctamente.`);
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
      onNotify?.(`Mesa ${table.number} eliminada.`);
      setFeedback({ type: "success", message: "Mesa eliminada correctamente." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible eliminar la mesa.",
      });
    }
  };

  const handleDownloadQr = (table) => {
    const svgElement = qrRefs.current[table.id];

    if (!svgElement) {
      return;
    }

    const serializer = new XMLSerializer();
    const svgMarkup = serializer.serializeToString(svgElement);
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mesa-${table.number}-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintQr = (table) => {
    const svgElement = qrRefs.current[table.id];

    if (!svgElement) {
      return;
    }

    const serializer = new XMLSerializer();
    const svgMarkup = serializer.serializeToString(svgElement);
    const printWindow = window.open("", "_blank", "width=600,height=700");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Mesa ${table.number}</title>
          <style>
            body { font-family: Arial, sans-serif; display:flex; min-height:100vh; align-items:center; justify-content:center; margin:0; }
            .card { text-align:center; border:1px solid #e2e8f0; border-radius:24px; padding:32px; }
            svg { width:280px; height:280px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Mesa ${table.number}</h1>
            <p>Escanea para abrir el menu digital</p>
            ${svgMarkup}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Gestion de Mesas</h2>
        <p className="text-sm text-slate-500">
          Administra el salon, genera codigos QR y controla la capacidad de cada mesa.
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
                Configura numero y capacidad en una sola vista.
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
            <h3 className="text-lg font-semibold text-slate-900">Salon y QR</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              {sortedTables.length} mesa{sortedTables.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {sortedTables.map((table) => {
              const menuUrl = buildTableUrl(businessId, table.id);

              return (
                <article
                  key={table.id}
                  className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-500">Mesa {table.number}</p>
                      <h4 className="mt-2 text-2xl font-bold text-slate-900">
                        {table.capacity || table.seats} puestos
                      </h4>
                      <div className="mt-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getTableStatusClasses(table.status)}`}
                        >
                          {formatTableStatus(table.status)}
                        </span>
                      </div>
                      <p className="mt-4 break-all text-xs leading-5 text-slate-500">
                        {menuUrl}
                      </p>
                    </div>

                    <div className="flex w-full justify-center md:w-auto md:justify-end">
                      <div
                        className="shrink-0 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"
                        ref={(node) => {
                          if (node) {
                            qrRefs.current[table.id] = node.querySelector("svg");
                          }
                        }}
                      >
                        <QRCodeSVG value={menuUrl} size={104} includeMargin />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-y-3 border-t border-slate-100 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(table)}
                        className="flex items-center justify-center gap-x-2 rounded-2xl bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        <Pencil size={16} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(table)}
                        className="flex items-center justify-center gap-x-2 rounded-2xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadQr(table)}
                        className="flex items-center justify-center gap-x-2 rounded-2xl bg-white px-3 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        <Download size={16} />
                        Descargar QR
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintQr(table)}
                        className="flex items-center justify-center gap-x-2 rounded-2xl bg-white px-3 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        <Printer size={16} />
                        Imprimir QR
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
