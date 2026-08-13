import { getSupabaseClient } from "../lib/supabaseClient";
import { getOpenCashSession } from "./supabase/cashService";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function buildOperatingExpensePayload(expense = {}) {
  const businessId = String(expense.business_id || expense.businessId || "").trim();
  const concept = String(expense.concept || "").trim();
  const category = String(expense.category || "").trim();
  const expenseDate = String(expense.expense_date || expense.expenseDate || "").trim();
  const paymentMethod = String(expense.payment_method || expense.paymentMethod || "cash").trim();
  const notes = String(expense.notes || "").trim();
  const vendorName = String(expense.vendor_name || expense.vendorName || "").trim();
  const amount = toNumber(expense.amount);

  if (!businessId) {
    throw new Error("El negocio activo es obligatorio para registrar el gasto.");
  }

  if (!concept) {
    throw new Error("El concepto del gasto es obligatorio.");
  }

  if (!category) {
    throw new Error("La categoria del gasto es obligatoria.");
  }

  if (!expenseDate) {
    throw new Error("La fecha del gasto es obligatoria.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Debes ingresar un valor valido para el gasto.");
  }

  return {
    business_id: businessId,
    type: "expense",
    expense_kind: "operating",
    concept,
    category,
    expense_date: expenseDate,
    payment_method: paymentMethod || "cash",
    amount,
    total: amount,
    notes,
    vendor_name: vendorName,
  };
}

function adaptOperatingExpense(row = {}) {
  const metadata = row.metadata || {};
  return {
    id: row.id,
    business_id: row.business_id,
    cash_session_id: row.cash_session_id,
    concept: row.description || metadata.concept || "Gasto operativo",
    category: metadata.category || "Gasto general",
    expense_date: metadata.expense_date || row.created_at?.slice?.(0, 10) || "",
    payment_method: row.method || "cash",
    amount: Number(row.amount || 0),
    total: Number(row.amount || 0),
    notes: metadata.notes || "",
    vendor_name: metadata.vendor_name || "",
    status: row.status || "valid",
    created_at: row.created_at,
    updated_at: row.updated_at,
    source: "supabase",
  };
}

export async function listOperatingExpenses(businessId) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) return [];

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("cash_movements")
    .select("*")
    .eq("business_id", normalizedBusinessId)
    .in("type", ["operating_expense", "operational_expense"])
    .neq("status", "reversed")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(adaptOperatingExpense);
}

export function subscribeToOperatingExpenses(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  let cancelled = false;
  const publish = () => {
    listOperatingExpenses(businessId)
      .then((expenses) => {
        if (!cancelled) callback(expenses);
      })
      .catch((error) => {
        console.error("[operatingExpenses]", error);
        if (!cancelled) callback([]);
      });
  };

  const channel = client
    .channel(`operating_expenses:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cash_movements",
        filter: `business_id=eq.${businessId}`,
      },
      publish
    )
    .subscribe();

  publish();
  return () => {
    cancelled = true;
    client.removeChannel(channel);
  };
}

export async function createOperatingExpense(expense) {
  const payload = buildOperatingExpensePayload(expense);
  const openSession = await getOpenCashSession(payload.business_id);

  if (!openSession) {
    throw new Error("Debes abrir caja antes de registrar un gasto operativo.");
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("cash_movements")
    .insert({
      business_id: payload.business_id,
      cash_session_id: openSession.id,
      type: "operating_expense",
      method: payload.payment_method,
      amount: payload.amount,
      status: "valid",
      description: payload.concept,
      metadata: {
        source: "operating_expense",
        concept: payload.concept,
        category: payload.category,
        expense_date: payload.expense_date,
        notes: payload.notes,
        vendor_name: payload.vendor_name,
      },
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateOperatingExpense(expenseId, updates = {}) {
  const normalizedExpenseId = String(expenseId || "").trim();
  if (!normalizedExpenseId) {
    throw new Error("El gasto a editar es obligatorio.");
  }

  void updates;
  throw new Error(
    "La edicion de gastos ya registrados requiere una RPC de auditoria en Supabase. Por ahora registra un ajuste nuevo."
  );
}
