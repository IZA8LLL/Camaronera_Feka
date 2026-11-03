'use strict';
/* Controlador de Operaciones: Muestreos, Parámetros de agua, Alimentación, Kardex, Granjas y Ciclos.
   Validación de ciclo/piscina y transacción de inventario para alimentación. */
const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const { id, dec, safeText } = require('../config/helpers');
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
  const matchGranja = !req.auth.granjaIds?.length || req.auth.granjaIds.some(x => x.equals(granjaId));
  const matchPiscina = !req.auth.piscinaIds?.length || req.auth.piscinaIds.some(x => x.equals(piscinaId));
  return matchGranja && matchPiscina;
}

async function checkCycle(req, granjaId, piscinaId, cicloId) {
  if (!allowedPool(req, granjaId, piscinaId)) return false;
  return !!await Ciclo.exists({
    _id: cicloId,
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
    if (!req.auth.isAdmin && req.auth.granjaIds?.length) {
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

// GET /api/ciclos/siguiente?piscina_id=...&granja_id=...&fecha=...
async function obtenerSiguienteCiclo(req, res, next) {
  try {
    const d = req.query.fecha ? new Date(req.query.fecha) : new Date();
    const year = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
    const piscinaId = req.query.piscina_id;
    const granjaId = req.query.granja_id;

    // Buscar todos los ciclos registrados del año para el tenant
    const prefix = `CIC-${year}-P`;
    const ciclos = await Ciclo.find({
      tenant_id: req.auth.tenantId,
      codigo: new RegExp(`^CIC-${year}-`)
    }).select('codigo estado piscina_id granja_id').sort({ codigo: 1 }).lean();

    let maxNum = 0;
    for (const c of ciclos) {
      if (c.codigo && c.codigo.startsWith(prefix)) {
        const num = parseInt(c.codigo.slice(prefix.length), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    // Regla de secuencia: si hay 5 registrados en 2026, el siguiente es el 6: CIC-2026-P06
    // En 2027, al haber 0 registrados para 2027, el siguiente es 1: CIC-2027-P01
    const nextNum = maxNum + 1;
    const nextCodigo = `CIC-${year}-P${String(nextNum).padStart(2, '0')}`;

    // Asegurar que exista documento activo para vincular en el registro si se pasa piscina
    let targetCiclo = await Ciclo.findOne({
      tenant_id: req.auth.tenantId,
      codigo: nextCodigo
    });

    if (!targetCiclo && piscinaId && granjaId) {
      targetCiclo = await Ciclo.create({
        tenant_id: req.auth.tenantId,
        granja_id: id(granjaId),
        piscina_id: id(piscinaId),
        codigo: nextCodigo,
        fecha_inicio: new Date(`${year}-01-01T00:00:00.000Z`),
        estado: 'activo',
        biomasa_estimada_kg: dec(0),
        especie: 'Litopenaeus vannamei'
      });
    }

    res.json({
      year,
      total_registrados: maxNum,
      siguiente_codigo: nextCodigo,
      siguiente_id: targetCiclo ? String(targetCiclo._id) : null,
      ciclos_existentes: ciclos.map(c => ({
        id: String(c._id),
        codigo: c.codigo,
        estado: c.estado,
        piscina_id: String(c.piscina_id),
        granja_id: String(c.granja_id)
      }))
    });
  } catch (e) { next(e); }
}

module.exports = {
  crearMuestreo,
  crearParametrosAgua,
  crearAlimentacion,
  listarKardex,
  listarLotes,
  listarGranjas,
  obtenerSiguienteCiclo
};
