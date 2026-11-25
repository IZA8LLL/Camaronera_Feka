# Auditoría técnica y plan de acción del ERP Camaronera

**Fecha de revisión:** 24 de noviembre de 2026  
**Versión examinada:** `f3c957b` (`main`)  
**Ámbito:** frontend Angular, API Express, persistencia MongoDB, dependencias, pruebas, interfaz de acceso y documentación del repositorio.

## 1. Resumen ejecutivo

La aplicación compila y las pruebas existentes pasan. La revisión estática identifica, sin embargo, fallos de autorización por objeto y una operación de escritura expuesta mediante `GET`. Estos hallazgos deben resolverse antes de usar el ERP con datos de distintas granjas o usuarios. La interfaz también conserva una capa de HTML construido manualmente y datos promocionales fijos que dificultan la revisión de seguridad y pueden presentar como reales métricas que no provienen del sistema.

El plan ordena primero la corrección de acceso y consistencia de datos; después, la protección de la sesión, la configuración de producción y las dependencias; finalmente, la simplificación de la interfaz y del código heredado. La limpieza de comentarios debe mejorar la legibilidad y conservar las explicaciones técnicas necesarias. La documentación académica debe declarar con veracidad cualquier asistencia de inteligencia artificial utilizada.

## 2. Alcance y método

Se revisaron rutas, controladores, middleware, modelos, servicios de autenticación, plantillas y estilos del frontend, scripts y configuración de CI. Se ejecutaron `npm run build` en `frontend`, `npm test` en `backend`, `npm run test:e2e` en `frontend` y `npm audit` en ambos paquetes. También se inspeccionó la página de acceso en escritorio y móvil.

**Resultado de las comprobaciones:** compilación Angular satisfactoria; 3 pruebas unitarias del backend y 24 pruebas E2E aprobadas. `npm audit --omit=dev` informó una alerta alta en `zod` para el backend y ninguna para el frontend. La auditoría completa del backend informó además dos alertas moderadas asociadas a dependencias de desarrollo. Estos resultados no sustituyen pruebas de autorización con una base de datos de ensayo, una revisión de infraestructura ni una prueba de penetración.

## 3. Hallazgos priorizados

| ID | Prioridad | Hallazgo y evidencia | Consecuencia probable |
| --- | --- | --- | --- |
| S-01 | **P0** | `backend/src/controllers/piscina.controller.js:12-15` consulta la colección nativa filtrando solo `tenant_id`. `backend/src/controllers/operacion.controller.js:203-210` devuelve todas las granjas del tenant cuando un usuario no administrador tiene `granjaIds` vacío. La ruta `/api/granjas` tampoco declara un permiso específico. | Un usuario autenticado puede recibir información de granjas o piscinas fuera de su asignación, según sus permisos y datos del tenant. |
| S-02 | **P0** | `backend/src/routes/api.routes.js:53` expone `/ciclos/siguiente` por `GET` sin permiso de creación. `backend/src/controllers/operacion.controller.js:253-268` puede crear un ciclo durante esa consulta. | Una lectura puede modificar datos y un usuario autenticado con una granja asignada puede activar una operación que no tiene autorización explícita. |
| S-03 | **P0** | `backend/src/controllers/operacion.controller.js:23-28` verifica que el ciclo esté activo, pero no comprueba que pertenezca a la `granja_id` y `piscina_id` enviadas. La función precede a registros de agua, muestreo y alimentación. | Se pueden asociar registros operativos a una combinación incoherente de ciclo, granja y piscina. |
| S-04 | **P1** | `frontend/src/services/auth.service.ts:39-41` y `frontend/src/services/api.service.ts:29-30` guardan el token de acceso en `localStorage`. | Un XSS que llegue a ejecutarse en el origen podría leer el token. El riesgo aumenta por la construcción manual de HTML indicada en S-05. |
| S-05 | **P1** | `frontend/src/app/shared/safe-html.pipe.ts:12` usa `bypassSecurityTrustHtml`; componentes de `frontend/src/app/pages/` escriben `innerHTML` mediante `ElementRef`. Los valores revisados se escapan en varios puntos, por lo que esta inspección **no demuestra un XSS explotable**. | El patrón elude las protecciones normales de plantillas Angular y amplía la posibilidad de introducir XSS en cambios futuros. |
| S-06 | **P1** | `frontend/src/services/auth.service.ts:30` envía siempre `turnstile_token: 'dev-token'`; `backend/src/middlewares/bot.middleware.js:8-43` exige verificación real fuera de desarrollo. | El inicio de sesión de producción no queda resuelto con el frontend actual. Si un despliegue se configura indebidamente como desarrollo, se omite el control del servidor. |
| S-07 | **P1** | `npm audit` señaló `zod@3.25.76` con severidad alta bajo [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). La corrección sugerida por npm implica migración a Zod 4. | Requiere verificar aplicabilidad al uso concreto y actualizar con pruebas de compatibilidad; no debe ejecutarse `npm audit fix --force` sin revisar el cambio mayor. |
| S-08 | **P1, condicionado al despliegue** | `backend/src/server.js:27` fija `trust proxy` a un salto y `:55` construye la redirección HTTPS con el encabezado `Host`. `backend/src/config/env.js:8` toma desarrollo como valor por defecto. | Si el proxy no elimina encabezados enviados por el cliente o falta `NODE_ENV=production`, pueden alterarse IP/origen percibidos y controles dependientes del entorno. La exposición depende de la infraestructura. |
| Q-01 | **P2** | Persisten `frontend/vite.config.ts`, `frontend/src/app.component.ts`, `frontend/src/app.routes.ts`, `frontend/src/router.ts`, `frontend/src/app.ts` y referencias a Vite en `README.md`, mientras `frontend/src/main.ts` arranca Angular. También existen dos copias idénticas de `camaronera-hero.jpg`. | Mantenimiento confuso, mayor superficie de revisión y riesgo de modificar una implementación que ya no se ejecuta. |
| D-01 | **P2** | `frontend/src/pages/login/login.page.ts:29-64` muestra “monitoreo satelital”, “tiempo real”, “predictivo”, `6.8 mg/L`, `100 %` y `1.35 FCA` como contenido fijo anterior al inicio de sesión. En `frontend/src/theme/pages.css` se usan textos de aproximadamente `0.62rem` y varios efectos animados. | Las cifras pueden interpretarse como datos actuales; la tipografía pequeña dificulta la lectura de indicadores. |
| Q-02 | **P2** | Encabezados de comentario decorativos, emojis en logs y documentación, estilos concentrados en líneas CSS extensas y mensajes que describen características no implementadas. | Dificultan la lectura académica y la distinción entre comportamiento comprobado, ejemplo y propuesta. La apariencia del comentario no determina su autoría. |

### Precisión sobre S-01 y S-03

El plugin `tenantScope` añade filtros a consultas realizadas mediante modelos Mongoose. Las lecturas con `mongoose.connection.db.collection(...)` no pasan por ese plugin. La evaluación se basa en la ruta y el código examinados; la explotación efectiva debe reproducirse con cuentas de prueba de distintos permisos, granjas y tenants. Esta verificación responde al riesgo de autorización por objeto descrito por [OWASP API Security](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/).

### Controles existentes que conviene conservar

El backend ya usa Argon2id para contraseñas, cookies de actualización `HttpOnly` y `SameSite=Strict`, validación de DTO con Zod, límites de tamaño para JSON, rate limiting, encabezados con Helmet, control de permisos RBAC y cifrado AES-GCM para campos de proveedores. La corrección debe reforzar estos controles sin eliminarlos por simplificación.

## 4. Plan de implementación

### Fase 0. Base de verificación

1. Preparar una base de datos de ensayo con dos tenants, dos granjas por tenant y usuarios con permisos y asignaciones diferentes. Usar valores sintéticos; no copiar datos reales.
2. Registrar respuestas esperadas para `/api/granjas`, `/api/piscinas`, `/api/ciclos/siguiente`, registros de agua, muestreo y alimentación.
3. Mantener como línea base la compilación Angular, las 3 pruebas unitarias y las 24 E2E aprobadas.

**Criterio de salida:** el entorno de ensayo reproduce los casos de acceso autorizado y denegado sin depender de la base de producción.

**Ejecución:** completada. La matriz inicial y las instrucciones de reproducción se encuentran en [FASE_0_BASE_DE_VERIFICACION.md](FASE_0_BASE_DE_VERIFICACION.md). Los siete casos inicialmente pendientes se corrigieron en la fase 1.

### Fase 1. Corrección de acceso y consistencia de datos — P0

1. Sustituir las lecturas directas que omiten el ámbito del usuario por consultas que incluyan `tenant_id`, granjas y piscinas asignadas. Definir explícitamente la política para usuarios sin asignaciones: acceso vacío o denegado, nunca acceso a todas las granjas por omisión. Añadir permiso de lectura a `/api/granjas`.
2. Separar la consulta del siguiente código de ciclo de su creación. `GET` solo debe calcular y devolver información. Crear ciclos mediante `POST`, con DTO, permiso específico y validación de granja, piscina y unicidad del código.
3. Verificar en `checkCycle` la correspondencia simultánea entre ciclo activo, tenant, granja y piscina; comprobar además que la piscina pertenece a la granja. Rechazar la operación antes de escribir consumo, lectura o movimiento de inventario.
4. Incorporar pruebas de autorización con combinaciones de IDs válidos pero pertenecientes a otra granja, piscina o tenant.

**Criterio de salida:** ningún usuario recibe objetos ajenos a su ámbito; `GET /api/ciclos/siguiente` no crea documentos; una combinación incoherente de IDs no produce registros ni movimientos de inventario. No avanzar al despliegue con estos casos pendientes.

**Ejecución:** implementada y verificada con la base temporal. Consulte [FASE_1_ACCESO_Y_CONSISTENCIA.md](FASE_1_ACCESO_Y_CONSISTENCIA.md) antes de aplicar los índices únicos a una base existente.

### Fase 2. Sesión, configuración y dependencias — P1

1. Conservar el access token solo en memoria y recuperar la sesión mediante la cookie de actualización `HttpOnly` al recargar la página. Adaptar el guard y el flujo de cierre de sesión. Probar expiración, rotación, revocación y recarga en dos pestañas.
2. Reemplazar `dev-token` por la integración real del desafío de acceso para producción. Hacer obligatoria la configuración de producción y definir un mecanismo de pruebas separado que no dependa de un token ficticio en la interfaz publicada.
3. Configurar `trust proxy` para la topología real y usar una dirección canónica de redirección HTTPS, sin construirla con un `Host` no validado. Verificar los encabezados que sobrescribe el proxy.
4. Revisar la alerta de Zod y migrar a una versión corregida con pruebas de DTO y regresión. Resolver también las alertas moderadas de herramientas de desarrollo tras examinar su impacto.
5. Eliminar gradualmente `SafeHtmlPipe` y los `innerHTML` de las vistas migrando a plantillas, interpolación y bindings de Angular. Mantener SVG e iconos como recursos controlados. Evaluar CSP y Trusted Types cuando la migración permita activarlos sin excepciones de bypass.

**Criterio de salida:** ninguna sesión persiste tokens de acceso en `localStorage`; el acceso funciona en la configuración de producción; la auditoría de dependencias de ejecución no informa alertas altas; la interfaz sigue superando sus pruebas.

### Fase 3. Diseño funcional y accesibilidad — P2

1. Mantener la paleta clara/oscura y simplificar la pantalla de acceso. Retirar cifras fijas o rotularlas claramente como ejemplo. Usar “tiempo real”, “satelital” o “predictivo” solo si existe una fuente de datos y una función verificable.
2. Elevar el tamaño de etiquetas y metadatos que hoy usan valores cercanos a `0.62rem`; revisar contraste, estados de foco, alertas y tablas en ambos temas. Conservar la preferencia de movimiento reducido.
3. Mostrar unidades, fecha de última medición, estado de carga y procedencia de cada indicador operativo. Mantener los módulos de trabajo de campo claramente separados de abastecimiento.
4. Validar escritorio, tableta y móvil con datos largos, listas vacías, errores de red y teclado. Las pruebas actuales de 320 px sirven como punto de partida.

**Criterio de salida:** ningún indicador fijo se presenta como medición actual y las tareas principales se completan con teclado y en ambos temas sin pérdida de información.

### Fase 4. Depuración y calidad de mantenimiento — P2

1. Construir el mapa de importaciones desde `frontend/src/main.ts` antes de retirar archivos anteriores a Angular. Eliminar `vite.config.ts`, rutas y componentes heredados solo cuando se confirme que no participan en compilación, pruebas ni documentación necesaria. Revisar si la dependencia directa `vite` sigue siendo necesaria.
2. Conservar una sola copia de la fotografía del acceso y actualizar su ruta. Actualizar `README.md`, scripts e instrucciones para describir Angular CLI y el pipeline vigente.
3. Sustituir los comentarios decorativos por comentarios breves que expliquen decisiones, invariantes y límites de seguridad. Retirar emojis de logs y mensajes institucionales donde no aporten significado. Conservar atribuciones, historial y la declaración académica de uso de IA cuando corresponda.
4. Añadir al CI las pruebas de autorización, `npm audit` con política de severidad acordada y las E2E apropiadas para una ejecución estable. La CI actual compila Angular y prueba el backend, pero no ejecuta Playwright.

**Criterio de salida:** cada archivo restante tiene una función comprobable, la documentación coincide con el ejecutable y CI detecta regresiones de autorización y de interfaz.

## 5. Orden de trabajo y entregables

| Orden | Entregable | Verificación antes de integrar |
| --- | --- | --- |
| 1 | Pruebas de acceso y corrección de S-01 a S-03 | Casos entre tenants, granjas y piscinas; ausencia de escrituras en `GET`. |
| 2 | Endurecimiento de sesión, acceso de producción y proxy | Flujo de sesión y desafío real; configuración reproducible detrás del proxy. |
| 3 | Actualización de dependencias y HTML seguro | `npm audit`, compilación, pruebas unitarias y E2E aprobadas. |
| 4 | Ajustes visuales y accesibilidad | Revisión visual en ambos temas, móvil y escritorio; métricas auténticas o claramente ilustrativas. |
| 5 | Retiro de código heredado y documentación | Mapa de importaciones, compilación y pruebas; README alineado con Angular. |

## 6. Límites y fuentes técnicas

La auditoría es de código y de comportamiento local. No se verificaron reglas reales de GitHub, despliegue, certificados, configuración del proxy, secretos del entorno ni datos de MongoDB de producción. La existencia de un riesgo condicionado no equivale a demostrar su explotación. Los archivos `.env` locales están excluidos por `.gitignore`; no se copiaron sus valores al informe.

Referencias técnicas utilizadas: [OWASP API Security Top 10](https://api-security.owasp.org/editions/2023/en/0x11-t10/), [seguridad de Angular](https://angular.dev/best-practices/security), [almacenamiento del navegador según OWASP](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html), [configuración de Express detrás de proxies](https://expressjs.com/en/guide/behind-proxies/), [semántica de métodos HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods) y [aviso de Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
