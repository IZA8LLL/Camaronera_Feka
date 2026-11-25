'use strict';
/* Controlador de Operaciones: Muestreos, Parámetros de agua, Alimentación, Kardex, Granjas y Ciclos.
   Validación de ciclo/piscina y transacción de inventario para alimentación. */
const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const { id, oid, dec, safeText } = require('../config/helpers');
const { Ciclo } = require('../models/ciclo.model');
const { Piscina } = require('../models/piscina.model');
const { Muestreo } = require('../models/muestreo.model');
const { Agua } = require('../models/agua.model');
const { Consumo } = require('../models/consumo.model');
const { Lote, Kardex } = require('../models/inventario.model');
const { audit } = require('./auth.controller');

// Verificar que el pool y ciclo pertenecen al usuario
function allowedPool(req, granjaId, piscinaId) {
  if (req.auth?.isAdmin) return true;
  const matchGranja = req.auth.granjaIds?.some(x => x.equals(granjaId));
  const matchPiscina = req.auth.piscinaIds?.some(x => x.equals(piscinaId));
  return matchGranja && matchPiscina;
}

async function checkCycle(req, granjaId, piscinaId, cicloId) {
  if (!allowedPool(req, granjaId, piscinaId)) return false;
  const pool = await Piscina.exists({
    _id: piscinaId, tenant_id: req.auth.tenantId, granja_id: granjaId
  });
  if (!pool) return false;
  return !!await Ciclo.exists({
    _id: cicloId, tenant_id: req.auth.tenantId, granja_id: granjaId,
    piscina_id: piscinaId, estado: 'activo'
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

// GET /api/lotes
async function listarLotes(req, res, next) {
  try {
    const rows = await Lote.find({ tenant_id: req.auth.tenantId })
      .sort({ fecha_ingreso: -1 })
      .limit(50)
      .lean();

    res.json(rows.map(x => ({
      id: String(x._id),
      _id: String(x._id),
      granja_id: String(x.granja_id),
      bodega_id: String(x.bodega_id),
      codigo_lote: x.codigo_lote,
      cantidad_actual: Number(x.cantidad_actual?.toString() || 0),
      costo_unitario: Number(x.costo_unitario?.toString() || 0)
    })));
  } catch (e) { next(e); }
}

// GET /api/granjas
async function listarGranjas(req, res, next) {
  try {
    const filter = { tenant_id: req.auth.tenantId };
    if (!req.auth.isAdmin) {
      filter._id = { $in: req.auth.granjaIds };
    }
    const rows = await mongoose.connection.db.collection('granjas_camaroneras')
      .find(filter)
      .sort({ nombre: 1 })
      .toArray();

    res.json(rows.map(x => ({
      id: String(x._id),
      _id: String(x._id),
      codigo: x.codigo,
      nombre: x.nombre,
      ubicacion: x.ubicacion
    })));
  } catch (e) { next(e); }
}

async function scopedPool(req, granjaId, piscinaId) {
  if (!allowedPool(req, granjaId, piscinaId)) return false;
  return !!await Piscina.exists({
    _id: piscinaId, tenant_id: req.auth.tenantId, granja_id: granjaId
  });
}

async function nextCycleCode(tenantId, year) {
  const prefix = `CIC-${year}-P`;
  const rows = await mongoose.connection.db.collection('ciclos_cultivo')
    .find({ tenant_id: tenantId, codigo: new RegExp(`^${prefix}[0-9]+$`) })
    .project({ codigo: 1 }).toArray();
  const maxNum = rows.reduce((max, row) => Math.max(max, Number(row.codigo.slice(prefix.length))), 0);
  return { maxNum, nextCodigo: `${prefix}${String(maxNum + 1).padStart(2, '0')}` };
}

// GET calcula el siguiente código; nunca crea documentos.
async function obtenerSiguienteCiclo(req, res, next) {
  try {
    if (!oid().safeParse(req.query.granja_id).success ||
        !oid().safeParse(req.query.piscina_id).success) {
      return res.status(400).json({ error: 'Granja y piscina requeridas' });
    }
    const fecha = req.query.fecha ? new Date(req.query.fecha) : new Date();
    if (Number.isNaN(fecha.getTime())) return res.status(400).json({ error: 'Fecha inválida' });
    const granjaId = id(req.query.granja_id), piscinaId = id(req.query.piscina_id);
    if (!await scopedPool(req, granjaId, piscinaId)) {
      return res.status(403).json({ error: 'Piscina fuera de alcance' });
    }
    const year = fecha.getUTCFullYear();
    const { maxNum, nextCodigo } = await nextCycleCode(req.auth.tenantId, year);
    const ciclos = await Ciclo.find({ piscina_id: piscinaId, granja_id: granjaId })
      .select('codigo estado piscina_id granja_id').sort({ codigo: 1 }).lean();
    res.json({
      year, total_registrados: maxNum, siguiente_codigo: nextCodigo, siguiente_id: null,
      ciclos_existentes: ciclos.map(c => ({
        id: String(c._id), codigo: c.codigo, estado: c.estado,
        piscina_id: String(c.piscina_id), granja_id: String(c.granja_id)
      }))
    });
  } catch (e) { next(e); }
}

// POST crea un ciclo activo con permiso explícito y vínculo comprobado.
async function crearCiclo(req, res, next) {
  try {
    const granjaId = id(req.data.granja_id), piscinaId = id(req.data.piscina_id);
    if (!await scopedPool(req, granjaId, piscinaId)) {
      return res.status(403).json({ error: 'Piscina fuera de alcance' });
    }
    if (await Ciclo.exists({ piscina_id: piscinaId, estado: 'activo' })) {
      return res.status(409).json({ error: 'La piscina ya tiene un ciclo activo' });
    }
    const fecha = new Date(req.data.fecha_inicio);
    const { nextCodigo } = await nextCycleCode(req.auth.tenantId, fecha.getUTCFullYear());
    const cycle = await Ciclo.create({
      tenant_id: req.auth.tenantId, granja_id: granjaId, piscina_id: piscinaId,
      codigo: nextCodigo, fecha_inicio: fecha, estado: 'activo',
      biomasa_estimada_kg: dec(0), especie: 'Litopenaeus vannamei'
    });
    await audit(req, 'crear', 'ciclos_cultivo', cycle._id, 'exito');
    return res.status(201).json({ id: String(cycle._id), codigo: cycle.codigo });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: 'Ciclo duplicado; vuelva a consultar' });
    next(e);
  }
}

module.exports = {
  crearMuestreo,
  crearParametrosAgua,
  crearAlimentacion,
  listarKardex,
  listarLotes,
  listarGranjas,
  obtenerSiguienteCiclo,
  crearCiclo
};
