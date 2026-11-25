# Fase 1 — Acceso y consistencia de datos

**Estado:** implementada y verificada localmente.

## Cambios

1. `GET /api/granjas` exige `granjas:leer` y filtra por tenant y granjas asignadas. Un usuario sin asignaciones recibe una lista vacía. `GET /api/piscinas` exige `piscinas:leer` y filtra por tenant, granjas y piscinas asignadas. Un administrador puede ver las granjas y piscinas de su tenant aunque no tenga asignaciones explícitas.
2. `GET /api/ciclos/siguiente` exige `piscinas:leer`, valida el par granja/piscina y solo calcula el código siguiente. Devuelve los ciclos de la piscina solicitada y `siguiente_id: null`; no realiza escrituras.
3. `POST /api/ciclos` exige `ciclos:crear` y un cuerpo `{ granja_id, piscina_id, fecha_inicio }` con fecha ISO. Verifica el ámbito, la pertenencia de la piscina a la granja y la ausencia de otro ciclo activo. Devuelve `201` con `{ id, codigo }`, `403` si está fuera de alcance y `409` ante duplicados o un ciclo activo existente. El bootstrap nuevo incorpora `granjas:leer` y `ciclos:crear` al rol administrador.
4. Agua, muestreo y alimentación comprueban tenant, granja, piscina y ciclo activo como un mismo vínculo antes de crear documentos. Alimentación rechaza el vínculo inválido antes de iniciar la transacción de inventario.
5. Los tres formularios muestran ciclos activos de la piscina seleccionada. Si no hay uno, ofrecen un botón explícito para crearlo; una consulta fallida no inventa un ID de ciclo ni permite enviarlo.

## Índices y datos existentes

Al conectar, la API crea dos índices únicos en `ciclos_cultivo`: `(tenant_id, codigo)` y `(tenant_id, piscina_id)` para documentos con `estado: "activo"`. Esto asegura unicidad incluso ante peticiones simultáneas. **Antes de arrancar esta versión sobre una base existente**, revise si hay códigos repetidos por tenant o varias filas activas por piscina y resuelva esos datos. La cuenta de MongoDB usada para el arranque debe poder crear índices. Si hay duplicados o falta ese permiso, el servidor no iniciará; esa condición evita operar sin la garantía de unicidad.

Los roles ya creados no reciben permisos nuevos automáticamente. Revise sus asignaciones: los usuarios que deben leer granjas necesitan `granjas:leer`; otorgue `ciclos:crear` solo a quienes deban abrir ciclos. El rol `administrador` conserva su acceso por la política RBAC existente.

## Verificación

- `cd backend && npm test`: 22 pruebas aprobadas, 0 pendientes. Incluye accesos entre tenants, granjas y piscinas; escrituras rechazadas sin efectos secundarios; creación autorizada y no autorizada de ciclos; índice único.
- `cd frontend && npm run build`: compilación correcta.
- `cd frontend && npm run test:e2e`: pruebas de escritorio y móvil, incluido el botón de creación explícita.

Las pruebas usan únicamente MongoDB temporal y valores sintéticos. No se aplicó ninguna migración a la base de producción.
