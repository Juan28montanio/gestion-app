# Auditoria Tecnica y Plan de Reestructuracion

Fecha: 2026-04-20
Proyecto: `gestion-pos`

## 1. Objetivo

Esta auditoria revisa la estructura actual del sistema desde frontend, servicios y flujo operativo para preparar una reestructuracion orientada a:

- escalabilidad futura
- menor sobrecarga cognitiva en interfaz
- menor acoplamiento entre UI y logica de negocio
- mejor mantenibilidad
- soporte real para smartphone, tablet y desktop

La revision prioriza flujos de trabajo y casos de uso antes que modulos aislados.

## 2. Resumen ejecutivo

El sistema tiene una base funcional fuerte, pero hoy concentra demasiada responsabilidad en pocos archivos grandes y en una organizacion por tipo tecnico.

Los principales riesgos actuales son:

- saturacion visual por mezclar operacion, contexto e inteligencia en la misma pantalla
- componentes gigantes con multiples responsabilidades
- servicios que mezclan persistencia, reglas de negocio, transformacion y salida de presentacion
- shell principal demasiado cargado
- ausencia de una arquitectura por dominio y flujo
- falta de herramientas basicas de calidad como pruebas, lint y validaciones automaticas

## 3. Hallazgos estructurales

### 3.1 Shell principal sobrecargado

Archivo:
- `src/App.jsx` - 812 lineas

Responsabilidades actuales detectadas:

- bootstrap de sesion
- control de splash screen
- navegacion principal
- drawer movil y sidebar desktop
- header fijo
- overlay de bloqueo por cierre de caja
- toasts
- modal de auditoria
- composicion de todos los modulos
- modo menu publico

Impacto:

- alto acoplamiento entre layout, sesion y logica operativa
- dificil probar rutas o escenarios por separado
- complicado escalar a mas modulos sin convertir `App.jsx` en cuello de botella

### 3.2 Componentes de dominio demasiado grandes

Archivos mas grandes:

- `src/components/AdminDashboard.jsx` - 1704 lineas
- `src/components/POSOrder.jsx` - 1534 lineas
- `src/components/ProductManager.jsx` - 1532 lineas
- `src/components/RecipeBookManager.jsx` - 735 lineas
- `src/components/PurchaseManager.jsx` - 712 lineas

Patron detectado:

- suscripcion a datos
- transformacion de datos
- logica de negocio
- manejo de modales
- feedback visual
- renderizado

todo dentro del mismo componente.

Impacto:

- cambios pequeños con riesgo alto de regresion
- poca reutilizacion
- dificultad para introducir pruebas por caso de uso
- mantenimiento mas lento

### 3.3 Organizacion actual por tipo tecnico, no por dominio

Estructura actual:

- `src/components`
- `src/services`
- `src/context`
- `src/utils`

Problema:

los archivos estan agrupados por naturaleza tecnica, no por capacidad del negocio.

Consecuencia:

- el flujo `compras -> insumos -> recetas -> margen -> caja` queda repartido en varios lugares
- los cambios de una capacidad funcional obligan a tocar multiples carpetas sin frontera clara

### 3.4 Servicios mezclando acceso a datos con reglas y presentacion

Caso mas evidente:

- `src/services/cashClosingService.js` - 730 lineas

Responsabilidades detectadas en el mismo archivo:

- apertura y cierre de caja
- bloqueo por jornada anterior
- calculo de totales
- consolidacion de ventas y compras
- liquidacion de cartera
- generacion de reporte HTML
- resumen ejecutivo de compras

Impacto:

- el servicio hace demasiado
- la salida del reporte esta acoplada al dominio
- cualquier cambio visual del reporte exige tocar logica financiera

### 3.5 Acoplamiento fuerte entre componentes y servicios

Ejemplos:

- `ProductManager.jsx` consume productos, insumos, proveedores, taxonomias, compras y fichas tecnicas
- `AdminDashboard.jsx` consume ventas, compras, caja, cartera, cierres y edicion de movimientos
- `POSOrder.jsx` consume mesas, clientes, productos, orden activa, caja abierta y pagos

Impacto:

- la UI conoce demasiados detalles de persistencia
- no existe una capa intermedia clara de casos de uso o hooks de dominio

### 3.6 Navegacion sin router real

Hallazgo:

- la app navega con `activeSection` en memoria dentro de `App.jsx`
- solo existe una ruta especial para menu publico

Impacto:

- no hay deep linking interno por modulo
- dificil preservar estado de navegacion
- mas complejo automatizar QA por rutas
- escalar a subflujos o pantallas dedicadas sera costoso

### 3.7 Sobrecarga informativa en interfaz

Patron visual detectado:

- tarjetas de contexto
- tarjetas de flujo
- tarjetas de acciones
- tarjetas de resumen
- tarjetas de inteligencia

conviviendo en la misma capa visual.

Impacto:

- desgaste cognitivo
- perdida de foco en la tarea primaria
- menor rendimiento percibido en movil y tablet

### 3.8 Falta de capa formal de calidad tecnica

`package.json` actual:

- `dev`
- `build`
- `preview`

No se detecta:

- `lint`
- `test`
- `typecheck`

Impacto:

- no hay barreras automaticas contra regresiones
- refactor grande con riesgo elevado

### 3.9 Hallazgos de limpieza y deuda visible

1. `src/components/TableView.jsx`
- no aparece referenciado desde el flujo principal actual
- candidato a archivo legacy o vista paralela sin uso

2. `README_MVP.md`
- describe una arquitectura inicial mucho mas simple que ya no representa el sistema real
- hoy funciona mas como documento historico que como guia vigente

3. `dist/`
- el repositorio esta generando cambios en build artifacts
- `.gitignore` no incluye `dist`
- esto ensucia el control de cambios y dificulta revisar codigo real

4. `src/components/FormModal.jsx`
- hoy solo reexporta `ModalWrapper`
- no es un error, pero si una capa de indireccion que conviene revisar para decidir si se mantiene como alias semantico o se elimina

## 4. Mapa de flujos principales

### 4.1 Operacion de salon y POS

Flujo:

1. Seleccionar mesa
2. Construir pedido
3. Registrar pago
4. Aplicar stock y consumo
5. Liberar mesa
6. Trazar ingreso en caja

Archivos involucrados:

- `src/components/TableManager.jsx`
- `src/components/POSOrder.jsx`
- `src/context/CartContext.jsx`
- `src/services/orderService.js`
- `src/services/financeService.js`
- `src/services/cashClosingService.js`
- `src/services/tableService.js`

Riesgo actual:

este flujo esta repartido entre UI, contexto y servicios sin una orquestacion intermedia clara.

### 4.2 Abastecimiento y costeo

Flujo:

1. Seleccionar proveedor
2. Registrar compra
3. Actualizar insumos
4. Recalcular costo promedio
5. Impactar fichas tecnicas
6. Leer efecto en margen y caja

Archivos involucrados:

- `src/components/ProductManager.jsx`
- `src/components/PurchaseManager.jsx`
- `src/components/SupplierManager.jsx`
- `src/components/RecipeBookManager.jsx`
- `src/services/purchaseService.js`
- `src/services/supplyService.js`
- `src/services/supplierService.js`
- `src/services/recipeBookService.js`

Riesgo actual:

el flujo existe funcionalmente, pero esta demasiado embebido en la interfaz.

### 4.3 Caja, cartera y cierre

Flujo:

1. Abrir caja
2. Registrar ventas y egresos
3. Medir resultado
4. Revisar cartera pendiente
5. Cerrar caja
6. Generar reporte

Archivos involucrados:

- `src/components/AdminDashboard.jsx`
- `src/services/cashClosingService.js`
- `src/services/financeService.js`
- `src/services/purchaseService.js`

Riesgo actual:

es el flujo mas critico y tambien el mas acoplado.

### 4.4 Clientes, ticketeras y seguimiento

Flujo:

1. Crear cliente
2. Asignar o consumir ticketera
3. Registrar venta asociada
4. Controlar saldo o deuda
5. Recuperar cartera

Archivos involucrados:

- `src/components/CustomerManager.jsx`
- `src/components/TicketWalletManager.jsx`
- `src/services/customerService.js`
- `src/services/financeService.js`
- `src/services/cashClosingService.js`

## 5. Problemas de arquitectura por prioridad

### Prioridad alta

1. Extraer el shell principal
2. Partir componentes gigantes
3. Sacar logica de negocio de la UI
4. Separar reportes HTML de servicios financieros
5. unificar capa de recomendaciones en un panel dedicado
6. dejar de mezclar operacion con inteligencia en la pantalla principal

### Prioridad media

1. reorganizar carpetas por dominio
2. introducir router interno o equivalente basado en rutas
3. crear hooks de dominio por flujo
4. centralizar validaciones y mensajes de error
5. reducir duplicacion de calculos y normalizadores

### Prioridad baja pero importante

1. limpiar aliases y wrappers redundantes
2. archivar o eliminar vistas legacy
3. actualizar documentacion tecnica
4. agregar scripts de lint y pruebas

## 6. Arquitectura objetivo recomendada

```text
src/
  app/
    AppShell.jsx
    navigation/
    layout/
    providers/
  modules/
    salon/
      components/
      hooks/
      use-cases/
      services/
    pos/
      components/
      hooks/
      use-cases/
      services/
    resources/
      suppliers/
      supplies/
      purchases/
      recipes/
      shared/
    finance/
      cash/
      receivables/
      closing/
      reports/
    customers/
    ticketing/
    account/
  shared/
    components/
    hooks/
    utils/
    constants/
  infrastructure/
    firebase/
    repositories/
    mappers/
```

## 7. Patron de interfaz recomendado

Separar la experiencia en 3 niveles:

### Nivel 1. Operar

Solo lo necesario para ejecutar:

- POS
- compras
- caja
- mesas

### Nivel 2. Revisar

Contexto breve y visible:

- estado
- historial corto
- alertas
- indicadores de riesgo

### Nivel 3. Decidir

Analitica e insights en espacio dedicado:

- drawer lateral
- panel de decisiones
- centro de recomendaciones

Regla:

las recomendaciones no deben seguir repartidas en cada vista como tarjetas completas.

## 8. Orden recomendado de reestructuracion

### Fase 1. Auditoria operativa y limpieza base

- inventario final de archivos y dependencias
- eliminar o archivar legacy comprobado
- excluir `dist/` del versionado
- actualizar README tecnico

### Fase 2. Extraccion del shell

- separar `AppShell`
- separar navegacion
- separar header
- separar sidebar y menu movil
- crear capa de panel contextual global

### Fase 3. Refactor del flujo recursos

- dividir `ProductManager` por subdominios
- mover compras, insumos y proveedores a `modules/resources`
- extraer hooks y casos de uso

### Fase 4. Refactor del flujo financiero

- dividir `AdminDashboard`
- separar `cashClosingService` en:
  - `cashSessionService`
  - `cashClosingDomain`
  - `cashReportBuilder`
  - `receivablesService`

### Fase 5. Refactor del POS

- dividir `POSOrder`
- extraer:
  - seleccion de mesa
  - catalogo
  - carrito
  - pagos
  - cambio en efectivo
  - drawer movil

### Fase 6. Calidad tecnica

- agregar lint
- agregar smoke tests
- agregar pruebas de casos de uso criticos
- normalizar errores y mensajes

## 9. Primer backlog profesional sugerido

### Sprint 1

- ignorar `dist/`
- documentar arquitectura actual
- identificar y decidir sobre `TableView.jsx`
- extraer `AppShell`, `MainHeader`, `Sidebar`, `MobileDrawer`

### Sprint 2

- crear `DecisionCenter` global
- mover recomendaciones fuera de las pantallas primarias
- reducir densidad visual en recursos y finanzas

### Sprint 3

- partir `ProductManager`
- introducir `modules/resources`
- extraer hooks de compras e insumos

### Sprint 4

- partir `AdminDashboard`
- separar reporte HTML de `cashClosingService`
- consolidar flujo de cierre

### Sprint 5

- partir `POSOrder`
- mejorar arquitectura responsive por flujo

## 10. Conclusiones

El sistema no esta mal construido, pero ya cruzo el punto en el que seguir agregando funcionalidad sin reordenar la arquitectura va a volver todo mas lento y fragil.

La prioridad correcta no es embellecer mas pantallas aisladas, sino:

- limpiar la base
- mover la arquitectura a dominios
- separar operacion de inteligencia
- reducir archivos gigantes
- preparar la app para rutas, pruebas y crecimiento

Esta reestructuracion debe ejecutarse por flujo de negocio, no por modulo tecnico.
