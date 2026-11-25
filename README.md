# By Fekas Corp. — ERP Camaronera

Proyecto académico para registrar y consultar operaciones de granjas camaroneras: piscinas, ciclos de cultivo, calidad de agua, muestreos, alimentación, inventario y compras.

## Estructura

- `backend/`: API Express, autenticación, autorización y persistencia en MongoDB.
- `frontend/`: aplicación Angular, páginas, servicios y estilos.
- `docs/MODELADO_BASE_DATOS.md`: modelo de datos.
- `specs/`: especificaciones funcionales del proyecto.

Los informes internos de auditoría y las evidencias locales se mantienen fuera del repositorio mediante `.gitignore`. El código de seguridad, las pruebas y la configuración de ejemplo sí se versionan.

## Desarrollo local

Requisitos: Node.js y una instancia de MongoDB compatible con las transacciones utilizadas por la API. Configure `backend/.env` a partir de `backend/.env.example`; no use los valores de ejemplo como credenciales reales.

En dos terminales:

```bash
cd backend
npm ci
npm run dev
```

```bash
cd frontend
npm ci
npm run dev
```

El frontend usa Angular CLI en `http://localhost:5173` y redirige `/auth`, `/api` y `/health` al backend local mediante `frontend/proxy.conf.json`. Los comandos de la raíz delegan en los paquetes: `npm run dev`, `npm run build`, `npm test` y `npm run test:e2e`.

## Verificación

```bash
cd backend && npm test
cd frontend && npm run build
cd frontend && npm run test:e2e
```

Las pruebas de autorización del backend crean una base temporal con datos sintéticos. Las pruebas de interfaz simulan la API. Consulte `backend/README.md` y `frontend/README.md` para detalles de cada aplicación.
