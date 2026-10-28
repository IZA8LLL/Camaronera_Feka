'use strict';
/* ═══════════════════════════════════════════════════════════
   Script de Inyección de Datos Demo para By Fekas Corp ERP
   Inserta datos completos y coherentes respetando los tipos BSON
   y validaciones $jsonSchema de las 26 colecciones.
   ═══════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');
const { Int32, Decimal128, ObjectId } = require('mongodb');
const { connectDB } = require('../config/db');
const { encrypt } = require('../services/crypto.service');

function dec(val) {
  return Decimal128.fromString(String(val));
}

function int(val) {
  return new Int32(val);
}

async function runSeed() {
  console.log('🌱 Iniciando inyección de datos de prueba en MongoDB Atlas...');
  await connectDB();
  const db = mongoose.connection.db;

  // 1. Obtener usuario administrador y tenant existentes
  const adminUser = await db.collection('usuarios').findOne({ email: 'admin@fekascorp.com' });
  if (!adminUser) {
    throw new Error('No se encontró el usuario admin@fekascorp.com. Ejecute primero "npm run bootstrap".');
  }

  const tenantId = adminUser.tenant_id;
  const now = new Date();
  console.log(`✓ Usando Tenant ID: ${tenantId}`);
  console.log(`✓ Usando Usuario Admin: ${adminUser.email} (${adminUser._id})`);

  // 2. Granjas Camaroneras
  let granja = await db.collection('granjas_camaroneras').findOne({ tenant_id: tenantId, codigo: 'GRA-01' });
  if (!granja) {
    const res = await db.collection('granjas_camaroneras').insertOne({
      tenant_id: tenantId,
      created_at: now,
      updated_at: now,
      codigo: 'GRA-01',
      nombre: 'Granja Camaronera San Rafael',
      ubicacion: 'Archipiélago de Jambelí, Golfo de Guayaquil',
      superficie_ha: dec('55.00'),
      activa: true,
      responsable_id: adminUser._id
    });
    granja = await db.collection('granjas_camaroneras').findOne({ _id: res.insertedId });
    console.log(`✓ Granja creada: ${granja.nombre}`);
  }

  // 3. Piscinas / Estanques
  const piscinasData = [
    { codigo: 'P-01', area_ha: dec('3.50'), profundidad_m: dec('1.80'), estado: 'activa', capacidad_m3: dec('63000.00') },
    { codigo: 'P-02', area_ha: dec('4.20'), profundidad_m: dec('2.00'), estado: 'activa', capacidad_m3: dec('84000.00') },
    { codigo: 'P-03', area_ha: dec('2.80'), profundidad_m: dec('1.60'), estado: 'mantenimiento', capacidad_m3: dec('44800.00') }
  ];

  const piscinaIds = [];
  for (const p of piscinasData) {
    let pool = await db.collection('piscinas_estanques').findOne({ tenant_id: tenantId, granja_id: granja._id, codigo: p.codigo });
    if (!pool) {
      const res = await db.collection('piscinas_estanques').insertOne({
        tenant_id: tenantId,
        granja_id: granja._id,
        created_at: now,
        updated_at: now,
        ...p
      });
      pool = { _id: res.insertedId, ...p };
      console.log(`✓ Piscina creada: ${p.codigo} (${p.estado})`);
    }
    piscinaIds.push(pool._id);
  }

  // 4. Actualizar usuario con granjas y piscinas para permisos ABAC en la API
  await db.collection('usuarios').updateOne(
    { _id: adminUser._id },
    { $set: { granja_ids: [granja._id], piscina_ids: piscinaIds } }
  );
  console.log(`✓ Permisos de usuario actualizados con granja y 3 piscinas.`);

  // 5. Ciclos de Cultivo
  let cicloP1 = await db.collection('ciclos_cultivo').findOne({ tenant_id: tenantId, piscina_id: piscinaIds[0], codigo: 'CICLO-2026-P01' });
  if (!cicloP1) {
    const res = await db.collection('ciclos_cultivo').insertOne({
      tenant_id: tenantId,
      granja_id: granja._id,
      piscina_id: piscinaIds[0],
      created_at: now,
      updated_at: now,
      codigo: 'CICLO-2026-P01',
      fecha_inicio: new Date(Date.now() - 35 * 86400000),
      fecha_fin: new Date(Date.now() + 55 * 86400000),
      estado: 'activo',
      biomasa_estimada_kg: dec('5240.00'),
      especie: 'Litopenaeus vannamei'
    });
    cicloP1 = { _id: res.insertedId };
    console.log('✓ Ciclo activo creado para Piscina P-01');
  }

  let cicloP2 = await db.collection('ciclos_cultivo').findOne({ tenant_id: tenantId, piscina_id: piscinaIds[1], codigo: 'CICLO-2026-P02' });
  if (!cicloP2) {
    const res = await db.collection('ciclos_cultivo').insertOne({
      tenant_id: tenantId,
      granja_id: granja._id,
      piscina_id: piscinaIds[1],
      created_at: now,
      updated_at: now,
      codigo: 'CICLO-2026-P02',
      fecha_inicio: new Date(Date.now() - 14 * 86400000),
      fecha_fin: new Date(Date.now() + 76 * 86400000),
      estado: 'activo',
      biomasa_estimada_kg: dec('2150.00'),
      especie: 'Litopenaeus vannamei'
    });
    cicloP2 = { _id: res.insertedId };
    console.log('✓ Ciclo activo creado para Piscina P-02');
  }

  // 6. Proveedores (con cifrado AES-256-GCM de RUC y cuentas bancarias)
  const prov1EncRuc = encrypt('0992384758001');
  const prov1EncCta = encrypt('CTE-2100456789-BCO-GUAYAQUIL');
  let prov1 = await db.collection('proveedores').findOne({ tenant_id: tenantId, codigo: 'PRV-001' });
  if (!prov1) {
    const res = await db.collection('proveedores').insertOne({
      tenant_id: tenantId,
      created_at: now,
      updated_at: now,
      codigo: 'PRV-001',
      nombre: 'BioMar Acuacultura Ecuador S.A.',
      ruc_cifrado: prov1EncRuc.data,
      ruc_iv: prov1EncRuc.iv,
      ruc_tag: prov1EncRuc.tag,
      cuenta_cifrada: prov1EncCta.data,
      cuenta_iv: prov1EncCta.iv,
      cuenta_tag: prov1EncCta.tag,
      contacto: 'pedidos@biomar.ec | +593 4 288 9900',
      activo: true
    });
    prov1 = { _id: res.insertedId };
    console.log('✓ Proveedor BioMar creado con RUC y Cuenta cifrados.');
  }

  const prov2EncRuc = encrypt('0991122334001');
  const prov2EncCta = encrypt('CTE-1122334455-BCO-PICHINCHA');
  let prov2 = await db.collection('proveedores').findOne({ tenant_id: tenantId, codigo: 'PRV-002' });
  if (!prov2) {
    const res = await db.collection('proveedores').insertOne({
      tenant_id: tenantId,
      created_at: now,
      updated_at: now,
      codigo: 'PRV-002',
      nombre: 'Laboratorio Larvicultura Mar Bravo S.A.',
      ruc_cifrado: prov2EncRuc.data,
      ruc_iv: prov2EncRuc.iv,
      ruc_tag: prov2EncRuc.tag,
      cuenta_cifrada: prov2EncCta.data,
      cuenta_iv: prov2EncCta.iv,
      cuenta_tag: prov2EncCta.tag,
      contacto: 'ventas@marbravolarvas.com | +593 99 876 5432',
      activo: true
    });
    prov2 = { _id: res.insertedId };
    console.log('✓ Proveedor Mar Bravo creado con RUC y Cuenta cifrados.');
  }

  // 7. Parámetros de Calidad de Agua
  await db.collection('parametros_agua').deleteMany({ tenant_id: tenantId });
  await db.collection('parametros_agua').insertMany([
    {
      tenant_id: tenantId,
      granja_id: granja._id,
      piscina_id: piscinaIds[0],
      ciclo_id: cicloP1._id,
      usuario_id: adminUser._id,
      fecha: new Date(Date.now() - 2 * 3600000), // hace 2 horas
      oxigeno_mg_l: dec('5.85'),
      salinidad_ppt: dec('28.50'),
      ph: dec('7.85'),
      temperatura_c: dec('28.40'),
      amonio_mg_l: dec('0.15'),
      alerta: false,
      created_at: now,
      updated_at: now
    },
    {
      tenant_id: tenantId,
      granja_id: granja._id,
      piscina_id: piscinaIds[1],
      ciclo_id: cicloP2._id,
      usuario_id: adminUser._id,
      fecha: new Date(Date.now() - 1 * 3600000), // hace 1 hora (con alerta de oxígeno bajo)
      oxigeno_mg_l: dec('3.10'),
      salinidad_ppt: dec('32.00'),
      ph: dec('8.40'),
      temperatura_c: dec('31.20'),
      amonio_mg_l: dec('1.80'),
      alerta: true,
      created_at: now,
      updated_at: now
    }
  ]);
  console.log('✓ Mediciones de Calidad de Agua registradas (1 normal, 1 con alerta).');

  // 8. Bodegas
  let bodega = await db.collection('bodegas').findOne({ tenant_id: tenantId, granja_id: granja._id, codigo: 'BOD-01' });
  if (!bodega) {
    const res = await db.collection('bodegas').insertOne({
      tenant_id: tenantId,
      granja_id: granja._id,
      created_at: now,
      updated_at: now,
      codigo: 'BOD-01',
      nombre: 'Bodega Principal de Alimentos e Insumos',
      ubicacion: 'Muelle de Carga Central',
      responsable_id: adminUser._id,
      activa: true
    });
    bodega = { _id: res.insertedId };
    console.log('✓ Bodega principal registrada.');
  }

  // 9. Insumos y Productos
  let prodBalanceado = await db.collection('insumos_productos').findOne({ tenant_id: tenantId, sku: 'BAL-35-INI' });
  if (!prodBalanceado) {
    const res = await db.collection('insumos_productos').insertOne({
      tenant_id: tenantId,
      created_at: now,
      updated_at: now,
      sku: 'BAL-35-INI',
      nombre: 'Camaronina 35% Iniciador Extruido',
      categoria: 'balanceado',
      unidad: 'kg',
      stock_minimo: dec('500.00'),
      activo: true
    });
    prodBalanceado = { _id: res.insertedId };
    console.log('✓ Insumo Balanceado creado.');
  }

  let prodProbiotico = await db.collection('insumos_productos').findOne({ tenant_id: tenantId, sku: 'PRO-AQUABAC' });
  if (!prodProbiotico) {
    const res = await db.collection('insumos_productos').insertOne({
      tenant_id: tenantId,
      created_at: now,
      updated_at: now,
      sku: 'PRO-AQUABAC',
      nombre: 'AquaBac Pro Bioremediador Marino',
      categoria: 'probiotico',
      unidad: 'l',
      stock_minimo: dec('50.00'),
      activo: true
    });
    prodProbiotico = { _id: res.insertedId };
    console.log('✓ Insumo Probiótico creado.');
  }

  // 10. Lotes de Inventario
  let lote = await db.collection('lotes_inventario').findOne({ tenant_id: tenantId, codigo_lote: 'LOT-2026-BM35' });
  if (!lote) {
    const res = await db.collection('lotes_inventario').insertOne({
      tenant_id: tenantId,
      granja_id: granja._id,
      bodega_id: bodega._id,
      producto_id: prodBalanceado._id,
      proveedor_id: prov1._id,
      created_at: now,
      updated_at: now,
      codigo_lote: 'LOT-2026-BM35',
      fecha_ingreso: new Date(Date.now() - 20 * 86400000),
      vence_at: new Date(Date.now() + 160 * 86400000),
      cantidad_inicial: dec('2000.00'),
      cantidad_actual: dec('1420.00'),
      costo_unitario: dec('1.45')
    });
    lote = { _id: res.insertedId };
    console.log('✓ Lote de inventario registrado con saldo disponible.');
  }

  // 11. Planes de Alimentación y Consumo Diario
  let plan = await db.collection('planes_alimentacion').findOne({ tenant_id: tenantId, ciclo_id: cicloP1._id });
  if (!plan) {
    const res = await db.collection('planes_alimentacion').insertOne({
      tenant_id: tenantId,
      granja_id: granja._id,
      ciclo_id: cicloP1._id,
      producto_id: prodBalanceado._id,
      created_at: now,
      updated_at: now,
      fecha_inicio: new Date(Date.now() - 30 * 86400000),
      fecha_fin: new Date(Date.now() + 45 * 86400000),
      racion_diaria_kg: dec('115.00'),
      frecuencia_diaria: int(4),
      aprobado_por: adminUser._id,
      estado: 'aprobado'
    });
    plan = { _id: res.insertedId };
    console.log('✓ Plan de alimentación activo registrado.');
  }

  await db.collection('consumo_alimento_diario').deleteMany({ tenant_id: tenantId });
  await db.collection('consumo_alimento_diario').insertOne({
    tenant_id: tenantId,
    granja_id: granja._id,
    piscina_id: piscinaIds[0],
    ciclo_id: cicloP1._id,
    plan_id: plan._id,
    lote_id: lote._id,
    usuario_id: adminUser._id,
    created_at: now,
    updated_at: now,
    fecha: new Date(Date.now() - 6 * 3600000),
    cantidad_kg: dec('112.50'),
    fca: dec('1.24'),
    biomasa_kg: dec('5240.00'),
    observacion: 'Alimentación en 4 raciones; platos testigos limpios sin remanente.'
  });
  console.log('✓ Registro de consumo diario de alimento con FCA calculado (1.24).');

  // 12. Movimientos Kardex
  await db.collection('movimientos_kardex').deleteMany({ tenant_id: tenantId });
  await db.collection('movimientos_kardex').insertMany([
    {
      tenant_id: tenantId,
      granja_id: granja._id,
      bodega_id: bodega._id,
      lote_id: lote._id,
      usuario_id: adminUser._id,
      created_at: now,
      updated_at: now,
      fecha: new Date(Date.now() - 20 * 86400000),
      tipo: 'entrada',
      cantidad: dec('2000.00'),
      saldo_posterior: dec('2000.00'),
      referencia: 'REF-ENT-2026-001',
      motivo: 'Ingreso inicial por Orden de Compra OC-001'
    },
    {
      tenant_id: tenantId,
      granja_id: granja._id,
      bodega_id: bodega._id,
      lote_id: lote._id,
      usuario_id: adminUser._id,
      created_at: now,
      updated_at: now,
      fecha: new Date(Date.now() - 6 * 3600000),
      tipo: 'salida',
      cantidad: dec('112.50'),
      saldo_posterior: dec('1420.00'),
      referencia: 'REF-SAL-2026-015',
      motivo: 'Alimentación piscina P-01 raciones del día'
    }
  ]);
  console.log('✓ Movimientos de Kardex registrados (Entrada y Salida trazada).');

  // 13. Muestreos Biométricos
  await db.collection('muestreos_biometricos').deleteMany({ tenant_id: tenantId });
  await db.collection('muestreos_biometricos').insertOne({
    tenant_id: tenantId,
    granja_id: granja._id,
    piscina_id: piscinaIds[0],
    ciclo_id: cicloP1._id,
    usuario_id: adminUser._id,
    created_at: now,
    updated_at: now,
    fecha: new Date(Date.now() - 24 * 3600000),
    peso_promedio_g: dec('14.85'),
    talla_promedio_cm: dec('11.50'),
    muestra_individuos: int(120),
    biomasa_estimada_kg: dec('5240.00'),
    observacion: 'Excelente tasa de crecimiento (+1.8g/sem). Intestino lleno y hepatopáncreas sano.'
  });
  console.log('✓ Muestreo biométrico registrado para P-01.');

  // 14. Órdenes de Compra
  await db.collection('ordenes_compra').deleteMany({ tenant_id: tenantId });
  await db.collection('ordenes_compra').insertOne({
    tenant_id: tenantId,
    granja_id: granja._id,
    proveedor_id: prov1._id,
    bodega_id: bodega._id,
    created_at: now,
    updated_at: now,
    numero: 'OC-2026-0001',
    fecha: new Date(Date.now() - 15 * 86400000),
    estado: 'aprobada',
    total: dec('2900.00'),
    creado_por: adminUser._id,
    aprobado_por: adminUser._id,
    lineas: [
      {
        producto_id: prodBalanceado._id,
        cantidad: dec('2000.00'),
        precio_unitario: dec('1.45')
      }
    ]
  });
  console.log('✓ Orden de compra aprobada registrada (OC-2026-0001).');

  // 15. Siembra de Larvas
  await db.collection('siembras_larvas').deleteMany({ tenant_id: tenantId });
  await db.collection('siembras_larvas').insertOne({
    tenant_id: tenantId,
    granja_id: granja._id,
    ciclo_id: cicloP1._id,
    proveedor_id: prov2._id,
    created_at: now,
    updated_at: now,
    fecha: new Date(Date.now() - 35 * 86400000),
    cantidad: int(350000),
    densidad_m2: dec('10.00'),
    lote_larvas: 'LARVA-MB-2026-04',
    supervivencia_estimada_pct: dec('85.00')
  });
  console.log('✓ Registro de Siembra de 350,000 post-larvas completado.');

  console.log('\n🎉 ¡Inyección de datos demo finalizada con éxito en MongoDB Atlas!');
  await mongoose.disconnect();
}

runSeed().catch(async (e) => {
  console.error('\n❌ Error al inyectar datos:', e);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
