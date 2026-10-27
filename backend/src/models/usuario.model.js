'use strict';
/* Modelos de seguridad: Usuario, Rol, Permiso, Sesión.
   El pre('save') de usuario transforma la contraseña a Argon2id. */
const mongoose = require('mongoose');
const argon2 = require('argon2');
const { schemaOptions } = require('../config/helpers');

// ─── Usuario ──────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true, select: false },
  nombre: { type: String, required: true },
  activo: { type: Boolean, required: true, default: true },
  rol_ids: { type: [mongoose.Schema.Types.ObjectId], default: [], immutable: true },
  granja_ids: { type: [mongoose.Schema.Types.ObjectId], default: [], immutable: true },
  piscina_ids: { type: [mongoose.Schema.Types.ObjectId], default: [], immutable: true },
  ultimo_acceso: Date,
  cedula_cifrada: { type: Buffer, select: false },
  cedula_iv: { type: Buffer, select: false },
  cedula_tag: { type: Buffer, select: false }
}, schemaOptions);

userSchema.index({ tenant_id: 1, email: 1 }, { unique: true });

// Hash Argon2id automático al guardar contraseña
userSchema.pre('save', async function () {
  if (this.isModified('password_hash') && !this.password_hash.startsWith('$argon2id$')) {
    this.password_hash = await argon2.hash(this.password_hash, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1
    });
  }
});

const Usuario = mongoose.model('Usuario', userSchema, 'usuarios');

// ─── Rol ──────────────────────────────────────────────────
const rolSchema = new mongoose.Schema({
  tenant_id: mongoose.Schema.Types.ObjectId,
  codigo: String,
  nombre: String,
  permiso_ids: [mongoose.Schema.Types.ObjectId],
  activo: Boolean
}, schemaOptions);

const Rol = mongoose.model('Rol', rolSchema, 'roles');

// ─── Permiso ──────────────────────────────────────────────
const permisoSchema = new mongoose.Schema({
  tenant_id: mongoose.Schema.Types.ObjectId,
  codigo: String,
  recurso: String,
  accion: String,
  descripcion: String
}, schemaOptions);

const Permiso = mongoose.model('Permiso', permisoSchema, 'permisos');

// ─── Sesión Activa ────────────────────────────────────────
const sesionSchema = new mongoose.Schema({
  tenant_id: mongoose.Schema.Types.ObjectId,
  usuario_id: mongoose.Schema.Types.ObjectId,
  jti_hash: String,
  refresh_hash: String,
  expires_at: Date,
  revocada: Boolean,
  ip_hash: String,
  user_agent: String,
  rotada_en: Date
}, schemaOptions);

const Sesion = mongoose.model('Sesion', sesionSchema, 'sesiones_activas');

module.exports = { Usuario, Rol, Permiso, Sesion };
