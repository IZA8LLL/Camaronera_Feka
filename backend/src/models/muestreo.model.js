'use strict';
/* Modelo de Muestreos Biométricos.
   Registra peso, talla, individuos y biomasa estimada. */
const mongoose = require('mongoose');
const { base, schemaOptions } = require('../config/helpers');
const { tenantScope } = require('../middlewares/tenant.middleware');

const muestreoSchema = new mongoose.Schema({
  ...base,
  piscina_id: mongoose.Schema.Types.ObjectId,
  ciclo_id: mongoose.Schema.Types.ObjectId,
  usuario_id: mongoose.Schema.Types.ObjectId,
  fecha: Date,
  peso_promedio_g: mongoose.Schema.Types.Decimal128,
  talla_promedio_cm: mongoose.Schema.Types.Decimal128,
  muestra_individuos: Number,
  biomasa_estimada_kg: mongoose.Schema.Types.Decimal128,
  observacion: String
}, schemaOptions);

muestreoSchema.plugin(tenantScope);

const Muestreo = mongoose.model('Muestreo', muestreoSchema, 'muestreos_biometricos');

module.exports = { Muestreo };
