'use strict';
/* Controlador de Operaciones: Muestreos, Parámetros de agua, Alimentación y Kardex.
   Validación de ciclo/piscina y transacción de inventario para alimentación. */
const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const { id, dec, safeText } = require('../config/helpers');
const { Ciclo } = require('../models/ciclo.model');
const { Muestreo } = require('../models/muestreo.model');
const { Agua } = require('../models/agua.model');
const { Consumo } = require('../models/consumo.model');
const { Lote, Kardex } = require('../models/inventario.model');
const { audit } = require('./auth.controller');

// Verificar que el pool y ciclo pertenecen al usuario
function allowedPool(req, granjaId, piscinaId) {
  return req.auth.granjaIds.some(x => x.equals(granjaId)) &&
    (req.auth.isAdmin || req.auth.piscinaIds.some(x => x.equals(piscinaId)));
}

async function checkCycle(req, granjaId, piscinaId, cicloId) {
  if (!allowedPool(req, granjaId, piscinaId)) return false;
  return !!await Ciclo.exists({
    _id: cicloId,
    granja_id: granjaId,
    piscina_id: piscinaId,
    estado: 'activo'
  });
}

// POST /api/muestreos
async function crearMuestreo(req, res, next) {
  try {
    const d = req.data;
    const granja = id(d.granja_id), pool = id(d.piscina_id), cycle = id(d.ciclo_id);

    if (!await checkCycle(req, granja, pool, cycle)) {
      return res.status(403).json({ error: 'Ciclo/piscina fuera de alcance' });
    }

    const doc = await Muestreo.create({
      tenant_id: req.auth.tenantId,
      granja_id: granja,
      piscina_id: pool,
      ciclo_id: cycle,
      usuario_id: req.auth.userId,
      fecha: new Date(d.fecha),
      peso_promedio_g: dec(d.peso_promedio_g),
      talla_promedio_cm: dec(d.talla_promedio_cm),
      muestra_individuos: d.muestra_individuos,
      biomasa_estimada_kg: dec(d.biomasa_estimada_kg),
      ...(d.observacion ? { observacion: safeText(d.observacion) } : {})
    });

    await audit(req, 'crear', 'muestreos_biometricos', doc._id, 'exito');
    res.status(201).json({ id: String(doc._id), fecha: doc.fecha });
  } catch (e) { next(e); }
}

// POST /api/parametros-agua
async function crearParametrosAgua(req, res, next) {
  try {
    const d = req.data;
    const granja = id(d.granja_id), pool = id(d.piscina_id), cycle = id(d.ciclo_id);

    if (!await checkCycle(req, granja, pool, cycle)) {
      return res.status(403).json({ error: 'Ciclo/piscina fuera de alcance' });
    }

    const doc = await Agua.create({
      tenant_id: req.auth.tenantId,
      granja_id: granja,
      piscina_id: pool,
      ciclo_id: cycle,
      usuario_id: req.auth.userId,
      fecha: new Date(d.fecha),
      oxigeno_mg_l: dec(d.oxigeno_mg_l),
      salinidad_ppt: dec(d.salinidad_ppt),
      ph: dec(d.ph),
      temperatura_c: dec(d.temperatura_c),
      amonio_mg_l: dec(d.amonio_mg_l),
      alerta: d.oxigeno_mg_l < 4 || d.ph < 7 || d.ph > 9 || d.amonio_mg_l > 1
    });

    await audit(req, 'crear', 'parametros_agua', doc._id, 'exito');
    res.status(201).json({ id: String(doc._id), alerta: doc.alerta });
  } catch (e) { next(e); }
}

// POST /api/alimentacion
async function crearAlimentacion(req, res, next) {
  try {
    const d = req.data;
    const granja = id(d.granja_id), pool = id(d.piscina_id);
    const cycle = id(d.ciclo_id), lote = id(d.lote_id);

    if (!await checkCycle(req, granja, pool, cycle)) {
      return res.status(403).json({ error: 'Ciclo/piscina fuera de alcance' });
    }

    const session = await mongoose.startSession();
    let created;

    try {
      await session.withTransaction(async () => {
        // Descontar inventario atómicamente
        const inventory = await Lote.findOneAndUpdate(
          { _id: lote, granja_id: granja, cantidad_actual: { $gte: dec(d.cantidad_kg) } },
          { $inc: { cantidad_actual: dec(-d.cantidad_kg) } },
          { returnDocument: 'after', session }
        );

        if (!inventory) {
          throw Object.assign(new Error('Lote inexistente o saldo insuficiente'), { status: 409 });
        }

        const [doc] = await Consumo.create([{
          tenant_id: req.auth.tenantId,
          granja_id: granja,
          piscina_id: pool,
          ciclo_id: cycle,
          lote_id: lote,
          usuario_id: req.auth.userId,
          fecha: new Date(d.fecha),
          cantidad_kg: dec(d.cantidad_kg),
          ...(d.fca !== undefined ? { fca: dec(d.fca) } : {}),
          ...(d.biomasa_kg !== undefined ? { biomasa_kg: dec(d.biomasa_kg) } : {}),
          ...(d.observacion ? { observacion: safeText(d.observacion) } : {})
        }], { session });

        // Registrar movimiento Kardex
        await Kardex.create([{
          tenant_id: req.auth.tenantId,
          granja_id: granja,
          bodega_id: inventory.bodega_id,
          lote_id: lote,
          usuario_id: req.auth.userId,
          fecha: new Date(),
          tipo: 'salida',
          cantidad: dec(d.cantidad_kg),
          saldo_posterior: inventory.cantidad_actual,
          referencia: randomUUID(),
          motivo: 'Alimentación diaria'
        }], { session });

        created = doc._id;
      });
    } finally {
      await session.endSession();
    }

    await audit(req, 'crear', 'consumo_alimento_diario', created, 'exito');
    res.status(201).json({ id: String(created) });
  } catch (e) { next(e); }
}

// GET /api/kardex
async function listarKardex(req, res, next) {
  try {
    const rows = await Kardex.find({})
      .sort({ fecha: -1 })
      .limit(100)
      .select('bodega_id lote_id fecha tipo cantidad saldo_posterior referencia motivo')
      .lean();

    res.json(rows.map(x => ({
      id: String(x._id),
      bodega_id: String(x.bodega_id),
      lote_id: String(x.lote_id),
      fecha: x.fecha,
      tipo: x.tipo,
      cantidad: x.cantidad?.toString(),
      saldo_posterior: x.saldo_posterior?.toString(),
      referencia: x.referencia,
      motivo: x.motivo
    })));
  } catch (e) { next(e); }
}

module.exports = { crearMuestreo, crearParametrosAgua, crearAlimentacion, listarKardex };
