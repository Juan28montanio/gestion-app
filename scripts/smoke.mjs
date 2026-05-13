import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

async function read(path) {
  return readFile(resolve(root, path), "utf8");
}

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`Smoke fallido: falta ${label}`);
  }
}

const [packageJson, financeService, inventoryService, workspaceService, functionsIndex, rules] = await Promise.all([
  read("package.json"),
  read("src/services/financeService.js"),
  read("src/services/inventoryService.js"),
  read("src/services/workspaceService.js"),
  read("functions/index.js"),
  read("firestore.rules"),
]);

const pkg = JSON.parse(packageJson);

["lint", "test", "test:smoke"].forEach((scriptName) => {
  if (!pkg.scripts?.[scriptName]) {
    throw new Error(`Smoke fallido: falta script ${scriptName}`);
  }
});

[
  "sales",
  "saleItems",
  "payments",
  "cashMovements",
  "inventoryMovements",
  "accountsReceivable",
  "accountsPayable",
].forEach((collectionName) => {
  assertIncludes(rules, `match /${collectionName}/`, `reglas para ${collectionName}`);
});

assertIncludes(financeService, "buildPosSaleDocuments", "creacion canonica de venta POS");
assertIncludes(financeService, "applySaleInventoryImpact", "integracion de impacto de inventario");
assertIncludes(inventoryService, "export async function applySaleInventoryImpact", "servicio applySaleInventoryImpact");
assertIncludes(inventoryService, "export async function reverseSaleInventoryImpact", "servicio reverseSaleInventoryImpact");
assertIncludes(inventoryService, "inventoryImpactStatus", "estado idempotente de inventario");
assertIncludes(workspaceService, "httpsCallable", "reset via Cloud Functions");
assertIncludes(functionsIndex, "assertAdminForBusiness", "proteccion admin backend");
assertIncludes(functionsIndex, "exports.resetBusinessWorkspace", "funcion backend de reset");
assertIncludes(functionsIndex, "auditLogs", "auditoria de reset/demo");
assertIncludes(rules, "isOwnerOrAdmin", "roles owner/admin en reglas");
assertIncludes(rules, "immutableBusinessId", "business_id inmutable en reglas");

console.log("Smoke tecnico OK: contrato canonico, inventario, reglas y reset protegidos presentes.");
