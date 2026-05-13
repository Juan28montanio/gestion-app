import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { getCurrentOpenCashSession } from "./cashClosingService";
import { createSubscriptionErrorHandler } from "./subscriptionService";
import {
  CONSUMPTION_STATUS,
  TICKET_STATUS,
  calculateExpirationDate,
  calculateMealsAvailable,
  calculatePricePerMeal,
  calculateTicketStatus,
  canCancelConsumption,
  canConsumeTicket,
  normalizeDate,
} from "../utils/ticketing";
import { normalizePaymentBreakdown } from "../utils/payments";
import { buildPosSaleDocuments, writePosSaleDocuments } from "./posFinancialService";

const plansCollection = collection(db, "ticketPlans");
const ticketsCollection = collection(db, "mealTickets");
const consumptionsCollection = collection(db, "ticketConsumptions");
const adjustmentsCollection = collection(db, "ticketAdjustments");
const salesCollection = collection(db, "sales_history");

function sortByCreatedAt(items = []) {
  return [...items].sort((left, right) => {
    const leftTime = normalizeDate(left.consumedAt || left.purchaseDate || left.createdAt)?.getTime?.() || 0;
    const rightTime = normalizeDate(right.consumedAt || right.purchaseDate || right.createdAt)?.getTime?.() || 0;
    return rightTime - leftTime;
  });
}

function normalizeBusinessId(value) {
  const businessId = String(value || "").trim();
  if (!businessId) {
    throw new Error("El business_id es obligatorio.");
  }
  return businessId;
}

function normalizeActor(actor = {}) {
  return {
    id: String(actor.id || actor.uid || "").trim(),
    name: String(actor.name || actor.displayName || actor.email || "Operador SmartProfit").trim(),
    email: String(actor.email || "").trim(),
  };
}

function normalizePlanPayload(plan, businessId) {
  const normalizedBusinessId = normalizeBusinessId(plan?.business_id || plan?.businessId || businessId);
  const name = String(plan?.name || "").trim();
  const mealsIncluded = Number(plan?.mealsIncluded ?? plan?.meals_included ?? 0);
  const price = Number(plan?.price ?? 0);
  const validityDays = Number(plan?.validityDays ?? plan?.validity_days ?? 0);

  if (!name) {
    throw new Error("El nombre del plan es obligatorio.");
  }

  if (!Number.isFinite(mealsIncluded) || mealsIncluded <= 0) {
    throw new Error("El plan debe incluir al menos un almuerzo.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("El precio del plan debe ser mayor o igual a cero.");
  }

  if (validityDays && (!Number.isFinite(validityDays) || validityDays <= 0)) {
    throw new Error("La vigencia del plan debe ser mayor a cero.");
  }

  return {
    business_id: normalizedBusinessId,
    businessId: normalizedBusinessId,
    name,
    mealsIncluded,
    meals_included: mealsIncluded,
    price,
    pricePerMeal: calculatePricePerMeal(price, mealsIncluded),
    price_per_meal: calculatePricePerMeal(price, mealsIncluded),
    validityDays: validityDays || null,
    validity_days: validityDays || null,
    allowedProducts: Array.isArray(plan?.allowedProducts) ? plan.allowedProducts : [],
    allowed_products: Array.isArray(plan?.allowedProducts) ? plan.allowedProducts : [],
    status: String(plan?.status || "active").trim(),
    description: String(plan?.description || "").trim(),
  };
}

function normalizeCustomerPatch(customerData, patch = {}) {
  const ticketBalance = Number(patch.ticketBalance ?? customerData.ticket_balance_units ?? 0);
  return {
    ticket_balance_units: Math.max(ticketBalance, 0),
    ticket_total_purchased: Number(patch.ticketTotalPurchased ?? customerData.ticket_total_purchased ?? 0),
    ticket_last_used_at: patch.ticketLastUsedAt ?? customerData.ticket_last_used_at ?? null,
    ticket_expires_at: patch.ticketExpiresAt ?? customerData.ticket_expires_at ?? null,
    updatedAt: serverTimestamp(),
  };
}

export function subscribeToTicketPlans(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  return onSnapshot(
    query(plansCollection, where("business_id", "==", businessId)),
    (snapshot) =>
      callback(
        snapshot.docs
          .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
          .sort((left, right) => String(left.name || "").localeCompare(String(right.name || ""), "es"))
      ),
    createSubscriptionErrorHandler({
      scope: "ticketPlans:subscribeToTicketPlans",
      callback,
      emptyValue: [],
    })
  );
}

export function subscribeToMealTickets(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  return onSnapshot(
    query(ticketsCollection, where("business_id", "==", businessId)),
    (snapshot) =>
      callback(
        sortByCreatedAt(
          snapshot.docs.map((snapshotDoc) => {
            const data = snapshotDoc.data();
            return {
              id: snapshotDoc.id,
              ...data,
              derivedStatus: calculateTicketStatus(data),
              derivedAvailable: calculateMealsAvailable(data),
            };
          })
        )
      ),
    createSubscriptionErrorHandler({
      scope: "mealTickets:subscribeToMealTickets",
      callback,
      emptyValue: [],
    })
  );
}

export function subscribeToTicketConsumptions(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  return onSnapshot(
    query(consumptionsCollection, where("business_id", "==", businessId)),
    (snapshot) =>
      callback(sortByCreatedAt(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })))),
    createSubscriptionErrorHandler({
      scope: "ticketConsumptions:subscribeToTicketConsumptions",
      callback,
      emptyValue: [],
    })
  );
}

export async function saveTicketPlan(businessId, plan, planId = "") {
  const payload = normalizePlanPayload(plan, businessId);
  const targetRef = planId ? doc(db, "ticketPlans", planId) : doc(plansCollection);

  await runTransaction(db, async (transaction) => {
    if (planId) {
      const planSnapshot = await transaction.get(targetRef);
      if (!planSnapshot.exists()) {
        throw new Error("El plan indicado no existe.");
      }
      transaction.update(targetRef, { ...payload, updatedAt: serverTimestamp() });
      return;
    }

    transaction.set(targetRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return targetRef.id;
}

export async function sellMealTicket(businessId, saleInput = {}, actorInput = {}) {
  const normalizedBusinessId = normalizeBusinessId(businessId);
  const customerId = String(saleInput.customerId || "").trim();
  const customerName = String(saleInput.customerName || "").trim();
  const mealsPurchased = Number(saleInput.mealsPurchased || 0);
  const amountPaid = Number(saleInput.amountPaid || 0);
  const paymentMethod = String(saleInput.paymentMethod || "").trim();
  const purchaseDate = normalizeDate(saleInput.purchaseDate) || new Date();
  const actor = normalizeActor(actorInput);

  if (!customerId || !customerName) {
    throw new Error("Debes seleccionar un cliente para vender la ticketera.");
  }

  if (!Number.isFinite(mealsPurchased) || mealsPurchased <= 0) {
    throw new Error("La ticketera debe incluir al menos un almuerzo.");
  }

  if (!Number.isFinite(amountPaid) || amountPaid < 0) {
    throw new Error("El valor pagado debe ser mayor o igual a cero.");
  }

  if (!paymentMethod) {
    throw new Error("El metodo de pago es obligatorio.");
  }

  const openCashSession = await getCurrentOpenCashSession(normalizedBusinessId);
  if (!openCashSession) {
    throw new Error("Debes abrir caja antes de registrar una venta de ticketera.");
  }

  const ticketRef = doc(ticketsCollection);
  const saleRef = doc(salesCollection);
  const customerRef = doc(db, "customers", customerId);
  const expirationDate =
    normalizeDate(saleInput.expirationDate) ||
    calculateExpirationDate(purchaseDate, Number(saleInput.validityDays || 0));
  const pricePerMeal = calculatePricePerMeal(amountPaid, mealsPurchased);

  await runTransaction(db, async (transaction) => {
    const customerSnapshot = await transaction.get(customerRef);
    if (!customerSnapshot.exists()) {
      throw new Error("El cliente seleccionado no existe.");
    }

    const customerData = customerSnapshot.data();
    const saleItem = {
      id: saleInput.planId || ticketRef.id,
      name: saleInput.planName || "Ticketera personalizada",
      quantity: 1,
      price: amountPaid,
      product_type: "ticket_wallet",
      ticket_units: mealsPurchased,
    };
    const posDocuments = buildPosSaleDocuments({
      businessId: normalizedBusinessId,
      orderId: ticketRef.id,
      orderData: {
        items: [saleItem],
      },
      tableId: null,
      tableName: "Ticketera",
      tableSessionId: null,
      paymentMethod,
      paymentBreakdown: normalizePaymentBreakdown([], paymentMethod, amountPaid),
      subtotal: amountPaid,
      chargedTotal: amountPaid,
      paymentAmount: amountPaid,
      cashReceived: paymentMethod === "cash" ? amountPaid : 0,
      ticketConsumption: { units: 0, coveredAmount: 0 },
      ticketGrantUnits: mealsPurchased,
      customerId,
      customerName,
      cashSessionId: openCashSession.id || "",
      actor,
    });
    writePosSaleDocuments(transaction, posDocuments);

    const ticketPayload = {
      business_id: normalizedBusinessId,
      businessId: normalizedBusinessId,
      customerId,
      customer_id: customerId,
      customerName,
      customer_name: customerName,
      planId: saleInput.planId || null,
      plan_id: saleInput.planId || null,
      planName: saleInput.planName || "Personalizada",
      plan_name: saleInput.planName || "Personalizada",
      mealsPurchased,
      meals_purchased: mealsPurchased,
      mealsConsumed: 0,
      meals_consumed: 0,
      mealsAvailable: mealsPurchased,
      meals_available: mealsPurchased,
      purchaseDate: Timestamp.fromDate(purchaseDate),
      purchase_date: Timestamp.fromDate(purchaseDate),
      expirationDate: expirationDate ? Timestamp.fromDate(expirationDate) : null,
      expiration_date: expirationDate ? Timestamp.fromDate(expirationDate) : null,
      amountPaid,
      amount_paid: amountPaid,
      pricePerMeal,
      price_per_meal: pricePerMeal,
      paymentMethod,
      payment_method: paymentMethod,
      status: TICKET_STATUS.ACTIVE,
      notes: String(saleInput.notes || "").trim(),
      createdBy: actor,
      created_by: actor,
      updatedBy: actor,
      updated_by: actor,
      salesHistoryId: saleRef.id,
      sales_history_id: saleRef.id,
      saleId: posDocuments.saleRef.id,
      sale_id: posDocuments.saleRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(ticketRef, ticketPayload);
    transaction.set(saleRef, {
      business_id: normalizedBusinessId,
      sale_id: posDocuments.saleRef.id,
      type: "income",
      concept: `Venta ticketera ${customerName}`,
      customer_id: customerId,
      customer_name: customerName,
      linked_ticket_id: ticketRef.id,
      items: [
        {
          ...saleItem,
          product_type: "meal_ticket",
        },
      ],
      subtotal: amountPaid,
      total: amountPaid,
      payment_method: paymentMethod,
      payment_label: paymentMethod,
      payment_breakdown: normalizePaymentBreakdown([], paymentMethod, amountPaid),
      payment_kind: "prepaid_ticket_sale",
      income_kind: "meal_ticket_sale",
      ticket_units_granted: mealsPurchased,
      ticket_units_consumed: 0,
      ticket_covered_amount: 0,
      closing_id: openCashSession.id || null,
      closed_at: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    transaction.update(
      customerRef,
      normalizeCustomerPatch(customerData, {
        ticketBalance: Number(customerData.ticket_balance_units || 0) + mealsPurchased,
        ticketTotalPurchased: Number(customerData.ticket_total_purchased || 0) + mealsPurchased,
        ticketExpiresAt: expirationDate ? Timestamp.fromDate(expirationDate) : customerData.ticket_expires_at || null,
      })
    );
  });

  return ticketRef.id;
}

export async function registerExistingMealTicket(businessId, input = {}, actorInput = {}) {
  const normalizedBusinessId = normalizeBusinessId(businessId);
  const customerId = String(input.customerId || "").trim();
  const customerName = String(input.customerName || "").trim();
  const mealsPurchased = Number(input.mealsPurchased || 0);
  const mealsConsumed = Number(input.mealsConsumed || 0);
  const amountPaid = Number(input.amountPaid || 0);
  const migrationReason = String(input.migrationReason || input.notes || "").trim();
  const purchaseDate = normalizeDate(input.purchaseDate) || new Date();
  const actor = normalizeActor(actorInput);

  if (!customerId || !customerName) {
    throw new Error("Debes seleccionar un cliente para cargar saldo inicial.");
  }

  if (!Number.isFinite(mealsPurchased) || mealsPurchased <= 0) {
    throw new Error("La ticketera debe incluir al menos un almuerzo.");
  }

  if (!Number.isFinite(mealsConsumed) || mealsConsumed < 0 || mealsConsumed > mealsPurchased) {
    throw new Error("Los almuerzos ya consumidos deben estar entre 0 y el total comprado.");
  }

  if (!migrationReason) {
    throw new Error("El motivo de carga inicial es obligatorio.");
  }

  const ticketRef = doc(ticketsCollection);
  const adjustmentRef = doc(adjustmentsCollection);
  const customerRef = doc(db, "customers", customerId);
  const expirationDate =
    normalizeDate(input.expirationDate) ||
    calculateExpirationDate(purchaseDate, Number(input.validityDays || 0));
  const mealsAvailable = Math.max(mealsPurchased - mealsConsumed, 0);
  const pricePerMeal = calculatePricePerMeal(amountPaid, mealsPurchased);

  await runTransaction(db, async (transaction) => {
    const customerSnapshot = await transaction.get(customerRef);
    if (!customerSnapshot.exists()) {
      throw new Error("El cliente seleccionado no existe.");
    }

    const customerData = customerSnapshot.data();
    const ticketPayload = {
      business_id: normalizedBusinessId,
      businessId: normalizedBusinessId,
      customerId,
      customer_id: customerId,
      customerName,
      customer_name: customerName,
      planId: input.planId || null,
      plan_id: input.planId || null,
      planName: input.planName || "Saldo inicial",
      plan_name: input.planName || "Saldo inicial",
      mealsPurchased,
      meals_purchased: mealsPurchased,
      mealsConsumed,
      meals_consumed: mealsConsumed,
      mealsAvailable: mealsAvailable,
      meals_available: mealsAvailable,
      purchaseDate: Timestamp.fromDate(purchaseDate),
      purchase_date: Timestamp.fromDate(purchaseDate),
      expirationDate: expirationDate ? Timestamp.fromDate(expirationDate) : null,
      expiration_date: expirationDate ? Timestamp.fromDate(expirationDate) : null,
      amountPaid,
      amount_paid: amountPaid,
      pricePerMeal,
      price_per_meal: pricePerMeal,
      paymentMethod: "legacy_paid",
      payment_method: "legacy_paid",
      status: mealsAvailable > 0 ? TICKET_STATUS.ACTIVE : TICKET_STATUS.EXHAUSTED,
      source: "pre_system_balance",
      source_label: "Pago anterior al sistema",
      notes: migrationReason,
      createdBy: actor,
      created_by: actor,
      updatedBy: actor,
      updated_by: actor,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(ticketRef, ticketPayload);
    transaction.set(adjustmentRef, {
      business_id: normalizedBusinessId,
      businessId: normalizedBusinessId,
      ticketId: ticketRef.id,
      ticket_id: ticketRef.id,
      customerId,
      customer_id: customerId,
      previousBalance: 0,
      previous_balance: 0,
      newBalance: mealsAvailable,
      new_balance: mealsAvailable,
      difference: mealsAvailable,
      reason: migrationReason,
      type: "initial_balance",
      adjustedBy: actor,
      adjusted_by: actor,
      createdAt: serverTimestamp(),
    });
    transaction.update(
      customerRef,
      normalizeCustomerPatch(customerData, {
        ticketBalance: Number(customerData.ticket_balance_units || 0) + mealsAvailable,
        ticketTotalPurchased: Number(customerData.ticket_total_purchased || 0) + mealsPurchased,
        ticketExpiresAt: expirationDate ? Timestamp.fromDate(expirationDate) : customerData.ticket_expires_at || null,
      })
    );
  });

  return ticketRef.id;
}

export async function consumeMealTicket(businessId, input = {}, actorInput = {}) {
  const normalizedBusinessId = normalizeBusinessId(businessId);
  const ticketId = String(input.ticketId || "").trim();
  const actor = normalizeActor(actorInput);

  if (!ticketId) {
    throw new Error("Debes seleccionar una ticketera activa.");
  }

  const ticketRef = doc(db, "mealTickets", ticketId);
  const consumptionRef = doc(consumptionsCollection);

  await runTransaction(db, async (transaction) => {
    const ticketSnapshot = await transaction.get(ticketRef);
    if (!ticketSnapshot.exists()) {
      throw new Error("La ticketera seleccionada no existe.");
    }

    const ticketData = ticketSnapshot.data();
    if (String(ticketData.business_id || "") !== normalizedBusinessId) {
      throw new Error("La ticketera no pertenece al negocio activo.");
    }

    const permission = canConsumeTicket(ticketData);
    if (!permission.allowed) {
      throw new Error(permission.reason);
    }

    const customerId = String(ticketData.customer_id || ticketData.customerId || "");
    const customerRef = doc(db, "customers", customerId);
    const customerSnapshot = await transaction.get(customerRef);
    const mealsConsumed = Number(ticketData.meals_consumed ?? ticketData.mealsConsumed ?? 0) + 1;
    const mealsPurchased = Number(ticketData.meals_purchased ?? ticketData.mealsPurchased ?? 0);
    const mealsAvailable = Math.max(mealsPurchased - mealsConsumed, 0);
    const nextTicket = {
      ...ticketData,
      mealsConsumed,
      meals_consumed: mealsConsumed,
      mealsAvailable,
      meals_available: mealsAvailable,
    };
    const nextStatus = calculateTicketStatus(nextTicket);

    transaction.set(consumptionRef, {
      business_id: normalizedBusinessId,
      businessId: normalizedBusinessId,
      ticketId,
      ticket_id: ticketId,
      customerId,
      customer_id: customerId,
      customerName: ticketData.customer_name || ticketData.customerName || "",
      customer_name: ticketData.customer_name || ticketData.customerName || "",
      productId: input.productId || null,
      product_id: input.productId || null,
      productName: String(input.productName || "Almuerzo").trim(),
      product_name: String(input.productName || "Almuerzo").trim(),
      consumedAt: serverTimestamp(),
      consumed_at: serverTimestamp(),
      consumedBy: actor,
      consumed_by: actor,
      status: CONSUMPTION_STATUS.VALID,
      cancelReason: "",
      cancel_reason: "",
      notes: String(input.notes || "").trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(ticketRef, {
      mealsConsumed,
      meals_consumed: mealsConsumed,
      mealsAvailable,
      meals_available: mealsAvailable,
      status: nextStatus,
      updatedBy: actor,
      updated_by: actor,
      updatedAt: serverTimestamp(),
    });

    if (customerSnapshot.exists()) {
      const customerData = customerSnapshot.data();
      transaction.update(
        customerRef,
        normalizeCustomerPatch(customerData, {
          ticketBalance: Number(customerData.ticket_balance_units || 0) - 1,
          ticketLastUsedAt: serverTimestamp(),
        })
      );
    }
  });

  return consumptionRef.id;
}

export async function cancelTicketConsumption(consumptionId, reason, actorInput = {}) {
  const normalizedConsumptionId = String(consumptionId || "").trim();
  const normalizedReason = String(reason || "").trim();
  const actor = normalizeActor(actorInput);

  if (!normalizedConsumptionId) {
    throw new Error("El consumo es obligatorio.");
  }

  if (!normalizedReason) {
    throw new Error("El motivo de anulacion es obligatorio.");
  }

  const consumptionRef = doc(db, "ticketConsumptions", normalizedConsumptionId);

  await runTransaction(db, async (transaction) => {
    const consumptionSnapshot = await transaction.get(consumptionRef);
    if (!consumptionSnapshot.exists()) {
      throw new Error("El consumo indicado no existe.");
    }

    const consumptionData = consumptionSnapshot.data();
    if (!canCancelConsumption(consumptionData)) {
      throw new Error("Este consumo ya fue anulado.");
    }

    const ticketRef = doc(db, "mealTickets", consumptionData.ticket_id || consumptionData.ticketId);
    const ticketSnapshot = await transaction.get(ticketRef);
    if (!ticketSnapshot.exists()) {
      throw new Error("La ticketera asociada no existe.");
    }

    const ticketData = ticketSnapshot.data();
    const mealsConsumed = Math.max(Number(ticketData.meals_consumed ?? ticketData.mealsConsumed ?? 0) - 1, 0);
    const mealsPurchased = Number(ticketData.meals_purchased ?? ticketData.mealsPurchased ?? 0);
    const mealsAvailable = Math.max(mealsPurchased - mealsConsumed, 0);
    const nextStatus = calculateTicketStatus({
      ...ticketData,
      status: ticketData.status === TICKET_STATUS.EXHAUSTED ? TICKET_STATUS.ACTIVE : ticketData.status,
      meals_consumed: mealsConsumed,
      mealsConsumed,
    });
    const customerId = String(ticketData.customer_id || ticketData.customerId || "");
    const customerRef = doc(db, "customers", customerId);
    const customerSnapshot = await transaction.get(customerRef);

    transaction.update(consumptionRef, {
      status: CONSUMPTION_STATUS.CANCELED,
      cancelReason: normalizedReason,
      cancel_reason: normalizedReason,
      canceledBy: actor,
      canceled_by: actor,
      canceledAt: serverTimestamp(),
      canceled_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(ticketRef, {
      mealsConsumed,
      meals_consumed: mealsConsumed,
      mealsAvailable,
      meals_available: mealsAvailable,
      status: nextStatus,
      updatedBy: actor,
      updated_by: actor,
      updatedAt: serverTimestamp(),
    });

    if (customerSnapshot.exists()) {
      const customerData = customerSnapshot.data();
      transaction.update(
        customerRef,
        normalizeCustomerPatch(customerData, {
          ticketBalance: Number(customerData.ticket_balance_units || 0) + 1,
        })
      );
    }
  });
}

export async function updateMealTicketStatus(ticketId, status, reason, actorInput = {}) {
  const normalizedTicketId = String(ticketId || "").trim();
  const normalizedStatus = String(status || "").trim();
  const normalizedReason = String(reason || "").trim();
  const actor = normalizeActor(actorInput);

  if (!normalizedTicketId) {
    throw new Error("La ticketera es obligatoria.");
  }

  if (![TICKET_STATUS.CANCELED, TICKET_STATUS.SUSPENDED, TICKET_STATUS.ACTIVE].includes(normalizedStatus)) {
    throw new Error("El estado solicitado no es valido.");
  }

  if (normalizedStatus !== TICKET_STATUS.ACTIVE && !normalizedReason) {
    throw new Error("El motivo es obligatorio.");
  }

  const ticketRef = doc(db, "mealTickets", normalizedTicketId);

  await runTransaction(db, async (transaction) => {
    const ticketSnapshot = await transaction.get(ticketRef);
    if (!ticketSnapshot.exists()) {
      throw new Error("La ticketera indicada no existe.");
    }

    const ticketData = ticketSnapshot.data();
    const currentStatus = calculateTicketStatus(ticketData);
    const available = calculateMealsAvailable(ticketData);
    const customerId = String(ticketData.customer_id || ticketData.customerId || "");
    const customerRef = doc(db, "customers", customerId);
    const customerSnapshot = customerId ? await transaction.get(customerRef) : null;

    transaction.update(ticketRef, {
      status: normalizedStatus,
      statusReason: normalizedReason,
      status_reason: normalizedReason,
      updatedBy: actor,
      updated_by: actor,
      updatedAt: serverTimestamp(),
    });

    if (
      customerSnapshot?.exists() &&
      normalizedStatus === TICKET_STATUS.CANCELED &&
      currentStatus !== TICKET_STATUS.CANCELED
    ) {
      const customerData = customerSnapshot.data();
      transaction.update(
        customerRef,
        normalizeCustomerPatch(customerData, {
          ticketBalance: Number(customerData.ticket_balance_units || 0) - available,
        })
      );
    }
  });
}

export async function adjustMealTicketBalance(ticketId, newBalance, reason, actorInput = {}) {
  const normalizedTicketId = String(ticketId || "").trim();
  const normalizedReason = String(reason || "").trim();
  const nextBalance = Number(newBalance);
  const actor = normalizeActor(actorInput);

  if (!normalizedTicketId) {
    throw new Error("La ticketera es obligatoria.");
  }

  if (!Number.isFinite(nextBalance) || nextBalance < 0) {
    throw new Error("El nuevo saldo debe ser mayor o igual a cero.");
  }

  if (!normalizedReason) {
    throw new Error("El motivo de ajuste es obligatorio.");
  }

  const ticketRef = doc(db, "mealTickets", normalizedTicketId);
  const adjustmentRef = doc(adjustmentsCollection);

  await runTransaction(db, async (transaction) => {
    const ticketSnapshot = await transaction.get(ticketRef);
    if (!ticketSnapshot.exists()) {
      throw new Error("La ticketera indicada no existe.");
    }

    const ticketData = ticketSnapshot.data();
    const previousBalance = calculateMealsAvailable(ticketData);
    const mealsPurchased = Number(ticketData.meals_purchased ?? ticketData.mealsPurchased ?? 0);
    const mealsConsumed = Math.max(mealsPurchased - nextBalance, 0);
    const nextStatus = nextBalance <= 0 ? TICKET_STATUS.EXHAUSTED : TICKET_STATUS.ACTIVE;
    const customerId = String(ticketData.customer_id || ticketData.customerId || "");
    const customerRef = doc(db, "customers", customerId);
    const customerSnapshot = await transaction.get(customerRef);

    transaction.set(adjustmentRef, {
      business_id: ticketData.business_id,
      businessId: ticketData.business_id,
      ticketId: normalizedTicketId,
      ticket_id: normalizedTicketId,
      customerId,
      customer_id: customerId,
      previousBalance,
      previous_balance: previousBalance,
      newBalance: nextBalance,
      new_balance: nextBalance,
      difference: nextBalance - previousBalance,
      reason: normalizedReason,
      adjustedBy: actor,
      adjusted_by: actor,
      createdAt: serverTimestamp(),
    });

    transaction.update(ticketRef, {
      mealsConsumed,
      meals_consumed: mealsConsumed,
      mealsAvailable: nextBalance,
      meals_available: nextBalance,
      status: nextStatus,
      updatedBy: actor,
      updated_by: actor,
      updatedAt: serverTimestamp(),
    });

    if (customerSnapshot.exists()) {
      const customerData = customerSnapshot.data();
      transaction.update(
        customerRef,
        normalizeCustomerPatch(customerData, {
          ticketBalance: Number(customerData.ticket_balance_units || 0) + (nextBalance - previousBalance),
        })
      );
    }
  });
}

export async function getMealTicket(ticketId) {
  const snapshot = await getDoc(doc(db, "mealTickets", ticketId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
