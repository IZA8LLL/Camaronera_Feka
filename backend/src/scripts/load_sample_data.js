'use strict';
/* ═══════════════════════════════════════════════════════════
   Carga de 35+ Registros Históricos y de Operación
   By Fekas Corp. — ERP Camaronera
   ═══════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');
const { Int32, Decimal128, ObjectId } = require('mongodb');
const { connectDB } = require('../config/db');

function dec(val) {
  return Decimal128.fromString(Number(val).toFixed(2));
}

function int(val) {
  return new Int32(Math.round(val));
}

async function injectBulkSampleData() {
  console.log('🚀 Iniciando inserción de más de 30 registros históricos en MongoDB Atlas...');
  await connectDB();
  const db = mongoose.connection.db;

  // 1. Obtener contexto base
  const adminUser = await db.collection('usuarios').findOne({ email: 'admin@fekascorp.com' });
  if (!adminUser) throw new Error('Usuario admin@fekascorp.com no encontrado.');
  const tenantId = adminUser.tenant_id;
  const now = new Date();

  const granja = await db.collection('granjas_camaroneras').findOne({ tenant_id: tenantId, codigo: 'GRA-01' });
  if (!granja) throw new Error('Granja GRA-01 no encontrada.');

  // 2. Asegurar piscinas P-01, P-02, P-03, P-04, P-05
  const extraPools = [
    { codigo: 'P-04', area_ha: dec(3.8), profundidad_m: dec(1.75), estado: 'activa', capacidad_m3: dec(66500) },
    { codigo: 'P-05', area_ha: dec(5.0), profundidad_m: dec(2.10), estado: 'inactiva', capacidad_m3: dec(105000) }
  ];

  for (const p of extraPools) {
    const exists = await db.collection('piscinas_estanques').findOne({ tenant_id: tenantId, granja_id: granja._id, codigo: p.codigo });
    if (!exists) {
      await db.collection('piscinas_estanques').insertOne({
        tenant_id: tenantId,
        granja_id: granja._id,
        created_at: now,
        updated_at: now,
        ...p
      });
      console.log(`✓ Piscina adicional agregada: ${p.codigo}`);
    }
  }

  const allPiscinas = await db.collection('piscinas_estanques').find({ tenant_id: tenantId, granja_id: granja._id }).toArray();
  const p1 = allPiscinas.find(p => p.codigo === 'P-01');
  const p2 = allPiscinas.find(p => p.codigo === 'P-02');
  const p4 = allPiscinas.find(p => p.codigo === 'P-04');

  // Actualizar usuario para que tenga alcance a todas las piscinas
  await db.collection('usuarios').updateOne(
    { _id: adminUser._id },
    { $set: { piscina_ids: allPiscinas.map(p => p._id) } }
  );

  // 3. Obtener o crear ciclo para P-01 y P-02
  const cicloP1 = await db.collection('ciclos_cultivo').findOne({ tenant_id: tenantId, piscina_id: p1._id, codigo: 'CICLO-2026-P01' });
  const cicloP2 = await db.collection('ciclos_cultivo').findOne({ tenant_id: tenantId, piscina_id: p2._id, codigo: 'CICLO-2026-P02' });

  // 4. Insumos y bodega
  const bodega = await db.collection('bodegas').findOne({ tenant_id: tenantId, codigo: 'BOD-01' });
  const prod = await db.collection('insumos_productos').findOne({ tenant_id: tenantId, sku: 'BAL-35-INI' });
  const lote = await db.collection('lotes_inventario').findOne({ tenant_id: tenantId, codigo_lote: 'LOT-2026-BM35' });
  const plan = await db.collection('planes_alimentacion').findOne({ tenant_id: tenantId, ciclo_id: cicloP1._id });
  const proveedor = await db.collection('proveedores').findOne({ tenant_id: tenantId, codigo: 'PRV-001' });

  // Limpiar datos transaccionales para generar serie histórica limpia de 30+ registros
  await db.collection('parametros_agua').deleteMany({ tenant_id: tenantId });
  await db.collection('consumo_alimento_diario').deleteMany({ tenant_id: tenantId });
  await db.collection('muestreos_biometricos').deleteMany({ tenant_id: tenantId });
  await db.collection('registro_mortalidad').deleteMany({ tenant_id: tenantId });
  await db.collection('movimientos_kardex').deleteMany({ tenant_id: tenantId });
  await db.collection('ordenes_compra').deleteMany({ tenant_id: tenantId });

  // ─── A. SERIE DE 14 MEDICIONES DE CALIDAD DE AGUA (Piscina 1 y 2) ───
  const aguaDocs = [];
  for (let dia = 14; dia >= 1; dia--) {
    const fechaLectura = new Date(Date.now() - dia * 24 * 3600000 + 7 * 3600000); // Mañana 07:00 AM
    // P-01 (condiciones óptimas con variación natural)
    const ox1 = 5.2 + Math.sin(dia) * 0.7;
    const ph1 = 7.7 + (dia % 3) * 0.1;
    const temp1 = 27.5 + (dia % 4) * 0.4;
    const sal1 = 28.0 + (dia % 2) * 0.5;
    const amo1 = 0.10 + (dia % 5) * 0.04;
    const alerta1 = ox1 < 4.0;

    aguaDocs.push({
      tenant_id: tenantId,
      granja_id: granja._id,
      piscina_id: p1._id,
      ciclo_id: cicloP1._id,
      usuario_id: adminUser._id,
      fecha: fechaLectura,
      oxigeno_mg_l: dec(ox1),
      salinidad_ppt: dec(sal1),
      ph: dec(ph1),
      temperatura_c: dec(temp1),
      amonio_mg_l: dec(amo1),
      alerta: alerta1,
      created_at: fechaLectura,
      updated_at: fechaLectura
    });

    // P-02 (algunos días con estrés / alerta de oxígeno)
    if (dia <= 7) {
      const fechaLecturaP2 = new Date(Date.now() - dia * 24 * 3600000 + 6 * 3600000);
      const ox2 = dia === 3 || dia === 1 ? 3.1 : 4.6 + (dia % 2) * 0.5;
      const alerta2 = ox2 < 3.5;
      aguaDocs.push({
        tenant_id: tenantId,
        granja_id: granja._id,
        piscina_id: p2._id,
        ciclo_id: cicloP2._id,
        usuario_id: adminUser._id,
        fecha: fechaLecturaP2,
        oxigeno_mg_l: dec(ox2),
        salinidad_ppt: dec(31.5),
        ph: dec(8.2),
        temperatura_c: dec(30.1),
        amonio_mg_l: dec(0.85),
        alerta: alerta2,
        created_at: fechaLecturaP2,
        updated_at: fechaLecturaP2
      });
    }
  }
  await db.collection('parametros_agua').insertMany(aguaDocs);
  console.log(`✓ Insertados ${aguaDocs.length} registros de Calidad de Agua (Monitoreo histórico).`);

  // ─── B. SERIE DE 10 REGISTROS DE CONSUMO DIARIO DE ALIMENTO ───
  const consumoDocs = [];
  let biomasaBase = 4200.0;
  for (let dia = 10; dia >= 1; dia--) {
    const fechaConsumo = new Date(Date.now() - dia * 24 * 3600000 + 17 * 3600000); // 17:00 PM
    const racion = 95.0 + (10 - dia) * 2.5; // Va subiendo de 95kg a 118kg
    biomasaBase += 105.0; // Ganancia de biomasa
    const fca = 1.20 + (dia % 3) * 0.02;

    consumoDocs.push({
      tenant_id: tenantId,
      granja_id: granja._id,
      piscina_id: p1._id,
      ciclo_id: cicloP1._id,
      plan_id: plan._id,
      lote_id: lote._id,
      usuario_id: adminUser._id,
      fecha: fechaConsumo,
      cantidad_kg: dec(racion),
      fca: dec(fca),
      biomasa_kg: dec(biomasaBase),
      observacion: `Alimentación Día -${dia}. Platos testigos evaluados sin sobrantes.`,
      created_at: fechaConsumo,
      updated_at: fechaConsumo
    });
  }
  await db.collection('consumo_alimento_diario').insertMany(consumoDocs);
  console.log(`✓ Insertados ${consumoDocs.length} registros de Consumo Diario de Alimento.`);

  // ─── C. 5 MUESTREOS BIOMÉTRICOS SEMANALES (Curva de Crecimiento) ───
  const biometria = [
    { sem: 5, peso: 3.50, talla: 4.80, bio: 1250.0, ind: 100, obs: 'Post-larva adaptada, excelente vitalidad.' },
    { sem: 4, peso: 6.20, talla: 7.10, bio: 2200.0, ind: 120, obs: 'Crecimiento uniforme, sin lesiones.' },
    { sem: 3, peso: 9.10, talla: 9.00, bio: 3250.0, ind: 120, obs: 'Talla comercial inicial, tracto lleno.' },
    { sem: 2, peso: 12.30, talla: 10.40, bio: 4350.0, ind: 130, obs: 'Buena muda, exoesqueleto firme.' },
    { sem: 1, peso: 14.85, talla: 11.50, bio: 5240.0, ind: 150, obs: 'Talla comercial óptima para cosecha en 3 semanas.' }
  ];

  const biometriaDocs = biometria.map(b => {
    const f = new Date(Date.now() - b.sem * 7 * 24 * 3600000);
    return {
      tenant_id: tenantId,
      granja_id: granja._id,
      piscina_id: p1._id,
      ciclo_id: cicloP1._id,
      usuario_id: adminUser._id,
      fecha: f,
      peso_promedio_g: dec(b.peso),
      talla_promedio_cm: dec(b.talla),
      muestra_individuos: int(b.ind),
      biomasa_estimada_kg: dec(b.bio),
      observacion: b.obs,
      created_at: f,
      updated_at: f
    };
  });
  await db.collection('muestreos_biometricos').insertMany(biometriaDocs);
  console.log(`✓ Insertados ${biometriaDocs.length} registros de Muestreos Biométricos.`);

  // ─── D. 4 REGISTROS DE MORTALIDAD DIARIA ───
  const mortalidadDocs = [
    { diasAtras: 8, cant: 12, causa: 'Muda nocturna', obs: 'Dentro de rango esperable' },
    { diasAtras: 5, cant: 18, causa: 'Depredación por aves de orilla', obs: 'Refuerzo de mallas perimetrales' },
    { diasAtras: 2, cant: 9, causa: 'Muda normal', obs: 'Sin signos de patologías' },
    { diasAtras: 1, cant: 14, causa: 'Cambio de marea y temperatura', obs: 'Oxigenación suplementaria encendida' }
  ].map(m => {
    const f = new Date(Date.now() - m.diasAtras * 24 * 3600000);
    return {
      tenant_id: tenantId,
      granja_id: granja._id,
      piscina_id: p1._id,
      ciclo_id: cicloP1._id,
      usuario_id: adminUser._id,
      fecha: f,
      cantidad: int(m.cant),
      causa: m.causa,
      observacion: m.obs,
      created_at: f,
      updated_at: f
    };
  });
  await db.collection('registro_mortalidad').insertMany(mortalidadDocs);
  console.log(`✓ Insertados ${mortalidadDocs.length} registros de Control de Mortalidad.`);

  // ─── E. 6 MOVIMIENTOS DE KARDEX (Inventario continuo) ───
  const kardexDocs = [
    { tipo: 'entrada', cant: 2000.0, saldo: 2000.0, ref: 'OC-2026-0001', mot: 'Recepción orden de compra proveedor BioMar', dias: 20 },
    { tipo: 'salida', cant: 100.0, saldo: 1900.0, ref: 'CONS-P01-01', mot: 'Alimentación Piscina P-01 semana 1', dias: 18 },
    { tipo: 'salida', cant: 105.0, saldo: 1795.0, ref: 'CONS-P01-02', mot: 'Alimentación Piscina P-01 semana 2', dias: 14 },
    { tipo: 'salida', cant: 110.0, saldo: 1685.0, ref: 'CONS-P01-03', mot: 'Alimentación Piscina P-01 semana 3', dias: 10 },
    { tipo: 'salida', cant: 115.0, saldo: 1570.0, ref: 'CONS-P01-04', mot: 'Alimentación Piscina P-01 semana 4', dias: 5 },
    { tipo: 'salida', cant: 150.0, saldo: 1420.0, ref: 'CONS-P01-05', mot: 'Alimentación Piscina P-01 semana 5', dias: 1 }
  ].map(k => {
    const f = new Date(Date.now() - k.dias * 24 * 3600000);
    return {
      tenant_id: tenantId,
      granja_id: granja._id,
      bodega_id: bodega._id,
      lote_id: lote._id,
      usuario_id: adminUser._id,
      fecha: f,
      tipo: k.tipo,
      cantidad: dec(k.cant),
      saldo_posterior: dec(k.saldo),
      referencia: k.ref,
      motivo: k.mot,
      created_at: f,
      updated_at: f
    };
  });
  await db.collection('movimientos_kardex').insertMany(kardexDocs);
  console.log(`✓ Insertados ${kardexDocs.length} registros de Movimientos de Kardex.`);

  // ─── F. 3 ÓRDENES DE COMPRA (Compras y Proveedores) ───
  const ordenesDocs = [
    {
      num: 'OC-2026-0001',
      estado: 'recibida',
      total: 2900.0,
      dias: 22,
      lineas: [{ producto_id: prod._id, cantidad: dec(2000.0), precio_unitario: dec(1.45) }]
    },
    {
      num: 'OC-2026-0002',
      estado: 'aprobada',
      total: 4350.0,
      dias: 8,
      lineas: [{ producto_id: prod._id, cantidad: dec(3000.0), precio_unitario: dec(1.45) }]
    },
    {
      num: 'OC-2026-0003',
      estado: 'borrador',
      total: 1450.0,
      dias: 1,
      lineas: [{ producto_id: prod._id, cantidad: dec(1000.0), precio_unitario: dec(1.45) }]
    }
  ].map(o => {
    const f = new Date(Date.now() - o.dias * 24 * 3600000);
    return {
      tenant_id: tenantId,
      granja_id: granja._id,
      proveedor_id: proveedor._id,
      bodega_id: bodega._id,
      numero: o.num,
      fecha: f,
      estado: o.estado,
      total: dec(o.total),
      creado_por: adminUser._id,
      aprobado_por: adminUser._id,
      lineas: o.lineas,
      created_at: f,
      updated_at: f
    };
  });
  await db.collection('ordenes_compra').insertMany(ordenesDocs);
  console.log(`✓ Insertadas ${ordenesDocs.length} Órdenes de Compra en diferentes estados.`);

  const totalNuevos = aguaDocs.length + consumoDocs.length + biometriaDocs.length + mortalidadDocs.length + kardexDocs.length + ordenesDocs.length;
  console.log(`\n🎉 Total registros de muestra generados: ${totalNuevos} registros insertados en MongoDB Atlas.`);
  await mongoose.disconnect();
}

injectBulkSampleData().catch(async (err) => {
  console.error('\n❌ Error al cargar registros masivos:', err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
