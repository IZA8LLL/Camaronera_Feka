'use strict';
/* Modelo de Ciclos de Cultivo.
   Estados: planificado, activo, cerrado. */
const mongoose = require('mongoose');
const { base, schemaOptions } = require('../config/helpers');
const { tenantScope } = require('../middlewares/tenant.middleware');

const cicloSchema = new mongoose.Schema({
  ...base,
  piscina_id: mongoose.Schema.Types.ObjectId,
  codigo: String,
  fecha_inicio: Date,
  fecha_fin: Date,
  estado: String,
  biomasa_estimada_kg: mongoose.Schema.Types.Decimal128,
  especie: String
}, schemaOptions);

cicloSchema.plugin(tenantScope);

const Ciclo = mongoose.model('Ciclo', cicloSchema, 'ciclos_cultivo');

module.exports = { Ciclo };
