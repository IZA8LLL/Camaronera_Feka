'use strict';
/* Modelos de Inventario: Lote y Kardex (movimientos de bodega).
   El Kardex registra entradas, salidas y ajustes con saldo posterior. */
const mongoose = require('mongoose');
const { base, schemaOptions } = require('../config/helpers');
const { tenantScope } = require('../middlewares/tenant.middleware');

// ─── Lote de Inventario ───────────────────────────────────
const loteSchema = new mongoose.Schema({
  ...base,
  bodega_id: mongoose.Schema.Types.ObjectId,
  producto_id: mongoose.Schema.Types.ObjectId,
  proveedor_id: mongoose.Schema.Types.ObjectId,
  codigo_lote: String,
  fecha_ingreso: Date,
  vence_at: Date,
  cantidad_inicial: mongoose.Schema.Types.Decimal128,
  cantidad_actual: mongoose.Schema.Types.Decimal128,
  costo_unitario: mongoose.Schema.Types.Decimal128
}, schemaOptions);

loteSchema.plugin(tenantScope);

const Lote = mongoose.model('Lote', loteSchema, 'lotes_inventario');

// ─── Movimientos Kardex ───────────────────────────────────
const kardexSchema = new mongoose.Schema({
  ...base,
  bodega_id: mongoose.Schema.Types.ObjectId,
  lote_id: mongoose.Schema.Types.ObjectId,
  usuario_id: mongoose.Schema.Types.ObjectId,
  fecha: Date,
  tipo: String,
  cantidad: mongoose.Schema.Types.Decimal128,
  saldo_posterior: mongoose.Schema.Types.Decimal128,
  referencia: String,
  motivo: String
}, schemaOptions);

kardexSchema.plugin(tenantScope);

const Kardex = mongoose.model('Kardex', kardexSchema, 'movimientos_kardex');

module.exports = { Lote, Kardex };
