/* ═══════════════════════════════════════════════════════════
   Dashboard Page — Panel Principal de Operaciones
   Diseño corporativo en escala pizarra y plata sin emojis
   ═══════════════════════════════════════════════════════════ */
import { fetchPiscinas } from '../../services/piscina.service';
import type { PiscinaRow } from '../../core/models/index';
import { getUser } from '../../services/auth.service';
import { escapeHtml, icon, pageHeader, type IconName } from '../../shared/ui';

export function renderDashboard(): string {
  const user = getUser();
  const stats: { id: string; label: string; hint: string; icon: IconName }[] = [
    { id: 'stat-total-pools', label: 'Piscinas totales', hint: 'Estanques en tu operación', icon: 'pools' },
    { id: 'stat-active-pools', label: 'Piscinas activas', hint: 'Estado operativo actual', icon: 'water' },
    { id: 'stat-alerts', label: 'Alertas de agua', hint: 'Piscinas que requieren revisión', icon: 'alert' },
    { id: 'stat-biomass', label: 'Biomasa total · kg', hint: 'Estimación de ciclos actuales', icon: 'scale' }
  ];
  const actions: { path: string; label: string; hint: string; icon: IconName }[] = [
    { path: '/form-muestreo', label: 'Muestreo', hint: 'Peso y crecimiento', icon: 'sample' },
    { path: '/form-agua', label: 'Calidad del agua', hint: 'Parámetros y alertas', icon: 'water' },
    { path: '/form-alimentacion', label: 'Alimentación', hint: 'Consumo e inventario', icon: 'feed' },
    { path: '/piscinas', label: 'Piscinas', hint: 'Revisar estanques', icon: 'pools' }
  ];
  return `
    ${pageHeader('Tu operación, en perspectiva.', `Bienvenido, ${user?.nombre || 'a By Fekas'}. Este es el resumen de tus piscinas.`, 'Panel de operaciones', `<a class="btn btn--primary" href="#/piscinas">Ver piscinas ${icon('arrow')}</a>`)}
    <div id="dashboard-stats" class="stats-grid" aria-label="Indicadores operativos">
      ${stats.map((stat, i) => `<div class="stat-card ${i === 0 ? 'stat-card--featured' : ''}"><div class="stat-card__top"><span class="stat-card__label">${stat.label}</span>${icon(stat.icon)}</div><div class="stat-card__value" id="${stat.id}">—</div><p class="stat-card__foot">${stat.hint}</p></div>`).join('')}
    </div>
    <div class="dashboard-columns">
      <section class="card"><div class="card__header"><div><h2 class="card__title">Atención en campo</h2><p class="card__caption">Alertas de los últimos registros de agua</p></div>${icon('alert')}</div>
        <div id="dashboard-alerts"><div class="loading-overlay" role="status"><div class="spinner"></div><span>Cargando alertas…</span></div></div>
      </section>
      <section class="card"><div class="card__header"><div><h2 class="card__title">Registrar una operación</h2><p class="card__caption">Accesos al trabajo de cada día</p></div></div>
        <div class="quick-actions">${actions.map(action => `<a class="quick-action" href="#${action.path}"><span class="quick-action__icon">${icon(action.icon)}</span><strong>${action.label}</strong><small>${action.hint}</small></a>`).join('')}</div>
      </section>
    </div>
    <section class="card section-gap"><div class="card__header"><div><h2 class="card__title">Estado de las piscinas</h2><p class="card__caption">Últimas mediciones disponibles por estanque</p></div><a href="#/piscinas" class="summary-link">Ver todas ${icon('arrow')}</a></div>
      <div id="dashboard-pool-summary"><div class="loading-overlay" role="status"><div class="spinner"></div><span>Cargando piscinas…</span></div></div>
    </section>`;
}

export async function initDashboard() {
  try {
    const pools = await fetchPiscinas();
    updateStats(pools);
    renderAlerts(pools);
    renderPoolSummary(pools);
  } catch {
    const alertsEl = document.getElementById('dashboard-alerts');
    if (alertsEl) {
      alertsEl.innerHTML = '<p style="color:var(--text-muted); padding:16px;">No se pudieron cargar los datos. Verifique la conexión con el backend.</p>';
    }
    const summaryEl = document.getElementById('dashboard-pool-summary');
    if (summaryEl) {
      summaryEl.innerHTML = '<p style="color:var(--text-muted); padding:16px;">Sin datos disponibles.</p>';
    }
  }
}

function updateStats(pools: PiscinaRow[]) {
  const total = pools.length;
  const active = pools.filter(p => p.estado === 'activa').length;
  const alerts = pools.filter(p => p.alerta).length;
  const biomass = pools.reduce((sum, p) => sum + (p.biomasa_kg ? parseFloat(p.biomasa_kg) : 0), 0);

  const setVal = (id: string, value: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setVal('stat-total-pools', String(total));
  setVal('stat-active-pools', String(active));
  setVal('stat-alerts', String(alerts));
  setVal('stat-biomass', biomass > 0 ? biomass.toLocaleString('es-EC', { maximumFractionDigits: 0 }) : '0');
}

function renderAlerts(pools: PiscinaRow[]) {
  const alertPools = pools.filter(p => p.alerta);
  const container = document.getElementById('dashboard-alerts');
  if (!container) return;

  if (alertPools.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        ${icon('check')}
        <p class="empty-state__title">Sin alertas registradas</p>
        <span class="empty-state__text">No hay alertas en los datos disponibles de tus piscinas.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = alertPools.map(p => `
    <a class="alert-tile" href="#/piscinas" title="Ver detalles de piscina">
      ${icon('alert')}
      <div class="alert-tile__content">
        <div class="alert-tile__title">Piscina ${escapeHtml(p.codigo)}</div>
        <div class="alert-tile__subtitle">
          O₂: ${escapeHtml(p.oxigeno_mg_l || '—')} mg/L · pH: ${escapeHtml(p.ph || '—')} · Amonio: ${escapeHtml(p.amonio_mg_l || '—')} mg/L
        </div>
      </div>
      ${icon('arrow')}
    </a>
  `).join('');
}

function renderPoolSummary(pools: PiscinaRow[]) {
  const container = document.getElementById('dashboard-pool-summary');
  if (!container) return;

  if (pools.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__text">No hay piscinas registradas</p>
      </div>
    `;
    return;
  }

  const statusColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'success';
      case 'mantenimiento': return 'warning';
      default: return 'neutral';
    }
  };

  container.innerHTML = `
    <div class="table-wrapper">
      <table class="table" aria-label="Estado operativo de piscinas">
        <thead>
          <tr>
            <th>Código</th>
            <th>Estado</th>
            <th>Área (ha)</th>
            <th>O₂ (mg/L)</th>
            <th>pH</th>
            <th>Biomasa (kg)</th>
            <th>FCA</th>
            <th>Alerta</th>
          </tr>
        </thead>
        <tbody>
          ${pools.map(p => `
            <tr>
              <td><a class="table-link text-strong" href="#/piscinas">${escapeHtml(p.codigo)}</a></td>
              <td><span class="badge badge--${statusColor(p.estado)}">${escapeHtml(p.estado)}</span></td>
              <td>${escapeHtml(p.area_ha || '—')}</td>
              <td class="${p.oxigeno_mg_l && parseFloat(p.oxigeno_mg_l) < 4 ? 'pool-metric__value--danger' : ''}">${escapeHtml(p.oxigeno_mg_l || '—')}</td>
              <td class="${p.ph && (parseFloat(p.ph) < 7 || parseFloat(p.ph) > 9) ? 'pool-metric__value--warning' : ''}">${escapeHtml(p.ph || '—')}</td>
              <td>${p.biomasa_kg ? parseFloat(p.biomasa_kg).toLocaleString('es-EC') : '—'}</td>
              <td>${escapeHtml(p.fca || '—')}</td>
              <td>${p.alerta ? '<span class="badge badge--danger">Alerta</span>' : '<span class="badge badge--success">OK</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

