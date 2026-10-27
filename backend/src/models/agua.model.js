'use strict';
/* Modelo de Parámetros de Agua.
   Registra oxígeno, salinidad, pH, temperatura, amonio y alertas. */
const mongoose = require('mongoose');
const { base, schemaOptions } = require('../config/helpers');
const { tenantScope } = require('../middlewares/tenant.middleware');

const aguaSchema = new mongoose.Schema({
  ...base,
  piscina_id: mongoose.Schema.Types.ObjectId,
  ciclo_id: mongoose.Schema.Types.ObjectId,
  usuario_id: mongoose.Schema.Types.ObjectId,
  fecha: Date,
  oxigeno_mg_l: mongoose.Schema.Types.Decimal128,
  salinidad_ppt: mongoose.Schema.Types.Decimal128,
  ph: mongoose.Schema.Types.Decimal128,
  temperatura_c: mongoose.Schema.Types.Decimal128,
  amonio_mg_l: mongoose.Schema.Types.Decimal128,
  alerta: Boolean
}, schemaOptions);

aguaSchema.plugin(tenantScope);

const Agua = mongoose.model('Agua', aguaSchema, 'parametros_agua');

module.exports = { Agua };
