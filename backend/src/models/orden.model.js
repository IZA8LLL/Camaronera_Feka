'use strict';
/* Modelo de Órdenes de Compra.
   Incluye líneas embebidas con producto, cantidad y precio unitario. */
const mongoose = require('mongoose');
const { base, schemaOptions } = require('../config/helpers');
const { tenantScope } = require('../middlewares/tenant.middleware');

const ordenSchema = new mongoose.Schema({
  ...base,
  proveedor_id: mongoose.Schema.Types.ObjectId,
  bodega_id: mongoose.Schema.Types.ObjectId,
  numero: String,
  fecha: Date,
  estado: String,
  total: mongoose.Schema.Types.Decimal128,
  creado_por: mongoose.Schema.Types.ObjectId,
  aprobado_por: { type: mongoose.Schema.Types.ObjectId, immutable: true },
  lineas: [{
    _id: false,
    producto_id: mongoose.Schema.Types.ObjectId,
    cantidad: mongoose.Schema.Types.Decimal128,
    precio_unitario: mongoose.Schema.Types.Decimal128
  }]
}, schemaOptions);

ordenSchema.plugin(tenantScope);

const Orden = mongoose.model('Orden', ordenSchema, 'ordenes_compra');

module.exports = { Orden };
