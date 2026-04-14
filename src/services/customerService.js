import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const customersCollection = collection(db, "customers");
const TICKET_WARNING_THRESHOLD = 2;

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  if (value?.toDate) {
    return value.toDate();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getTicketWalletState(customer) {
  const balance = Number(
    customer?.ticket_balance_units ??
      customer?.ticketBalanceUnits ??
      customer?.lunch_ticket_balance ??
      0
  );
  const expiresAt = normalizeDate(
    customer?.ticket_expires_at ?? customer?.ticketExpiresAt ?? null
  );
  const lastUsedAt = normalizeDate(
    customer?.ticket_last_used_at ?? customer?.ticketLastUsedAt ?? null
  );
  const now = new Date();
  const isExpired = expiresAt ? expiresAt.getTime() < now.getTime() : false;
  const activeBalance = isExpired ? 0 : Math.max(balance, 0);
  const minutesSinceLastUse = lastUsedAt
    ? (now.getTime() - lastUsedAt.getTime()) / 60000
    : Number.POSITIVE_INFINITY;

  return {
    balance: activeBalance,
    expiresAt,
    lastUsedAt,
    isExpired,
    isActive: activeBalance > 0,
    lowBalance: activeBalance > 0 && activeBalance <= TICKET_WARNING_THRESHOLD,
    requiresReuseConfirmation: minutesSinceLastUse < 30,
  };
}

function normalizeCustomerPayload(customer, businessId) {
  const normalizedBusinessId = String(customer?.business_id || businessId || "").trim();
  const name = String(customer?.name || "").trim();
  const phone = String(customer?.phone || "").trim();
  const email = String(customer?.email || "").trim();
  const notes = String(customer?.notes || "").trim();

  if (!normalizedBusinessId) {
    throw new Error("El business_id del cliente es obligatorio.");
  }

  if (!name) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  return {
    business_id: normalizedBusinessId,
    name,
    phone,
    email,
    notes,
    debt_balance: Number(
      customer?.debt_balance ?? customer?.debtBalance ?? customer?.pendingDebt ?? 0
    ),
    pendingDebt: Number(
      customer?.pendingDebt ?? customer?.debt_balance ?? customer?.debtBalance ?? 0
    ),
    ticket_balance_units: Number(
      customer?.ticket_balance_units ?? customer?.ticketBalanceUnits ?? 0
    ),
    ticket_total_purchased: Number(
      customer?.ticket_total_purchased ?? customer?.ticketTotalPurchased ?? 0
    ),
    ticket_last_used_at:
      customer?.ticket_last_used_at ?? customer?.ticketLastUsedAt ?? null,
    ticket_expires_at:
      customer?.ticket_expires_at ?? customer?.ticketExpiresAt ?? null,
  };
}

export function subscribeToCustomers(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const customersQuery = query(
    customersCollection,
    where("business_id", "==", businessId),
    orderBy("name", "asc")
  );

  return onSnapshot(customersQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
}

export async function createCustomer(businessId, customer) {
  const payload = normalizeCustomerPayload(customer, businessId);
  const createdCustomer = await addDoc(customersCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdCustomer.id;
}

export async function updateCustomer(customerId, businessId, customer) {
  if (!customerId) {
    throw new Error("El id del cliente es obligatorio para editar.");
  }

  const payload = normalizeCustomerPayload(customer, businessId);
  await updateDoc(doc(db, "customers", customerId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCustomer(customerId) {
  if (!customerId) {
    throw new Error("El id del cliente es obligatorio para eliminar.");
  }

  await deleteDoc(doc(db, "customers", customerId));
}

export async function adjustCustomerTicketWallet(customerId, adjustment) {
  const normalizedCustomerId = String(customerId || "").trim();

  if (!normalizedCustomerId) {
    throw new Error("El id del cliente es obligatorio para ajustar la tiquetera.");
  }

  const units = Number(adjustment?.units || 0);
  const expiresAt = adjustment?.expiresAt || null;

  await updateDoc(doc(db, "customers", normalizedCustomerId), {
    ticket_balance_units: Math.max(units, 0),
    ticket_total_purchased: Number(adjustment?.totalPurchased ?? units),
    ticket_expires_at: expiresAt,
    updatedAt: serverTimestamp(),
  });
}
