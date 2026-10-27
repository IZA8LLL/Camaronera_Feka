'use strict';
/* Middleware de verificación Cloudflare Turnstile.
   En desarrollo (NODE_ENV=development) se omite la verificación. */
const { env, isDev } = require('../config/env');

async function checkBot(req, res, next) {
  // En desarrollo, omitir verificación de Turnstile
  if (isDev) return next();

  try {
    const ua = req.get('user-agent') || '';
    if (ua.length < 8 || /^(curl|wget|python-requests)\b/i.test(ua)) {
      return res.status(403).json({ error: 'Cliente no admitido' });
    }

    const token = req.body?.turnstile_token;
    if (typeof token !== 'string' || token.length > 2048) {
      return res.status(403).json({ error: 'Challenge requerido' });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    let result;

    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: token,
          remoteip: req.ip
        }),
        signal: controller.signal
      });
      result = await response.json();
    } finally {
      clearTimeout(timer);
    }

    if (!result.success ||
        result.hostname !== env.TURNSTILE_HOSTNAME ||
        result.action !== 'login') {
      return res.status(403).json({ error: 'Challenge inválido' });
    }

    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { checkBot };
