'use strict';
/* Rutas públicas: Login y Refresh Token.
   Login requiere verificación Turnstile y rate limiting. */
const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const { sha } = require('../config/helpers');
const { checkBot } = require('../middlewares/bot.middleware');
const { validate, loginDto } = require('../middlewares/validate.middleware');
const { login, refresh } = require('../controllers/auth.controller');
const { env } = require('../config/env');

const router = Router();

// Rate limiting para login: 5 intentos por IP+email en 15 minutos
const loginLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: req => `${req.ip}:${sha(String(req.body?.email || '').toLowerCase())}`
});

// Verificar origen para refresh
function cookieOrigin(req, res, next) {
  // En desarrollo, permitir cualquier origen
  if (require('../config/env').isDev) return next();
  if (req.get('origin') !== env.APP_ORIGIN) {
    return res.status(403).json({ error: 'Origen inválido' });
  }
  next();
}

// POST /auth/login
router.post('/login', loginLimit, checkBot, validate(loginDto), login);

// POST /auth/refresh
router.post('/refresh', cookieOrigin, refresh);

module.exports = router;
