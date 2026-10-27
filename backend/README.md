# 🦐 By Fekas Corp. — Backend API (ERP Camaronera)

API REST robusta desarrollada en Node.js, Express y Mongoose para la gestión integral de camaroneras, estanques, parámetros fisicoquímicos, muestreos biométricos, alimentación transaccional (Kardex) y compras a proveedores con cifrado AES-256.

---

## 🛡️ Arquitectura de Seguridad Implementada

1. **Aislamiento Multitenant (AsyncLocalStorage):**
   - Plugin global de Mongoose que inyecta automáticamente `{ tenant_id }` en cada query, mutación y agregación.
2. **Autenticación Robusta:**
   - Hashing de contraseñas con **Argon2id** (memoria 64MB, 3 iteraciones, paralelismo 1).
   - Tokens JWT: Access Token de corta duración (15 minutos) y Refresh Token seguro rotativo en Cookie HTTP-Only (`__Host-` / `SameSite=Strict`).
3. **Cifrado en Reposo de Datos Sensibles:**
   - Cifrado simétrico autenticado **AES-256-GCM** para RUCs de proveedores y cuentas bancarias.
4. **Prevención de Inyecciones NoSQL:**
   - Sanitización contra operadores maliciosos (`$where`, `$expr`, regex masivos).
5. **Mitigación de Bots y Abusos:**
   - Integración con **Cloudflare Turnstile** para inicio de sesión seguro.
   - Rate limiting por IP y hash SHA-256 de usuario.
6. **Integridad de Transacciones ACID:**
   - Descuento automático de inventario Kardex y registro de consumo de alimento mediante sesiones de transacción en MongoDB.

---

## 🚀 Requisitos Previos

- Node.js 18.0 o superior
- Base de datos en MongoDB Atlas (o réplica local) denominada `by_fekas_corp_db`

---

## ⚙️ Configuración (.env)

Cree un archivo `.env` en la raíz de la carpeta `backend/` basándose en `.env.example`:

```env
NODE_ENV=development
PORT=3000

# Cadena de conexión de MongoDB Atlas
MONGO_URI=mongodb+srv://<usuario>:<password>@cluster0.mongodb.net/by_fekas_corp_db?retryWrites=true&w=majority

# Seguridad JWT (mínimo 32 caracteres aleatorios)
JWT_SECRET=super_secret_camaronera_fekas_jwt_key_2026_xYz987!

# Clave AES-256-GCM (32 bytes en Base64 = 44 caracteres)
ENCRYPTION_KEY_BASE64=YnlfZmVrYXNfY29ycF9zZWN1cmVfa2V5XzIwMjZfMzJieXRlczE=

# Cloudflare Turnstile (opcional en desarrollo)
TURNSTILE_SECRET=0x4AAAAAAA...
TURNSTILE_HOSTNAME=localhost

# Origen del Frontend
APP_ORIGIN=http://localhost:5173

# Directorio privado de uploads
PRIVATE_UPLOAD_DIR=../uploads

# Credenciales para inicializar el primer usuario Administrador
BOOTSTRAP_EMAIL=admin@byfekas.com
BOOTSTRAP_PASSWORD=AdminCamaronera2026!
```

---

## 📦 Instalación y Ejecución

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

## 📡 Endpoints de la API

### Autenticación (`/auth`)
- `POST /auth/login`: Autenticación con tenant, email, password y token de Turnstile. Retorna access_token y cookie de refresh.
- `POST /auth/refresh`: Renovación transparente del access_token mediante cookie de refresh.

### Rutas Protegidas (`/api`)
- `GET /api/me`: Información del usuario en sesión, permisos RBAC y asignación de granjas.
- `POST /api/logout`: Cierre de sesión e invalidación de tokens.
- `GET /api/piscinas`: Lectura de estanques y métricas en tiempo real.
- `POST /api/operaciones/muestreo`: Registro de biometría (peso, talla, cálculo de biomasa).
- `POST /api/operaciones/agua`: Registro fisicoquímico (oxígeno, pH, salinidad, amonio) con detección de alertas.
- `POST /api/operaciones/alimentacion`: Consumo de alimento diario y descuento atómico de inventario en Kardex.
- `GET /api/proveedores`: Listado de proveedores autorizados.
- `POST /api/proveedores`: Registro de proveedor con cifrado automático AES-256-GCM.
- `GET /api/ordenes`: Consulta de órdenes de compra con cálculo de IVA y totales.
- `POST /api/ordenes`: Emisión de nueva orden de compra.

---

## 🧪 Health Check
- `GET /health`: Estado del servicio y tiempo de actividad.
