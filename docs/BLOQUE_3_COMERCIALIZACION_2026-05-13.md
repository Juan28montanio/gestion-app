# SmartProfit - Bloque 3 comercializacion

Fecha: 2026-05-13

## Demo guiada de 10 minutos

Ruta sugerida dentro del producto: Guia de uso > Demo guiada de 10 minutos.

1. Negocio demo y promesa: "vende, controla caja y entiende tu utilidad diaria".
2. Caja abierta: base inicial, cajero, efectivo esperado y acciones.
3. Venta rapida: items vendidos, pago real y movimiento de caja.
4. Compra de insumos: abastecimiento y costo conectado.
5. Costeo/margen: producto rentable o producto a ajustar.
6. Cierre de caja: efectivo esperado, contado y diferencia.
7. Finanzas: utilidad estimada, obligaciones y decision sugerida.

## Datos requeridos

La demo se puede preparar desde Cuenta > Soporte > "Empezar con datos de ejemplo".

Los datos demo quedan marcados con:

- `is_demo: true`
- `demo_batch_id`

La limpieza se realiza desde Cloud Function `cleanupDemoData`, no desde deletes directos del cliente.

## Puntos de venta comercial

- "No solo vendes: entiendes si la venta dejo utilidad".
- "Caja real separada de cartera y pagos digitales".
- "Compras e insumos explican margen".
- "El cierre deja diferencia y trazabilidad".
- "La demo se limpia sin tocar datos reales".

## Lenguaje ajustado

- Navegacion: `Recursos` pasa a `Insumos y costos`.
- Caja: se enfatiza dinero real, turno, efectivo esperado y diferencia.
- Finanzas: se enfatiza utilidad diaria, obligaciones, margen y decision.
- Guia de uso: incluye ruta comercial concreta.

## Seguridad comercial

Para demo/beta controlada, las operaciones destructivas relevantes corren por Cloud Functions:

- `resetBusinessWorkspace`
- `seedDemoData`
- `cleanupDemoData`

Firestore Rules vuelven a bloquear deletes directos sobre ventas, pagos, caja, inventario, cierres y cartera.

## Bloqueo de despliegue detectado

El codigo de Functions compila con `npm run functions:lint`, pero `firebase deploy --only functions --dry-run` intento habilitar APIs y fallo porque el proyecto `gestion-app-b1aae` no tiene una cuenta de facturacion abierta. Para completar el despliegue real hay que activar billing en Firebase/Google Cloud y repetir:

```bash
npx firebase-tools deploy --only firestore:rules,functions
```

## Pendientes para beta abierta

- Migrar ticketeras al modelo canonico `sales/payments`.
- Verificar demo autenticada con una cuenta real del proyecto Firebase.
- Agregar indices Firestore si el volumen crece.
- Crear backup/export antes de permitir reset en clientes reales.
