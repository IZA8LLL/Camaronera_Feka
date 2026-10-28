# Plan técnico: registro de calidad de agua

## Stack y componentes
- API: Node.js, Express, Zod y Mongoose existentes.
- Contrato de entrada: `waterDto` en `backend/src/middlewares/validate.middleware.js`.
- Flujo protegido: autenticación y permiso en `backend/src/routes/api.routes.js`.
- Persistencia y cálculo de alertas: controlador de operaciones y modelo Agua.
- Verificación: Node.js `node:test`, ejecutado localmente y en GitHub Actions.

## Decisiones
- Reutilizar las reglas de validación del servidor como fuente de verdad.
- Mantener autorización y aislamiento multitenant en la API.
- No cambiar límites del dominio sin aprobación técnica acuícola.
- La interfaz ofrece validación rápida; el servidor siempre repite la validación.

## Riesgos
- Los rangos permitidos en el DTO son límites de entrada, no recomendaciones de manejo acuícola.
- Las pruebas unitarias no prueban la conexión real a MongoDB ni la autorización extremo a extremo.
