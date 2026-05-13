# SmartProfit - Bloque 1 base critica

Fecha: 2026-05-13

## Diagnostico del uso actual

- `sales` ya existe como modelo transaccional nuevo del POS. Se crea desde `posFinancialService` con estado de pago, totales, caja activa y estado de impacto de inventario.
- `saleItems` registra las lineas vendidas por `sale_id`; es la fuente adecuada para recomponer costo e inventario por venta.
- `payments` registra los pagos reales; los medios de credito quedan pendientes y no deben contarse como caja recibida.
- `cashMovements` registra lo que afecta caja fisica/digital por pago, abonos, compras y ajustes.
- `inventoryMovements` existe para compras y ya tenia salida por venta, pero el impacto se ejecutaba despues de confirmar la venta en otra transaccion.
- `accountsReceivable` y `accountsPayable` son las fuentes nuevas de cartera y obligaciones.
- `sales_history` sigue activo para dashboard, cierres de caja, abonos legacy y ticketeras. No se elimina en esta fase.

## Contrato canonico

- `sales`: fuente principal de ventas. Totales, estado de pago, estado de anulacion, caja asociada e `inventoryImpactStatus`.
- `saleItems`: detalle atomico de productos vendidos, cantidades, precio unitario y ficha tecnica vinculada.
- `payments`: pagos reales y su estado. No reemplaza a `sales`, solo explica recaudo.
- `cashMovements`: movimientos que afectaron caja. Debe alimentar caja y cierres.
- `inventoryMovements`: entradas, salidas, ajustes y reversos trazables por `business_id`, `source_type`, `source_id` y `sale_id`/`purchase_id`.
- `accountsReceivable`: saldo pendiente por ventas a credito.
- `accountsPayable`: saldo pendiente por compras a credito.
- `sales_history`: lectura legacy temporal y compatibilidad con cierres/reportes existentes.

## Transicion segura

1. Mantener escritura dual en venta POS: canonico + `sales_history`.
2. Migrar reportes y cierres gradualmente para leer `sales`, `payments`, `cashMovements` y cartera.
3. Bloquear edicion directa de totales historicos en reglas.
4. Mantener `sales_history` como compatibilidad hasta que Caja, Finanzas y cierres no dependan de el.
5. Agregar migracion futura para reconstruir `saleItems/payments/cashMovements` desde legacy si hay ventas antiguas sin modelo canonico.

## Cambios aplicados

- `src/services/inventoryService.js`: nuevo servicio central con `applySaleInventoryImpact(saleId)` y `reverseSaleInventoryImpact(saleId)`.
- `src/services/financeService.js`: cierre POS ahora llama al servicio idempotente y marca `inventoryImpactStatus: failed` si el impacto falla.
- `firestore.rules`: reglas mas estrictas por negocio, rol owner/admin para deletes, movimientos append-only y bloqueo de campos criticos.
- `src/services/workspaceService.js`: reset exige rol owner/admin, frase `REINICIAR`, cubre colecciones nuevas y registra auditoria.
- `src/components/AccountSettings.jsx` y `src/app/AppShell.jsx`: pasan actor/rol/frase al reset.
- `package.json`, `eslint.config.js`, `scripts/smoke.mjs`, tests en `src/utils`: scripts `lint`, `test`, `test:smoke`.

## Operaciones destructivas encontradas

- Reset de workspace: riesgo alto. Reforzado con rol, frase, contrasena existente en UI y auditoria.
- Deletes directos de datos operativos: riesgo medio/alto. Como el reset aun corre desde cliente, las reglas permiten borrado solo a owner/admin para colecciones reiniciables; la UI exige contrasena y frase fuerte.
- Anulacion de compras y consumos de tiquetera: riesgo medio. Ya piden motivo y dejan trazabilidad.
- Reverso de movimiento de caja: riesgo medio. Es no destructivo y registra auditoria.
- Edicion de `sales_history`: riesgo alto por totales legacy. Reglas bloquean edicion directa de total/metodo de pago.

## Pruebas manuales necesarias

1. Abrir caja, registrar venta con producto simple y confirmar que `sales`, `saleItems`, `payments`, `cashMovements` e `inventoryMovements` se crean.
2. Reintentar `applySaleInventoryImpact(saleId)` y verificar que no descuente doble.
3. Registrar venta con ficha tecnica y verificar descuento de insumos.
4. Registrar venta sin impacto de inventario y verificar `inventoryImpactStatus: not_applicable`.
5. Anular/reversar una venta en flujo administrativo futuro y validar `reverseSaleInventoryImpact`.
6. Cerrar caja con ventas legacy y nuevas.
7. Probar reset con rol no admin, frase incorrecta y frase correcta.
8. Probar que reglas bloqueen edicion directa de totales en `sales` y `sales_history`.

## Riesgos pendientes

- El cierre POS todavia confirma venta/caja y luego aplica inventario en una transaccion separada. Ahora es idempotente y queda marcado como `failed`, pero una Cloud Function o backend transaccional seria el cierre ideal.
- `cashClosingService` todavia depende fuerte de `sales_history`.
- Ticketeras escriben ventas en `sales_history`; deben migrarse a `sales/payments` en una fase controlada.
- Las reglas nuevas pueden bloquear pantallas legacy que intenten editar totales. Es intencional, pero debe validarse en QA manual.
- El reset deberia moverse a Cloud Function para que las reglas puedan volver a bloquear deletes directos en ventas, pagos, caja e inventario.
