import { getSupabaseClient } from "../lib/supabaseClient";
import { getOpenCashSession } from "./supabase/cashService";

function sortOperatingExpenses(items = []) {
  return [...items].sort((left, right) =>
    String(right?.expense_date || "").localeCompare(String(left?.expense_date || ""), "es", {
      sensitivity: "base",
    })
  );
}

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

export function subscribeToOperatingExpenses(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  callback([]);
  return () => {};
/*
  const expensesQuery = query(
    operatingExpensesCollection,
    where("business_id", "==", businessId)
  );

  return onSnapshot(expensesQuery, (snapshot) => {
    callback(
      sortOperatingExpenses(
        snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
      )
    );
  }, createSubscriptionErrorHandler({
    scope: "operating_expenses:subscribeToOperatingExpenses",
    callback,
    emptyValue: [],
  }));
*/
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
