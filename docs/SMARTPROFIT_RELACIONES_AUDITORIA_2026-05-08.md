# Auditoria de relaciones SmartProfit/PACIFICA Control

Fecha: 2026-05-08

## 1. Mapa actual detectado

- Cuenta/configuracion: `accountService` centraliza usuarios, roles, permisos, metodos de pago, `businessSettings` y `auditLogs`. `POSOrder` ya se suscribe a metodos activos y reglas de caja.
- Catalogo/productos: `productService` normaliza productos, categorias, modificadores, combos, disponibilidad POS, ticketera y enlace a ficha tecnica.
- Salon/mesas: `TableManager` usa `subscribeToAvailableProducts`, `salonService`, `orderService`, `kitchenTickets` y envia la cuenta al POS. No crea ventas paralelas.
- POS/ventas: `POSOrder` cobra a traves de `orderService.requestPayment`, que delega en `financeService.closeOrderAndLogSale`.
- Pagos/caja/cartera: `posFinancialService` construye `sales`, `saleItems`, `payments`, `cashMovements` y `accountsReceivable`; `financeControlService` gestiona abonos de CxC/CxP.
- Ticketeras: `mealTicketService` separa venta de ticketera (`sales`, `sales_history`, saldo) del consumo (`ticketConsumptions`), evitando ingreso nuevo en el consumo.
- Compras/insumos/inventario: `purchaseService` confirma compras con `inventoryMovements`, actualiza stock/costos de `ingredients`, crea CxP o egreso de caja y refresca fichas.
- Fichas tecnicas: `recipeBookService` usa `recipeBooks` y `ingredients`; soporta componentes/fichas base y expande `ingredients` para consumo.
- Dashboard/BI: `AdminDashboard` y `dashboardHelpers` leen ventas historicas, compras, caja, CxC, CxP, movimientos y cierres.

## 2. Incoherencias encontradas

- El flujo POS ya creaba venta, pagos, caja y cartera, pero el inventario se descontaba despues en una segunda transaccion sin `inventoryMovements` de salida por venta.
- `sales` quedaba con `inventoryImpactStatus: pending` aunque el stock si se descontara, dejando BI/auditoria sin fuente confiable.
- El descuento de venta podia afectar stock directo de producto sin exigir modo valido. Se ajusto para impactar producto solo con `inventory.consumesInventory` y modo `direct_item` o `combo`.
- Caja usa `cashMovements` como fuente real, mientras algunas vistas siguen leyendo `sales_history` por compatibilidad historica. Riesgo de cifras duplicadas si un reporte suma ambas sin filtrar.
- `posFinance` mantiene una tabla estatica de metodos. La UI ya obedece `paymentMethods`, pero los servicios criticos todavia no reciben la configuracion activa para calcular `affectsCashRegister`.
- No existe script `lint`, asi que no hay barrera automatica de imports muertos o hooks/funciones huerfanas.

## 3. Riesgos de duplicidad

- Doble fuente de ventas: `sales` es el modelo transaccional nuevo; `sales_history` sigue como compatibilidad/dashboard.
- Doble ticketera: cliente mantiene saldo agregado y tambien existen `mealTickets`/`ticketConsumptions`; se debe tratar el saldo de cliente como cache operacional.
- Doble finanzas/caja: `financeService`, `cashClosingService`, `financeControlService` y `posFinancialService` comparten responsabilidad financiera. Mantener `posFinancialService` como constructor de documentos POS y mover abonos/cierres a servicios dedicados.
- Modulos antiguos de producto/receta aun conviven con paneles nuevos en `features/resources`; deben refactorizarse por etapas, no borrarse.

## 4. Servicios a centralizar

- Mantener `productService`, `purchaseService`, `mealTicketService`, `salonService`, `accountService`, `financeControlService` y `posFinancialService`.
- Extraer en siguiente fase un `inventoryService` para `sale_out`, ajustes, mermas, reversos y validacion de stock negativo.
- Extraer en siguiente fase un `settingsService` de lectura puntual para que transacciones criticas no dependan solo de suscripciones UI.
- Mantener `financeService.closeOrderAndLogSale` como orquestador temporal hasta crear un `saleService.confirmSale`.

## 5. Datos que no deben tocarse

- No borrar `sales_history`, `orders`, `customers`, `mealTickets`, `ticketConsumptions`, `purchases`, `ingredients`, `recipeBooks`, `cashMovements`, `accountsReceivable`, `accountsPayable`.
- No renombrar colecciones existentes.
- No migrar historicos sin script reversible.
- No alterar `business_id`/`businessId` ni `user_id`/`userId` historicos; usar adaptadores/normalizadores.

## 6. Plan de refactor seguro

1. Consolidar inventario por ventas con `inventoryMovements` y estado de impacto en `sales`. Hecho parcialmente en esta intervencion.
2. Crear `inventoryService` con funciones idempotentes `applyInventoryFromSale` y `reverseInventoryFromSale`.
3. Pasar configuracion real de metodos de pago a los servicios transaccionales o leerla dentro de transaccion por `businessId`.
4. Cambiar Dashboard/BI gradualmente para priorizar `sales`, `payments`, `cashMovements`, CxC/CxP e inventario por movimientos.
5. Agregar `lint` y pruebas smoke para compra, venta POS, ticketera, deuda, abono, cierre de caja.
6. Solo despues, retirar codigo legacy confirmado como no referenciado.

## 7. Correccion aplicada

- `financeService.handleStockReduction` ahora genera `inventoryMovements` de tipo `sale_out` con `sourceType/sourceId`, `saleId`, `orderId`, item, cantidad, unidad, costo y stock antes/despues.
- `closeOrderAndLogSale` pasa el `saleId` creado al impacto de inventario.
- La venta en `sales` queda marcada como `inventoryImpactStatus: applied` si hubo movimientos o `not_applicable` si no habia impacto.
- El descuento directo de producto solo ocurre cuando el producto declara consumo de inventario y modo valido.

## 8. Riesgos pendientes

- El impacto de inventario de venta sigue ocurriendo en una segunda transaccion despues de confirmar venta/caja. Falta moverlo a un `inventoryService` idempotente o a una transaccion compuesta por caso de uso.
- Falta reverso de inventario/caja/ticketera para anulacion completa de venta.
- Falta validar `allowNegativeStock` desde `businessSettings` en servicios, no solo en UI.
- Falta que servicios financieros usen metodos de pago configurados, no solo la tabla estatica de `posFinance`.
- Falta automatizar pruebas manuales obligatorias con datos seed o emulador Firestore.

## 9. Verificacion

- `npm run build`: correcto.
- `npm run lint`: no ejecutable; el proyecto no define script `lint` en `package.json`.
