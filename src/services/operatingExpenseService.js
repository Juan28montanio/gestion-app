import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const operatingExpensesCollection = collection(db, "operating_expenses");

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

  const expensesQuery = query(
    operatingExpensesCollection,
    where("business_id", "==", businessId),
    orderBy("expense_date", "desc")
  );

  return onSnapshot(expensesQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
}

export async function createOperatingExpense(expense) {
  const payload = buildOperatingExpensePayload(expense);
  const createdRef = await addDoc(operatingExpensesCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdRef.id;
}

export async function updateOperatingExpense(expenseId, updates = {}) {
  const normalizedExpenseId = String(expenseId || "").trim();
  if (!normalizedExpenseId) {
    throw new Error("El gasto a editar es obligatorio.");
  }

  const payload = {
    updatedAt: serverTimestamp(),
  };

  if (typeof updates.concept !== "undefined") {
    payload.concept = String(updates.concept || "").trim();
  }

  if (typeof updates.category !== "undefined") {
    payload.category = String(updates.category || "").trim();
  }

  if (typeof updates.expenseDate !== "undefined") {
    payload.expense_date = String(updates.expenseDate || "").trim();
  }

  if (typeof updates.paymentMethod !== "undefined") {
    payload.payment_method = String(updates.paymentMethod || "cash").trim();
  }

  if (typeof updates.notes !== "undefined") {
    payload.notes = String(updates.notes || "").trim();
  }

  if (typeof updates.vendorName !== "undefined") {
    payload.vendor_name = String(updates.vendorName || "").trim();
  }

  const nextAmount = Number(updates.amount);
  if (Number.isFinite(nextAmount) && nextAmount >= 0) {
    payload.amount = nextAmount;
    payload.total = nextAmount;
  }

  await updateDoc(doc(db, "operating_expenses", normalizedExpenseId), payload);
}
