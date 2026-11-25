'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const { startIsolatedMongo } = require('../test-support/isolated-mongo');

const objectId = () => new mongoose.Types.ObjectId();
const str = value => String(value);

test('fase 1: autorización con MongoDB temporal y datos sintéticos', async t => {
  const mongo = await startIsolatedMongo();
  t.after(() => mongo.stop());

  // Estas variables prevalecen sobre el .env local y nunca apuntan a datos reales.
  process.env.NODE_ENV = 'development';
  process.env.MONGO_URI = mongo.uri;
  process.env.JWT_SECRET = 'fase-0-clave-sintetica-de-ensayo-123456789';
  process.env.ENCRYPTION_KEY_BASE64 = Buffer.alloc(32, 7).toString('base64');
  process.env.APP_ORIGIN = 'http://127.0.0.1:4200';
  const { app, connectDB } = require('../src/server');
  const { sha } = require('../src/config/helpers');
  await connectDB();
  const db = mongoose.connection.db;

  const tenantA = objectId(), tenantB = objectId();
  const farms = [objectId(), objectId(), objectId(), objectId()];
  const pools = farms.map(() => objectId());
  const cycles = farms.map(() => objectId());
  const users = [objectId(), objectId(), objectId(), objectId(), objectId()];
  const roles = [objectId(), objectId(), objectId(), objectId()];
  const permissions = ['granjas:leer', 'piscinas:leer', 'ciclos:crear', 'muestreos:crear', 'agua:crear', 'alimentacion:crear'];
  const permissionIds = permissions.map(() => objectId());
  const tenants = [tenantA, tenantA, tenantB, tenantB];

  await db.collection('granjas_camaroneras').insertMany(farms.map((id, i) => ({
    _id: id, tenant_id: tenants[i], codigo: `G-${i + 1}`, nombre: `Granja ensayo ${i + 1}`
  })));
  await db.collection('piscinas_estanques').insertMany(pools.map((id, i) => ({
    _id: id, tenant_id: tenants[i], granja_id: farms[i], codigo: `P-${i + 1}`, estado: 'activa'
  })));
  await db.collection('ciclos_cultivo').insertMany(cycles.map((id, i) => ({
    _id: id, tenant_id: tenants[i], granja_id: farms[i], piscina_id: pools[i],
    codigo: `CIC-2026-P0${i + 1}`, estado: i === 1 ? 'cerrado' : 'activo'
  })));
  await db.collection('permisos').insertMany(permissionIds.map((id, i) => ({
    _id: id, tenant_id: tenantA, recurso: permissions[i].split(':')[0],
    accion: permissions[i].split(':')[1], codigo: permissions[i]
  })).concat([{ _id: objectId(), tenant_id: tenantB, recurso: 'piscinas', accion: 'leer', codigo: 'piscinas:leer' }]));
  const tenantBPermission = await db.collection('permisos').findOne({ tenant_id: tenantB });
  await db.collection('roles').insertMany([
    { _id: roles[0], tenant_id: tenantA, codigo: 'operador', nombre: 'Operador', activo: true, permiso_ids: permissionIds },
    { _id: roles[1], tenant_id: tenantA, codigo: 'lector', nombre: 'Lector', activo: true, permiso_ids: [permissionIds[0], permissionIds[1]] },
    { _id: roles[2], tenant_id: tenantB, codigo: 'lector', nombre: 'Lector B', activo: true, permiso_ids: [tenantBPermission._id] },
    { _id: roles[3], tenant_id: tenantA, codigo: 'administrador', nombre: 'Administrador A', activo: true, permiso_ids: [] }
  ]);
  await db.collection('usuarios').insertMany([
    { _id: users[0], tenant_id: tenantA, email: 'operador@ensayo.invalid', nombre: 'Operador', activo: true, rol_ids: [roles[0]], granja_ids: farms.slice(0, 2), piscina_ids: pools.slice(0, 2) },
    { _id: users[1], tenant_id: tenantA, email: 'lector@ensayo.invalid', nombre: 'Lector', activo: true, rol_ids: [roles[1]], granja_ids: [farms[0]], piscina_ids: [pools[0]] },
    { _id: users[2], tenant_id: tenantA, email: 'sin-asignacion@ensayo.invalid', nombre: 'Sin asignación', activo: true, rol_ids: [roles[1]], granja_ids: [], piscina_ids: [] },
    { _id: users[3], tenant_id: tenantB, email: 'otro-tenant@ensayo.invalid', nombre: 'Otro tenant', activo: true, rol_ids: [roles[2]], granja_ids: [farms[2]], piscina_ids: [pools[2]] },
    { _id: users[4], tenant_id: tenantA, email: 'admin@ensayo.invalid', nombre: 'Administrador', activo: true, rol_ids: [roles[3]], granja_ids: [], piscina_ids: [] }
  ]);
  const lot = objectId();
  await db.collection('lotes_inventario').insertOne({
    _id: lot, tenant_id: tenantA, granja_id: farms[1], bodega_id: objectId(),
    cantidad_actual: mongoose.Types.Decimal128.fromString('100'), codigo_lote: 'ENSAYO-01'
  });

  const tokens = [];
  for (let i = 0; i < users.length; i++) {
    const jti = randomUUID();
    const sid = objectId();
    await db.collection('sesiones_activas').insertOne({
      _id: sid, tenant_id: i === 3 ? tenantB : tenantA, usuario_id: users[i],
      jti_hash: sha(jti), revocada: false, expires_at: new Date(Date.now() + 3600000)
    });
    tokens.push(jwt.sign({ sub: str(users[i]), tenant_id: str(i === 3 ? tenantB : tenantA), sid: str(sid), jti },
      process.env.JWT_SECRET, { algorithm: 'HS256', audience: 'by-fekas-erp', issuer: 'by-fekas-corp', expiresIn: '1h' }));
  }

  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(userIndex, route, body) {
    const response = await fetch(base + route, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${tokens[userIndex]}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    return { status: response.status, data: await response.json() };
  }

  const farmsOperator = await request(0, '/api/granjas');
  await t.test('operador ve sus dos granjas y ningún tenant ajeno', () => {
    assert.equal(farmsOperator.status, 200);
    assert.deepEqual(farmsOperator.data.map(x => x.id).sort(), farms.slice(0, 2).map(str).sort());
  });
  const farmsEmpty = await request(2, '/api/granjas');
  await t.test('usuario sin asignación no recibe granjas', () => {
    assert.deepEqual(farmsEmpty.data, []);
  });
  const poolsReader = await request(1, '/api/piscinas');
  await t.test('lector solo recibe su piscina asignada', () => {
    assert.deepEqual(poolsReader.data.map(x => x.id), [str(pools[0])]);
  });
  const poolsTenantB = await request(3, '/api/piscinas');
  await t.test('un tenant solo recibe sus piscinas', () => {
    assert.equal(poolsTenantB.status, 200);
    assert.deepEqual(poolsTenantB.data.map(x => x.id), [str(pools[2])]);
  });
  const adminFarms = await request(4, '/api/granjas');
  const adminPools = await request(4, '/api/piscinas');
  await t.test('administrador sin asignaciones ve solo su tenant', () => {
    assert.deepEqual(adminFarms.data.map(x => x.id).sort(), farms.slice(0, 2).map(str).sort());
    assert.deepEqual(adminPools.data.map(x => x.id).sort(), pools.slice(0, 2).map(str).sort());
  });

  const cycleCountBefore = await db.collection('ciclos_cultivo').countDocuments();
  const next = await request(0, `/api/ciclos/siguiente?granja_id=${farms[0]}&piscina_id=${pools[0]}&fecha=2027-01-10`);
  const cycleCountAfter = await db.collection('ciclos_cultivo').countDocuments();
  await t.test('GET de siguiente ciclo no escribe', () => {
    assert.equal(next.status, 200);
    assert.equal(cycleCountAfter, cycleCountBefore);
    assert.deepEqual(next.data.ciclos_existentes.map(x => x.id), [str(cycles[0])]);
  });

  const fecha = '2026-11-24T12:00:00.000Z';
  const common = { granja_id: str(farms[1]), piscina_id: str(pools[1]), ciclo_id: str(cycles[0]), fecha };
  const water = await request(0, '/api/parametros-agua', {
    ...common, oxigeno_mg_l: 5, salinidad_ppt: 28, ph: 7.8, temperatura_c: 29, amonio_mg_l: 0.2
  });
  await t.test('agua rechaza ciclo de otra piscina y no escribe', async () => {
    assert.equal(water.status, 403);
    assert.equal(await db.collection('parametros_agua').countDocuments(), 0);
  });
  const sample = await request(0, '/api/muestreos', {
    ...common, peso_promedio_g: 14, talla_promedio_cm: 10,
    muestra_individuos: 30, biomasa_estimada_kg: 100
  });
  await t.test('muestreo rechaza ciclo de otra piscina y no escribe', async () => {
    assert.equal(sample.status, 403);
    assert.equal(await db.collection('muestreos_biometricos').countDocuments(), 0);
  });
  const feed = await request(0, '/api/alimentacion', {
    ...common, lote_id: str(lot), cantidad_kg: 5
  });
  await t.test('alimentación rechaza ciclo incoherente sin consumir inventario', async () => {
    assert.equal(feed.status, 403);
    assert.equal(await db.collection('consumo_alimento_diario').countDocuments(), 0);
    assert.equal((await db.collection('lotes_inventario').findOne({ _id: lot })).cantidad_actual.toString(), '100');
  });
  const readerWater = await request(1, '/api/parametros-agua', {
    ...common, oxigeno_mg_l: 5, salinidad_ppt: 28, ph: 7.8, temperatura_c: 29, amonio_mg_l: 0.2
  });
  await t.test('lector sin permiso de escritura recibe 403', () => {
    assert.equal(readerWater.status, 403);
  });
  const validWater = await request(0, '/api/parametros-agua', {
    granja_id: str(farms[0]), piscina_id: str(pools[0]), ciclo_id: str(cycles[0]), fecha,
    oxigeno_mg_l: 5, salinidad_ppt: 28, ph: 7.8, temperatura_c: 29, amonio_mg_l: 0.2
  });
  await t.test('operador puede registrar agua con IDs coherentes', () => {
    assert.equal(validWater.status, 201);
  });
  const poolsAfterReading = await request(0, '/api/piscinas');
  await t.test('la consulta de piscinas identifica la fecha de los datos operativos', () => {
    const pool = poolsAfterReading.data.find(row => row.id === str(pools[0]));
    assert.equal(new Date(pool.ultima_lectura_agua).toISOString(), fecha);
    assert.equal(pool.biomasa_actualizada_at, null);
    assert.equal(pool.fecha_ultimo_consumo, null);
  });
  const unauthenticated = await fetch(base + '/api/granjas');
  await t.test('sin token recibe 401', () => {
    assert.equal(unauthenticated.status, 401);
  });

  const wrongTenant = await request(0, `/api/ciclos/siguiente?granja_id=${farms[2]}&piscina_id=${pools[2]}`);
  await t.test('consulta de ciclo de otro tenant recibe 403', () => {
    assert.equal(wrongTenant.status, 403);
  });
  const wrongPair = await request(0, '/api/ciclos', {
    granja_id: str(farms[0]), piscina_id: str(pools[1]), fecha_inicio: fecha
  });
  await t.test('creación rechaza piscina de otra granja', () => {
    assert.equal(wrongPair.status, 403);
  });
  const readerCreate = await request(1, '/api/ciclos', {
    granja_id: str(farms[0]), piscina_id: str(pools[0]), fecha_inicio: fecha
  });
  await t.test('lector sin permiso de ciclos no puede crearlos', () => {
    assert.equal(readerCreate.status, 403);
  });
  const createPayload = { granja_id: str(farms[1]), piscina_id: str(pools[1]), fecha_inicio: fecha };
  const created = await request(0, '/api/ciclos', createPayload);
  await t.test('operador crea explícitamente un ciclo válido', async () => {
    assert.equal(created.status, 201);
    const stored = await db.collection('ciclos_cultivo').findOne({ _id: new mongoose.Types.ObjectId(created.data.id) });
    assert.equal(str(stored.granja_id), str(farms[1]));
    assert.equal(str(stored.piscina_id), str(pools[1]));
    assert.equal(stored.estado, 'activo');
  });
  const duplicate = await request(0, '/api/ciclos', createPayload);
  await t.test('no se crea un segundo ciclo activo en la misma piscina', () => {
    assert.equal(duplicate.status, 409);
  });
  await t.test('índices únicos protegen código y ciclo activo', async () => {
    const indexes = await db.collection('ciclos_cultivo').listIndexes().toArray();
    assert.equal(indexes.find(x => x.name === 'uniq_ciclo_codigo_tenant')?.unique, true);
    assert.equal(indexes.find(x => x.name === 'uniq_ciclo_activo_piscina')?.unique, true);
  });

  console.log('FASE_1_OBSERVADO ' + JSON.stringify({
    granjas_sin_asignacion: farmsEmpty.data.length,
    piscinas_lector: poolsReader.data.length,
    piscinas_tenant_b: poolsTenantB.data.length,
    ciclos_creados_por_get: cycleCountAfter - cycleCountBefore,
    agua_incoherente: water.status,
    agua_incoherente_documentos: await db.collection('parametros_agua').countDocuments({ ciclo_id: cycles[0], granja_id: farms[1] }),
    muestreo_incoherente: sample.status,
    muestreo_incoherente_documentos: await db.collection('muestreos_biometricos').countDocuments(),
    alimentacion_incoherente: feed.status,
    consumo_incoherente_documentos: await db.collection('consumo_alimento_diario').countDocuments(),
    saldo_lote_tras_consumo_incoherente: (await db.collection('lotes_inventario').findOne({ _id: lot })).cantidad_actual.toString(),
    lector_sin_permiso: readerWater.status
  }));
});
