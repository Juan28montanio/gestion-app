import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeHelp,
  Building2,
  CreditCard,
  KeyRound,
  ListChecks,
  LogOut,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import ModalWrapper from "./ModalWrapper";
import {
  DEFAULT_BUSINESS_SETTINGS,
  DEFAULT_PAYMENT_METHODS,
  saveBusinessSettings,
  savePaymentMethods,
  subscribeToAuditLogs,
  subscribeToBusinessSettings,
  subscribeToBusinessUsers,
  subscribeToPaymentMethods,
  updateBusinessProfileWithAudit,
  updateBusinessUserRole,
  validateBusinessSettings,
} from "../services/accountService";
import { updateBusinessAccount } from "../services/businessService";
import {
  ACCOUNT_ACTIONS,
  ACCOUNT_MODULES,
  CRITICAL_PERMISSIONS,
  ROLE_LABELS,
  canManageAccountSection,
  getDefaultPermissionsByRole,
  getRoleLabel,
  hasPermission,
  normalizeUserRole,
} from "../utils/accountPermissions";

const TABS = [
  { id: "profile", label: "Mi perfil", icon: UserRound },
  { id: "business", label: "Negocio", icon: Building2 },
  { id: "users", label: "Usuarios y roles", icon: UsersRound },
  { id: "permissions", label: "Permisos", icon: ShieldCheck },
  { id: "payments", label: "Metodos de pago", icon: CreditCard },
  { id: "operation", label: "Operacion", icon: SlidersHorizontal },
  { id: "security", label: "Seguridad", icon: KeyRound },
  { id: "audit", label: "Auditoria", icon: ListChecks },
  { id: "support", label: "Soporte", icon: BadgeHelp },
];

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
];

function createActor(currentUser, userProfile) {
  return {
    id: currentUser?.uid || userProfile?.id || "",
    email: currentUser?.email || userProfile?.email || "",
    name: userProfile?.display_name || currentUser?.displayName || currentUser?.email || "Usuario",
  };
}

function createProfileForm(userProfile, currentUser) {
  return {
    displayName: userProfile?.display_name || currentUser?.displayName || "",
    email: currentUser?.email || userProfile?.email || "",
    phone: userProfile?.phone || "",
    avatarUrl: userProfile?.avatar_url || "",
    theme: userProfile?.preferences?.theme || "system",
  };
}

function createBusinessForm(business = {}) {
  return {
    name: business?.name || "",
    legalName: business?.legal_name || "",
    nit: business?.nit || "",
    address: business?.address || "",
    city: business?.city || "",
    phone: business?.phone || "",
    email: business?.email || "",
    logoUrl: business?.logo_url || "",
    category: business?.category || "Restaurante",
    currency: business?.currency || "COP",
    timezone: business?.timezone || "America/Bogota",
    receiptNotes: business?.receipt_notes || "",
    status: business?.status || "active",
  };
}

function SectionCard({ title, description, children, tone = "white" }) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-[#fff7df]"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50"
        : "border-slate-200 bg-white";

  return (
    <article className={`rounded-[24px] border ${toneClass} p-5 shadow-sm`}>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {children}
    </article>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {description ? <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span> : null}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

function formatAuditDate(value) {
  const date = value?.toDate?.() || null;
  return date ? date.toLocaleString("es-CO") : "Fecha pendiente";
}

function getActivePosPaymentOptions(paymentMethods) {
  return paymentMethods
    .filter((method) => method.active && !method.isCredit && !method.isNonCashConsumption)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((method) => ({ value: method.key, label: method.name }));
}

export default function AccountSettings({
  business,
  userProfile,
  currentUser,
  verifySessionPassword,
  onSaveProfile,
  onResetWorkspace,
  onGoGuide,
  onLogout,
}) {
  const businessId = business?.id || userProfile?.business_id || "";
  const [activeTab, setActiveTab] = useState("profile");
  const [profileForm, setProfileForm] = useState(() => createProfileForm(userProfile, currentUser));
  const [businessForm, setBusinessForm] = useState(() => createBusinessForm(business));
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [businessUsers, setBusinessUsers] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_BUSINESS_SETTINGS);
  const [auditLogs, setAuditLogs] = useState([]);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    auditPin: "",
    confirmAuditPin: "",
  });
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPhrase, setResetPhrase] = useState("");
  const [isResettingWorkspace, setIsResettingWorkspace] = useState(false);
  const actor = useMemo(() => createActor(currentUser, userProfile), [currentUser, userProfile]);
  const isAccountManager = canManageAccountSection(userProfile);

  useEffect(() => {
    setProfileForm(createProfileForm(userProfile, currentUser));
  }, [currentUser, userProfile]);

  useEffect(() => {
    setBusinessForm(createBusinessForm(business));
  }, [business]);

  useEffect(() => {
    if (!businessId) return undefined;
    const unsubscribeUsers = subscribeToBusinessUsers(businessId, setBusinessUsers);
    const unsubscribePayments = subscribeToPaymentMethods(businessId, setPaymentMethods);
    const unsubscribeSettings = subscribeToBusinessSettings(businessId, setSettings);
    const unsubscribeAudit = subscribeToAuditLogs(businessId, setAuditLogs);
    return () => {
      unsubscribeUsers();
      unsubscribePayments();
      unsubscribeSettings();
      unsubscribeAudit();
    };
  }, [businessId]);

  const activePosPaymentOptions = useMemo(
    () => getActivePosPaymentOptions(paymentMethods),
    [paymentMethods]
  );
  const currentRole = normalizeUserRole(userProfile?.role || "owner");
  const canSaveAdminAreas = currentRole === "owner" || currentRole === "admin" || isAccountManager;

  const setFeedbackMessage = (type, message) => {
    setFeedback({ type, message });
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!profileForm.displayName.trim()) {
      setFeedbackMessage("error", "El nombre es obligatorio.");
      return;
    }

    setIsSaving(true);
    try {
      await onSaveProfile({
        displayName: profileForm.displayName,
        phone: profileForm.phone,
        avatarUrl: profileForm.avatarUrl,
        preferences: { theme: profileForm.theme },
      });
      setFeedbackMessage("success", "Perfil actualizado.");
    } catch (error) {
      setFeedbackMessage("error", error instanceof Error ? error.message : "No fue posible guardar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveBusiness = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await updateBusinessProfileWithAudit(businessId, businessForm, actor, business || null);
      setFeedbackMessage("success", "Datos del negocio actualizados.");
    } catch (error) {
      setFeedbackMessage("error", error instanceof Error ? error.message : "No fue posible guardar el negocio.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveSecurity = async (event) => {
    event.preventDefault();
    if (!securityForm.auditPin || securityForm.auditPin !== securityForm.confirmAuditPin) {
      setFeedbackMessage("error", "Confirma un PIN de auditoria valido.");
      return;
    }
    if (!/^\d{4,6}$/.test(securityForm.auditPin)) {
      setFeedbackMessage("error", "El PIN debe tener entre 4 y 6 digitos.");
      return;
    }

    setIsSaving(true);
    try {
      await verifySessionPassword(securityForm.currentPassword);
      await updateBusinessAccount(businessId, {
        name: business?.name || businessForm.name,
        logoUrl: business?.logo_url || businessForm.logoUrl,
        auditPin: securityForm.auditPin,
      });
      setSecurityForm({ currentPassword: "", auditPin: "", confirmAuditPin: "" });
      setFeedbackMessage("success", "PIN de auditoria actualizado.");
    } catch (error) {
      setFeedbackMessage("error", error instanceof Error ? error.message : "No fue posible actualizar seguridad.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserChange = async (targetUser, patch) => {
    if (!canSaveAdminAreas) {
      setFeedbackMessage("error", "No tienes permisos para administrar usuarios.");
      return;
    }

    try {
      await updateBusinessUserRole({
        businessId,
        targetUserId: targetUser.id,
        role: patch.role ?? targetUser.role,
        status: patch.status ?? targetUser.status ?? "active",
        actor,
        previousValue: targetUser,
      });
      setFeedbackMessage("success", "Usuario actualizado.");
    } catch (error) {
      setFeedbackMessage("error", error instanceof Error ? error.message : "No fue posible actualizar el usuario.");
    }
  };

  const updatePaymentMethod = (key, patch) => {
    setPaymentMethods((current) =>
      current.map((method) => (method.key === key ? { ...method, ...patch } : method))
    );
  };

  const persistPaymentMethods = async () => {
    setIsSaving(true);
    try {
      await savePaymentMethods(businessId, paymentMethods, actor);
      setFeedbackMessage("success", "Metodos de pago guardados. POS y Caja usaran esta configuracion.");
    } catch (error) {
      setFeedbackMessage("error", error instanceof Error ? error.message : "No fue posible guardar metodos de pago.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateNestedSetting = (group, key, value) => {
    setSettings((current) => validateBusinessSettings({
      ...current,
      [group]: {
        ...(current[group] || {}),
        [key]: value,
      },
    }));
  };

  const persistSettings = async () => {
    setIsSaving(true);
    try {
      await saveBusinessSettings(businessId, settings, actor);
      setFeedbackMessage("success", "Configuracion operativa guardada.");
    } catch (error) {
      setFeedbackMessage("error", error instanceof Error ? error.message : "No fue posible guardar configuracion.");
    } finally {
      setIsSaving(false);
    }
  };

  const canResetWorkspace =
    !isResettingWorkspace &&
    String(resetPhrase || "").trim().toUpperCase() === "REINICIAR" &&
    Boolean(String(resetPassword || "").trim());

  const handleWorkspaceReset = async () => {
    if (!canResetWorkspace) return;
    setIsResettingWorkspace(true);
    try {
      await verifySessionPassword(resetPassword);
      await onResetWorkspace();
      setIsResetModalOpen(false);
      setResetPassword("");
      setResetPhrase("");
      setFeedbackMessage("success", "El espacio de trabajo fue reiniciado.");
      onGoGuide?.();
    } catch (error) {
      setFeedbackMessage("error", error instanceof Error ? error.message : "No fue posible reiniciar.");
    } finally {
      setIsResettingWorkspace(false);
    }
  };

  return (
    <section className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Administracion SaaS
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">Cuenta</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Centro de administracion para identidad, negocio, usuarios, roles, metodos de pago,
              reglas operativas, seguridad y auditoria.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-950">{actor.name}</p>
            <p className="mt-1 text-slate-500">{getRoleLabel(currentRole)} - {actor.email || "Sin correo"}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm xl:sticky xl:top-6 xl:self-start">
          <nav className="grid gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-5">
          {feedback.message ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ring-1 ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-rose-50 text-rose-700 ring-rose-200"
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          {activeTab === "profile" ? (
            <form onSubmit={saveProfile} className="grid gap-5">
              <SectionCard
                title="Mi perfil"
                description="Informacion personal del usuario activo. El correo proviene de Firebase Auth."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput label="Nombre" required value={profileForm.displayName} onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))} />
                  <FormInput label="Correo" value={profileForm.email} readOnly />
                  <FormInput label="Telefono" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
                  <FormInput label="Avatar URL" value={profileForm.avatarUrl} onChange={(event) => setProfileForm((current) => ({ ...current, avatarUrl: event.target.value }))} />
                  <FormSelect label="Tema visual" value={profileForm.theme} onChange={(event) => setProfileForm((current) => ({ ...current, theme: event.target.value }))}>
                    <option value="system">Sistema</option>
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro futuro</option>
                  </FormSelect>
                  <FormInput label="Rol actual" value={getRoleLabel(currentRole)} readOnly />
                </div>
              </SectionCard>
              <button type="submit" disabled={isSaving} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {isSaving ? "Guardando..." : "Guardar perfil"}
              </button>
            </form>
          ) : null}

          {activeTab === "business" ? (
            <form onSubmit={saveBusiness} className="grid gap-5">
              <SectionCard
                title="Datos del negocio"
                description="Perfil unico del negocio activo. Se reutiliza la coleccion businesses existente."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput label="Nombre comercial" required value={businessForm.name} onChange={(event) => setBusinessForm((current) => ({ ...current, name: event.target.value }))} />
                  <FormInput label="Razon social" value={businessForm.legalName} onChange={(event) => setBusinessForm((current) => ({ ...current, legalName: event.target.value }))} />
                  <FormInput label="NIT / identificacion" value={businessForm.nit} onChange={(event) => setBusinessForm((current) => ({ ...current, nit: event.target.value }))} />
                  <FormInput label="Categoria" value={businessForm.category} onChange={(event) => setBusinessForm((current) => ({ ...current, category: event.target.value }))} />
                  <FormInput label="Direccion" value={businessForm.address} onChange={(event) => setBusinessForm((current) => ({ ...current, address: event.target.value }))} />
                  <FormInput label="Ciudad" value={businessForm.city} onChange={(event) => setBusinessForm((current) => ({ ...current, city: event.target.value }))} />
                  <FormInput label="Telefono" value={businessForm.phone} onChange={(event) => setBusinessForm((current) => ({ ...current, phone: event.target.value }))} />
                  <FormInput label="Correo" value={businessForm.email} onChange={(event) => setBusinessForm((current) => ({ ...current, email: event.target.value }))} />
                  <FormInput label="Logo URL" value={businessForm.logoUrl} onChange={(event) => setBusinessForm((current) => ({ ...current, logoUrl: event.target.value }))} />
                  <FormInput label="Moneda" value={businessForm.currency} readOnly />
                  <FormInput label="Zona horaria" value={businessForm.timezone} onChange={(event) => setBusinessForm((current) => ({ ...current, timezone: event.target.value }))} />
                  <FormSelect label="Estado" value={businessForm.status} onChange={(event) => setBusinessForm((current) => ({ ...current, status: event.target.value }))} options={STATUS_OPTIONS} />
                  <FormInput className="md:col-span-2" label="Texto para recibos/facturas" multiline rows={3} value={businessForm.receiptNotes} onChange={(event) => setBusinessForm((current) => ({ ...current, receiptNotes: event.target.value }))} />
                </div>
              </SectionCard>
              <button type="submit" disabled={isSaving || !canSaveAdminAreas} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                Guardar negocio
              </button>
            </form>
          ) : null}

          {activeTab === "users" ? (
            <SectionCard
              title="Usuarios y roles"
              description="Administracion preparada para multiples usuarios. El owner conserva acceso total."
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    <tr>
                      <th className="py-3 pr-4">Usuario</th>
                      <th className="py-3 pr-4">Rol</th>
                      <th className="py-3 pr-4">Estado</th>
                      <th className="py-3 pr-4">Permisos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(businessUsers.length ? businessUsers : [userProfile].filter(Boolean)).map((user) => (
                      <tr key={user.id}>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-900">{user.display_name || user.email || "Usuario"}</p>
                          <p className="text-xs text-slate-500">{user.email || "Sin correo"}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={normalizeUserRole(user.role)}
                            disabled={!canSaveAdminAreas || user.role === "owner"}
                            onChange={(event) => handleUserChange(user, { role: event.target.value })}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                          >
                            {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={user.status || "active"}
                            disabled={!canSaveAdminAreas || user.role === "owner"}
                            onChange={(event) => handleUserChange(user, { status: event.target.value })}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                          >
                            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </td>
                        <td className="py-3 pr-4 text-slate-500">{getDefaultPermissionsByRole(user.role).includes("*") ? "Todos" : getDefaultPermissionsByRole(user.role).length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Invitacion por correo queda preparada como siguiente paso; hoy se conserva el usuario autenticado y cualquier documento existente en business_users.
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "permissions" ? (
            <div className="grid gap-5">
              <SectionCard
                title="Matriz de permisos"
                description="Permisos por modulo y accion. Los roles admin/owner siempre conservan permisos completos."
              >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {Object.keys(ROLE_LABELS).map((role) => (
                    <article key={role} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{getRoleLabel(role)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {getDefaultPermissionsByRole(role).includes("*")
                          ? "Permisos completos"
                          : `${getDefaultPermissionsByRole(role).length} permisos base`}
                      </p>
                    </article>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Permisos criticos" description="Estos permisos deben validarse en UI y servicio antes de ejecutar acciones sensibles.">
                <div className="grid gap-2 md:grid-cols-2">
                  {CRITICAL_PERMISSIONS.map((permission) => (
                    <div key={permission} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                      <span className="font-semibold text-slate-800">{permission}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {hasPermission(userProfile, permission) ? "Permitido para tu rol" : "Restringido para tu rol"}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Catalogo tecnico" description="Modulos y acciones disponibles para extender la matriz.">
                <p className="text-sm text-slate-500">Modulos: {ACCOUNT_MODULES.join(", ")}</p>
                <p className="mt-2 text-sm text-slate-500">Acciones: {ACCOUNT_ACTIONS.join(", ")}</p>
              </SectionCard>
            </div>
          ) : null}

          {activeTab === "payments" ? (
            <SectionCard
              title="Metodos de pago"
              description="Los metodos activos monetarios alimentan el POS. Caja usa sus reglas para efectivo fisico y recaudo digital."
            >
              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <article key={method.key} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[1.2fr_repeat(4,minmax(120px,1fr))]">
                    <FormInput label="Nombre" value={method.name} onChange={(event) => updatePaymentMethod(method.key, { name: event.target.value })} />
                    <ToggleRow label="Activo" checked={method.active} onChange={(value) => updatePaymentMethod(method.key, { active: value })} />
                    <ToggleRow label="Caja fisica" checked={method.affectsPhysicalCash} onChange={(value) => updatePaymentMethod(method.key, { affectsPhysicalCash: value })} />
                    <ToggleRow label="Caja digital" checked={method.affectsDigitalCash} onChange={(value) => updatePaymentMethod(method.key, { affectsDigitalCash: value })} />
                    <ToggleRow label="Referencia" checked={method.requiresReference} onChange={(value) => updatePaymentMethod(method.key, { requiresReference: value })} />
                    <ToggleRow label="Cliente" checked={method.requiresCustomer} onChange={(value) => updatePaymentMethod(method.key, { requiresCustomer: value })} />
                    <ToggleRow label="Permite cambio" checked={method.allowsChange} onChange={(value) => updatePaymentMethod(method.key, { allowsChange: value })} />
                    <ToggleRow label="Credito" checked={method.isCredit} onChange={(value) => updatePaymentMethod(method.key, { isCredit: value })} />
                    <ToggleRow label="No monetario" checked={method.isNonCashConsumption} onChange={(value) => updatePaymentMethod(method.key, { isNonCashConsumption: value })} />
                    <FormInput label="Orden" type="number" value={method.sortOrder} onChange={(event) => updatePaymentMethod(method.key, { sortOrder: Number(event.target.value) })} />
                  </article>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
                POS activo: {activePosPaymentOptions.map((option) => option.label).join(", ") || "sin metodos monetarios activos"}.
              </div>
              <button type="button" onClick={persistPaymentMethods} disabled={isSaving || !canSaveAdminAreas} className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                Guardar metodos
              </button>
            </SectionCard>
          ) : null}

          {activeTab === "operation" ? (
            <div className="grid gap-5">
              <SectionCard title="Caja">
                <div className="grid gap-3 md:grid-cols-2">
                  <ToggleRow label="Exigir caja abierta para vender" checked={settings.cash.requireOpenCashSession} onChange={(value) => updateNestedSetting("cash", "requireOpenCashSession", value)} />
                  <ToggleRow label="Permitir ventas sin caja abierta" checked={settings.cash.allowSalesWithoutCashSession} onChange={(value) => updateNestedSetting("cash", "allowSalesWithoutCashSession", value)} />
                  <FormInput label="Diferencia maxima cierre" type="number" value={settings.cash.maxClosingDifference} onChange={(event) => updateNestedSetting("cash", "maxClosingDifference", Number(event.target.value))} />
                </div>
              </SectionCard>
              <SectionCard title="POS">
                <div className="grid gap-3 md:grid-cols-2">
                  <ToggleRow label="Permitir descuentos" checked={settings.pos.allowDiscounts} onChange={(value) => updateNestedSetting("pos", "allowDiscounts", value)} />
                  <ToggleRow label="Requerir motivo descuentos" checked={settings.pos.requireDiscountReason} onChange={(value) => updateNestedSetting("pos", "requireDiscountReason", value)} />
                  <ToggleRow label="Permitir ventas a credito" checked={settings.pos.allowCreditSales} onChange={(value) => updateNestedSetting("pos", "allowCreditSales", value)} />
                  <ToggleRow label="Requerir cliente para deuda" checked={settings.pos.requireCustomerForDebt} onChange={(value) => updateNestedSetting("pos", "requireCustomerForDebt", value)} />
                  <ToggleRow label="Permitir cortesias" checked={settings.pos.allowCourtesy} onChange={(value) => updateNestedSetting("pos", "allowCourtesy", value)} />
                  <ToggleRow label="Motivo obligatorio en cortesias" checked={settings.pos.requireCourtesyReason} onChange={(value) => updateNestedSetting("pos", "requireCourtesyReason", value)} />
                </div>
              </SectionCard>
              <SectionCard title="Salon, ticketeras, inventario y compras">
                <div className="grid gap-3 md:grid-cols-2">
                  <ToggleRow label="Transferir mesa" checked={settings.tables.allowTableTransfer} onChange={(value) => updateNestedSetting("tables", "allowTableTransfer", value)} />
                  <ToggleRow label="Dividir cuenta" checked={settings.tables.allowSplitBill} onChange={(value) => updateNestedSetting("tables", "allowSplitBill", value)} />
                  <ToggleRow label="Ajustar saldo tiquetera" checked={settings.tickets.allowBalanceAdjustments} onChange={(value) => updateNestedSetting("tickets", "allowBalanceAdjustments", value)} />
                  <FormInput label="Vigencia tiquetera por defecto" type="number" value={settings.tickets.defaultValidityDays} onChange={(event) => updateNestedSetting("tickets", "defaultValidityDays", Number(event.target.value))} />
                  <ToggleRow label="Alertar stock bajo" checked={settings.inventory.alertLowStock} onChange={(value) => updateNestedSetting("inventory", "alertLowStock", value)} />
                  <ToggleRow label="Permitir stock negativo" checked={settings.inventory.allowNegativeStock} onChange={(value) => updateNestedSetting("inventory", "allowNegativeStock", value)} />
                  <ToggleRow label="Editar compras confirmadas" checked={settings.purchases.allowEditConfirmedPurchases} onChange={(value) => updateNestedSetting("purchases", "allowEditConfirmedPurchases", value)} />
                  <ToggleRow label="Actualizar costo promedio" checked={settings.purchases.updateAverageCost} onChange={(value) => updateNestedSetting("purchases", "updateAverageCost", value)} />
                  <ToggleRow label="Costos solo a roles autorizados" checked={settings.technicalSheets.showCostsOnlyToAuthorizedRoles} onChange={(value) => updateNestedSetting("technicalSheets", "showCostsOnlyToAuthorizedRoles", value)} />
                  <FormInput label="Food cost objetivo" type="number" value={settings.technicalSheets.defaultTargetFoodCost} onChange={(event) => updateNestedSetting("technicalSheets", "defaultTargetFoodCost", Number(event.target.value))} />
                </div>
              </SectionCard>
              <button type="button" onClick={persistSettings} disabled={isSaving || !canSaveAdminAreas} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                Guardar configuracion operativa
              </button>
            </div>
          ) : null}

          {activeTab === "security" ? (
            <div className="grid gap-5">
              <form onSubmit={saveSecurity}>
                <SectionCard
                  title="Seguridad"
                  description="Cambios sensibles exigen reautenticacion con la contrasena actual."
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormInput label="Contrasena actual" type="password" value={securityForm.currentPassword} onChange={(event) => setSecurityForm((current) => ({ ...current, currentPassword: event.target.value }))} />
                    <FormInput label="Nuevo PIN auditoria" type="password" inputMode="numeric" value={securityForm.auditPin} onChange={(event) => setSecurityForm((current) => ({ ...current, auditPin: event.target.value.replace(/\D/g, "").slice(0, 6) }))} />
                    <FormInput label="Confirmar PIN" type="password" inputMode="numeric" value={securityForm.confirmAuditPin} onChange={(event) => setSecurityForm((current) => ({ ...current, confirmAuditPin: event.target.value.replace(/\D/g, "").slice(0, 6) }))} />
                  </div>
                  <button type="submit" disabled={isSaving} className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    Actualizar PIN
                  </button>
                </SectionCard>
              </form>
              <SectionCard title="Acciones criticas" description="Estas acciones deben pedir permiso o confirmacion antes de ejecutarse." tone="warning">
                <p className="text-sm leading-6 text-slate-700">
                  Anular venta, anular pago, ajustar caja, cerrar caja, cambiar costos, confirmar/anular compras, ajustar inventario, ajustar saldo de tiquetera, cambiar permisos e inactivar usuarios.
                </p>
              </SectionCard>
              <SectionCard title="Sesion">
                <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  <LogOut size={16} />
                  Cerrar sesion
                </button>
              </SectionCard>
              <SectionCard title="Reiniciar espacio de trabajo" tone="danger">
                <p className="text-sm leading-6 text-rose-700">
                  Borra datos operativos del negocio activo, conservando la cuenta. Usar solo para empezar desde cero.
                </p>
                <button type="button" onClick={() => setIsResetModalOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white">
                  <RotateCcw size={16} />
                  Reiniciar app en cero
                </button>
              </SectionCard>
            </div>
          ) : null}

          {activeTab === "audit" ? (
            <SectionCard title="Auditoria" description="Registro basico de cambios importantes de cuenta y configuracion.">
              <div className="grid gap-3">
                {auditLogs.map((log) => (
                  <article key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <p className="font-semibold text-slate-900">{log.action || "Cambio registrado"}</p>
                      <p className="text-xs text-slate-500">{formatAuditDate(log.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {log.user_name || log.userName || "Usuario"} - {log.module || "account"} - {log.entity_type || log.entityType || "entidad"}
                    </p>
                    {log.reason ? <p className="mt-2 text-sm text-slate-600">{log.reason}</p> : null}
                  </article>
                ))}
                {!auditLogs.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    Aun no hay eventos de auditoria para este negocio.
                  </div>
                ) : null}
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "support" ? (
            <SectionCard title="Soporte" description="Informacion de sistema y acciones futuras.">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sistema</p>
                  <p className="mt-2 font-semibold text-slate-900">SmartProfit / PACIFICA Control</p>
                  <p className="mt-1 text-sm text-slate-500">Version 0.1.0</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Negocio</p>
                  <p className="mt-2 font-semibold text-slate-900">{business?.name || "Sin nombre"}</p>
                  <p className="mt-1 text-sm text-slate-500">{businessId || "Sin businessId"}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <p>Contacto soporte: soporte@smartprofit.local</p>
                <p>Futuro: exportar datos, respaldos, politicas de privacidad, plan de suscripcion, logs avanzados y personalizacion visual.</p>
              </div>
              <button type="button" onClick={onGoGuide} className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                Abrir guia de uso
              </button>
            </SectionCard>
          ) : null}
        </div>
      </div>

      <ModalWrapper
        open={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        maxWidthClass="max-w-2xl"
        icon={{ main: <AlertTriangle size={20} />, close: "X" }}
        title="Reiniciar espacio de trabajo"
        description="Esta accion es irreversible para la data operativa del negocio activo."
      >
        <div className="grid gap-4">
          <FormInput label='Escribe "REINICIAR"' value={resetPhrase} onChange={(event) => setResetPhrase(event.target.value)} />
          <FormInput label="Contrasena actual" type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setIsResetModalOpen(false)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              Cancelar
            </button>
            <button type="button" onClick={handleWorkspaceReset} disabled={!canResetWorkspace} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {isResettingWorkspace ? "Reiniciando..." : "Confirmar reinicio"}
            </button>
          </div>
        </div>
      </ModalWrapper>
    </section>
  );
}
