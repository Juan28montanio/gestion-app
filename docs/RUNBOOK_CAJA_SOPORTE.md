# Runbook de caja y soporte

## Objetivo

Estandarizar soporte operativo para caja antes de Fase 3, donde habra multiples negocios, roles, planes y posibles bloqueos por suscripcion.

## Estados principales

### Caja sin abrir

Sintomas:

- POS puede mostrar que la caja no esta operativa.
- Algunas operaciones financieras quedan bloqueadas.

Accion:

1. Ir a `Caja`.
2. Confirmar usuario y negocio activo.
3. Abrir caja con monto base real.
4. Registrar nota si la apertura es correctiva.

### Caja abierta del dia actual

Sintomas:

- POS y ventas operan normalmente.
- Modulo caja muestra metricas de ventas, efectivo esperado y pagos digitales.

Accion:

1. Operar ventas normalmente.
2. Evitar cierres manuales desde base de datos.
3. Si hay diferencia, registrar observacion al cerrar.

### Cierre pendiente de jornada anterior

Sintomas:

- Aparece overlay `Cierre pendiente`.
- La app bloquea navegacion normal hacia POS/catalogo.
- El boton lleva a `Ir a caja y finanzas`.

Accion:

1. Usar el boton del overlay.
2. Revisar ventas, pagos y movimientos.
3. Cerrar caja con conteo real.
4. Documentar diferencia si existe.
5. Volver al modulo operativo.

Notas tecnicas:

- El overlay tiene `data-testid="cash-lock-overlay"`.
- La accion principal tiene `data-testid="cash-lock-go-finance-button"`.
- Los E2E deben resolver este estado como usuario real, no forzar clicks debajo del overlay.

## Errores comunes

### `Open cash session not found for sale`

Causa probable:

- Se intento cerrar una venta sin caja abierta.

Accion:

1. Confirmar estado de caja.
2. Abrir caja si corresponde.
3. Reintentar venta.
4. Si la venta quedo parcial, revisar `sales`, `payments`, `sale_items` y `cash_movements`.

### Diferencia de efectivo al cierre

Causa probable:

- Pago registrado en metodo incorrecto.
- Conteo fisico diferente al esperado.
- Venta historica migrada sin pago asociado.

Accion:

1. Ejecutar `npm run check:supabase`.
2. Revisar `payments` por metodo.
3. Comparar contra movimientos de caja.
4. Registrar diferencia en notas del cierre.
5. No editar ventas historicas sin evidencia.

### Venta preparada bloqueada por stock

Causa probable:

- Insumo de ficha tecnica sin stock suficiente.

Accion:

1. Revisar ficha tecnica del producto.
2. Revisar insumos y stock actual.
3. Registrar compra o ajuste de inventario.
4. Reintentar venta.

## Consultas de soporte sugeridas

Ventas monetarias sin pagos:

```sql
select id, total, paid_amount, pending_amount, payment_status, created_at
from public.sales s
where payment_status = 'paid'
  and total > 0
  and not exists (
    select 1 from public.payments p where p.sale_id = s.id
  );
```

Movimientos sin pago asociado:

```sql
select id, sale_id, payment_id, amount, created_at
from public.cash_movements
where payment_id is not null
  and not exists (
    select 1 from public.payments p where p.id = cash_movements.payment_id
  );
```

Snapshots de rentabilidad por venta:

```sql
select product_name, sale_price, unit_cost, gross_margin, gross_margin_percent, created_at
from public.product_cost_snapshots
where source_type = 'sale_close'
order by created_at desc
limit 50;
```

## Escalamiento

Escalar a soporte tecnico cuando:

- `unusualSalesWithoutPayments` sea mayor que 0.
- `paymentsWithoutSale` sea mayor que 0.
- `movementsWithoutPayment` sea mayor que 0.
- una RPC critica falle con error no contemplado.
- haya sospecha de RLS mostrando datos entre negocios.

## Checklist antes de soporte a cliente SaaS

- [ ] Usuario pertenece al negocio correcto.
- [ ] Rol del usuario permite la accion.
- [ ] Caja esta abierta o cerrada segun el flujo.
- [ ] No hay cierre pendiente anterior.
- [ ] `npm run check:supabase` pasa.
- [ ] `npm run check:supabase:rpc` pasa.

