import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Component } from "react";

export default class SectionErrorBoundary extends Component {
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
          : "Ocurrio un error inesperado al cargar este modulo.",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SectionErrorBoundary", {
      title: this.props.title,
      error,
      errorInfo,
    });
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: "" });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="rounded-[28px] border border-rose-200 bg-white/90 p-6 shadow-lg ring-1 ring-rose-100">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500">
              Recuperacion de modulo
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {this.props.title || "No fue posible abrir este modulo"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {this.props.description ||
                "La aplicacion detecto un fallo y evito que el resto del sistema se cayera. Puedes reintentar ahora mismo."}
            </p>
            <p className="mt-3 text-sm text-rose-700">{this.state.errorMessage}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <RefreshCcw size={16} />
                Reintentar modulo
              </button>
              {this.props.onGoSafeSection ? (
                <button
                  type="button"
                  onClick={this.props.onGoSafeSection}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Ir a una vista segura
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
