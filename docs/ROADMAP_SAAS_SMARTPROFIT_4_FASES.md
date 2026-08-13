# Roadmap SaaS SmartProfit en 4 fases

## Contexto

SmartProfit es una plataforma SaaS para microempresarios gastronomicos. El producto ya cuenta con una base tecnica relevante: React + Vite en el frontend, Supabase como backend principal, PostgreSQL como base de datos, autenticacion, Row Level Security, modelo multiempresa por `business_id`, modulos de POS, caja, salon, clientes, proveedores, compras, inventario y RPCs para operaciones criticas.

El objetivo del roadmap es llevar la base actual hacia un producto comercializable bajo suscripcion, con foco en rentabilidad gastronomica: fichas tecnicas, explosion de materiales, sincronizacion con inventario, costos automaticos y sugerencia de precios.

## Principios de arquitectura

- Mantener el monolito frontend React mientras el producto valida mercado.
- Usar Supabase/PostgreSQL como backend transaccional principal.
- Ejecutar operaciones criticas mediante RPCs, no mediante multiples escrituras directas desde el cliente.
- Aislar datos por `business_id` y endurecer RLS por rol.
- Guardar snapshots historicos de costos, precios y margenes para evitar que cambios futuros alteren reportes pasados.
- Priorizar trazabilidad: auditoria, reversas y movimientos compensatorios antes que ediciones destructivas.

## Fase 1: MVP operativo vendible

### Objetivo

Consolidar un producto minimo confiable para que un restaurante pueda operar POS, caja, mesas, ventas y clientes en produccion sin depender de procesos manuales fragiles.

### Alcance funcional

- Login y negocio activo con Supabase Auth.
- POS de venta rapida.
- Salon con mesas, sesiones, pedidos y cocina.
- Apertura y cierre de caja.
- Ventas pagadas, ventas con saldo pendiente y cobro de cartera.
- Clientes y tiqueteras si el flujo actual ya es estable.
- Catalogo de productos y categorias.
- Auditoria basica de acciones criticas.

### Alcance tecnico

- Validar que Firebase/Firestore no sea dependencia operativa en runtime.
- Confirmar que caja, ventas, salon y cartera pasen por RPCs.
- Aplicar parches SQL pendientes en Supabase antes de produccion.
- Configurar variables de entorno de Vercel para Supabase.
- Mantener OpenAPI actualizado para RPCs publicas.
- Ejecutar pruebas base antes de cada despliegue.

### Entregables

- Flujo completo probado: abrir caja, vender, cobrar, cerrar caja.
- Flujo de mesa probado: abrir mesa, enviar pedido, solicitar cuenta, cobrar.
- Scripts `npm run test`, `npm run test:smoke`, `npm run check:supabase`, `npm run check:supabase:rpc` y `npm run build` funcionando.
- Checklist manual de validacion de produccion.
- Politicas RLS revisadas para que usuarios anonimos no lean datos del negocio.

### Criterios de salida

- Un restaurante piloto puede operar una jornada completa sin intervencion tecnica.
- No hay escrituras criticas de caja/venta que dependan de secuencias fragiles en frontend.
- Los errores operativos muestran mensajes claros.
- Existe respaldo/exportacion antes de aplicar SQL sensible.

### Riesgos

- Permisos demasiado amplios por rol.
- Datos inconsistentes si aun quedan escrituras directas para flujos financieros.
- Falta de pruebas E2E para regresiones en POS/caja.

## Fase 2: gestion de costos y rentabilidad

### Objetivo

Convertir SmartProfit de un POS operativo en una herramienta de rentabilidad gastronomica, habilitando fichas tecnicas reales, costos automaticos y descuento de insumos por venta.

### Alcance funcional

- Crear y editar fichas tecnicas por producto preparado.
- Definir ingredientes, cantidades, unidades, mermas y rendimiento.
- Calcular costo por receta, costo por porcion, food cost, margen bruto y precio sugerido.
- Asociar productos del catalogo con fichas tecnicas.
- Descontar insumos automaticamente al cerrar ventas.
- Mostrar alertas de bajo stock y productos con margen bajo.
- Registrar historial de precios de insumos por proveedor.

### Alcance tecnico

- Crear tablas:
  - `technical_sheets`
  - `technical_sheet_items`
  - `technical_sheet_versions`
  - `product_cost_snapshots`
  - opcional: `production_batches`
- Crear RPCs:
  - `create_or_update_technical_sheet`
  - `activate_technical_sheet_version`
  - `recalculate_product_cost`
  - `close_sale_with_inventory_explosion`
  - `reverse_inventory_explosion`
- Extender `close_sale` o crear una version nueva que descuente insumos de `supplies`.
- Guardar snapshot de costo y margen en `sale_items.metadata` o en tabla dedicada.
- Resolver conversiones de unidades: compra, inventario y receta.

### Entregables

- Modulo de fichas tecnicas habilitado en Supabase.
- Servicio `recipeBookService` conectado a tablas/RPCs reales.
- Venta de producto preparado descuenta insumos.
- Reporte de margen por producto y por venta.
- Tests unitarios para calculos de costeo.
- Tests SQL/RPC para explosion de materiales.

### Criterios de salida

- Al vender un producto preparado, el inventario de insumos baja correctamente.
- El costo historico de una venta no cambia aunque cambie el costo del insumo despues.
- El sistema impide vender/confirmar operaciones imposibles o deja auditoria clara si se permite stock negativo.
- El usuario puede ver precio sugerido y margen estimado desde la ficha tecnica.

### Riesgos

- Complejidad de unidades y conversiones.
- Cambios de receta sin versionado historico.
- Inventario inconsistente si se descuentan productos en vez de insumos.

## Fase 3: escalabilidad SaaS

### Objetivo

Preparar la plataforma para venderse bajo suscripcion a multiples negocios, con aislamiento, permisos, planes, limites y operacion tecnica repetible.

### Alcance funcional

- Onboarding self-service de negocio.
- Invitacion de usuarios al equipo.
- Roles por modulo y accion.
- Planes de suscripcion.
- Bloqueo o degradacion por estado de pago.
- Limites por plan: usuarios, negocios, productos, mesas, historico, reportes avanzados.
- Panel de administracion interna para soporte.

### Alcance tecnico

- Crear tablas:
  - `plans`
  - `subscriptions`
  - `subscription_events`
  - `usage_counters`
  - `invitations`
- Integrar Stripe o Mercado Pago:
  - checkout
  - customer portal
  - webhooks
  - reconciliacion de estado
- Implementar autorizacion por permisos, no solo membresia.
- Separar ambientes: local, staging y produccion.
- Versionar migraciones con Supabase CLI.
- Agregar observabilidad con Sentry o equivalente.
- Automatizar CI: lint, tests, build, smoke y validacion de contrato OpenAPI.

### Entregables

- Flujo completo: registro, creacion de negocio, seleccion de plan y acceso al producto.
- Webhooks de suscripcion procesados de forma idempotente.
- RLS reforzado por rol para compras, caja, inventario, usuarios y configuracion.
- Dashboard interno de negocios, usuarios, suscripciones y errores relevantes.
- Guia de despliegue y rollback.

### Criterios de salida

- Un nuevo cliente puede registrarse sin ayuda manual.
- Un negocio suspendido no puede operar funciones de pago segun reglas definidas.
- Los datos entre restaurantes permanecen aislados.
- El equipo puede diagnosticar errores de produccion con logs y trazas suficientes.

### Riesgos

- Webhooks duplicados o fuera de orden.
- Estados de suscripcion ambiguos.
- RLS incompleto en tablas nuevas.
- Falta de migraciones reproducibles entre ambientes.

## Fase 4: lanzamiento comercial

### Objetivo

Lanzar SmartProfit al mercado con propuesta clara, soporte inicial, medicion de adopcion y procesos de operacion comercial.

### Alcance funcional

- Landing page orientada a restaurantes pequenos.
- Demo guiada o datos de ejemplo por tipo de negocio.
- Onboarding con checklist: productos, caja, mesas, insumos, ficha tecnica y primera venta.
- Panel de salud del negocio:
  - ventas del dia
  - margen estimado
  - productos menos rentables
  - alertas de inventario
  - cuentas por pagar
- Exportacion de datos basica.
- Centro de ayuda inicial.

### Alcance tecnico

- Dominio de produccion.
- Monitoreo de errores y disponibilidad.
- Backups programados.
- Politica de soporte y recuperacion de datos.
- Analitica de producto:
  - activacion
  - retencion
  - uso de POS
  - uso de fichas tecnicas
  - negocios con caja cerrada correctamente
- Preparar procesos para migrar datos de clientes piloto.

### Entregables

- Producto desplegado en produccion.
- Proceso de alta de clientes.
- Material minimo de ventas y soporte.
- Tablero interno de metricas SaaS.
- Piloto con 3 a 5 restaurantes reales.
- Lista priorizada de mejoras despues del piloto.

### Criterios de salida

- Los pilotos operan al menos dos semanas con datos reales.
- Se mide activacion y retencion inicial.
- Existen mecanismos para atender errores, restaurar datos y corregir inconsistencias.
- El producto tiene una propuesta comercial clara: no solo "POS", sino "POS con control de rentabilidad".

### Riesgos

- Vender antes de validar el motor de rentabilidad.
- Soporte manual excesivo por onboarding incompleto.
- Reportes financieros poco confiables si faltan snapshots y auditoria.
- Pricing desalineado con el valor percibido por microempresarios.

## Prioridad recomendada inmediata

La siguiente inversion tecnica deberia ser la Fase 2: fichas tecnicas persistentes y explosion de materiales. El proyecto ya tiene una base operativa razonable para POS/caja/salon, pero el diferenciador comercial esta en rentabilidad. Sin ese motor, SmartProfit compite como otro POS; con ese motor, puede posicionarse como una herramienta para saber cuanto gana realmente cada plato.

## Orden sugerido de implementacion tecnica

1. Disenar tablas de fichas tecnicas y versiones.
2. Crear RPC para guardar ficha tecnica con items.
3. Conectar `recipeBookService` a Supabase.
4. Calcular y persistir costo actual del producto.
5. Extender cierre de venta para explosion de insumos.
6. Guardar snapshot historico de costo/margen en cada venta.
7. Crear reportes de rentabilidad por producto.
8. Agregar tests SQL y E2E de venta con descuento de inventario.

