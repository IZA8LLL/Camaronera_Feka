'use strict';
/* Modelo de Logs de Auditoría.
   Registra acciones, recursos y resultados con IP hasheada. */
const mongoose = require('mongoose');
const { schemaOptions } = require('../config/helpers');

const auditoriaSchema = new mongoose.Schema({
  tenant_id: mongoose.Schema.Types.ObjectId,
  usuario_id: mongoose.Schema.Types.ObjectId,
  accion: String,
  recurso: String,
  recurso_id: mongoose.Schema.Types.ObjectId,
  fecha: Date,
  ip_hash: String,
  resultado: String,
  detalle: String
}, schemaOptions);

const Auditoria = mongoose.model('Auditoria', auditoriaSchema, 'logs_auditoria');

module.exports = { Auditoria };
