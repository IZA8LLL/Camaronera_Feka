'use strict';
/* Validador genérico de DTOs con Zod.
   Los datos validados se guardan en req.data. */
const { z } = require('zod');
const { oid } = require('../config/helpers');

function parse(schema, req, res, next) {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Entrada inválida',
      issues: result.error.issues.map(x => ({
        campo: x.path.join('.'),
        mensaje: x.message
      }))
    });
  }
  req.data = result.data;
  next();
}

// Factory para crear middleware de validación
const validate = (schema) => (req, res, next) => parse(schema, req, res, next);

// ─── DTOs ─────────────────────────────────────────────────
const loginDto = z.object({
  tenant_id: oid().optional(),
  email: z.string().email().max(254),
  password: z.string().min(1).max(1024),
  turnstile_token: z.string().min(1).optional()
}).strict();

const sampleDto = z.object({
  granja_id: oid(),
  piscina_id: oid(),
  ciclo_id: oid(),
  fecha: z.string().datetime(),
  peso_promedio_g: z.number().gt(0).max(100),
  talla_promedio_cm: z.number().gt(0).max(50),
  muestra_individuos: z.number().int().min(1).max(10000),
  biomasa_estimada_kg: z.number().min(0).max(1e8),
  observacion: z.string().max(1000).optional()
}).strict();

const waterDto = z.object({
  granja_id: oid(),
  piscina_id: oid(),
  ciclo_id: oid(),
  fecha: z.string().datetime(),
  oxigeno_mg_l: z.number().gt(0).max(30),
  salinidad_ppt: z.number().min(0).max(60),
  ph: z.number().min(0).max(14),
  temperatura_c: z.number().min(0).max(45),
  amonio_mg_l: z.number().min(0).max(50)
}).strict();

const feedDto = z.object({
  granja_id: oid(),
  piscina_id: oid(),
  ciclo_id: oid(),
  lote_id: oid(),
  fecha: z.string().datetime(),
  cantidad_kg: z.number().gt(0).max(100000),
  fca: z.number().min(0).max(20).optional(),
  biomasa_kg: z.number().min(0).max(1e8).optional(),
  observacion: z.string().max(1000).optional()
}).strict();

const providerDto = z.object({
  codigo: z.string().min(1).max(40).optional(),
  nombre: z.string().min(1).max(160),
  ruc: z.string().regex(/^\d{10,13}$/),
  cuenta_bancaria: z.string().max(40).optional().or(z.literal('')),
  contacto: z.string().max(160).optional(),
  email: z.string().email().optional().or(z.literal(''))
}).strip();

const milli = z.number().gt(0).max(1e8).refine(
  n => Number.isSafeInteger(Math.round(n * 1000)) && Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-6
);

const cents = z.number().min(0).max(1e8).refine(
  n => Number.isSafeInteger(Math.round(n * 100)) && Math.abs(n * 100 - Math.round(n * 100)) < 1e-6
);

const orderDto = z.object({
  granja_id: oid(),
  proveedor_id: oid(),
  bodega_id: oid(),
  numero: z.string().min(1).max(40),
  lineas: z.array(z.object({
    producto_id: oid(),
    cantidad: milli,
    precio_unitario: cents
  }).strict()).min(1).max(100)
}).strict();

module.exports = {
  validate,
  loginDto, sampleDto, waterDto, feedDto,
  providerDto, orderDto
};
