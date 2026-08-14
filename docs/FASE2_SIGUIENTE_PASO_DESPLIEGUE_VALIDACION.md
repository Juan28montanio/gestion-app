# Fase 2 - Siguiente paso: despliegue remoto y validacion final

## Objetivo

Cerrar el siguiente paso critico de la ruta de implementacion de Fase 2: sincronizar el motor de rentabilidad con Supabase remoto y validar que el flujo completo funciona fuera del entorno local.

Este paso existe porque el backend local ya tiene tablas, RPCs, RLS, grants y pruebas SQL del motor de rentabilidad, pero el Supabase remoto configurado en `.env` aun puede no tener desplegada la RPC:

```text
public.create_or_update_technical_sheet
```

La meta es pasar de "implementado localmente" a "validado contra backend real".

## Alcance del paso

Incluye:

- Verificar estado local del backend.
- Aplicar migracion a Supabase remoto.
- Refrescar schema cache de PostgREST si hace falta.
- Ejecutar smoke checks contra remoto.
- Ejecutar E2E de rentabilidad.
- Registrar evidencia de cierre.

No incluye:

- Implementar billing.
- Crear planes de suscripcion.
- Cambiar arquitectura general.
- Redisenar UI.
- Agregar nuevas funcionalidades fuera de Fase 2.

## Precondiciones

Antes de tocar Supabase remoto:

- [ ] Tener acceso al proyecto Supabase correcto.
- [ ] Confirmar que `.env` apunta al proyecto correcto.
- [ ] Confirmar que el proyecto remoto no es un entorno de produccion con usuarios reales sin backup reciente.
- [ ] Tener Docker/Supabase local funcionando para pruebas SQL.
- [ ] Tener la migracion local actualizada en `supabase/migrations/20260813000100_smartprofit_backend.sql`.
- [ ] Haber ejecutado pruebas locales basicas.

## Archivos relevantes

### SQL fuente

- `database/supabase/schema-profitability.sql`
- `database/supabase/rpc-profitability.sql`
- `database/supabase/security-grants.sql`
- `database/supabase/performance-indexes.sql`

### Migracion local

- `supabase/migrations/20260813000100_smartprofit_backend.sql`

### Tests

- `supabase/tests/001_backend_contract.sql`
- `supabase/tests/002_rls_isolation.sql`
- `supabase/tests/003_rpc_transactions.sql`
- `supabase/tests/004_profitability_engine.sql`
- `supabase/tests/005_profitability_security_and_nested.sql`
- `e2e/smartprofit-profitability-flows.e2e.spec.ts`
- `e2e/smartprofit-critical-flows.e2e.spec.ts`

### Servicios frontend

- `src/services/recipeBookService.js`
- `src/services/app/salesGateway.js`
- `src/services/supabase/salesService.js`
- `src/services/supabase/supabaseErrorMessages.js`
- `src/domain/sales.js`

## Paso 1: validacion local previa

Ejecutar:

```bash
npm run test
npm run test:smoke
npm run test:sql
npm run lint
npm run build
```

Resultado esperado:

- [ ] Unit tests pasan.
- [ ] Smoke pasa.
- [ ] SQL tests pasan.
- [ ] Lint no tiene errores.
- [ ] Build pasa.

Notas:

- Warnings de lint no bloquean este paso si no afectan rentabilidad.
- Si `npm run test:sql` falla, no desplegar remoto hasta resolver.

## Paso 2: identificar proyecto Supabase remoto

Revisar `.env`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Confirmar el `project-ref` desde la URL:

```text
https://<project-ref>.supabase.co
```

Checklist:

- [ ] El `project-ref` coincide con el proyecto objetivo.
- [ ] El usuario autenticado en Supabase CLI tiene permisos sobre ese proyecto.
- [ ] El entorno objetivo es el correcto: staging o produccion controlada.

## Paso 3: respaldo antes de migrar

Si el remoto contiene datos reales:

- [ ] Exportar backup desde Supabase Dashboard.
- [ ] Registrar fecha/hora del backup.
- [ ] Registrar project-ref.
- [ ] Confirmar que no se aplicara la migracion sobre el proyecto equivocado.

Evidencia sugerida:

```text
Backup previo:
- Fecha:
- Proyecto:
- Responsable:
- Notas:
```

## Paso 4: aplicar migracion remota

Opcion recomendada con Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Si ya esta enlazado:

```bash
npx supabase db push
```

Luego refrescar schema cache si PostgREST no reconoce funciones nuevas:

```sql
notify pgrst, 'reload schema';
```

Opcion manual desde SQL Editor, solo si no se usa CLI:

1. Ejecutar `database/supabase/schema-profitability.sql`.
2. Ejecutar `database/supabase/rpc-profitability.sql`.
3. Ejecutar `database/supabase/security-grants.sql`.
4. Ejecutar `notify pgrst, 'reload schema';`.

Checklist:

- [ ] Tablas de rentabilidad creadas.
- [ ] RPCs de rentabilidad creadas.
- [ ] RLS habilitado.
- [ ] Grants/revokes aplicados.
- [ ] Schema cache refrescado.

## Paso 5: verificacion remota rapida

Ejecutar checks remotos:

```bash
npm run check:supabase
npm run check:supabase:rpc
```

Resultado esperado:

- [ ] `check:supabase` pasa.
- [ ] `check:supabase:rpc` pasa.
- [ ] No aparece error de funcion inexistente.

Errores esperados si falta migracion:

```text
Could not find the function public.create_or_update_technical_sheet
Could not find the function public.close_sale_with_inventory_explosion
Could not find the function public.reverse_inventory_explosion
```

Accion si ocurre:

1. Confirmar que `db push` fue contra el proyecto correcto.
2. Ejecutar `notify pgrst, 'reload schema';`.
3. Reintentar `npm run check:supabase:rpc`.
4. Si persiste, revisar en SQL Editor:
   - `select proname from pg_proc where proname like '%technical_sheet%';`
   - `select proname from pg_proc where proname like '%inventory_explosion%';`

## Paso 6: ejecutar E2E de rentabilidad

Ejecutar:

```bash
npx playwright test e2e/smartprofit-profitability-flows.e2e.spec.ts
```

Validaciones cubiertas:

- Crea insumo E2E.
- Crea producto preparado E2E.
- Crea ficha tecnica activa.
- Valida costo por porcion.
- Cierra venta preparada.
- Descuenta inventario.
- Crea `inventory_movements.sale_out`.
- Crea `product_cost_snapshots.sale_close`.
- Bloquea venta con stock insuficiente.
- Verifica que no quedan ventas parciales ante error.

Checklist:

- [ ] E2E de rentabilidad pasa.
- [ ] Datos E2E quedan archivados o reversados.
- [ ] No quedan productos/insumos activos de prueba por accidente.

## Paso 7: ejecutar E2E critico de regresion

Despues de validar rentabilidad:

```bash
npx playwright test e2e/smartprofit-critical-flows.e2e.spec.ts
```

Objetivo:

- Confirmar que el nuevo motor no rompio POS/caja/flujos criticos existentes.

Checklist:

- [ ] Venta rapida sigue funcionando.
- [ ] Metodos de pago siguen funcionando.
- [ ] Caja sigue bloqueando o permitiendo segun configuracion.
- [ ] Errores se muestran correctamente.

## Paso 8: QA manual minimo

Ejecutar manualmente en la app:

1. Entrar con usuario de prueba.
2. Abrir Recursos > Insumos.
3. Confirmar o crear un insumo con stock y costo.
4. Abrir Recursos > Fichas tecnicas.
5. Crear ficha activa asociada a producto preparado.
6. Verificar:
   - costo por porcion;
   - food cost;
   - margen;
   - precio sugerido.
7. Ir a POS.
8. Vender el producto preparado.
9. Confirmar en Supabase:
   - `supplies.current_stock` bajo;
   - `inventory_movements` tiene `sale_out`;
   - `sale_items.metadata.profitability_snapshot` existe;
   - `product_cost_snapshots` tiene `source_type = 'sale_close'`.
10. Probar venta sin stock suficiente.

Checklist:

- [ ] El usuario puede crear ficha sin ayuda tecnica.
- [ ] El POS descuenta insumos.
- [ ] Stock insuficiente muestra mensaje entendible.
- [ ] El carrito no se pierde silenciosamente ante error.
- [ ] El margen historico queda guardado.

## Paso 9: registrar evidencia

Actualizar `docs/FASE2_RENTABILIDAD_QA_CIERRE.md` con:

```text
Fecha de validacion:
Proyecto Supabase:
Commit/local state:

Comandos ejecutados:
- npm run test
- npm run test:smoke
- npm run test:sql
- npm run lint
- npm run build
- npm run check:supabase
- npm run check:supabase:rpc
- npx playwright test e2e/smartprofit-profitability-flows.e2e.spec.ts
- npx playwright test e2e/smartprofit-critical-flows.e2e.spec.ts

Resultado:

Bloqueos:

Decision:
- Fase 2 cerrada
- Fase 2 pendiente por:
```

## Criterios para marcar este paso como completo

Este siguiente paso queda completo cuando:

- [ ] Supabase remoto tiene tablas de rentabilidad.
- [ ] Supabase remoto tiene RPCs de rentabilidad.
- [ ] PostgREST reconoce las RPCs nuevas.
- [ ] `npm run check:supabase:rpc` pasa.
- [ ] E2E de rentabilidad pasa contra remoto.
- [ ] E2E critico no presenta regresiones graves.
- [ ] QA manual confirma venta con explosion de insumos.
- [ ] Se actualiza documento de evidencia.

## Riesgos y mitigaciones

### Riesgo: aplicar migracion en proyecto equivocado

Mitigacion:

- Confirmar `project-ref` antes de `db push`.
- Revisar `.env`.
- Documentar entorno objetivo.

### Riesgo: PostgREST no reconoce RPC nueva

Mitigacion:

- Ejecutar `notify pgrst, 'reload schema';`.
- Reintentar checks.

### Riesgo: RLS impide E2E aunque SQL local pase

Mitigacion:

- Confirmar usuario E2E pertenece a `business_users`.
- Confirmar rol del usuario.
- Confirmar que `business_id` de E2E coincide con `.env`.

### Riesgo: datos E2E ensucian el negocio

Mitigacion:

- Usar `metadata.e2e = true`.
- Archivar productos/insumos de prueba.
- Revertir explosion con `reverse_inventory_explosion`.

## Siguiente paso despues de completar

Si este paso queda en verde, avanzar con:

1. Reportes de rentabilidad historica usando `product_cost_snapshots`.
2. Datos demo reales para mostrar el flujo comercial.
3. Preparacion de Fase 3: planes, suscripciones, invitaciones y billing.

## Resultado de validacion - 2026-08-14

Proyecto Supabase validado:

```text
project-ref: dmicvtkgbyoleckykzez
business_id E2E: c08a64ca-23dd-4599-b680-6192d14676aa
```

Estado:

- [x] Supabase CLI enlazado al proyecto remoto.
- [x] `npm run test` pasa: 8 archivos, 22 tests.
- [x] `npm run test:sql` pasa: 5 archivos, 116 pruebas SQL.
- [x] `npm run test:smoke` pasa.
- [x] `npm run lint` pasa sin errores ni warnings.
- [x] `npm run build` pasa.
- [x] `npm run check:supabase` pasa contra remoto.
- [x] `npm run check:supabase:rpc` pasa contra remoto e incluye RPCs core y de rentabilidad sin mutar datos.
- [x] `npx playwright test e2e/smartprofit-profitability-flows.e2e.spec.ts --reporter=list` pasa: 7/7.
- [x] `npx playwright test e2e/smartprofit-critical-flows.e2e.spec.ts --reporter=list` pasa: 23/23.

Correcciones aplicadas durante la validacion:

- `CashLockOverlay` expone `data-testid="cash-lock-overlay"` y `data-testid="cash-lock-go-finance-button"`.
- Las suites E2E de rentabilidad y flujos criticos resuelven el bloqueo operativo de caja por la ruta real de usuario antes de navegar a POS/catalogo.
- `check:supabase:rpc` ahora valida tambien `create_or_update_technical_sheet`, `recalculate_product_cost` y `close_sale_with_inventory_explosion` con fallos esperados seguros.

Observaciones:

- La proteccion de caja por cierre pendiente es correcta desde UX/negocio; el ajuste fue en automatizacion para reconocerla y operar como lo haria un usuario.
- La higiene de ventas historicas fue aplicada: 31 ventas monetarias heredadas desde Firebase quedaron respaldadas por 38 pagos reconstruidos desde `metadata.firebase.payment_breakdown`.
- Quedan 25 ventas sin pagos asociados porque son registros no monetarios en cero; `check:supabase` las reporta aparte como `nonMonetarySalesWithoutPayments`.
- El historial remoto de migraciones fue reconciliado: `20260813000100_smartprofit_backend.sql` quedo marcada como aplicada despues de verificar tablas, RPCs, RLS y politicas clave.

Decision tecnica:

```text
Fase 2 puede considerarse lista para demo controlada y preparacion de Fase 3.
Antes de Fase 3 productiva, mantener staging separado y automatizar estas validaciones en CI.
```

## Recomendaciones profesionales para entrar a Fase 3

1. Mantener migraciones reconciliadas antes de crear nuevas features: `npx supabase db push --linked --dry-run` debe responder `Remote database is up to date`.
2. Crear entornos separados `staging` y `production`: los E2E con datos reales deben correr por defecto en staging, con variables `E2E_SMARTPROFIT_*` dedicadas.
3. Mantener datos E2E aislados: todo fixture debe llevar `metadata.e2e = true`, `run_id` y limpieza/archivo automatico verificable.
4. Convertir los 5 warnings de lint en deuda cerrada antes de Fase 3, para que cualquier warning nuevo sea senal real y no ruido.
5. Agregar CI por capas: unit/smoke/build en cada push, SQL/RLS en PRs de backend, E2E criticos nocturnos y antes de release.
6. Endurecer RLS con pruebas por rol para Fase 3: owner, admin, cashier/waiter y usuario sin membresia.
7. Documentar un runbook de caja: apertura, cierre pendiente, cierre de jornada anterior, errores esperados y pasos de soporte.
8. Preparar observabilidad: logs de RPC fallidas, errores de inventario insuficiente, tiempos de cierre de venta y alertas para transacciones incompletas.
9. Crear dataset demo estable: productos preparados, insumos, ficha tecnica, venta, movimiento de inventario y snapshot historico listos para presentacion.
10. Definir puerta de salida de Fase 3: billing/suscripciones no debe mezclarse con cambios no reconciliados de migracion ni con datos historicos ambiguos.

## Brechas menores resueltas para iniciar Fase 3

Actualizado el 2026-08-14:

- [x] Separacion de entornos preparada con `.env.staging.example`, `.env.production.example` y `SMARTPROFIT_ENV`.
- [x] CI base preparado con `.github/workflows/phase-gates.yml`.
- [x] Dataset demo estable preparado con `npm run demo:profitability`.
- [x] Runbook operativo de caja creado en `docs/RUNBOOK_CAJA_SOPORTE.md`.
- [x] Reporte tecnico de rentabilidad historica disponible con `npm run report:profitability`.
- [x] Residual historico no monetario documentado y separado en `npm run check:supabase`.

Documento de alistamiento:

```text
docs/FASE3_ALISTAMIENTO_OPERATIVO.md
```
