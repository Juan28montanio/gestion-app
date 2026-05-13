const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const RESETTABLE_COLLECTIONS = [
  "tables",
  "orders",
  "orderItems",
  "tableSessions",
  "tableEvents",
  "kitchenTickets",
  "products",
  "ingredients",
  "suppliers",
  "purchases",
  "recipeBooks",
  "customers",
  "sales",
  "saleItems",
  "payments",
  "sales_history",
  "cashMovements",
  "cash_closings",
  "accountsReceivable",
  "receivablePayments",
  "accountsPayable",
  "payablePayments",
  "inventoryMovements",
  "paymentMethods",
  "businessSettings",
  "ticketPlans",
  "mealTickets",
  "ticketConsumptions",
  "ticketAdjustments",
  "onboardingProgress",
  "operating_expenses",
  "resource_taxonomies",
];

const DEMO_COLLECTIONS = [
  "products",
  "ingredients",
  "suppliers",
  "purchases",
  "sales",
  "saleItems",
  "payments",
  "cashMovements",
  "cash_closings",
  "accountsReceivable",
  "inventoryMovements",
];

function normalizeText(value) {
  return String(value || "").trim();
}

function demoId(businessId, suffix) {
  return `${businessId}_demo_${suffix}`;
}

function baseDemoFields(businessId, batchId) {
  return {
    businessId,
    business_id: businessId,
    isDemo: true,
    is_demo: true,
    demoBatchId: batchId,
    demo_batch_id: batchId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function getBusinessUser(uid) {
  const snapshot = await db.collection("business_users").doc(uid).get();
  if (!snapshot.exists) {
    throw new HttpsError("permission-denied", "No se encontro el usuario del negocio.");
  }
  return { id: snapshot.id, ...snapshot.data() };
}

async function assertAdminForBusiness(request, businessId) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesion.");
  }
  const normalizedBusinessId = normalizeText(businessId);
  const profile = await getBusinessUser(request.auth.uid);
  const role = normalizeText(profile.role).toLowerCase();
  if (profile.business_id !== normalizedBusinessId) {
    throw new HttpsError("permission-denied", "El negocio no coincide con el usuario autenticado.");
  }
  if (role !== "owner" && role !== "admin") {
    throw new HttpsError("permission-denied", "Esta accion requiere rol administrador.");
  }
  return profile;
}

async function deleteQueryInChunks(query, chunkSize = 250) {
  let deleted = 0;
  while (true) {
    const snapshot = await query.limit(chunkSize).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    await batch.commit();
    deleted += snapshot.size;
  }
  return deleted;
}

async function purgeCollectionByBusinessId(collectionName, businessId) {
  const collectionRef = db.collection(collectionName);
  const bySnakeCase = await deleteQueryInChunks(collectionRef.where("business_id", "==", businessId));
  const byCamelCase = await deleteQueryInChunks(collectionRef.where("businessId", "==", businessId));
  return bySnakeCase + byCamelCase;
}

async function cleanupDemoDocs(businessId) {
  let deleted = 0;
  for (const collectionName of DEMO_COLLECTIONS) {
    deleted += await deleteQueryInChunks(
      db.collection(collectionName).where("business_id", "==", businessId).where("is_demo", "==", true)
    );
  }
  return deleted;
}

function actorFromRequest(request, profile) {
  return {
    id: request.auth?.uid || profile.id || "",
    email: request.auth?.token?.email || profile.email || "",
    name: profile.display_name || request.auth?.token?.name || request.auth?.token?.email || "Usuario",
  };
}

exports.resetBusinessWorkspace = onCall(async (request) => {
  const businessId = normalizeText(request.data?.businessId);
  const confirmation = normalizeText(request.data?.confirmation).toUpperCase();
  if (!businessId) {
    throw new HttpsError("invalid-argument", "No se encontro el negocio activo.");
  }
  if (confirmation !== "REINICIAR") {
    throw new HttpsError("invalid-argument", 'Confirma con la palabra "REINICIAR".');
  }

  const profile = await assertAdminForBusiness(request, businessId);
  const actor = actorFromRequest(request, profile);
  const deletionSummary = {};

  for (const collectionName of RESETTABLE_COLLECTIONS) {
    deletionSummary[collectionName] = await purgeCollectionByBusinessId(collectionName, businessId);
  }

  await db.collection("businesses").doc(businessId).set({
    logo_url: "",
    audit_pin_hash: "",
    audit_pin_updated_at: null,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await db.collection("auditLogs").add({
    business_id: businessId,
    businessId,
    user_id: actor.id,
    userId: actor.id,
    user_name: actor.name,
    userName: actor.name,
    module: "workspace",
    action: "workspace.reset",
    entity_type: "business",
    entityType: "business",
    entity_id: businessId,
    entityId: businessId,
    newValue: deletionSummary,
    reason: "Reinicio controlado del espacio de trabajo",
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, deleted: deletionSummary };
});

exports.cleanupDemoData = onCall(async (request) => {
  const businessId = normalizeText(request.data?.businessId);
  if (!businessId) {
    throw new HttpsError("invalid-argument", "No se encontro el negocio activo.");
  }

  const profile = await assertAdminForBusiness(request, businessId);
  const actor = actorFromRequest(request, profile);
  const deleted = await cleanupDemoDocs(businessId);

  await db.collection("auditLogs").add({
    business_id: businessId,
    businessId,
    user_id: actor.id,
    userId: actor.id,
    user_name: actor.name,
    userName: actor.name,
    module: "demo",
    action: "demo.cleanup",
    entity_type: "demoData",
    entityType: "demoData",
    entity_id: businessId,
    entityId: businessId,
    newValue: { deleted },
    reason: "Limpieza de datos demo",
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, deleted };
});

exports.seedDemoData = onCall(async (request) => {
  const businessId = normalizeText(request.data?.businessId);
  if (!businessId) {
    throw new HttpsError("invalid-argument", "No se encontro el negocio activo.");
  }

  const profile = await assertAdminForBusiness(request, businessId);
  const actor = actorFromRequest(request, profile);
  await cleanupDemoDocs(businessId);

  const batchId = `demo_${Date.now()}`;
  const supplierId = demoId(businessId, "supplier");
  const ingredientId = demoId(businessId, "ingredient");
  const productId = demoId(businessId, "product");
  const purchaseId = demoId(businessId, "purchase");
  const saleId = demoId(businessId, "sale");
  const saleItemId = demoId(businessId, "sale_item");
  const paymentId = demoId(businessId, "payment");
  const cashSessionId = demoId(businessId, "cash");
  const cashMovementId = demoId(businessId, "cash_movement");
  const inventoryMovementId = demoId(businessId, "inventory_movement");
  const dateKey = new Date().toISOString().slice(0, 10);
  const demo = baseDemoFields(businessId, batchId);
  const batch = db.batch();

  batch.set(db.collection("suppliers").doc(supplierId), {
    ...demo,
    name: "Proveedor Demo",
    category: "Insumos base",
    phone: "3000000000",
    status: "active",
  });
  batch.set(db.collection("ingredients").doc(ingredientId), {
    ...demo,
    name: "Cafe demo",
    category: "Bebidas",
    unit: "g",
    base_unit: "g",
    stock: 900,
    currentCost: 28,
    average_cost: 28,
    inventory: { currentStock: 900, location: "Demo" },
    status: "active",
  });
  batch.set(db.collection("products").doc(productId), {
    ...demo,
    name: "Cafe rentable demo",
    category: "Bebidas",
    price: 8000,
    cost: 1800,
    stock: 20,
    status: "active",
    visibleInPOS: true,
    inventory: {
      consumesInventory: true,
      inventoryImpactMode: "direct_item",
      allowSaleWhenStockLow: true,
    },
  });
  batch.set(db.collection("cash_closings").doc(cashSessionId), {
    ...demo,
    status: "open",
    opening_amount: 50000,
    openingAmount: 50000,
    cashier_name: actor.name,
    opened_at: FieldValue.serverTimestamp(),
    opened_date_key: dateKey,
  });
  batch.set(db.collection("purchases").doc(purchaseId), {
    ...demo,
    supplier_id: supplierId,
    supplier_name: "Proveedor Demo",
    status: "confirmada",
    purchase_date: dateKey,
    total: 28000,
    payment_method: "cash",
    items: [
      {
        inventoryItemId: ingredientId,
        ingredient_id: ingredientId,
        ingredient_name: "Cafe demo",
        quantity: 1000,
        unit_cost: 28,
        total_cost: 28000,
        category: "Bebidas",
      },
    ],
  });
  batch.set(db.collection("sales").doc(saleId), {
    ...demo,
    sourceType: "quick_sale",
    source_type: "quick_sale",
    tableId: "quick-sale",
    table_id: "quick-sale",
    tableName: "Mostrador",
    table_name: "Mostrador",
    status: "paid",
    paymentStatus: "paid",
    payment_status: "paid",
    subtotal: 16000,
    total: 16000,
    paidAmount: 16000,
    paid_amount: 16000,
    pendingAmount: 0,
    pending_amount: 0,
    inventoryImpactStatus: "applied",
    inventory_impact_status: "applied",
    cashSessionId,
    cash_session_id: cashSessionId,
  });
  batch.set(db.collection("saleItems").doc(saleItemId), {
    ...demo,
    saleId,
    sale_id: saleId,
    productId,
    product_id: productId,
    productName: "Cafe rentable demo",
    product_name: "Cafe rentable demo",
    quantity: 2,
    unitPrice: 8000,
    unit_price: 8000,
    subtotal: 16000,
    inventoryImpactStatus: "applied",
    inventory_impact_status: "applied",
  });
  batch.set(db.collection("payments").doc(paymentId), {
    ...demo,
    saleId,
    sale_id: saleId,
    method: "cash",
    amount: 16000,
    status: "completed",
    affectsCashRegister: true,
    affects_cash_register: true,
    cashSessionId,
    cash_session_id: cashSessionId,
  });
  batch.set(db.collection("cashMovements").doc(cashMovementId), {
    ...demo,
    cashSessionId,
    cash_session_id: cashSessionId,
    type: "sale_income",
    method: "cash",
    amount: 16000,
    description: "Venta demo Mostrador",
    sourceType: "sale",
    source_type: "sale",
    sourceId: saleId,
    source_id: saleId,
    saleId,
    sale_id: saleId,
    paymentId,
    payment_id: paymentId,
    status: "valid",
  });
  batch.set(db.collection("inventoryMovements").doc(inventoryMovementId), {
    ...demo,
    type: "sale_out",
    movementType: "sale_out",
    movement_type: "sale_out",
    direction: "out",
    sourceType: "sale",
    source_type: "sale",
    sourceId: saleId,
    source_id: saleId,
    saleId,
    sale_id: saleId,
    inventoryItemId: productId,
    inventory_item_id: productId,
    inventoryItemName: "Cafe rentable demo",
    inventory_item_name: "Cafe rentable demo",
    productId,
    product_id: productId,
    quantity: 2,
    unit: "und",
    unitCost: 1800,
    totalCost: 3600,
    stockBefore: 22,
    stock_before: 22,
    stockAfter: 20,
    stock_after: 20,
    status: "valid",
  });

  await batch.commit();

  await db.collection("auditLogs").add({
    business_id: businessId,
    businessId,
    user_id: actor.id,
    userId: actor.id,
    user_name: actor.name,
    userName: actor.name,
    module: "demo",
    action: "demo.seed",
    entity_type: "demoData",
    entityType: "demoData",
    entity_id: batchId,
    entityId: batchId,
    newValue: { batchId },
    reason: "Carga de datos demo controlados",
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, batchId };
});
