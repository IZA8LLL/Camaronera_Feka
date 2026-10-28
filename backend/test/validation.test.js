'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { waterDto } = require('../src/middlewares/validate.middleware');

const validWaterReading = {
  granja_id: '507f1f77bcf86cd799439011',
  piscina_id: '507f1f77bcf86cd799439012',
  ciclo_id: '507f1f77bcf86cd799439013',
  fecha: '2026-10-28T12:00:00.000Z',
  oxigeno_mg_l: 5.2,
  salinidad_ppt: 28,
  ph: 7.8,
  temperatura_c: 29,
  amonio_mg_l: 0.2
};

test('acepta una lectura de agua con campos y rangos válidos', () => {
  const result = waterDto.safeParse(validWaterReading);
  assert.equal(result.success, true);
});

test('rechaza una lectura de agua con pH fuera de rango', () => {
  const result = waterDto.safeParse({ ...validWaterReading, ph: 14.1 });
  assert.equal(result.success, false);
});

test('rechaza campos que no forman parte del contrato', () => {
  const result = waterDto.safeParse({ ...validWaterReading, tenant_id: 'otro-tenant' });
  assert.equal(result.success, false);
});
