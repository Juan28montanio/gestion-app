import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import FormInput from "./FormInput";
import {
  createTaxonomy,
  deleteTaxonomy,
  seedDefaultTaxonomies,
  subscribeToTaxonomies,
  updateTaxonomy,
} from "../services/taxonomyService";

export default function TaxonomyManagerModal({
  open,
  onClose,
  businessId,
  scope,
  title,
  description,
}) {
  const [categories, setCategories] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    seedDefaultTaxonomies(businessId, scope).catch(() => {});
    const unsubscribe = subscribeToTaxonomies(businessId, scope, setCategories);
    return () => unsubscribe();
  }, [businessId, open, scope]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => String(a.label || "").localeCompare(String(b.label || ""), "es")),
    [categories]
  );

  const resetEditor = () => {
    setEditingId(null);
    setEditingLabel("");
  };

  const handleCreate = async () => {
    setIsBusy(true);
    setFeedback({ type: "", message: "" });

    try {
      await createTaxonomy(businessId, scope, newLabel);
      setNewLabel("");
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible crear la categoria.",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) {
      return;
    }

    setIsBusy(true);
    setFeedback({ type: "", message: "" });

    try {
      await updateTaxonomy(editingId, businessId, scope, editingLabel);
      resetEditor();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible actualizar la categoria.",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (taxonomyId) => {
    setIsBusy(true);
    setFeedback({ type: "", message: "" });

    try {
      await deleteTaxonomy(taxonomyId);
      if (editingId === taxonomyId) {
        resetEditor();
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible eliminar la categoria.",
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      icon={{ main: <Plus size={20} />, close: <X size={18} /> }}
      title={title}
      description={description}
    >
      <div className="grid gap-5">
        <div className="grid gap-3 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200 md:grid-cols-[1fr_auto]">
          <FormInput
            label="Nueva categoria"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            hint="Se agrega al flujo compartido entre formularios y compras."
          />
          <div className="grid content-end">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isBusy}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              Agregar
            </button>
          </div>
        </div>

        <div className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
          <div className="mb-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Categorias activas
            </h4>
          </div>

          <div className="grid gap-3">
            {sortedCategories.map((category) => {
              const isEditing = editingId === category.id;
              return (
                <div
                  key={category.id}
                  className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 md:grid-cols-[1fr_auto]"
                >
                  {isEditing ? (
                    <FormInput
                      label="Renombrar categoria"
                      value={editingLabel}
                      onChange={(event) => setEditingLabel(event.target.value)}
                    />
                  ) : (
                    <div className="grid gap-1">
                      <p className="text-sm font-semibold text-slate-900">{category.label}</p>
                      <p className="text-xs text-slate-400">
                        Disponible para formularios y registros relacionados.
                      </p>
                    </div>
                  )}

                  <div className="flex items-end justify-end gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={resetEditor}
                          className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleUpdate}
                          className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Guardar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(category.id);
                            setEditingLabel(category.label || "");
                          }}
                          className="rounded-2xl bg-slate-100 p-2.5 text-slate-700"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category.id)}
                          className="rounded-2xl bg-rose-50 p-2.5 text-rose-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {sortedCategories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
                Aun no hay categorias registradas.
              </div>
            ) : null}
          </div>
        </div>

        {feedback.message ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
            {feedback.message}
          </div>
        ) : null}
      </div>
    </ModalWrapper>
  );
}
