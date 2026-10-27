'use strict';
/* Modelo de Consumo de Alimento Diario.
   Incluye FCA (factor de conversión alimenticia) y biomasa. */
const mongoose = require('mongoose');
const { base, schemaOptions } = require('../config/helpers');
const { tenantScope } = require('../middlewares/tenant.middleware');

const consumoSchema = new mongoose.Schema({
  ...base,
  piscina_id: mongoose.Schema.Types.ObjectId,
  ciclo_id: mongoose.Schema.Types.ObjectId,
  plan_id: mongoose.Schema.Types.ObjectId,
  lote_id: mongoose.Schema.Types.ObjectId,
  usuario_id: mongoose.Schema.Types.ObjectId,
  fecha: Date,
  cantidad_kg: mongoose.Schema.Types.Decimal128,
  fca: mongoose.Schema.Types.Decimal128,
  biomasa_kg: mongoose.Schema.Types.Decimal128,
  observacion: String
}, schemaOptions);

consumoSchema.plugin(tenantScope);

const Consumo = mongoose.model('Consumo', consumoSchema, 'consumo_alimento_diario');

module.exports = { Consumo };
