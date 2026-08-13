import { PAYMENT_METHOD_LABELS } from "../utils/payments";
import {
  getCashSessionLockInfo as getCashSessionLockInfoInApp,
  closeCashSession as closeCashSessionInApp,
  getCurrentOpenCashSession as getCurrentOpenCashSessionInApp,
  openCashSession as openCashSessionInApp,
  subscribeToCashSessions as subscribeToCashSessionsInApp,
  subscribeToOpenCashSession as subscribeToOpenCashSessionInApp,
} from "./app/cashGateway";
import { settleSaleDebtWithRpc } from "./supabase/cashService";

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCOP(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function buildClosingCode(closedAt = new Date(), sequence = 1) {
  const month = `${closedAt.getMonth() + 1}`.padStart(2, "0");
  const day = `${closedAt.getDate()}`.padStart(2, "0");
  const year = `${closedAt.getFullYear()}`.slice(-2);
  return `CIERRE-${month}${day}${year}-${String(sequence || 1).padStart(3, "0")}`;
}

export function getCashSessionLockInfo(session) {
  return getCashSessionLockInfoInApp(session);

}

export function subscribeToOpenCashSession(businessId, callback) {
  return subscribeToOpenCashSessionInApp(businessId, callback);

}

export function subscribeToCashClosings(businessId, callback) {
  return subscribeToCashSessionsInApp(businessId, callback);

}

export async function getCurrentOpenCashSession(businessId) {
  return getCurrentOpenCashSessionInApp(businessId);

}

export async function openCashSession(businessId, options = {}) {
  return openCashSessionInApp(businessId, options);

}

export async function closeCashSession({ businessId, closingId, cashCounted, context = {} }) {
  return closeCashSessionInApp({ businessId, closingId, cashCounted, context });

}

export async function settlePendingDebtSale(saleId, paymentMethod) {
  const normalizedSaleId = String(saleId || "").trim();
  const normalizedPaymentMethod = String(paymentMethod || "").trim();

  if (!normalizedSaleId || !normalizedPaymentMethod) {
    throw new Error("Debes indicar la venta pendiente y el metodo de pago.");
  }

  throw new Error("Para cobrar cartera desde Caja usa la accion de cartera sincronizada con negocio activo.");
}

export async function settlePendingDebtSaleForBusiness({ businessId, saleId, paymentMethod, amount = null }) {
  const normalizedBusinessId = String(businessId || "").trim();
  const normalizedSaleId = String(saleId || "").trim();
  const normalizedPaymentMethod = String(paymentMethod || "").trim() || "cash";

  if (!normalizedBusinessId || !normalizedSaleId) {
    throw new Error("Debes indicar el negocio y la venta pendiente.");
  }

  return settleSaleDebtWithRpc({
    p_business_id: normalizedBusinessId,
    p_sale_id: normalizedSaleId,
    p_amount: amount,
    p_method: normalizedPaymentMethod,
    p_reference: null,
    p_notes: "Cobro desde cierre de caja",
  });
}

export function buildCashClosingReportHtml(report) {
  const openedAtLabel = report.openedAt ? report.openedAt.toLocaleString("es-CO") : "-";
  const closedAtLabel = report.closedAt ? report.closedAt.toLocaleString("es-CO") : "-";
  const cashDifferenceTone =
    Number(report.cashDifference || 0) === 0
      ? "#166534"
      : Number(report.cashDifference || 0) > 0
        ? "#946200"
        : "#b42318";
  const cashDifferenceLabel =
    Number(report.cashDifference || 0) === 0
      ? "Cuadre exacto"
      : Number(report.cashDifference || 0) > 0
        ? "Sobrante en caja"
        : "Faltante en caja";
  const incomeMovementCount = (report.movementEntries || []).filter((entry) => entry.type === "Ingreso").length;
  const expenseMovementCount = (report.movementEntries || []).filter((entry) => entry.type === "Egreso").length;
  const byMethodRows = Object.entries(report.byMethod || {})
    .map(
      ([method, total]) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${PAYMENT_METHOD_LABELS[method] || method}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCOP(total)}</td></tr>`
    )
    .join("");
  const auditRows = (report.auditEntries || [])
    .map(
      (entry) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.type}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.tableName}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.detail}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${entry.at ? entry.at.toLocaleString("es-CO") : "-"}</td></tr>`
    )
    .join("");
  const movementRows = (report.movementEntries || [])
    .map(
      (entry) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.type}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.concept}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.detail}${entry.operationalType ? `<div style="margin-top:6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${entry.operationalType === "Venta compuesta" ? "#946200" : "#64748b"};">${entry.operationalType}</div>` : ""}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${PAYMENT_METHOD_LABELS[entry.paymentMethod] || entry.paymentMethod || "-"}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${entry.at ? entry.at.toLocaleString("es-CO") : "-"}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${formatCOP(entry.amount)}</td></tr>`
    )
    .join("");
  const purchaseSummary = report.purchaseSummary || {};
  const purchaseNarrative = purchaseSummary.count
    ? `Se registraron ${purchaseSummary.count} compra(s) por ${formatCOP(purchaseSummary.total || 0)} dentro del periodo del cierre.`
    : "No se registraron compras dentro del periodo del cierre.";
  const purchaseContext = purchaseSummary.count
    ? [
        purchaseSummary.shareOfSalesPct !== null
          ? `Estas compras equivalen al ${purchaseSummary.shareOfSalesPct.toFixed(0)}% de las ventas del turno.`
          : "",
        purchaseSummary.topSupplierName
          ? `Proveedor de mayor peso: ${purchaseSummary.topSupplierName} con ${formatCOP(purchaseSummary.topSupplierTotal || 0)}.`
          : "",
        purchaseSummary.topCategoryName
          ? `Categoria de mayor gasto: ${purchaseSummary.topCategoryName} con ${formatCOP(purchaseSummary.topCategoryTotal || 0)}.`
          : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "El documento resume principalmente recaudo, arqueo y movimientos del turno.";
  const topSupplierRows = (purchaseSummary.topSuppliers || [])
    .map(
      (entry) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.name}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${formatCOP(entry.total)}</td></tr>`
    )
    .join("");
  const highlightedPurchaseRows = (purchaseSummary.highlightedPurchases || [])
    .map(
      (entry) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.supplierName}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.invoiceNumber}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.date || "-"}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${entry.itemsCount}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${formatCOP(entry.total)}</td></tr>`
    )
    .join("");

  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Reporte de cierre SmartProfit</title>
      <style>
        body { font-family: "Segoe UI", Arial, sans-serif; padding: 24px; color: #0f172a; background: #eef2f7; }
        .sheet { max-width: 1120px; margin: 0 auto; background: white; border-radius: 24px; padding: 36px; box-shadow: 0 20px 60px rgba(15,23,42,.12); }
        .topbar { display:flex; justify-content:space-between; gap:24px; align-items:flex-start; margin-bottom:24px; padding-bottom:24px; border-bottom:1px solid #e2e8f0; }
        .brand { display:flex; flex-direction:column; gap:6px; }
        .pill { display:inline-flex; align-items:center; border-radius:999px; padding:8px 14px; font-size:12px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; background:#f8fafc; color:#334155; border:1px solid #cbd5e1; }
        .grid { display:grid; gap:16px; }
        .grid-3 { grid-template-columns: repeat(3, minmax(0,1fr)); }
        .grid-4 { grid-template-columns: repeat(4, minmax(0,1fr)); }
        .card { border:1px solid #e2e8f0; border-radius:24px; padding:20px; background:#fff; }
        .card.dark { background: linear-gradient(135deg,#0f172a 0%,#1e293b 100%); color:#fff; border:none; }
        .eyebrow { font-size:12px; letter-spacing:.18em; text-transform:uppercase; font-weight:700; color:#94a3b8; }
        .value { font-size:28px; font-weight:800; margin-top:10px; }
        .band { margin:28px 0; border:1px solid #e2e8f0; border-radius:24px; padding:20px; background:linear-gradient(135deg,#ffffff 0%,#f8fafc 100%); }
        .band-title { font-size:12px; letter-spacing:.18em; text-transform:uppercase; font-weight:700; color:#64748b; }
        .band-body { margin-top:10px; font-size:14px; line-height:1.7; color:#334155; }
        table { width:100%; border-collapse: collapse; }
        th { text-align:left; font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#64748b; padding:10px 12px; border-bottom:1px solid #cbd5e1; }
        .section-title { font-size:18px; font-weight:700; margin:28px 0 14px; }
        .muted { color:#64748b; }
        .kpi-note { margin:10px 0 0; color:#64748b; font-size:13px; line-height:1.6; }
        .two-col { display:grid; gap:16px; grid-template-columns: 1.1fr .9fr; }
        .meta-list { display:grid; gap:10px; }
        .meta-row { display:flex; justify-content:space-between; gap:16px; border-bottom:1px solid #e2e8f0; padding-bottom:10px; }
        .meta-row:last-child { border-bottom:none; padding-bottom:0; }
        @media print {
          body { background:white; padding:0; }
          .sheet { box-shadow:none; border-radius:0; max-width:none; padding:24px; }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="topbar">
          <div class="brand">
            <h1 style="margin:0;font-size:22px;">${report.businessName || "SmartProfit"}</h1>
            <p style="margin:0;color:#64748b;">Reporte operativo y financiero de cierre</p>
            <h2 style="margin:18px 0 0;font-size:32px;">Reporte de cierre de caja</h2>
            <p style="margin:8px 0 0;color:#475569;max-width:560px;line-height:1.6;">
              Documento de control del turno con resumen financiero, medios de pago, movimientos y trazabilidad del responsable.
            </p>
          </div>
          <div style="text-align:right;">
            <span class="pill">${report.closingCode || buildClosingCode(report.closedAt, 1)}</span>
            <p style="margin:16px 0 0;"><strong>Operador:</strong> ${report.operatorName || report.cashierName || "Operador SmartProfit"}</p>
            <p style="margin:6px 0 0;"><strong>Cuenta:</strong> ${report.cashierEmail || "Sin correo"}</p>
            <p style="margin:6px 0 0;"><strong>Apertura:</strong> ${openedAtLabel}</p>
            <p style="margin:6px 0 0;"><strong>Cierre:</strong> ${closedAtLabel}</p>
          </div>
        </div>

        <div class="grid grid-3">
          <div class="card">
            <div class="eyebrow">Ventas del turno</div>
            <div class="value">${formatCOP(report.salesTotal)}</div>
          </div>
          <div class="card">
            <div class="eyebrow">Gastos del turno</div>
            <div class="value">${formatCOP(report.expensesTotal)}</div>
            <p style="margin:10px 0 0;color:#64748b;">Compras: ${formatCOP(report.purchaseExpensesTotal || 0)} · Operativos: ${formatCOP(report.operatingExpensesTotal || 0)}</p>
          </div>
          <div class="card dark">
            <div class="eyebrow" style="color:#cbd5e1;">Balance neto</div>
            <div class="value">${formatCOP(report.netBalance)}</div>
          </div>
        </div>

        <div class="band">
          <div class="band-title">Identificacion del turno</div>
          <div class="two-col" style="margin-top:14px;">
            <div class="meta-list">
              <div class="meta-row"><span class="muted">Negocio</span><strong>${report.businessName || "SmartProfit"}</strong></div>
              <div class="meta-row"><span class="muted">Responsable</span><strong>${report.operatorName || report.cashierName || "Operador SmartProfit"}</strong></div>
              <div class="meta-row"><span class="muted">Cuenta</span><strong>${report.cashierEmail || "Sin correo"}</strong></div>
              <div class="meta-row"><span class="muted">Codigo de cierre</span><strong>${report.closingCode || buildClosingCode(report.closedAt, 1)}</strong></div>
            </div>
            <div class="meta-list">
              <div class="meta-row"><span class="muted">Inicio del turno</span><strong>${openedAtLabel}</strong></div>
              <div class="meta-row"><span class="muted">Fin del turno</span><strong>${closedAtLabel}</strong></div>
              <div class="meta-row"><span class="muted">Base de apertura</span><strong>${formatCOP(report.openingAmount || 0)}</strong></div>
              <div class="meta-row"><span class="muted">Movimientos auditables</span><strong>${report.auditEntries?.length || 0}</strong></div>
            </div>
          </div>
        </div>

        <div class="band">
          <div class="band-title">Lectura ejecutiva del cierre</div>
          <div class="band-body">
            ${purchaseNarrative}
            ${purchaseContext}
          </div>
        </div>

        <div class="section-title">Resumen de medios</div>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th style="text-align:right;">Esperado en sistema</th>
              <th style="text-align:right;">Declarado por cajero</th>
              <th style="text-align:right;">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;">Base de apertura</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCOP(report.openingAmount || 0)}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">-</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">-</td>
            </tr>
            <tr>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;">Efectivo</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCOP(report.cashExpected)}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCOP(report.cashCounted)}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCOP(report.cashDifference)}</td>
            </tr>
          </tbody>
        </table>
        <p class="kpi-note"><strong style="color:${cashDifferenceTone};">${cashDifferenceLabel}.</strong> La diferencia entre efectivo esperado y contado define el ajuste final del arqueo.</p>

        <div class="section-title">Movimientos del turno</div>
        <div class="grid grid-4">
          <div class="card">
            <div class="eyebrow">Total recaudado</div>
            <div class="value">${formatCOP(report.totalCollected)}</div>
          </div>
          <div class="card">
            <div class="eyebrow">Ventas registradas</div>
            <div class="value">${report.totalSalesCount || 0}</div>
          </div>
          <div class="card">
            <div class="eyebrow">Servicios por tiquetera</div>
            <div class="value">${report.ticketWalletUnits || 0} uds</div>
          </div>
          <div class="card">
            <div class="eyebrow">Movimientos del periodo</div>
            <div class="value">${(report.movementEntries || []).length}</div>
            <p class="kpi-note">Ingresos: ${incomeMovementCount} · Egresos: ${expenseMovementCount}</p>
          </div>
        </div>

        <div class="section-title">Resumen por canal</div>
        <table>
          <thead>
            <tr>
              <th>Canal</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${byMethodRows}</tbody>
        </table>

        <div class="section-title">Proveedores y compras destacadas</div>
        ${
          purchaseSummary.count
            ? `<div class="grid grid-3">
                <div class="card">
                  <div class="eyebrow">Proveedor principal</div>
                  <div class="value" style="font-size:22px;">${purchaseSummary.topSupplierName || "Sin dato"}</div>
                  <p style="margin:10px 0 0;color:#64748b;">${formatCOP(purchaseSummary.topSupplierTotal || 0)}</p>
                </div>
                <div class="card">
                  <div class="eyebrow">Categoria dominante</div>
                  <div class="value" style="font-size:22px;">${purchaseSummary.topCategoryName || "Sin categoria"}</div>
                  <p style="margin:10px 0 0;color:#64748b;">${formatCOP(purchaseSummary.topCategoryTotal || 0)}</p>
                </div>
                <div class="card">
                  <div class="eyebrow">Compras registradas</div>
                  <div class="value">${purchaseSummary.count || 0}</div>
                  <p style="margin:10px 0 0;color:#64748b;">${formatCOP(purchaseSummary.total || 0)} en total</p>
                </div>
              </div>
              <div style="display:grid;gap:16px;grid-template-columns:1fr 1.2fr;margin-top:16px;">
                <div class="card">
                  <div class="eyebrow">Top proveedores del periodo</div>
                  ${
                    topSupplierRows
                      ? `<table style="margin-top:14px;">
                          <thead>
                            <tr>
                              <th>Proveedor</th>
                              <th style="text-align:right;">Total</th>
                            </tr>
                          </thead>
                          <tbody>${topSupplierRows}</tbody>
                        </table>`
                      : `<p style="margin-top:14px;color:#64748b;">No hay proveedores destacados para este cierre.</p>`
                  }
                </div>
                <div class="card">
                  <div class="eyebrow">Compras mas relevantes</div>
                  ${
                    highlightedPurchaseRows
                      ? `<table style="margin-top:14px;">
                          <thead>
                            <tr>
                              <th>Proveedor</th>
                              <th>Factura</th>
                              <th>Fecha</th>
                              <th style="text-align:right;">Items</th>
                              <th style="text-align:right;">Total</th>
                            </tr>
                          </thead>
                          <tbody>${highlightedPurchaseRows}</tbody>
                        </table>`
                      : `<p style="margin-top:14px;color:#64748b;">No hay compras relevantes para detallar en este cierre.</p>`
                  }
                </div>
              </div>`
            : `<div class="card" style="background:#f8fafc;">No hubo compras en el periodo, por lo que no hay proveedores ni facturas destacadas para este cierre.</div>`
        }

        <div class="section-title">Detalle resumido de movimientos</div>
        ${
          movementRows
            ? `<table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Concepto</th>
                    <th>Detalle</th>
                    <th>Canal</th>
                    <th style="text-align:right;">Hora</th>
                    <th style="text-align:right;">Valor</th>
                  </tr>
                </thead>
                <tbody>${movementRows}</tbody>
              </table>`
            : `<div class="card" style="background:#f8fafc;">No se registraron movimientos dentro del periodo de cierre.</div>`
        }

        <div class="section-title">Auditoria del turno</div>
        ${
          auditRows
            ? `<table>
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Mesa</th>
                    <th>Detalle</th>
                    <th style="text-align:right;">Hora</th>
                  </tr>
                </thead>
                <tbody>${auditRows}</tbody>
              </table>`
            : `<div class="card" style="background:#f8fafc;">No se registraron ordenes anuladas ni ajustes auditables en este turno.</div>`
        }
      </div>
    </body>
  </html>`;
}
