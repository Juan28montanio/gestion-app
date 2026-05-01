import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage:
        error instanceof Error
          ? error.message
          : "La aplicacion encontro un error inesperado.",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AppErrorBoundary", { error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4 py-8 text-slate-900">
        <section className="w-full max-w-2xl rounded-[32px] border border-rose-200 bg-white p-8 shadow-[0_24px_100px_rgba(15,23,42,0.08)]">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
              <AlertTriangle size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
                Recuperacion general
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                La app encontro un fallo y evito quedar inutilizable
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Puedes recargar la interfaz para restablecer la sesion visual. Si el problema persiste, conviene revisar permisos del backend o errores de sincronizacion del modulo activo.
              </p>
              <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                {this.state.errorMessage}
              </p>

              <button
                type="button"
                onClick={this.handleReload}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <RefreshCcw size={16} />
                Recargar aplicacion
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }
}
