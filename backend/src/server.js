'use strict';
/* ═══════════════════════════════════════════════════════════
   By Fekas Corp. — ERP Camaronera | Servidor Principal
   Express + Helmet + Rate Limit + CORS + MongoDB
   ═══════════════════════════════════════════════════════════ */
const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');

const { env, isDev } = require('./config/env');
const { connectDB } = require('./config/db');
const { sanitize } = require('./middlewares/sanitize.middleware');
const authRoutes = require('./routes/auth.routes');
const apiRoutes = require('./routes/api.routes');

// Bootstrap imports
const { Usuario, Rol, Permiso } = require('./models/usuario.model');

const app = express();

// ─── Seguridad de cabeceras ───────────────────────────────
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true
}));

// ─── CORS ─────────────────────────────────────────────────
app.use(cors({
  origin: env.APP_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── HTTPS redirect (solo producción) ─────────────────────
if (!isDev) {
  app.use((req, res, next) => {
    if (req.secure) return next();
    return res.redirect(308, `https://${req.get('host')}${req.originalUrl}`);
  });
}

// ─── Body parsing y cookies ───────────────────────────────
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());

// ─── NoSQL sanitization ──────────────────────────────────
app.use(sanitize);

// ─── Rate limiting global ─────────────────────────────────
app.use(rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

// ─── Rutas ────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ─── Manejo global de errores ─────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(413).json({ error: 'Archivo excede límites' });
  }
  if (err?.status) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof mongoose.Error.ValidationError ||
      err instanceof mongoose.Error.CastError ||
      err?.code === 11000) {
    return res.status(400).json({ error: 'Documento inválido o duplicado' });
  }
  console.error('Fallo de servidor:', err);
  res.status(500).json({ error: 'Error interno' });
});

// ─── Bootstrap: alta inicial ──────────────────────────────
async function bootstrap() {
  if (!env.BOOTSTRAP_EMAIL || !env.BOOTSTRAP_PASSWORD) {
    throw new Error('Defina BOOTSTRAP_EMAIL y BOOTSTRAP_PASSWORD');
  }
  await connectDB();

  if (await Usuario.exists({})) {
    throw new Error('Bootstrap permitido solo en una base de datos sin usuarios');
  }

  const tenant = new mongoose.Types.ObjectId();
  const actions = [
    ['piscinas', 'leer'], ['muestreos', 'crear'], ['agua', 'crear'],
    ['alimentacion', 'crear'], ['kardex', 'leer'], ['compras', 'leer'],
    ['compras', 'crear'], ['proveedores', 'crear'], ['adjuntos', 'crear']
  ];

  const permissions = [];
  for (const [recurso, accion] of actions) {
    permissions.push(await Permiso.create({
      tenant_id: tenant,
      codigo: `${recurso}:${accion}`,
      recurso, accion,
      descripcion: `${recurso} ${accion}`
    }));
  }

  const role = await Rol.create({
    tenant_id: tenant,
    codigo: 'administrador',
    nombre: 'Administrador',
    permiso_ids: permissions.map(x => x._id),
    activo: true
  });

  const user = await Usuario.create({
    tenant_id: tenant,
    email: env.BOOTSTRAP_EMAIL,
    password_hash: env.BOOTSTRAP_PASSWORD,
    nombre: 'Administrador inicial',
    activo: true,
    rol_ids: [role._id],
    granja_ids: [],
    piscina_ids: []
  });

  console.log(`\n🦐 Bootstrap completado:`);
  console.log(`   Tenant: ${tenant}`);
  console.log(`   Usuario: ${user.email}`);
  console.log(`   Asigne granja_ids y piscina_ids antes de operar.\n`);
  await mongoose.disconnect();
}

// ─── Inicio ───────────────────────────────────────────────
if (require.main === module) {
  if (process.argv[2] === 'bootstrap') {
    bootstrap().catch(e => { console.error(e.message); process.exitCode = 1; });
  } else {
    connectDB()
      .then(() => {
        const server = app.listen(env.PORT, () => {
          console.log(`\n🦐 By Fekas Corp. — ERP Camaronera`);
          console.log(`   API corriendo en puerto ${env.PORT}`);
          console.log(`   Entorno: ${env.NODE_ENV}\n`);
        });

        server.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.error(`\n❌ Error: El puerto ${env.PORT} ya está en uso.`);
            console.error(`   Cierre el proceso en el puerto ${env.PORT} o configure otro PORT en .env\n`);
          } else {
            console.error('Error en el servidor HTTP:', err.message);
          }
          process.exit(1);
        });
      })
      .catch(e => { console.error('Error conectando a MongoDB:', e.message); process.exitCode = 1; });
  }
}

module.exports = { app, connectDB };
