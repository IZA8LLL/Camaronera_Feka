# Fase 0 — Base de verificación

**Fecha:** 24 de noviembre de 2026. **Ámbito:** API local y pruebas existentes del frontend.

## Entorno reproducible

`backend/test/security-baseline.test.js` inicia un proceso `mongod` local con réplica de un nodo, puerto libre y directorio temporal. El proceso se detiene y borra su directorio al terminar. El test fija explícitamente `MONGO_URI`, `JWT_SECRET`, `ENCRYPTION_KEY_BASE64`, `APP_ORIGIN` y `NODE_ENV` antes de cargar la aplicación. No usa la conexión del `.env` local ni datos de producción. Requiere `mongod` instalado y disponible en `PATH`; se ejecuta con `cd backend && npm run test:security`.

Los datos son sintéticos: dos tenants, dos granjas y dos piscinas por tenant, cuatro ciclos activos, cuatro usuarios (operador con dos granjas, lector con una, lector sin asignación y lector del otro tenant), roles y permisos de lectura/escritura, sesiones temporales y un lote de alimento. Los identificadores se generan en cada ejecución.

Las pruebas marcadas `TODO` expresan el contrato de seguridad **esperado**. Fallan hoy por los hallazgos S-01 a S-03 de la auditoría. Node las informa sin hacer fallar el comando; en la fase 1 se quitará `TODO` al corregir cada caso. No deben interpretarse como pruebas aprobadas.

## Matriz de acceso y respuestas

| Caso | Respuesta esperada | Observado en fase 0 | Hallazgo |
| --- | --- | --- | --- |
| Operador A, `GET /api/granjas` | `200`, solo sus dos granjas | `200`, dos granjas A | Conforme |
| Lector A sin granjas, `GET /api/granjas` | `200`, lista vacía | `200`, dos granjas A | S-01 |
| Lector A asignado a una piscina, `GET /api/piscinas` | `200`, una piscina | `200`, dos piscinas A | S-01 |
| Lector B, `GET /api/piscinas` | `200`, una piscina B | `200`, dos piscinas B | S-01 |
| Operador A, `GET /api/ciclos/siguiente` con granja y piscina | `200`, ningún documento nuevo | `200`, crea un ciclo | S-02 |
| Operador A, `POST /api/parametros-agua` con ciclo de otra piscina | `403`, ningún registro | `201`, registra lectura | S-03 |
| Operador A, `POST /api/muestreos` con ciclo de otra piscina | `403`, ningún registro | `201`, registra muestreo | S-03 |
| Operador A, `POST /api/alimentacion` con ciclo de otra piscina | `403`, sin consumo ni descuento | `201`, registra consumo y descuenta 5 kg | S-03 |
| Lector A, `POST /api/parametros-agua` sin permiso | `403` | `403` | Conforme |
| Operador A, `POST /api/parametros-agua` con IDs coherentes | `201` | `201` | Conforme |
| Sin token, `GET /api/granjas` | `401` | `401` | Conforme |

Los cruces de granja y piscina usan identificadores válidos y asignados al mismo operador; por eso la prueba detecta la ausencia de validación de correspondencia entre ciclo, granja y piscina. El saldo del lote se verifica en la base temporal después del `POST` de alimentación.

## Línea base existente

- Backend: `npm test` conserva las tres pruebas unitarias de validación. La nueva matriz se ejecuta en el mismo comando y deja siete casos de seguridad como `TODO`.
- Frontend: `npm run build` termina correctamente.
- Frontend: `npm run test:e2e` aprobó las 24 pruebas (escritorio y móvil).

**Criterio de salida de fase 0:** cumplido para el entorno aislado y la reproducción de accesos permitidos y denegados. Los siete incumplimientos de seguridad quedan pendientes para la fase 1.
