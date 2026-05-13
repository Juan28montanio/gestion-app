# SmartProfit

La documentacion principal fue actualizada en [README.md](README.md).

Este archivo queda como referencia historica del MVP inicial.

# MVP Restaurante SPA

## Estructura sugerida

```text
src/
  components/
    AdminDashboard.js
    POSOrder.js
    TableView.js
  context/
    CartContext.jsx
  firebase/
    firebaseConfig.js
  services/
    financeService.js
    orderService.js
    productService.js
    tableService.js
  App.js
  main.jsx
  index.css
firestore.rules
```

## Dependencias

```bash
npm install firebase react react-dom
npm install -D tailwindcss postcss autoprefixer
```

## Modelo de datos recomendado

### `products`

```json
{
  "business_id": "demo_restaurant_business",
  "name": "Hamburguesa Doble",
  "price": 28000,
  "category": "Comidas"
}
```

### `tables`

```json
{
  "business_id": "demo_restaurant_business",
  "number": 1,
  "status": "free",
  "seats": 4,
  "active_order_id": null
}
```

### `orders`

```json
{
  "business_id": "demo_restaurant_business",
  "table_id": "TABLE_DOC_ID",
  "status": "open",
  "items": [],
  "total": 0,
  "createdAt": "serverTimestamp"
}
```

### `sales_history`

```json
{
  "business_id": "demo_restaurant_business",
  "orderId": "ORDER_DOC_ID",
  "total": 56000,
  "method": "cash",
  "date": "serverTimestamp"
}
```

## Notas de implementación

- Todos los módulos consumen servicios de Firebase separados de la UI.
- La actualización de mesas y órdenes usa `onSnapshot` para tiempo real.
- Las reglas asumen que el usuario autenticado tiene `business_id` como custom claim.
- Para producción conviene agregar índices compuestos para las consultas de `orders` y `sales_history`.
