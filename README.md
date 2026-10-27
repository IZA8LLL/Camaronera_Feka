# 🦐 By Fekas Corp. — ERP Camaronera

Proyecto integral para la gestión, control biométrico y monitoreo en tiempo real de camaroneras, respaldado por la base de datos `by_fekas_corp_db` en MongoDB Atlas y con arquitectura de seguridad multinivel.

---

## 📁 Estructura del Proyecto

El proyecto está separado limpiamente en dos capas independientes:

```
Proyecto_Camaronera/
├── backend/                  # API REST con Express, Mongoose y Arquitectura de Seguridad
│   ├── src/
│   │   ├── config/           # Conexión MongoDB con TLS y validación Zod de variables
│   │   ├── controllers/      # Controladores de Auth, Piscinas, Operaciones y Compras
│   │   ├── middlewares/      # TenantScope, JWT, Turnstile Bot check, Sanitización NoSQL
│   │   ├── models/           # 10 Esquemas Mongoose (Piscinas, Muestreos, Agua, Kardex, etc.)
│   │   ├── routes/           # Rutas públicas (/auth) y protegidas (/api)
│   │   ├── services/         # Cifrado simétrico AES-256-GCM
│   │   └── server.js         # Servidor principal con Helmet, Rate Limit y Bootstrap
│   ├── .env.example          # Plantilla de variables de entorno
│   ├── .env                  # Variables locales configuradas
│   ├── package.json          # Dependencias y scripts del backend
│   └── README.md             # Documentación detallada del backend
│
├── frontend/                 # Single Page Application con Vite, TypeScript y Vanilla CSS
│   ├── src/
│   │   ├── core/
│   │   │   ├── guards/       # AuthGuard para protección de vistas
│   │   │   ├── interceptors/ # Inyección de token Bearer y manejo de errores 401
│   │   │   ├── models/       # Interfaces TypeScript espejo del backend
│   │   │   └── toast.ts      # Sistema de notificaciones toast flotantes
│   │   ├── environments/     # Variables de entorno frontend
│   │   ├── pages/            # Vistas (Login, Dashboard, Piscinas, Muestreo, Agua, Alimentación, Compras)
│   │   ├── services/         # Clientes HTTP (Auth, Piscinas, Operaciones, Compras)
│   │   ├── theme/            # Design System (variables.css con estética oceánica y glassmorphism)
│   │   ├── app.component.ts  # Shell de la aplicación (Sidebar, Topbar y Outlet)
│   │   ├── app.routes.ts     # Enrutador SPA con hash routing
│   │   └── main.ts           # Punto de entrada
│   ├── index.html            # HTML con Google Fonts Inter
│   ├── vite.config.ts        # Configuración de Vite con proxy hacia el backend
│   ├── tsconfig.json         # Configuración estricta de TypeScript
│   ├── package.json          # Dependencias de Vite y TypeScript
│   └── README.md             # Documentación detallada del frontend
│
├── by_fekas_corp_db.mongodb.js # Script inicial de base de datos de MongoDB Atlas
├── security_architecture.js    # Especificación de seguridad de referencia
└── README.md                   # Esta guía general
```

---

## 🚀 Puesta en Marcha Rápida

### 1. Iniciar el Backend
```bash
cd backend
npm install
npm run dev
```
> El servidor backend escuchará en el puerto `3000`.

### 2. Iniciar el Frontend
En una segunda terminal:
```bash
cd frontend
npm install
npm run dev
```
> La aplicación estará disponible en `http://localhost:5173`. Las peticiones `/auth` y `/api` se redirigen transparentemente al backend sin problemas de CORS.

---

## 🔒 Aspectos de Seguridad Destacados

- **Multitenancy Total:** Filtrado automático por `tenant_id` mediante AsyncLocalStorage.
- **Argon2id + JWT:** Hashing moderno y tokens efímeros con rotación segura.
- **Cifrado AES-256-GCM:** Protección en reposo de RUCs y cuentas bancarias de proveedores.
- **Transacciones ACID:** Descuento atómico de insumos alimenticios en Kardex.
- **Protección contra Inyecciones:** Sanitización activa de queries MongoDB.
