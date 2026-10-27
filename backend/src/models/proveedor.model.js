'use strict';
/* Modelo de Proveedores.
   RUC y cuenta bancaria cifrados con AES-256-GCM. */
const mongoose = require('mongoose');
const { schemaOptions } = require('../config/helpers');

const proveedorSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true },
  codigo: String,
  nombre: String,
  ruc_cifrado: { type: Buffer, select: false },
  ruc_iv: { type: Buffer, select: false },
  ruc_tag: { type: Buffer, select: false },
  cuenta_cifrada: { type: Buffer, select: false },
  cuenta_iv: { type: Buffer, select: false },
  cuenta_tag: { type: Buffer, select: false },
  contacto: String,
  activo: Boolean
}, schemaOptions);

const Proveedor = mongoose.model('Proveedor', proveedorSchema, 'proveedores');

module.exports = { Proveedor };
