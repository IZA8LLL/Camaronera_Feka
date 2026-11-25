# By Fekas Corp. — Backend API (ERP Camaronera)

API REST desarrollada en Node.js, Express y Mongoose para piscinas, parámetros de agua, muestreos, alimentación con Kardex y compras.

---

## Controles de seguridad implementados

1. **Aislamiento por tenant (AsyncLocalStorage):**
   - Los modelos operativos con `tenantScope` filtran por tenant y asignaciones. Las consultas directas a colecciones requieren filtros explícitos.
2. **Autenticación:**
   - Hashing de contraseñas con **Argon2id** (memoria 64MB, 3 iteraciones, paralelismo 1).
   - Tokens JWT: Access Token de corta duración (15 minutos) y Refresh Token seguro rotativo en Cookie HTTP-Only (`__Host-` / `SameSite=Strict`).
3. **Cifrado en Reposo de Datos Sensibles:**
   - Cifrado simétrico autenticado **AES-256-GCM** para RUCs de proveedores y cuentas bancarias.
4. **Validación de entradas:**
   - DTOs validados con Zod, sanitización de claves MongoDB y bloqueo de `$where` en operaciones Mongoose.
5. **Control de acceso y tasa:**
   - Permisos RBAC por ruta, comprobación de granja/piscina/ciclo y límites de peticiones. El backend verifica Turnstile fuera del entorno de desarrollo; la integración de producción del frontend está pendiente.
6. **Integridad de Transacciones ACID:**
   - Descuento automático de inventario Kardex y registro de consumo de alimento mediante sesiones de transacción en MongoDB.

---

## Requisitos previos

- Node.js 22
- Base de datos en MongoDB Atlas (o réplica local) denominada `by_fekas_corp_db`

---

## Configuración (.env)

Cree `backend/.env` a partir de `backend/.env.example` y sustituya todos los valores de ejemplo por valores propios. La clave JWT debe tener al menos 32 caracteres aleatorios y la clave AES debe contener 32 bytes codificados en Base64. El archivo `.env` está excluido de Git.

---

## Instalación y ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Inicializar base de datos con usuario administrador (Bootstrap)
npm run bootstrap

# 3. Iniciar servidor en modo desarrollo
npm run dev

# 4. Iniciar en producción
npm start
```

---

## Endpoints de la API

### Autenticación (`/auth`)
- `POST /auth/login`: Autenticación con tenant, email, password y token de Turnstile. Retorna access_token y cookie de refresh.
- `POST /auth/refresh`: Renovación transparente del access_token mediante cookie de refresh.

### Rutas Protegidas (`/api`)
- `GET /api/me`: Información del usuario en sesión, permisos RBAC y asignación de granjas.
- `POST /api/logout`: Cierre de sesión e invalidación de tokens.
- `GET /api/granjas`: Granjas asignadas al usuario (`granjas:leer`).
- `GET /api/piscinas`: Lectura de estanques y últimas mediciones disponibles.
- `GET /api/ciclos/siguiente`: Consulta del siguiente código sin crear documentos (`piscinas:leer`).
- `POST /api/ciclos`: Creación explícita de un ciclo activo (`ciclos:crear`).
- `POST /api/muestreos`: Registro de biometría (peso, talla, cálculo de biomasa).
- `POST /api/parametros-agua`: Registro fisicoquímico (oxígeno, pH, salinidad, amonio) con detección de alertas.
- `POST /api/alimentacion`: Consumo de alimento diario y descuento atómico de inventario en Kardex.
- `GET /api/proveedores`: Listado de proveedores autorizados.
- `POST /api/proveedores`: Registro de proveedor con cifrado automático AES-256-GCM.
- `GET /api/ordenes`: Consulta de órdenes de compra con cálculo de IVA y totales.
- `POST /api/ordenes`: Emisión de nueva orden de compra.

---

## Estado del servicio
- `GET /health`: Estado del servicio y tiempo de actividad.

## Verificación

`npm test` ejecuta las pruebas de validación y autorización con MongoDB temporal. La CI comprueba sintaxis JavaScript, pruebas y auditoría de dependencias de ejecución. En el backend la auditoría bloquea alertas críticas; en el frontend bloquea alertas altas o críticas. La CI del frontend compila Angular y ejecuta Playwright en Chromium.
