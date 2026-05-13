# SmartProfit

SmartProfit es un SaaS operativo para restaurantes, cafes y negocios de comida. La narrativa del producto es simple: vende, controla caja y entiende tu utilidad diaria.

## Stack real

- React 19 + Vite 6
- Firebase Auth
- Firestore
- Firebase Storage
- Firebase Hosting
- Firebase Cloud Functions v2 para operaciones privilegiadas
- Tailwind CSS
- Vitest y ESLint

## Instalacion

```bash
npm install
npm --prefix functions install
```

Crea `.env` a partir de `.env.example`:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run test:smoke
npm run functions:lint
npm run build
npm run preview
```

## Firebase

Verificar reglas:

```bash
npx firebase-tools deploy --only firestore:rules --dry-run
```

Desplegar reglas y Functions:

```bash
npx firebase-tools deploy --only firestore:rules,functions
```

Cloud Functions v2 requiere facturacion activa y APIs habilitadas (`cloudfunctions`, `cloudbuild`, `artifactregistry`). Si el deploy falla por billing, las funciones privilegiadas quedan pendientes de despliegue aunque el codigo compile.

Desplegar Hosting:

```bash
npm run build
npx firebase-tools deploy --only hosting
```

## Modelo canonico

- `sales`: fuente principal de ventas.
- `saleItems`: items vendidos por venta.
- `payments`: pagos reales y su estado.
- `cashMovements`: movimientos que afectaron caja.
- `inventoryMovements`: entradas, salidas, ajustes y reversos.
- `accountsReceivable`: cartera de clientes.
- `accountsPayable`: obligaciones con proveedores.
- `sales_history`: compatibilidad temporal legacy.

El servicio `salesLedgerService` arma la lectura operativa desde el modelo canonico y conserva fallback legacy para evitar perdida de datos historicos.

## Operaciones protegidas

Estas operaciones corren por Cloud Functions con Firebase Admin:

- `resetBusinessWorkspace`
- `seedDemoData`
- `cleanupDemoData`

El cliente no necesita permisos de borrado sobre ventas, pagos, caja, inventario, cierres ni cartera. Las reglas deben permanecer estrictas; no relajar deletes para resolver problemas de reset o demo.

## Flujo de demo comercial

1. En Cuenta > Soporte, usar "Empezar con datos de ejemplo".
2. Abrir Guia de uso > Demo guiada de 10 minutos.
3. Mostrar Caja: estado del turno, efectivo esperado, pagos digitales y alertas.
4. Mostrar POS: venta rapida.
5. Mostrar Insumos y costos: compra, inventario y costeo.
6. Mostrar Caja: cierre y diferencia.
7. Mostrar Finanzas: utilidad estimada, por cobrar, por pagar y decision sugerida.
8. En Cuenta > Soporte, usar "Limpiar solo datos demo" si se quiere volver a operar con datos reales.

## Mantenimiento

- No eliminar `sales_history` hasta que ticketeras y reportes legacy escriban tambien en `sales/payments`.
- No mover calculos criticos de caja a componentes UI.
- Cualquier anulacion o reverso debe registrar auditoria y movimiento inverso, no borrar datos historicos.
- Antes de avanzar a beta abierta, validar Functions en el proyecto Firebase real y probar una venta completa con reglas desplegadas.
