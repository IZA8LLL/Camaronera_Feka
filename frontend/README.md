# By Fekas Corp. — Frontend

ERP camaronero con Angular, TypeScript y CSS. La interfaz ofrece temas claro y oscuro, navegación adaptable a móvil y servicios HTTP para la API.

## Ejecutar

Desde la carpeta `frontend`:

```bash
npm ci
npm run dev
```

Angular CLI atiende en el puerto 5173 y usa `proxy.conf.json` para redirigir `/auth`, `/api` y `/health` al backend local en el puerto 3000. Las operaciones reales necesitan el backend y su configuración. No se incluyen credenciales ni datos de demostración en la aplicación.

La tipografía usa fuentes del sistema para que la compilación no dependa de un proveedor externo de fuentes.

## Organización

```text
src/
  main.ts                 Arranque de Angular
  app/
    app.component.ts      Shell y navegación principal
    app.routes.ts         Rutas y protección de acceso
  shared/
    ui.ts                 Iconos, encabezados, secciones y escape de texto
    navigation.ts         Menú y comportamiento accesible en móvil
  theme/
    variables.css         Entrada CSS y orden de importaciones
    tokens.css            Colores, tipografía y medidas compartidas
    base.css              Base, foco, utilidades y movimiento reducido
    layout.css            Sidebar, topbar y puntos de adaptación
    components.css        Tarjetas, tablas, botones, campos y notificaciones
    pages.css             Composición específica de páginas
  pages/                  Plantillas y eventos de cada módulo
  services/               Comunicación HTTP y sesión
  core/                   Modelos, guardas y notificaciones
tests/erp.spec.ts          Regresión de interfaz con API simulada
```

El recorrido de ejecución es `src/main.ts` → `src/app/app.config.ts` y `src/app/app.routes.ts` → componentes de `src/app/pages/` → vistas de `src/pages/` → servicios de `src/services/`. Las vistas comparten tipos y funciones de `src/core/` y `src/shared/`. `src/app/shared/safe-html.pipe.ts` sigue en uso por el shell Angular; su sustitución corresponde a la fase de endurecimiento de HTML.

## Pantallas disponibles

- Acceso con correo y contraseña, errores de autenticación y cierre de sesión.
- Resumen operativo: piscinas, alertas, biomasa y accesos a registros.
- Piscinas: últimas mediciones y enlaces a formularios con datos prellenados.
- Los indicadores muestran unidades, procedencia y fecha disponible. La ausencia de una lectura se presenta explícitamente; la biomasa se identifica como estimación del ciclo.
- Muestreo, agua y alimentación: formularios conectados a los servicios existentes.
- Compras: consulta de órdenes y proveedores, y registro de proveedores.

Las mediciones se consultan al entrar en las pantallas; no hay actualización por streaming. La pantalla de acceso no muestra cifras de producción ficticias. La pantalla de compras no incorpora creación de órdenes.

## Verificación

```bash
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
# Ejecutar todo:
npm run check
```

Playwright inicia Angular CLI en `127.0.0.1:4175`. Prueba escritorio y móvil, los contratos de envío de los tres registros y proveedores, acceso/salida, creación explícita de ciclos, menú con teclado, estados vacíos y de error, escape de datos y desbordamiento a 320px. Todas las llamadas a `/api` y `/auth` se interceptan con datos ficticios: estas pruebas no requieren MongoDB y no certifican la integración con la base real.

Las capturas se generan en `test-results/`; ante fallas se conserva también una traza. Esos resultados no se versionan. Para ejecutar en otra máquina, usar `npm ci` e instalar Chromium con el comando indicado.

## Criterios para mantener el diseño

El tema claro es el predeterminado, incluso si el sistema operativo usa modo oscuro. El botón **Modo oscuro**, disponible en acceso y barra superior, alterna ambos temas con teclado o ratón y anuncia su estado mediante `aria-pressed`. La preferencia se guarda localmente con la clave `by-fekas-theme`; si el navegador bloquea el almacenamiento, el cambio sigue funcionando durante la página actual. Cambiar de tema no vuelve a renderizar formularios ni elimina datos introducidos.

`public/theme-init.js` restaura la preferencia antes del primer render y `src/shared/theme.ts` controla el botón. Los colores de ambos modos están en `tokens.css`; utilizar las variables semánticas para que cualquier nuevo componente soporte ambos temas.

1. Definir los colores compartidos en `tokens.css`; reservar verde, ámbar y rojo para estados, siempre acompañados de texto.
2. Reutilizar `pageHeader`, `formIntro`, `icon` y las clases existentes antes de crear variantes.
3. Usar enlaces para navegar y botones para acciones. Evitar manejadores JavaScript dentro de atributos HTML.
4. Aplicar `escapeHtml` a texto dinámico insertado en plantillas; construir parámetros con `URLSearchParams`. Usar `textContent` para mensajes.
5. Mantener las llamadas a la API en `services/` y los tipos en `core/models/`. Los componentes de `shared/` no deben consultar servicios.
6. Conservar etiquetas de formularios, foco visible, navegación por teclado, control del foco en el menú móvil y soporte para movimiento reducido.
7. Antes de integrar cambios, ejecutar `npm run check` y revisar las capturas de escritorio y móvil.

Estos criterios aportan mantenibilidad, usabilidad y prevención de regresiones. No constituyen una certificación de una norma de calidad ni una auditoría completa de accesibilidad o seguridad del ERP.

## Alcance del rediseño

La interfaz usa Angular como punto de entrada y conserva los formularios de campo. La creación de ciclos requiere una acción explícita; la consulta del siguiente código es de solo lectura. El atributo `step="any"` del oxígeno admite decimales respetando el mínimo, máximo y campo obligatorio.
