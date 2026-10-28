'use strict';
/* Middleware de autenticación JWT.
   Verifica el Access Token, la sesión vigente y carga permisos RBAC.
   Ejecuta el callback dentro del contexto de tenantScope. */
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { oid, id, sha, scopeStore } = require('../config/helpers');
const { Usuario, Rol, Permiso, Sesion } = require('../models/usuario.model');

async function authenticate(req, res, next) {
  try {
    const match = /^Bearer (.+)$/.exec(req.get('authorization') || '');
    if (!match) return res.status(401).json({ error: 'Token requerido' });

    const payload = jwt.verify(match[1], env.JWT_SECRET, {
      algorithms: ['HS256'],
      audience: 'by-fekas-erp',
      issuer: 'by-fekas-corp'
    });

    // Validar estructura del payload
    if (![payload.sub, payload.tenant_id, payload.sid].every(x => oid().safeParse(x).success) ||
        typeof payload.jti !== 'string') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const tenantId = id(payload.tenant_id);
    const userId = id(payload.sub);

    // Verificar sesión activa y usuario
    const [session, user] = await Promise.all([
      Sesion.findOne({
        _id: id(payload.sid),
        tenant_id: tenantId,
        usuario_id: userId,
        jti_hash: sha(payload.jti),
        revocada: false,
        expires_at: { $gt: new Date() }
      }),
      Usuario.findOne({ _id: userId, tenant_id: tenantId, activo: true })
    ]);

    if (!session || !user) {
      return res.status(401).json({ error: 'Sesión revocada' });
    }

    // Cargar roles y permisos
    const roles = await Rol.find({
      _id: { $in: user.rol_ids },
      tenant_id: tenantId,
      activo: true
    });
    const permisoIds = roles.flatMap(r => r.permiso_ids);
    const permisos = await Permiso.find({
      _id: { $in: permisoIds },
      tenant_id: tenantId
    }).select('recurso accion');

    const grants = new Set(permisos.map(p => `${p.recurso}:${p.accion}`));

    // Contexto de autenticación
    req.auth = {
      tenantId,
      userId,
      granjaIds: user.granja_ids,
      piscinaIds: user.piscina_ids,
      isAdmin: roles.some(r => r.codigo === 'administrador'),
      grants
    };

    // Ejecutar en el contexto del tenant
    scopeStore.run(req.auth, next);
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Middleware de autorización por recurso:acción
const permit = (resource, action) => (req, res, next) => {
  if (req.auth?.isAdmin || req.auth?.grants?.has(`${resource}:${action}`)) return next();
  return res.status(403).json({ error: 'Permiso denegado' });
};

module.exports = { authenticate, permit };
