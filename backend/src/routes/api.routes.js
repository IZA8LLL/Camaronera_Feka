'use strict';
/* Rutas protegidas por JWT y permisos RBAC.
   Todas pasan por authenticate + operationLimit. */
const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const { authenticate, permit } = require('../middlewares/auth.middleware');
const { validate, sampleDto, waterDto, feedDto, providerDto, orderDto } = require('../middlewares/validate.middleware');
const { listarPiscinas } = require('../controllers/piscina.controller');
const { crearMuestreo, crearParametrosAgua, crearAlimentacion, listarKardex } = require('../controllers/operacion.controller');
const { listarOrdenes, crearProveedor, crearOrden } = require('../controllers/compras.controller');
const { logout } = require('../controllers/auth.controller');

const router = Router();

// Rate limiting para operaciones: 60 por minuto por usuario
const operationLimit = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: req => req.auth?.userId?.toString() || req.ip
});

// Todas las rutas /api requieren autenticación
router.use(authenticate, operationLimit);

// ─── Perfil del usuario ───────────────────────────────────
router.get('/me', (req, res) => {
  res.json({
    id: String(req.auth.userId),
    granja_ids: req.auth.granjaIds.map(String),
    piscina_ids: req.auth.piscinaIds.map(String),
    permisos: [...req.auth.grants],
    isAdmin: req.auth.isAdmin
  });
});

// ─── Piscinas ─────────────────────────────────────────────
router.get('/piscinas', permit('piscinas', 'leer'), listarPiscinas);

// ─── Muestreos Biométricos ───────────────────────────────
router.post('/muestreos', permit('muestreos', 'crear'), validate(sampleDto), crearMuestreo);

// ─── Parámetros de Agua ──────────────────────────────────
router.post('/parametros-agua', permit('agua', 'crear'), validate(waterDto), crearParametrosAgua);

// ─── Alimentación ─────────────────────────────────────────
router.post('/alimentacion', permit('alimentacion', 'crear'), validate(feedDto), crearAlimentacion);

// ─── Kardex ───────────────────────────────────────────────
router.get('/kardex', permit('kardex', 'leer'), listarKardex);

// ─── Órdenes de Compra ───────────────────────────────────
router.get('/ordenes-compra', permit('compras', 'leer'), listarOrdenes);
router.post('/ordenes-compra', permit('compras', 'crear'), validate(orderDto), crearOrden);

// ─── Proveedores ──────────────────────────────────────────
router.post('/proveedores', permit('proveedores', 'crear'), validate(providerDto), crearProveedor);

// ─── Logout ───────────────────────────────────────────────
router.post('/logout', logout);

module.exports = router;
