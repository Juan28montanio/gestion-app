import { useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import { SmartProfitWordmark } from "./SmartProfitMark";

const EMPTY_LOGIN = {
  email: "",
  password: "",
};

const EMPTY_REGISTER = {
  businessName: "",
  adminName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const PROOF_POINTS = [
  {
    label: "Caja",
    text: "Apertura, ventas y cierre conectados.",
    icon: WalletCards,
  },
  {
    label: "Margen",
    text: "Costos y recetas listos para decidir precios.",
    icon: TrendingUp,
  },
  {
    label: "Control",
    text: "Datos aislados por negocio con Supabase.",
    icon: ShieldCheck,
  },
];

function AuthField({ label, type = "text", value, onChange, placeholder, hint, testId }) {
  const inputId = testId ? testId.replace("-input", "") : undefined;

  return (
    <label data-testid={testId ? `${inputId}-field` : undefined} className="grid gap-2 text-sm text-slate-700" htmlFor={inputId}>
      <span className="font-medium">{label}</span>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        data-testid={testId}
        aria-label={label}
        required
        className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-900/10"
      />
      {hint ? <span className="text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

export default function AuthScreen({ onLogin, onRegister, isBusy, notice = "" }) {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await onLogin(loginForm);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "No fue posible iniciar sesion.");
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (registerForm.password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("La confirmacion de la contrasena no coincide.");
      return;
    }

    try {
      const result = await onRegister(registerForm);
      if (result?.needsEmailConfirmation) {
        setSuccess("Cuenta creada. Revisa tu correo para confirmar el acceso; despues podras iniciar sesion.");
        setMode("login");
        setLoginForm({
          email: registerForm.email,
          password: "",
        });
        return;
      }

      setSuccess("Cuenta y negocio creados. Ya puedes ingresar.");
      setMode("login");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "No fue posible crear la cuenta.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f6ef] px-4 py-4 text-slate-950 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1480px] gap-4 xl:min-h-[calc(100vh-3rem)] xl:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.68fr)] xl:gap-4">
        <section className="order-2 relative overflow-hidden rounded-lg border border-[#d8ddcf] bg-[#fdfdf9] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.10)] sm:p-8 xl:order-1">
          <div className="relative grid h-full content-between gap-7">
            <div className="flex items-center justify-between gap-3">
              <SmartProfitWordmark />
              <div className="hidden rounded-full border border-emerald-900/10 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 sm:block">
                Beta SaaS
              </div>
            </div>

            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(260px,0.58fr)]">
              <div className="max-w-3xl">
                <h1 className="max-w-4xl text-[2.6rem] font-black leading-[0.98] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">
                Controla lo que vendes, lo que cuesta y lo que realmente ganas.
              </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                SmartProfit conecta punto de venta, compras, costeo, clientes y caja para que el negocio
                trabaje con mas claridad y menos friccion.
              </p>
              </div>

              <div className="relative min-h-[280px] overflow-hidden rounded-lg border border-[#d8ddcf] bg-[linear-gradient(180deg,#ffffff_0%,#f3f7eb_100%)]">
                <img
                  src="/smartprofit-brand-clean.png"
                  alt="SmartProfit - El control que tu rentabilidad merece"
                  className="absolute left-1/2 top-[40%] h-[82%] w-[82%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-95 sm:h-[88%] sm:w-[88%]"
                />
                <div className="absolute inset-x-0 bottom-0 border-t border-emerald-900/10 bg-white/92 px-4 py-3 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-slate-950">POS, costos y caja en una cuenta</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Todo listo para operar con el negocio asociado a Supabase.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {PROOF_POINTS.map(({ label, text, icon: Icon }) => (
                <article key={label} className="rounded-lg border border-[#d8ddcf] bg-white px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <p className="text-sm font-black text-slate-950">{label}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
                </article>
              ))}
            </div>

            <div className="rounded-lg bg-slate-950 px-5 py-5 text-white">
              <div className="grid gap-4 md:grid-cols-[0.62fr_1fr] md:items-center">
                <p className="text-xl font-black tracking-[-0.02em]">El control que tu rentabilidad merece.</p>
                <p className="text-sm leading-6 text-slate-300">
                  Hecho para restaurantes, cafes y negocios que necesitan vender, costear y cerrar caja sin perder contexto.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="order-1 flex items-start xl:order-2 xl:items-center">
          <div className="w-full rounded-lg border border-[#d8ddcf] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.10)] sm:p-7">
            <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1 ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setMode("login");
                }}
                data-testid="auth-login-tab"
                className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                  mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setMode("register");
                }}
                data-testid="auth-register-tab"
                className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                  mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                Crear cuenta
              </button>
            </div>
            {notice ? (
              <div role="status" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                {notice}
              </div>
            ) : null}
            {success ? (
              <div role="status" className="mb-5 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{success}</span>
              </div>
            ) : null}

            {mode === "login" ? (
              <form data-testid="login-form" onSubmit={handleLogin} className="grid gap-5">
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">
                    Entra a tu operacion
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Usa tu correo y contrasena para continuar con ventas, caja y control del negocio.
                  </p>
                </div>

                <AuthField
                  label="Correo"
                  type="email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="admin@negocio.com"
                  testId="login-email-input"
                />
                <AuthField
                  label="Contrasena"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Ingresa tu contrasena"
                  testId="login-password-input"
                />

                {error ? (
                  <div data-testid="login-error-container" role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <span data-testid="login-error-message">{error}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isBusy}
                  data-testid="login-submit-button"
                  aria-busy={isBusy}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-6 text-sm font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-900/20 disabled:opacity-70"
                >
                  {isBusy ? <LoaderCircle className="animate-spin" size={18} /> : null}
                  Entrar al sistema
                  {!isBusy ? <ArrowRight size={18} aria-hidden="true" /> : null}
                </button>

                <p data-testid="login-register-section" className="text-sm text-slate-500">
                  Si aun no tienes una cuenta,{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setMode("register");
                    }}
                    data-testid="login-register-link"
                    className="font-semibold text-slate-900"
                  >
                    registra tu negocio
                  </button>
                  .
                </p>
              </form>
            ) : (
              <form data-testid="register-form" onSubmit={handleRegister} className="grid gap-5">
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">
                    Crea tu espacio de trabajo
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Configura el negocio y el usuario administrador con los datos iniciales para empezar a operar.
                  </p>
                </div>

                <AuthField
                  label="Nombre del negocio"
                  value={registerForm.businessName}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      businessName: event.target.value,
                    }))
                  }
                  placeholder="Brunch Central"
                  hint="Este nombre aparecera en el sistema y en la cuenta principal."
                  testId="register-business-name-input"
                />
                <AuthField
                  label="Nombre del administrador"
                  value={registerForm.adminName}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, adminName: event.target.value }))
                  }
                  placeholder="Laura Mendoza"
                  testId="register-admin-name-input"
                />
                <AuthField
                  label="Correo"
                  type="email"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="admin@brunchcentral.com"
                  testId="register-email-input"
                />
                <AuthField
                  label="Contrasena"
                  type="password"
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Minimo 6 caracteres"
                  hint="Elige una contrasena facil de recordar para el administrador."
                  testId="register-password-input"
                />
                <AuthField
                  label="Confirmar contrasena"
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  placeholder="Repite la contrasena"
                  testId="register-confirm-password-input"
                />

                {error ? (
                  <div data-testid="register-error-container" role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <span data-testid="register-error-message">{error}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isBusy}
                  data-testid="register-submit-button"
                  aria-busy={isBusy}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-6 text-sm font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-900/20 disabled:opacity-70"
                >
                  {isBusy ? <LoaderCircle className="animate-spin" size={18} /> : null}
                  Crear negocio
                  {!isBusy ? <ArrowRight size={18} aria-hidden="true" /> : null}
                </button>

                <p className="text-sm text-slate-500">
                  Si ya tienes una cuenta,{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setMode("login");
                    }}
                    data-testid="go-to-login-button"
                    className="font-semibold text-slate-900"
                  >
                    vuelve al ingreso
                  </button>
                  .
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
