'use strict';
/* Funciones utilitarias compartidas entre módulos del backend. */
const { z } = require('zod');
const mongoose = require('mongoose');
const { AsyncLocalStorage } = require('node:async_hooks');
const { createHash } = require('node:crypto');

// AsyncLocalStorage para aislamiento por tenant
const scopeStore = new AsyncLocalStorage();

// Validador de ObjectId como string hexadecimal de 24 caracteres
const oid = () => z.string().regex(/^[a-f\d]{24}$/i);

// Convertir string a ObjectId de Mongoose
const id = (v) => new mongoose.Types.ObjectId(v);

// Hash SHA-256
const sha = (v) => createHash('sha256').update(v).digest('hex');

// Convertir número a Decimal128
const dec = (v) => mongoose.Types.Decimal128.fromString(String(v));

// Limpiar texto de caracteres de control y HTML
const safeText = (v) => v.replace(/[\u0000-\u001f\u007f<>]/g, '').trim();

// Campos base comunes a modelos con tenantScope
const base = {
  tenant_id: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true },
  granja_id: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true }
};

// Opciones comunes de schema
const schemaOptions = {
  strict: 'throw',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false
};

// Detectar operador $where en filtros (prevención NoSQL injection)
function containsWhere(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, item]) =>
    key === '$where' || containsWhere(item)
  );
}

module.exports = {
  scopeStore, oid, id, sha, dec, safeText,
  base, schemaOptions, containsWhere
};
