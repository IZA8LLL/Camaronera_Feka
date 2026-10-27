'use strict';
/* Controlador de Piscinas: lectura de estanques con estado actual.
   Para cada piscina devuelve el último registro de agua, ciclo activo y FCA. */
const { Piscina } = require('../models/piscina.model');
const { Ciclo } = require('../models/ciclo.model');
const { Agua } = require('../models/agua.model');
const { Consumo } = require('../models/consumo.model');

// GET /api/piscinas
async function listarPiscinas(req, res, next) {
  try {
    const pools = await Piscina.find({})
      .select('codigo granja_id area_ha estado capacidad_m3 profundidad_m')
      .limit(100)
      .lean();

    const rows = await Promise.all(pools.map(async (p) => {
      const [agua, ciclo, consumo] = await Promise.all([
        Agua.findOne({ piscina_id: p._id }).sort({ fecha: -1 })
          .select('oxigeno_mg_l salinidad_ppt ph temperatura_c amonio_mg_l alerta fecha').lean(),
        Ciclo.findOne({ piscina_id: p._id, estado: 'activo' })
          .select('biomasa_estimada_kg codigo especie fecha_inicio').lean(),
        Consumo.findOne({ piscina_id: p._id }).sort({ fecha: -1 })
          .select('fca cantidad_kg fecha').lean()
      ]);

      return {
        id: String(p._id),
        codigo: p.codigo,
        granja_id: String(p.granja_id),
        area_ha: p.area_ha?.toString(),
        profundidad_m: p.profundidad_m?.toString(),
        capacidad_m3: p.capacidad_m3?.toString(),
        estado: p.estado,
        ciclo_id: ciclo ? String(ciclo._id) : null,
        ciclo_codigo: ciclo?.codigo || null,
        especie: ciclo?.especie || null,
        fecha_inicio_ciclo: ciclo?.fecha_inicio || null,
        oxigeno_mg_l: agua?.oxigeno_mg_l?.toString() || null,
        salinidad_ppt: agua?.salinidad_ppt?.toString() || null,
        ph: agua?.ph?.toString() || null,
        temperatura_c: agua?.temperatura_c?.toString() || null,
        amonio_mg_l: agua?.amonio_mg_l?.toString() || null,
        alerta: agua?.alerta || false,
        ultima_lectura_agua: agua?.fecha || null,
        biomasa_kg: ciclo?.biomasa_estimada_kg?.toString() || null,
        fca: consumo?.fca?.toString() || null,
        ultimo_consumo_kg: consumo?.cantidad_kg?.toString() || null
      };
    }));

    res.json(rows);
  } catch (e) { next(e); }
}

module.exports = { listarPiscinas };
