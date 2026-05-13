# SmartProfit - Bloque 2 producto vendible

Fecha: 2026-05-13

## Decision sobre riesgos antes de avanzar

Se resolvieron dos riesgos antes de redisenar Caja y Finanzas:

- Caja/Finanzas ya no dependen exclusivamente de `sales_history`; ahora leen un ledger canonico construido desde `sales`, `saleItems` y `payments`, con fallback legacy.
- El cierre de caja usa el mismo ledger canonico para calcular ventas del turno y evita duplicar documentos legacy cuando existe `sales`.

No se movio inventario a Cloud Function en esta fase porque requiere backend/proceso de despliegue adicional. El servicio idempotente queda como mitigacion suficiente para avanzar a UX, con recomendacion de backend antes de beta abierta.

## Caja

Nueva jerarquia aplicada:

1. Estado del turno: caja abierta/cerrada, cajero, hora de apertura y base.
2. Acciones claras: registrar egreso, abrir/cerrar caja.
3. Resumen ejecutivo: ventas del turno, efectivo esperado, pagos digitales y cartera pendiente.
4. Alertas accionables: diferencias, caja bloqueada, cartera y turno largo.
5. Metodos de pago como lectura secundaria.
6. Movimientos e historial quedan en tabs secundarios.

Antes: la vista mezclaba dashboard historico, caja actual, cierres y cuentas por cobrar en la misma lectura.

Despues: el dueno puede responder rapido cuanto vendio, cuanto entro, cuanto deberia tener y que debe hacer ahora.

## Finanzas

Nueva jerarquia aplicada:

- Abre en `Resumen ejecutivo`.
- Separa rentabilidad, ingresos, gastos, por cobrar y por pagar.
- Mantiene cartera, proveedores y gastos como tabs secundarios.
- Evita competir visualmente con Caja: Caja habla de turno y efectivo; Finanzas habla de utilidad y obligaciones.

## Recursos / Productos / Fichas

Mapa actual:

- `ProductManager.jsx` conserva estado compartido y modales.
- `ResourceSectionRouter.jsx` enruta proveedores, compras y fichas.
- Inventario y catalogo ya estaban en paneles dedicados.

Primera extraccion segura:

- `CatalogWorkspace`
- `InventoryWorkspace`
- `PurchaseWorkspace`
- `CostingWorkspace`

Estos wrappers no cambian comportamiento; crean limites de intencion para futuras extracciones sin reescritura riesgosa.

## Onboarding hasta primera venta

Se agrego `OnboardingChecklist` visible por negocio:

- Negocio creado.
- Medio de pago listo.
- Mesa o venta rapida.
- Primer producto.
- Caja abierta.
- Primera venta registrada.
- Primer cierre.

El progreso se guarda en `onboardingProgress/{businessId}` y se calcula con senales reales de Firestore.

## Demo data controlada

Se agrego `demoDataService` con:

- `seedDemoData(businessId, actor)`
- `cleanupDemoData(businessId)`

Los documentos demo incluyen `is_demo: true` y `demo_batch_id`, y pueden limpiarse sin tocar datos reales.

Datos incluidos:

- proveedor,
- insumo,
- producto rentable,
- compra,
- venta,
- pago,
- caja abierta,
- movimiento de caja,
- movimiento de inventario.

## Pendientes

- Reset y demo seed/cleanup fueron movidos a Cloud Functions en el Bloque 3; mantener esa ruta privilegiada.
- Migrar ticketeras para crear `sales/payments` canonicos, no solo `sales_history`.
- Extraer logica de estado de `ProductManager.jsx` en una fase posterior.
- Verificar visualmente Caja/Finanzas con datos reales o demo en navegador autenticado.
