# Fase 2 - Ruta de implementacion del motor de rentabilidad

## Objetivo de la fase

Completar la Fase 2 del roadmap SaaS SmartProfit: fichas tecnicas persistentes, costeo real, snapshots historicos de margen y explosion de insumos al cerrar ventas.

El proyecto ya tiene una base importante implementada:

- Tablas de rentabilidad en `database/supabase/schema-profitability.sql`.
- RPCs de rentabilidad en `database/supabase/rpc-profitability.sql`.
- Servicio `recipeBookService` conectado a Supabase.
- POS conectado al cierre transaccional `close_sale_with_inventory_explosion`.
- Pruebas unitarias y smoke.
- Prueba SQL del motor de rentabilidad en `supabase/tests/004_profitability_engine.sql`.

La fase no debe considerarse terminada hasta que el flujo completo este verificado desde UI, SQL, servicios y reportes.

## Estado actual estimado

Avance aproximado: 82%.

Implementado:

- Persistencia de fichas tecnicas.
- Versionado de fichas activas.
- Calculo backend de costeo.
- Actualizacion de costo del producto preparado.
- Cierre de venta con explosion de insumos.
- Snapshot historico en venta.
- Reversa de explosion de inventario.
- Prueba SQL de flujo feliz, reversa y stock insuficiente.

Pendiente principal:

- Desplegar en Supabase remoto las RPCs/tablas de rentabilidad ya presentes en la migracion local.
- Validar flujo completo desde UI real.
- Endurecer permisos por rol en backend/RLS/RPC.
- Mejorar UX de errores de stock y diagnostico de margen.
- Consolidar reportes de rentabilidad usando snapshots reales.
- Documentar operacion, limites y politica de datos.

## Orden recomendado de ejecucion

1. QA tecnico del backend de rentabilidad.
2. Integracion UI completa de fichas tecnicas.
3. Flujo POS end-to-end con descuento de insumos.
4. Reportes de margen y alertas.
5. Seguridad y permisos.
6. E2E, SQL tests y documentacion final.

## Area 1: Backend Supabase/PostgreSQL

### Objetivo

Dejar el motor transaccional estable, seguro y auditable.

### Tareas

- [ ] Revisar `schema-profitability.sql` contra el modelo final de Fase 2.
- [ ] Confirmar que las tablas tengan indices suficientes por:
  - `business_id`
  - `product_id`
  - `technical_sheet_id`
  - `technical_sheet_version_id`
  - `sale_id`
  - `sale_item_id`
  - `created_at`
- [ ] Revisar `rpc-profitability.sql` para asegurar atomicidad en:
  - creacion/edicion de ficha tecnica
  - activacion de version
  - cierre de venta con explosion
  - reversa de explosion
- [ ] Validar que `close_sale_with_inventory_explosion` no deje ventas parciales si falla stock.
- [ ] Agregar o confirmar pruebas para receta con merma.
- [ ] Agregar o confirmar pruebas para venta de varias unidades del mismo producto preparado.
- [ ] Agregar o confirmar pruebas para venta mixta:
  - producto directo
  - producto con ficha tecnica
  - producto sin impacto de inventario
- [ ] Revisar soporte de `source_type = 'technical_sheet'` para fichas base dentro de fichas finales.
- [ ] Definir si Fase 2 soportara fichas anidadas en produccion o solo quedaran preparadas para una Fase 2.1.
- [ ] Confirmar que `product_cost_snapshots` guarde datos suficientes para reportes sin depender del payload del frontend.
- [ ] Agregar grants/revokes faltantes si se crean nuevas funciones auxiliares.
- [ ] Regenerar o sincronizar migracion local en `supabase/migrations` si cambian SQL fuente.

### Criterios de salida

- `npm run test:sql` pasa con el motor de rentabilidad.
- `npm run check:backend` pasa o documenta bloqueos externos.
- La venta con stock insuficiente revierte toda la transaccion.
- Los snapshots historicos quedan completos por venta/item.

## Area 2: Servicios frontend y dominio

### Objetivo

Asegurar que la UI use las RPCs correctas y que los payloads no pierdan informacion de rentabilidad.

### Tareas

- [x] Revisar `src/services/recipeBookService.js` con flujo real:
  - listar fichas
  - crear ficha
  - editar ficha
  - desactivar ficha
  - recalcular costos por insumo
- [x] Validar que `createRecipeBook` envie siempre:
  - `business_id`
  - `product_id`
  - `yield_data`
  - `components`
  - `costing`
  - `status`
- [x] Validar que cada componente envie:
  - `sourceType`
  - `sourceId`
  - `quantity`
  - `unit`
  - `unitCost`
  - `wastePercent`
- [x] Revisar `src/domain/sales.js` para confirmar que el payload de venta conserva `product_id`, cantidad, precio y datos de ficha si existen.
- [x] Revisar `src/services/app/salesGateway.js` y confirmar que todo cobro POS pasa por `closePosSale`.
- [x] Evitar rutas antiguas que llamen `close_sale` cuando corresponde usar `close_sale_with_inventory_explosion`.
- [x] Normalizar errores de Supabase/PostgREST a mensajes de negocio:
  - stock insuficiente
  - ficha tecnica sin componentes
  - insumo inexistente
  - caja no abierta
  - producto sin ficha activa
- [x] Agregar tests unitarios para mapeo de payload de ficha tecnica.
- [x] Agregar tests unitarios para mapeo de payload de venta preparada.

### Criterios de salida

- Crear/editar ficha desde UI impacta Supabase.
- Vender producto preparado desde POS llama la RPC de explosion.
- Errores tecnicos no aparecen crudos al usuario.
- No existe fallback silencioso que omita inventario.

## Area 3: Frontend UX - Fichas tecnicas

### Objetivo

Hacer que el modulo de fichas tecnicas sea usable por un restaurante real.

### Tareas

- [x] Revisar `RecipeBookManager` y `RecipeBookEditorModal` con datos reales de Supabase.
- [x] Confirmar que el editor permite:
  - seleccionar producto del catalogo
  - seleccionar insumos
  - definir cantidad
  - definir unidad
  - definir merma
  - definir rendimiento/porciones
  - ver costo total
  - ver costo por porcion
  - ver food cost
  - ver precio sugerido
  - activar/desactivar ficha
- [ ] Mostrar estado de sincronizacion al guardar ficha.
- [x] Mostrar error claro si se intenta guardar ficha sin componentes.
- [x] Mostrar error claro si un componente no tiene insumo/ficha fuente valida.
- [ ] Agregar indicador de ficha activa en catalogo.
- [ ] Agregar indicador de costo desactualizado cuando cambian insumos.
- [ ] Definir comportamiento al editar una ficha activa:
  - crear nueva version
  - conservar historico
  - no alterar ventas anteriores
- [ ] Confirmar responsive en desktop y mobile.

### Criterios de salida

- Un usuario puede crear una ficha sin ayuda tecnica.
- La UI comunica costo, margen y precio sugerido antes de guardar.
- La version activa queda visible.
- El usuario entiende si un producto preparado descuenta inventario por ficha tecnica.

## Area 4: Frontend UX - POS e inventario

### Objetivo

Hacer visible y confiable el impacto de inventario durante la venta.

### Tareas

- [x] En POS, mostrar si el producto es:
  - venta directa
  - producto preparado con ficha
  - combo
  - sin impacto de inventario
- [x] Al cobrar, capturar errores de stock insuficiente y mostrar:
  - insumo afectado
  - accion sugerida: comprar, ajustar stock o permitir stock negativo desde configuracion
- [ ] Confirmar que una venta fallida por stock no limpia el carrito sin explicar el error.
- [ ] En inventario, mostrar movimientos `sale_out` asociados a ventas.
- [ ] En inventario, mostrar movimientos `reversal` cuando se revierta explosion.
- [x] En catalogo, mostrar costo estimado y margen usando datos actuales.
- [x] En dashboard o recursos, mostrar productos sin ficha tecnica.
- [x] En dashboard o recursos, mostrar productos con food cost alto.

### Criterios de salida

- El usuario ve por que una venta no pudo cerrarse.
- El inventario refleja salidas por receta.
- Los productos preparados tienen una senal visual clara.

## Area 5: Reportes y analitica de rentabilidad

### Objetivo

Usar los snapshots historicos para reportes confiables de margen.

### Tareas

- [ ] Revisar `CostingWorkspace` y helpers de dashboard.
- [ ] Confirmar que los reportes lean `product_cost_snapshots` cuando aplique.
- [ ] Calcular margen historico por:
  - venta
  - item vendido
  - producto
  - dia/rango
- [ ] Separar margen estimado actual vs margen historico real.
- [ ] Mostrar productos:
  - sin ficha tecnica
  - sin costo
  - con food cost alto
  - con margen bajo
  - con stock bajo de insumos criticos
- [ ] Agregar ranking de productos mas rentables y menos rentables.
- [ ] Documentar definiciones:
  - costo por porcion
  - food cost
  - margen bruto
  - precio sugerido

### Criterios de salida

- Cambiar el costo de un insumo no altera el margen historico de ventas pasadas.
- Reportes distinguen claramente costo actual y costo historico.
- El usuario puede identificar productos que necesitan ajuste de precio.

## Area 6: Seguridad, permisos y RLS

### Objetivo

Evitar que cualquier miembro del negocio pueda alterar costos, inventario o fichas tecnicas sin permiso.

### Tareas

- [ ] Revisar politicas RLS de tablas de rentabilidad.
- [ ] Decidir permisos minimos por rol:
  - owner/admin: todo
  - manager: crear/editar fichas y ver costos
  - cashier: vender, no editar costos
  - waiter: vender/comandar, no ver costos sensibles
  - kitchen: ver preparacion, no ver costos
  - accountant: ver costos/reportes, no operar POS
- [ ] Endurecer RPCs con `has_business_role` donde aplique.
- [ ] Agregar validacion de permisos en UI.
- [x] Agregar tests SQL para:
  - usuario no autorizado no edita ficha tecnica
  - usuario no autorizado no recalcula costos
  - usuario autorizado si puede operar
- [ ] Revisar `security-grants.sql` para evitar funciones `SECURITY DEFINER` expuestas a `anon`.
- [ ] Ejecutar advisors de Supabase antes de cerrar cambios de seguridad.

### Criterios de salida

- RLS mantiene aislamiento multiempresa.
- Los costos no quedan expuestos a roles operativos no autorizados.
- Las RPCs sensibles validan membresia y rol.

## Area 7: QA, E2E y pruebas

### Objetivo

Convertir la implementacion en confianza verificable.

### Tareas

- [x] Actualizar `e2e/smartprofit-profitability-flows.e2e.spec.ts`.
- [x] Eliminar o reemplazar `test.skip` obsoletos de Fase 2.
- [x] Crear E2E flujo feliz:
  - login
  - crear insumo
  - crear producto preparado
  - crear ficha tecnica
  - vender producto
  - verificar stock descontado
  - verificar snapshot historico
- [x] Crear E2E de stock insuficiente:
  - bajar stock de insumo
  - intentar vender
  - validar error
  - validar que no se creo venta parcial
- [ ] Crear E2E de edicion de ficha:
  - editar componentes
  - activar nueva version
  - vender
  - confirmar snapshot con version nueva
- [x] Mantener SQL test `004_profitability_engine.sql` como contrato backend.
- [x] Agregar test unitario para `technicalSheetCalculations`.
- [x] Agregar test unitario para payload de ficha tecnica usado por `recipeBookService`.
- [ ] Ejecutar suite completa antes de cerrar fase.

### Comandos de verificacion

```bash
npm run test
npm run test:smoke
npm run test:sql
npm run lint
npm run build
npm run check:supabase
npm run check:supabase:rpc
npx playwright test e2e/smartprofit-profitability-flows.e2e.spec.ts
npx playwright test e2e/smartprofit-critical-flows.e2e.spec.ts
```

### Criterios de salida

- No quedan `test.skip` para contratos centrales de Fase 2.
- Tests unitarios y smoke pasan.
- SQL tests pasan.
- E2E de rentabilidad pasa o documenta bloqueo externo con precision.

## Area 8: Datos demo y documentacion operativa

### Objetivo

Permitir demo comercial y soporte sin depender de datos improvisados.

### Tareas

- [ ] Actualizar `demoDataService` para crear:
  - insumos
  - producto preparado
  - ficha tecnica activa
  - venta con snapshot
  - movimientos de inventario
- [ ] Marcar datos demo con metadata clara.
- [ ] Permitir limpieza segura de datos demo sin tocar datos reales.
- [x] Documentar flujo de demo:
  - crear ficha
  - comprar insumo
  - vender plato
  - ver margen
  - ver stock descontado
- [x] Actualizar README o documento de Fase 2 con pasos de operacion.
- [x] Documentar politica de stock negativo.
- [x] Documentar como interpretar margen historico vs margen actual.

### Criterios de salida

- El equipo puede hacer una demo de rentabilidad en menos de 10 minutos.
- Los datos demo son reversibles.
- La documentacion permite soporte basico sin tocar codigo.

## Hitos sugeridos

### Hito 1: Backend verificado

- SQL de rentabilidad revisado.
- `npm run test:sql` pasa.
- `npm run test:smoke` pasa.

### Hito 2: UI de fichas estable

- Crear/editar/desactivar ficha desde UI.
- Producto queda asociado a ficha activa.
- Costo del producto se actualiza.

### Hito 3: POS con explosion validado

- Venta preparada descuenta insumos.
- Snapshot historico queda guardado.
- Stock insuficiente bloquea venta sin crear datos parciales.

### Hito 4: Reportes y alertas

- Margen historico por producto visible.
- Productos sin ficha o con food cost alto visibles.
- Inventario muestra salidas por venta.

### Hito 5: Cierre de fase

- E2E actualizado sin skips centrales.
- Permisos endurecidos.
- Documentacion y datos demo listos.

## Definicion de terminado de Fase 2

La Fase 2 se considera completa cuando:

- Una ficha tecnica puede crearse, editarse, versionarse y activarse desde UI.
- Un producto preparado queda asociado a una ficha activa.
- La venta POS descuenta insumos automaticamente.
- La venta guarda costo, margen, food cost y version de ficha en snapshot historico.
- Una venta fallida por stock insuficiente no crea datos parciales.
- Reportes muestran margen historico y alertas basicas de rentabilidad.
- Roles no autorizados no pueden alterar costos o fichas.
- Pruebas unitarias, SQL, smoke, build y E2E de rentabilidad pasan.

## Siguiente tarea recomendada

Actualizar `e2e/smartprofit-profitability-flows.e2e.spec.ts`: los `test.skip` actuales todavia describen un estado anterior donde el backend de rentabilidad no existia. Esa suite debe convertirse en el contrato principal para cerrar la Fase 2 desde UI y Supabase.
