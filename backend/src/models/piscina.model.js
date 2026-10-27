'use strict';
/* Modelo de Piscinas/Estanques.
   Estados: activa, mantenimiento, inactiva. */
const mongoose = require('mongoose');
const { base, schemaOptions } = require('../config/helpers');
const { tenantScope } = require('../middlewares/tenant.middleware');

const piscinaSchema = new mongoose.Schema({
  ...base,
  codigo: String,
  area_ha: mongoose.Schema.Types.Decimal128,
  profundidad_m: mongoose.Schema.Types.Decimal128,
  estado: String,
  capacidad_m3: mongoose.Schema.Types.Decimal128
}, schemaOptions);

piscinaSchema.plugin(tenantScope);

const Piscina = mongoose.model('Piscina', piscinaSchema, 'piscinas_estanques');

module.exports = { Piscina };
