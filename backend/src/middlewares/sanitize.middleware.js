'use strict';
/* Prevención de inyecciones NoSQL.
   Rechaza claves de operador ($) en body, query y params. */
const mongoSanitize = require('express-mongo-sanitize');

function sanitize(req, res, next) {
  if (mongoSanitize.has(req.body || {}) ||
      mongoSanitize.has(req.query || {}) ||
      mongoSanitize.has(req.params || {})) {
    return res.status(400).json({ error: 'Claves de consulta prohibidas' });
  }
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  next();
}

module.exports = { sanitize };
