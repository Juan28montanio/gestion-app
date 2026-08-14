# Fase 3 - Alistamiento operativo

## Objetivo

Resolver las brechas menores detectadas al cerrar Fase 2 para iniciar Fase 3 con una base SaaS operable: entornos separados, CI, datos demo, runbooks, reportes de rentabilidad y tratamiento claro de datos residuales.

## Estado de alistamiento

- [x] Entornos documentados con `.env.staging.example` y `.env.production.example`.
- [x] CI base agregado en `.github/workflows/phase-gates.yml`.
- [x] Dataset demo de rentabilidad preparado mediante `npm run demo:profitability`.
- [x] Runbook de caja y soporte creado en `docs/RUNBOOK_CAJA_SOPORTE.md`.
- [x] Reporte tecnico de snapshots de rentabilidad disponible con `npm run report:profitability`.
- [x] Residual historico no monetario documentado y separado en `npm run check:supabase`.

## Entornos

La regla para Fase 3 es simple:

- `local`: desarrollo con `.env` local y Supabase local/remoto controlado.
- `staging`: validacion con datos demo y usuario E2E dedicado.
- `production`: clientes reales; E2E solo para smoke controlado.

Archivos base:

- `.env.example`: referencia local actual.
- `.env.staging.example`: variables esperadas para staging.
- `.env.production.example`: variables esperadas para produccion.

Comando de puerta:

```bash
npm run check:phase3:readiness
```

En CI/staging usar modo estricto:

```bash
npm run check:phase3:readiness -- --strict
```

## CI

Workflow:

```text
.github/workflows/phase-gates.yml
```

Jobs:

- `local-quality`: lint, unit tests, smoke, build y readiness sin secretos.
- `supabase-contract`: checks remotos contra staging con secretos de GitHub Actions.

Secretos requeridos para staging:

```text
STAGING_SUPABASE_URL
STAGING_SUPABASE_ANON_KEY
STAGING_SUPABASE_CHECK_EMAIL
STAGING_SUPABASE_CHECK_PASSWORD
STAGING_SUPABASE_CHECK_BUSINESS_ID
```

## Dataset demo

Dry-run:

```bash
npm run demo:profitability
```

Aplicar en staging:

```bash
SMARTPROFIT_ENV=staging npm run demo:profitability:apply
```

El script crea, de forma idempotente:

- dos insumos demo;
- un producto preparado demo;
- una ficha tecnica activa;
- componentes con cantidades, merma, costo unitario y precio objetivo.

No aplica por defecto fuera de `staging`. Para pruebas locales excepcionales existe `--allow-non-staging`.

## Reporte tecnico de rentabilidad

Comando:

```bash
npm run report:profitability
```

El reporte lee `product_cost_snapshots` y resume:

- cantidad de snapshots;
- snapshots originados por venta;
- ingreso/costo/margen acumulado;
- margen promedio;
- ranking por producto.

Este reporte no reemplaza el dashboard final de Fase 4, pero deja un punto de control tecnico para asegurar que Fase 2 produce evidencia analitica usable.

## Datos residuales historicos

Estado despues de la higiene:

- 31 ventas monetarias historicas reconstruidas.
- 38 pagos creados.
- $813.000 COP conciliados.
- 25 ventas no monetarias en cero permanecen sin pago asociado.

`npm run check:supabase` ahora separa:

- `paidMonetarySalesWithoutPayments`: debe permanecer en 0.
- `nonMonetarySalesWithoutPayments`: residual esperado mientras no se modele consumo no monetario como evento separado.
- `unusualSalesWithoutPayments`: debe permanecer en 0.

## Puerta recomendada antes de crear tablas de Fase 3

Ejecutar:

```bash
npm run lint
npm run test
npm run test:smoke
npm run build
npm run check:phase3:readiness
npm run check:supabase
npm run check:supabase:rpc
npm run report:profitability
npx supabase db push --linked --dry-run
```

Resultado esperado:

- lint sin warnings;
- unit/smoke/build en verde;
- Supabase remoto sin migraciones pendientes;
- `paidMonetarySalesWithoutPayments = 0`;
- RPC core y rentabilidad disponibles;
- reporte de rentabilidad produce salida JSON.

## Decision

Con estas brechas resueltas, Fase 3 puede iniciar por arquitectura SaaS:

1. modelo de planes y suscripciones;
2. invitaciones y permisos por accion;
3. webhooks idempotentes;
4. panel interno de soporte;
5. observabilidad y errores de produccion.

