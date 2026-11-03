import { test, expect, type Page } from '@playwright/test';

// Datos ficticios. Ninguna prueba se conecta a MongoDB ni envía peticiones al backend.
const ids = { piscina: '111111111111111111111111', granja: '222222222222222222222222', ciclo: '333333333333333333333333', lote: '444444444444444444444444' };
const user = { id: '555555555555555555555555', nombre: 'María Campos', email: 'maria@example.test', tenant_id: '666666666666666666666666' };
const pools = [
  { id: ids.piscina, granja_id: ids.granja, ciclo_id: ids.ciclo, codigo: 'P-01', estado: 'activa', especie: 'Camarón blanco', ciclo_codigo: 'C-2026-01', area_ha: '4.5', oxigeno_mg_l: '6.5', ph: '7.8', salinidad_ppt: '25', temperatura_c: '28', amonio_mg_l: '0.3', biomasa_kg: '12500', fca: '1.4', alerta: false },
  { id: '777777777777777777777777', granja_id: ids.granja, ciclo_id: ids.ciclo, codigo: 'P-02', estado: 'activa', especie: 'Camarón blanco', area_ha: '3.2', oxigeno_mg_l: '3.5', ph: '7.2', biomasa_kg: '8200', fca: '1.6', alerta: true },
  { id: '888888888888888888888888', granja_id: ids.granja, ciclo_id: null, codigo: 'P-03', estado: 'mantenimiento', area_ha: '5', alerta: false }
];

async function mockApi(page: Page, authenticated = true) {
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const body = path === '/api/piscinas' ? pools
      : path === '/api/proveedores' && route.request().method() === 'GET' ? [{ id: 'provider-1', nombre: 'Balanceados del Pacífico', email_contacto: 'ventas@example.test', activo: true }]
      : path === '/api/ordenes' ? [{ numero_orden: 'OC-2026-004', fecha: '2026-10-29T12:00:00Z', estado: 'aprobada', total: 2450 }]
      : { id: 'registro-prueba', alerta: false };
    await route.fulfill({ json: body });
  });
  await page.route('**/auth/**', route => route.fulfill({ json: { access_token: 'test-token', user, token_type: 'Bearer', expires_in: 900 } }));
  if (authenticated) await page.addInitScript(user => {
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('user', JSON.stringify(user));
  }, user);
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('acceso, error recuperable y cierre de sesión', async ({ page }, info) => {
  await mockApi(page, false);
  await page.goto('/#/login');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bienvenido de nuevo.');
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath('login.png'), fullPage: true });
  await page.getByLabel('Correo electrónico').fill('maria@example.test');
  await page.getByLabel('Contraseña').fill('test-password');
  await page.route('**/auth/login', route => route.fulfill({ status: 401, json: { error: 'Credenciales inválidas' } }));
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page.getByRole('alert')).toHaveText('Credenciales inválidas');
  await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeEnabled();
  await page.unroute('**/auth/login');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).toHaveURL(/#\/dashboard$/);
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/#\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
});

test('dashboard conserva indicadores, alertas y enlaces', async ({ page }, info) => {
  await mockApi(page);
  await page.goto('/#/dashboard');
  await expect(page.locator('#stat-total-pools')).toHaveText('3');
  await expect(page.locator('#stat-active-pools')).toHaveText('2');
  await expect(page.locator('#stat-alerts')).toHaveText('1');
  await expect(page.locator('#stat-biomass')).toHaveText((20700).toLocaleString('es-EC', { maximumFractionDigits: 0 }));
  await expect(page.locator('.alert-tile')).toHaveCount(1);
  await expect(page.locator('.table tbody tr')).toHaveCount(3);
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath('dashboard.png'), fullPage: true });
  await page.locator('.quick-action').filter({ hasText: 'Calidad del agua' }).click();
  await expect(page.locator('#agua-form')).toBeVisible();
});

test('menú móvil accesible y navegación entre todos los módulos', async ({ page }, info) => {
  await mockApi(page);
  await page.goto('/#/dashboard');
  const toggle = page.getByRole('button', { name: 'Abrir menú' });
  if (info.project.name === 'mobile') {
    await expect(page.locator('#app-sidebar')).toHaveJSProperty('inert', true);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('link', { name: 'Compras y proveedores', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'By Fekas Corp., inicio' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  }
  for (const [name, path] of [['Piscinas y estanques', '/piscinas'], ['Muestreo biométrico', '/form-muestreo'], ['Calidad del agua', '/form-agua'], ['Alimentación', '/form-alimentacion'], ['Compras y proveedores', '/compras']]) {
    if (info.project.name === 'mobile') await toggle.click();
    await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${path}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await noOverflow(page);
    await expect(page.locator('.layout__content')).toHaveJSProperty('inert', false);
  }
});

const operations = [
  { path: 'form-agua', endpoint: '/api/parametros-agua', prefix: 'a', link: 'Agua', fields: { oxigeno: '6.5', salinidad: '25', ph: '7.8', temp: '28', amonio: '0.5' }, expected: { oxigeno_mg_l: 6.5, salinidad_ppt: 25, ph: 7.8, temperatura_c: 28, amonio_mg_l: 0.5 } },
  { path: 'form-muestreo', endpoint: '/api/muestreos', prefix: 'm', link: 'Muestreo', fields: { peso: '18.5', talla: '12.3', individuos: '50', biomasa: '4500', obs: 'Muestra de prueba' }, expected: { peso_promedio_g: 18.5, talla_promedio_cm: 12.3, muestra_individuos: 50, biomasa_estimada_kg: 4500, observacion: 'Muestra de prueba' } },
  { path: 'form-alimentacion', endpoint: '/api/alimentacion', prefix: 'al', link: 'Alimento', fields: { lote: ids.lote, cantidad: '125.5', fca: '1.4', biomasa: '4500', obs: 'Consumo de prueba' }, expected: { lote_id: ids.lote, cantidad_kg: 125.5, fca: 1.4, biomasa_kg: 4500, observacion: 'Consumo de prueba' } }
];
for (const operation of operations) {
  test(`${operation.path}: prellenado, validación y contrato del envío`, async ({ page }, info) => {
    await mockApi(page);
    await page.goto('/#/piscinas');
    await page.locator('.pool-card').first().getByRole('link', { name: operation.link, exact: true }).click();
    for (const key of ['granja', 'piscina', 'ciclo'] as const) await expect(page.locator(`#${operation.prefix}-${key}`)).toHaveValue(ids[key]);
    await page.locator(`#${operation.prefix}-fecha`).fill('2026-10-30T09:30');
    for (const [field, value] of Object.entries(operation.fields)) await page.locator(`#${operation.prefix}-${field}`).fill(value!);
    if (operation.path === 'form-agua') {
      await page.locator('#a-oxigeno').fill('3.5');
      await expect(page.locator('#a-preview')).toContainText('O₂ bajo');
      await page.locator('#a-oxigeno').fill('31');
      expect(await page.locator('#a-oxigeno').evaluate((input: HTMLInputElement) => input.validity.rangeOverflow)).toBe(true);
      await page.locator('#a-oxigeno').fill('6.5');
      await expect(page.locator('#a-preview')).toBeHidden();
    }
    await noOverflow(page);
    await page.screenshot({ path: info.outputPath(`${operation.path}.png`), fullPage: true });
    expect(await page.locator('form').evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(true);
    const request = page.waitForRequest(request => request.url().endsWith(operation.endpoint) && request.method() === 'POST');
    await page.locator(`#${operation.prefix}-submit`).click();
    const sent = await request;
    expect(sent.postDataJSON()).toEqual({ ...operation.expected, granja_id: ids.granja, piscina_id: ids.piscina, ciclo_id: ids.ciclo, fecha: await page.evaluate(() => new Date('2026-10-30T09:30').toISOString()) });
    expect(sent.headers().authorization).toBe('Bearer test-token');
    await expect(page.locator('.toast--success')).toBeVisible();
  });
}

test('compras mantiene el formulario de proveedor y sus datos', async ({ page }, info) => {
  await mockApi(page);
  await page.goto('/#/compras');
  await expect(page.getByText('OC-2026-004')).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo proveedor' }).click();
  await expect(page.locator('#prov-nombre')).toBeFocused();
  await page.locator('#prov-nombre').fill('Proveedor de prueba');
  await page.locator('#prov-ruc').fill('0991234567001');
  await page.locator('#prov-contacto').fill('Ana');
  await page.locator('#prov-email').fill('ana@example.test');
  await page.locator('#prov-cuenta').fill('1234567890');
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath('compras.png'), fullPage: true });
  const request = page.waitForRequest(request => request.url().endsWith('/api/proveedores') && request.method() === 'POST');
  await page.getByRole('button', { name: 'Guardar proveedor' }).click();
  expect((await request).postDataJSON()).toEqual({ nombre: 'Proveedor de prueba', ruc: '0991234567001', contacto: 'Ana', email: 'ana@example.test', cuenta_bancaria: '1234567890' });
  await expect(page.locator('#modal-prov')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Nuevo proveedor' })).toHaveAttribute('aria-expanded', 'false');
});

test('datos vacíos, errores y texto dinámico seguro', async ({ page }) => {
  await mockApi(page);
  await page.route('**/api/piscinas', route => route.fulfill({ json: [] }));
  await page.goto('/#/dashboard');
  await expect(page.getByText('No hay piscinas registradas', { exact: true })).toBeVisible();
  await page.route('**/api/piscinas', route => route.fulfill({ status: 500, json: { error: 'Error de prueba' } }));
  await page.reload();
  await expect(page.getByText('Sin datos disponibles.')).toBeVisible();
  await page.goto('/#/form-agua?codigo=' + encodeURIComponent('<img src=x onerror=alert(1)>') + '&granja=' + encodeURIComponent('" autofocus onfocus="alert(1)'));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('#router-outlet img')).toHaveCount(0);
  expect(await page.locator('#a-granja').getAttribute('onfocus')).toBeNull();
});

test('pantallas sin desbordamiento a 320px y con movimiento reducido', async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['dashboard', 'piscinas', 'form-agua', 'form-muestreo', 'form-alimentacion', 'compras']) {
    await page.goto(`/#/${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    if (path === 'piscinas') await expect(page.locator('.pool-card')).toHaveCount(3);
    if (path === 'dashboard') await expect(page.locator('#stat-total-pools')).toHaveText('3');
    if (path === 'compras') await expect(page.getByText('OC-2026-004')).toBeVisible();
    await noOverflow(page);
  }
});
