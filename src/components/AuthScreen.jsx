import { useState } from "react";
import { LoaderCircle } from "lucide-react";
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

function AuthField({ label, type = "text", value, onChange, placeholder, hint }) {
  return (
    <label className="grid gap-2 text-sm text-slate-700">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
      />
      {hint ? <span className="text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

export default function AuthScreen({ onLogin, onRegister, isBusy }) {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await onLogin(loginForm);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "No fue posible iniciar sesion.");
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    if (registerForm.password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("La confirmacion de la contrasena no coincide.");
      return;
    }

    try {
      await onRegister(registerForm);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "No fue posible crear la cuenta.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-6 py-6 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1480px] gap-6 xl:grid-cols-[1.08fr_0.7fr]">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eef2ff_100%)] p-8 shadow-[0_24px_100px_rgba(15,23,42,0.08)] md:p-10">
          <div className="absolute -right-20 top-[-120px] h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />
          <div className="absolute bottom-[-140px] left-[-120px] h-80 w-80 rounded-full bg-amber-100/50 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="flex items-center gap-3">
              <SmartProfitWordmark />
            </div>

            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
                Copiloto financiero operativo
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-[0.98] tracking-[-0.05em] text-slate-950 md:text-6xl">
                Controla lo que vendes, lo que cuesta y lo que realmente ganas.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                SmartProfit conecta punto de venta, compras, costeo, clientes y caja para que el negocio
                trabaje con mas claridad y menos friccion.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Operacion</p>
                <p className="mt-2 text-xl font-black text-slate-950">POS + salon</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Mesas, pedidos y pagos en un flujo rapido para el equipo.
                </p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Rentabilidad</p>
                <p className="mt-2 text-xl font-black text-slate-950">Costo conectado</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Productos, recetas e insumos alineados para defender el margen.
                </p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Caja</p>
                <p className="mt-2 text-xl font-black text-slate-950">Cierre con contexto</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Movimientos, cartera y cierres para decidir mejor cada jornada.
                </p>
              </article>
            </div>

            <div className="grid gap-4 rounded-[28px] bg-slate-950 px-5 py-5 text-white md:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Promesa</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Menos tiempo corrigiendo, mas tiempo operando con criterio.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Uso diario</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Hecho para restaurantes, cafes y negocios con ritmo operativo real.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Decision</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Cada modulo busca responder cuanto vendo, cuanto cuesta y cuanto queda.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            <div className="mb-6 inline-flex rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMode("login");
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMode("register");
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                Crear cuenta
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="grid gap-5">
                <div>
                  <h2 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">
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
                />
                <AuthField
                  label="Contrasena"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Ingresa tu contrasena"
                />

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isBusy}
                  className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                >
                  {isBusy ? <LoaderCircle className="animate-spin" size={18} /> : null}
                  Entrar al sistema
                </button>

                <p className="text-sm text-slate-500">
                  Si aun no tienes una cuenta,{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setMode("register");
                    }}
                    className="font-semibold text-slate-900"
                  >
                    registra tu negocio
                  </button>
                  .
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="grid gap-5">
                <div>
                  <h2 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">
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
                />
                <AuthField
                  label="Nombre del administrador"
                  value={registerForm.adminName}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, adminName: event.target.value }))
                  }
                  placeholder="Laura Mendoza"
                />
                <AuthField
                  label="Correo"
                  type="email"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="admin@brunchcentral.com"
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
                />

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isBusy}
                  className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                >
                  {isBusy ? <LoaderCircle className="animate-spin" size={18} /> : null}
                  Crear negocio
                </button>

                <p className="text-sm text-slate-500">
                  Si ya tienes una cuenta,{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setMode("login");
                    }}
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
