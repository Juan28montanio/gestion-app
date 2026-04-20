import { useEffect, useState } from "react";
import { Building2, ShieldCheck, UserRound } from "lucide-react";
import FormInput from "./FormInput";
import LogoImage from "./LogoImage";
import { SmartProfitIsotype } from "./SmartProfitMark";
import { normalizeLogoUrl, validateLogoUrl } from "../utils/logoUrl";

const EMPTY_FORM = {
  businessName: "",
  logoUrl: "",
  displayName: "",
  auditPin: "",
  confirmAuditPin: "",
  currentPassword: "",
};

function SettingsCard({ icon, title, description, children }) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </article>
  );
}

export default function AccountSettings({
  business,
  userProfile,
  currentUser,
  verifySessionPassword,
  onSaveBusiness,
  onSaveProfile,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [logoValidation, setLogoValidation] = useState({
    status: "idle",
    message: "Valida el enlace antes de guardar para confirmar que el logo sea publico.",
  });
  const previewLogoUrl = normalizeLogoUrl(form.logoUrl);

  useEffect(() => {
    setForm({
      businessName: business?.name || "",
      logoUrl: business?.logo_url || "",
      displayName: userProfile?.display_name || currentUser?.displayName || "",
      auditPin: "",
      confirmAuditPin: "",
      currentPassword: "",
    });
  }, [business, currentUser, userProfile]);

  useEffect(() => {
    setLogoValidation({
      status: form.logoUrl ? "idle" : "empty",
      message: form.logoUrl
        ? "Valida el enlace antes de guardar para confirmar que el logo sea publico."
        : "Si no agregas un logo, el sistema usa el isotipo principal.",
    });
  }, [form.logoUrl]);

  const runLogoValidation = async () => {
    if (!form.logoUrl) {
      setLogoValidation({
        status: "empty",
        message: "Si no agregas un logo, el sistema usa el isotipo principal.",
      });
      return { ok: true };
    }

    setLogoValidation({
      status: "loading",
      message: "Probando el enlace del logo...",
    });

    const result = await validateLogoUrl(form.logoUrl);
    if (!result.ok) {
      setLogoValidation({
        status: "error",
        message: result.message,
      });
      return result;
    }

    setLogoValidation({
      status: "success",
      message: "Logo validado correctamente. La imagen es accesible para el sistema.",
    });
    return result;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: "", message: "" });

    if (form.auditPin && form.auditPin !== form.confirmAuditPin) {
      setFeedback({ type: "error", message: "La confirmacion del PIN no coincide." });
      return;
    }

    if (form.auditPin && !form.currentPassword) {
      setFeedback({
        type: "error",
        message: "Ingresa tu contrasena actual para crear o cambiar el PIN de auditoria.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const logoResult = await runLogoValidation();
      if (!logoResult.ok) {
        setFeedback({
          type: "error",
          message: "Corrige el enlace del logo antes de guardar los cambios.",
        });
        return;
      }

      if (form.auditPin) {
        await verifySessionPassword?.(form.currentPassword);
      }

      await Promise.all([
        onSaveBusiness({
          name: form.businessName,
          logoUrl: normalizeLogoUrl(form.logoUrl),
          auditPin: form.auditPin,
        }),
        onSaveProfile({ displayName: form.displayName }),
      ]);

      setFeedback({ type: "success", message: "La informacion de la cuenta fue actualizada." });
      setForm((current) => ({
        ...current,
        auditPin: "",
        confirmAuditPin: "",
        currentPassword: "",
      }));
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "No fue posible guardar la informacion.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_52%,#eef2ff_100%)] px-6 py-6 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Cuenta y configuracion
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-slate-950">
              Identidad, seguridad y control del espacio de trabajo
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Mantén consistente la identidad del negocio, deja claro quién opera el sistema y protege cambios sensibles con una verificación real antes de tocar el PIN de auditoría.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Responsable activo
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {form.displayName || "Administrador"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {currentUser?.email || userProfile?.email || "Sin correo"}
              </p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Estado de seguridad
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {business?.audit_pin_hash ? "PIN protegido" : "PIN pendiente"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Los cambios sensibles exigen validar la contrasena actual.
              </p>
            </article>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="grid gap-6">
          <SettingsCard
            icon={<Building2 size={20} />}
            title="Identidad del negocio"
            description="Ajusta la presencia visual del negocio para que el espacio operativo, la cuenta y los reportes compartan la misma identidad."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Nombre del negocio"
                value={form.businessName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, businessName: event.target.value }))
                }
              />
              <FormInput
                label="Logo URL"
                value={form.logoUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, logoUrl: event.target.value }))
                }
                placeholder="https://..."
                hint="Acepta URLs directas y enlaces publicos de Google Drive. Valida el enlace antes de guardar."
              />
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Estado del logo
                    </p>
                    <p
                      className={`mt-1 text-sm ${
                        logoValidation.status === "error"
                          ? "text-rose-600"
                          : logoValidation.status === "success"
                            ? "text-emerald-700"
                            : "text-slate-500"
                      }`}
                    >
                      {logoValidation.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={runLogoValidation}
                    disabled={logoValidation.status === "loading"}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {logoValidation.status === "loading" ? "Probando..." : "Validar logo"}
                  </button>
                </div>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={<UserRound size={20} />}
            title="Responsable operativo"
            description="Este nombre acompaña la operacion diaria y ayuda a reconocer quien esta administrando el sistema."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Nombre visible"
                value={form.displayName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, displayName: event.target.value }))
                }
              />
              <div className="grid gap-2 text-sm text-slate-700">
                <span className="font-medium text-slate-700">Correo</span>
                <div className="flex min-h-[52px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
                  {currentUser?.email || userProfile?.email || "Sin correo"}
                </div>
              </div>
            </div>
          </SettingsCard>
        </section>

        <aside className="grid gap-6">
          <SettingsCard
            icon={<ShieldCheck size={20} />}
            title="Seguridad de auditoria"
            description="El PIN protege ajustes de caja, cartera y ticketeras. Para crearlo o cambiarlo primero se valida la contrasena de la sesion actual."
          >
            <div className="grid gap-4">
              <FormInput
                label="Contrasena actual"
                type="password"
                value={form.currentPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currentPassword: event.target.value }))
                }
                placeholder="Ingresa tu contrasena para validar tu identidad"
                hint="Solo es obligatoria cuando quieras crear o editar el PIN."
              />
              <FormInput
                label="Nuevo PIN"
                type="password"
                inputMode="numeric"
                value={form.auditPin}
                onChange={(event) =>
                  setForm((current) => ({ ...current, auditPin: event.target.value }))
                }
                placeholder={
                  business?.audit_pin_hash
                    ? "Escribe un nuevo PIN"
                    : "Crea un PIN de auditoria"
                }
                hint="Usa un PIN corto y operativo. El sistema validara antes la sesion."
              />
              <FormInput
                label="Confirmar PIN"
                type="password"
                inputMode="numeric"
                value={form.confirmAuditPin}
                onChange={(event) =>
                  setForm((current) => ({ ...current, confirmAuditPin: event.target.value }))
                }
                placeholder="Repite el PIN"
              />
            </div>
          </SettingsCard>

          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Vista previa institucional
            </p>
            <div className="mt-4 flex items-center gap-4 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white">
                {form.logoUrl ? (
                  <LogoImage
                    url={previewLogoUrl}
                    alt={form.businessName || "Negocio"}
                    className="h-full w-full rounded-3xl"
                    imageClassName="h-full w-full rounded-3xl object-contain bg-white p-2"
                    fallbackClassName="border border-slate-200 bg-white"
                  />
                ) : (
                  <SmartProfitIsotype className="h-9 w-9" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-slate-950">
                  {form.businessName || "Nombre del negocio"}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {form.displayName || "Administrador"}
                </p>
                <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-slate-400">
                  Cuenta operativa principal
                </p>
              </div>
            </div>
          </article>

          {feedback.message ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ring-1 ${
                feedback.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "border border-rose-200 bg-rose-50 text-rose-700 ring-rose-200"
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </aside>
      </form>
    </section>
  );
}
