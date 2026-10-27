'use strict';
/* Controlador de autenticación: Login, Refresh Token y Logout.
   Login verifica Argon2id y crea sesión con token par (access + refresh).
   Refresh rota atómicamente el refresh token y JTI. */
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const { randomBytes, randomUUID } = require('node:crypto');
const { env } = require('../config/env');
const { id, sha, safeText } = require('../config/helpers');
const { Usuario, Rol, Permiso, Sesion } = require('../models/usuario.model');
const { Auditoria } = require('../models/auditoria.model');

const cookieOptions = {
  httpOnly: true,
  secure: !require('../config/env').isDev,
  sameSite: 'strict',
  path: '/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 días
};

function createAccess(user, sessionId, jti) {
  return jwt.sign(
    { sub: String(user._id), tenant_id: String(user.tenant_id), sid: String(sessionId), jti },
    env.JWT_SECRET,
    { algorithm: 'HS256', audience: 'by-fekas-erp', issuer: 'by-fekas-corp', expiresIn: '15m' }
  );
}

function tokenPair() {
  return {
    refresh: randomBytes(32).toString('base64url'),
    jti: randomUUID()
  };
}

async function audit(req, accion, recurso, recursoId, resultado, detalle = '') {
  const cleaned = safeText(detalle).slice(0, 500);
  await Auditoria.create({
    tenant_id: req.auth?.tenantId || id(req.data?.tenant_id),
    usuario_id: req.auth?.userId,
    accion, recurso,
    recurso_id: recursoId,
    fecha: new Date(),
    ip_hash: sha(req.ip || ''),
    resultado,
    ...(cleaned ? { detalle: cleaned } : {})
  });
}

// POST /auth/login
async function login(req, res, next) {
  try {
    const { tenant_id, email, password } = req.data;
    const filter = {
      email: email.toLowerCase(),
      activo: true
    };
    if (tenant_id) {
      filter.tenant_id = id(tenant_id);
    }

    const user = await Usuario.findOne(filter).select('+password_hash');

    if (!user || !(await argon2.verify(user.password_hash, password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { refresh, jti } = tokenPair();
    const session = await Sesion.create({
      tenant_id: user.tenant_id,
      usuario_id: user._id,
      jti_hash: sha(jti),
      refresh_hash: sha(refresh),
      expires_at: new Date(Date.now() + cookieOptions.maxAge),
      revocada: false,
      ip_hash: sha(req.ip || ''),
      user_agent: (req.get('user-agent') || '').slice(0, 250)
    });

    // Actualizar último acceso
    await Usuario.updateOne({ _id: user._id }, { $set: { ultimo_acceso: new Date() } });

    res.cookie('refresh_token', `${session._id}.${refresh}`, cookieOptions);
    res.json({
      access_token: createAccess(user, session._id, jti),
      token_type: 'Bearer',
      expires_in: 900,
      user: {
        id: String(user._id),
        nombre: user.nombre,
        email: user.email,
        tenant_id: String(user.tenant_id)
      }
    });
  } catch (e) { next(e); }
}

// POST /auth/refresh
async function refresh(req, res, next) {
  try {
    const match = /^([a-f\d]{24})\.([A-Za-z0-9_-]{43})$/.exec(req.cookies?.refresh_token || '');
    if (!match) return res.status(401).json({ error: 'Sesión inválida' });

    const oldHash = sha(match[2]);
    const userSession = await Sesion.findOne({
      _id: id(match[1]),
      refresh_hash: oldHash,
      revocada: false,
      expires_at: { $gt: new Date() }
    });

    if (!userSession) return res.status(401).json({ error: 'Sesión inválida' });

    const user = await Usuario.findOne({
      _id: userSession.usuario_id,
      tenant_id: userSession.tenant_id,
      activo: true
    });
    if (!user) return res.status(401).json({ error: 'Sesión inválida' });

    const { refresh: newRefresh, jti } = tokenPair();
    const session = await Sesion.findOneAndUpdate(
      { _id: userSession._id, refresh_hash: oldHash, revocada: false },
      {
        $set: {
          refresh_hash: sha(newRefresh),
          jti_hash: sha(jti),
          rotada_en: new Date(),
          expires_at: new Date(Date.now() + cookieOptions.maxAge)
        }
      },
      { returnDocument: 'after' }
    );

    if (!session) return res.status(401).json({ error: 'Sesión reutilizada' });

    res.cookie('refresh_token', `${session._id}.${newRefresh}`, cookieOptions);
    res.json({
      access_token: createAccess(user, session._id, jti),
      token_type: 'Bearer',
      expires_in: 900
    });
  } catch (e) { next(e); }
}

// POST /api/logout
async function logout(req, res, next) {
  try {
    const match = /^Bearer (.+)$/.exec(req.get('authorization') || '');
    if (!match) return res.status(401).json({ error: 'Token requerido' });

    const payload = jwt.verify(match[1], env.JWT_SECRET, {
      algorithms: ['HS256'],
      audience: 'by-fekas-erp',
      issuer: 'by-fekas-corp'
    });

    await Sesion.updateOne(
      { _id: id(payload.sid), tenant_id: req.auth.tenantId, usuario_id: req.auth.userId },
      { $set: { revocada: true } }
    );

    res.clearCookie('refresh_token', {
      path: '/auth', httpOnly: true,
      secure: !require('../config/env').isDev,
      sameSite: 'strict'
    });
    res.status(204).end();
  } catch (e) { next(e); }
}

module.exports = { login, refresh, logout, audit, cookieOptions };
