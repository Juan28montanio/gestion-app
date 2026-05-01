# Sprint 1 - Confiabilidad y base de lanzamiento

## Objetivo
Endurecer la base tecnica para que la app no se rompa en los flujos criticos del negocio y para que cada negocio opere con sus propios datos de forma segura.

## Alcance de este sprint
- Aislamiento de datos por negocio en Firestore.
- Recuperacion visual cuando un modulo falle.
- Revalidacion de flujos sensibles.
- Checklist manual de smoke tests para operacion diaria.

## Cambios estructurales del sprint
- Reglas de Firestore reforzadas para colecciones criticas con validacion por `business_id`.
- Recuperacion por modulo con `SectionErrorBoundary` para evitar caidas completas de la app.
- Reinicio de espacio de trabajo mas seguro y sin borrado cliente de Storage.

## Flujos criticos que deben quedar estables
1. Registro e inicio de sesion.
2. Carga inicial de cuenta y datos del negocio.
3. Alta de proveedor, insumo y compra.
4. Alta de producto y ficha tecnica.
5. Apertura de mesa, pedido y cobro en POS.
6. Registro de gasto y lectura de caja.
7. Cierre de caja.
8. Reinicio del espacio de trabajo.

## Smoke tests manuales

### 1. Acceso y aislamiento
- Crear una cuenta nueva.
- Confirmar que inicia sin datos heredados de otro negocio.
- Cerrar sesion e ingresar con otra cuenta.
- Confirmar que cada cuenta solo visualiza su propia informacion.

### 2. Cuenta y configuracion
- Actualizar nombre del negocio.
- Actualizar nombre visible del administrador.
- Probar validacion de URL de logo.
- Configurar o cambiar PIN con verificacion de contrasena.
- Abrir la guia de uso desde cuenta.

### 3. Centro de recursos
- Crear proveedor.
- Crear insumo manualmente.
- Registrar una compra con proveedor de contado.
- Registrar una compra con proveedor a credito.
- Confirmar que la compra actualiza stock y referencias del insumo.
- Confirmar que no hay errores al navegar entre proveedores, insumos, compras, preparaciones y fichas.

### 4. Catalogo y fichas
- Crear producto simple.
- Crear producto compuesto.
- Crear o editar ficha tecnica.
- Confirmar que margen, costo y precio sugerido cargan sin romper el modulo.
- Confirmar que el producto se sigue viendo desde POS.

### 5. POS y salon
- Abrir una mesa.
- Agregar productos al pedido.
- Registrar pago en efectivo ingresando valor pagado.
- Confirmar calculo de cambio o vueltas.
- Cancelar una orden y verificar liberacion de mesa.

### 6. Finanzas y cierre
- Registrar gasto operativo.
- Registrar servicio fijo si aplica.
- Confirmar que compras de contado afectan la caja y compras a credito no rompen el cierre.
- Abrir y cerrar caja.
- Validar que el reporte de cierre muestra movimientos y totales sin caidas.

### 7. Reinicio
- Ejecutar `Reiniciar app en cero`.
- Confirmar que borra datos operativos del negocio actual.
- Confirmar que la cuenta y el acceso siguen funcionando.
- Confirmar que la app vuelve a un estado limpio y usable.

## Riesgos abiertos del sprint
- Falta automatizacion de pruebas de regresion.
- Falta monitoreo centralizado de errores en produccion.
- Falta endurecer Storage con una estrategia servidor o reglas mas precisas.
- Persisten componentes grandes que conviene seguir compactando en sprints posteriores.

## Criterio de salida
- No hay errores bloqueantes visibles en login, recursos, productos, POS, caja, cierre y cuenta.
- El sistema recupera fallos puntuales de modulo sin tumbar toda la aplicacion.
- Cada usuario solo puede leer y escribir datos de su negocio.
- Un negocio nuevo puede operar desde cero sin encontrar datos ajenos ni pantallas inutilizables.
