# Plan de lanzamiento con Supabase

## Estado operativo actual

- Autenticacion, negocio activo y RLS funcionan sobre Supabase.
- Catalogo, clientes, POS, caja y ventas ya usan Supabase como ruta principal.
- Cierre de caja usa RPC y calcula efectivo esperado por sesion.
- Salon cuenta con modelo operacional Supabase para mesas, sesiones, eventos y cocina.
- Firebase/Firestore ya no es dependencia operativa del frontend.

## Bloque minimo antes de cobrar mensualidad

1. Aplicar parches SQL pendientes en Supabase:
   - `database/supabase/patch-close-cash-session-cash-only.sql`
   - `database/supabase/patch-settle-sale-debt.sql`
2. Validar:
   - `npm run check:supabase`
   - `npm run check:supabase:rpc`
   - `npm run test`
   - `npm run build`
3. Probar manualmente con `katteryneramos@gmail.com`:
   - login
   - apertura de caja
   - venta en efectivo
   - venta con abono parcial
   - cobro de cartera
   - cierre de caja con efectivo contado
   - uso de salon hasta generar venta/cobro

## Siguientes bloques de producto

1. Cuentas por pagar y compras:
   - tablas/RPC para compras, pagos a proveedores y reversas.
   - impacto de caja por egresos.
2. Inventario:
   - compras como entradas.
   - ventas como salidas.
   - reversas auditadas.
3. Tiqueteras:
   - planes, ventas, consumo y vencimiento.
   - auditoria por cliente.
4. Recetas y costeo:
   - fichas tecnicas.
   - costo real por producto.
   - margen estimado.
5. Multiempresa comercial:
   - onboarding de negocio.
   - invitacion de usuarios.
   - roles completos.
6. Suscripcion:
   - tabla `subscriptions`.
   - bloqueo por estado de pago.
   - integracion de pagos cuando el producto ya este validado.

## Criterios de lanzamiento

- No hay llamadas a Firestore/Firebase en runtime.
- RLS anonimo no lee datos de negocio.
- Todas las escrituras criticas pasan por RPC.
- Las acciones bloqueadas muestran mensajes claros y no rompen la app.
- Vercel tiene variables Supabase configuradas para produccion.
- Existe respaldo/exportacion de datos antes de cada parche SQL relevante.
