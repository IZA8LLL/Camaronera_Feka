# By Fekas Corp. — Frontend

ERP camaronero con Vite, TypeScript y CSS. La interfaz usa una paleta pizarra y plata, navegación adaptable a móvil y componentes visuales compartidos. Los servicios HTTP conservan los contratos de la API existente.

## Ejecutar

Desde la carpeta `frontend`:

```bash
npm ci
npm run dev
```

Vite atiende en el puerto 5173 y redirige `/auth`, `/api` y `/health` al backend local en el puerto 3000. Las operaciones reales necesitan el backend y su configuración. No se incluyen credenciales ni datos de demostración en la aplicación.

## Organización

```text
src/
  main.ts                 Entrada y eventos de navegación
  app.component.ts        Shell, inicialización de página y limpieza del menú
  app.routes.ts           Rutas y protección de acceso
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
  core/                   Modelos, guardas, interceptores y notificaciones
tests/erp.spec.ts          Regresión de interfaz con API simulada
```

Los archivos `app.ts` y `router.ts` se conservan como reexportaciones de compatibilidad. No representan implementaciones alternativas.

## Pantallas disponibles

- Acceso con correo y contraseña, errores de autenticación y cierre de sesión.
- Resumen operativo: piscinas, alertas, biomasa y accesos a registros.
- Piscinas: últimas mediciones y enlaces a formularios con datos prellenados.
- Muestreo, agua y alimentación: formularios conectados a los servicios existentes.
- Compras: consulta de órdenes y proveedores, y registro de proveedores.

Las mediciones se consultan al entrar en las pantallas; no hay actualización por streaming. La pantalla de compras no incorpora creación de órdenes. El rediseño no añade módulos de negocio.

## Verificación

```bash
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
# Ejecutar todo:
npm run check
```

Playwright inicia una instancia aislada de Vite en `127.0.0.1:4175`. Prueba escritorio y móvil, los contratos de envío de los tres registros y proveedores, acceso/salida, menú con teclado, estados vacíos y de error, escape de datos y desbordamiento a 320px. Todas las llamadas a `/api` y `/auth` se interceptan con datos ficticios: estas pruebas no requieren MongoDB y no certifican la integración con la base real.

Las capturas se generan en `test-results/`; ante fallas se conserva también una traza. Esos resultados no se versionan. Para ejecutar en otra máquina, usar `npm ci` e instalar Chromium con el comando indicado.

## Criterios para mantener el diseño

1. Definir los colores compartidos en `tokens.css`; reservar verde, ámbar y rojo para estados, siempre acompañados de texto.
2. Reutilizar `pageHeader`, `formIntro`, `icon` y las clases existentes antes de crear variantes.
3. Usar enlaces para navegar y botones para acciones. Evitar manejadores JavaScript dentro de atributos HTML.
4. Aplicar `escapeHtml` a texto dinámico insertado en plantillas; construir parámetros con `URLSearchParams`. Usar `textContent` para mensajes.
5. Mantener las llamadas a la API en `services/` y los tipos en `core/models/`. Los componentes de `shared/` no deben consultar servicios.
6. Conservar etiquetas de formularios, foco visible, navegación por teclado, control del foco en el menú móvil y soporte para movimiento reducido.
7. Antes de integrar cambios, ejecutar `npm run check` y revisar las capturas de escritorio y móvil.

Estos criterios aportan mantenibilidad, usabilidad y prevención de regresiones. No constituyen una certificación de una norma de calidad ni una auditoría completa de accesibilidad o seguridad del ERP.

## Alcance del rediseño

Se reorganizó la presentación sin cambiar servicios, modelos de negocio, endpoints, autenticación ni backend. Se corrigió además el atributo HTML `step` del oxígeno: `min="0.000001"` junto con `step="0.01"` rechazaba valores normales como `6.5`; `step="any"` admite decimales conservando el mínimo, máximo y campo obligatorio. Las pruebas verifican el envío de `6.5` y el rechazo de un valor superior a 30.
