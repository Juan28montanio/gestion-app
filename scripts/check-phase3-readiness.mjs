import fs from "node:fs";
import process from "node:process";

const STRICT = process.argv.includes("--strict");
const REQUIRED_LOCAL_FILES = [
  ".env.example",
  ".env.staging.example",
  ".env.production.example",
  ".github/workflows/phase-gates.yml",
  "docs/FASE3_ALISTAMIENTO_OPERATIVO.md",
  "docs/RUNBOOK_CAJA_SOPORTE.md",
  "scripts/seed-demo-profitability.mjs",
  "scripts/report-profitability-snapshots.mjs",
];

const REQUIRED_ENV_BY_MODE = {
  staging: [
    "SMARTPROFIT_ENV",
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "SUPABASE_CHECK_EMAIL",
    "SUPABASE_CHECK_PASSWORD",
    "SUPABASE_CHECK_BUSINESS_ID",
  ],
  production: [
    "SMARTPROFIT_ENV",
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "SUPABASE_CHECK_EMAIL",
    "SUPABASE_CHECK_PASSWORD",
    "SUPABASE_CHECK_BUSINESS_ID",
  ],
};

function readDotenv() {
  if (!fs.existsSync(".env")) return {};
  return Object.fromEntries(
    fs
      .readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        return [key, valueParts.join("=").replace(/^["']|["']$/g, "")];
      })
  );
}

function printCheck(ok, message) {
  console.log(`${ok ? "OK" : "FAIL"} ${message}`);
}

const env = { ...readDotenv(), ...process.env };
const failures = [];
const warnings = [];

for (const file of REQUIRED_LOCAL_FILES) {
  const exists = fs.existsSync(file);
  printCheck(exists, `archivo requerido: ${file}`);
  if (!exists) failures.push(`Falta ${file}`);
}

const smartprofitEnv = String(env.SMARTPROFIT_ENV || "local").trim().toLowerCase();
const knownEnv = ["local", "staging", "production"].includes(smartprofitEnv);
printCheck(knownEnv, `SMARTPROFIT_ENV reconocido: ${smartprofitEnv}`);
if (!knownEnv) failures.push("SMARTPROFIT_ENV debe ser local, staging o production.");

const requiredEnv = REQUIRED_ENV_BY_MODE[smartprofitEnv] || [];
for (const key of requiredEnv) {
  const ok = Boolean(env[key]);
  printCheck(ok, `variable ${smartprofitEnv}: ${key}`);
  if (!ok) failures.push(`Falta variable ${key} para ${smartprofitEnv}.`);
}

if (smartprofitEnv === "production" && env.E2E_SMARTPROFIT_EMAIL) {
  warnings.push("E2E_SMARTPROFIT_EMAIL esta definido en production; usa E2E productivos solo para smoke controlado.");
}

if (warnings.length) {
  console.log("\nWarnings:");
  warnings.forEach((warning) => console.log(`- ${warning}`));
}

if (failures.length) {
  console.error("\nReadiness issues:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  if (STRICT) {
    process.exitCode = 1;
  } else {
    console.log("\nModo no estricto: corrige estos puntos antes de habilitar Fase 3 en staging/production.");
  }
  process.exit();
}

console.log("\nOK: alistamiento base de Fase 3 verificado.");

