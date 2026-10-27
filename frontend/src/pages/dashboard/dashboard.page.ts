/* ═══════════════════════════════════════════════════════════
   Dashboard Page — Panel principal con resumen de métricas
   Muestra estado general de piscinas, alertas y actividad
   ═══════════════════════════════════════════════════════════ */
import { fetchPiscinas } from '../../services/piscina.service.ts';
import type { PiscinaRow } from '../../core/models/index.ts';
import { getUser } from '../../services/auth.service.ts';

export function renderDashboard(): string {
  const user = getUser();
  return `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Dashboard</h1>
        <p class="page-header__subtitle">Bienvenido, ${user?.nombre || 'Operador'}</p>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn--secondary btn--sm" onclick="location.hash='#/piscinas'">
          🏊 Ver Piscinas
        </button>
      </div>
    </div>

    <div id="dashboard-stats" class="stats-grid">
      <div class="stat-card animate-card-enter delay-1">
        <div class="stat-card__icon stat-card__icon--aqua">🏊</div>
        <div class="stat-card__value" id="stat-total-pools">—</div>
        <div class="stat-card__label">Piscinas Totales</div>
      </div>
      <div class="stat-card animate-card-enter delay-2">
        <div class="stat-card__icon stat-card__icon--green">✓</div>
        <div class="stat-card__value" id="stat-active-pools">—</div>
        <div class="stat-card__label">Piscinas Activas</div>
      </div>
      <div class="stat-card animate-card-enter delay-3">
        <div class="stat-card__icon stat-card__icon--red">⚠</div>
        <div class="stat-card__value" id="stat-alerts">—</div>
        <div class="stat-card__label">Alertas de Agua</div>
      </div>
      <div class="stat-card animate-card-enter delay-4">
        <div class="stat-card__icon stat-card__icon--blue">📊</div>
        <div class="stat-card__value" id="stat-biomass">—</div>
        <div class="stat-card__label">Biomasa Total (kg)</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
      <div class="card animate-card-enter delay-3">
        <div class="card__header">
          <h2 class="card__title">🔴 Alertas Recientes</h2>
        </div>
        <div id="dashboard-alerts">
          <div class="loading-overlay">
            <div class="spinner"></div>
            <span>Cargando alertas…</span>
          </div>
        </div>
      </div>

      <div class="card animate-card-enter delay-4">
        <div class="card__header">
          <h2 class="card__title">⚡ Acciones Rápidas</h2>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <button class="btn btn--secondary" onclick="location.hash='#/form-muestreo'" style="justify-content:flex-start;">
            <span>🔬</span> Registrar Muestreo
          </button>
          <button class="btn btn--secondary" onclick="location.hash='#/form-agua'" style="justify-content:flex-start;">
            <span>💧</span> Registrar Parámetros de Agua
          </button>
          <button class="btn btn--secondary" onclick="location.hash='#/form-alimentacion'" style="justify-content:flex-start;">
            <span>🍤</span> Registrar Alimentación
          </button>
          <button class="btn btn--secondary" onclick="location.hash='#/piscinas'" style="justify-content:flex-start;">
            <span>🏊</span> Ver Todas las Piscinas
          </button>
        </div>
      </div>
    </div>

    <div class="card animate-card-enter delay-5" style="margin-top:16px;">
      <div class="card__header">
        <h2 class="card__title">📋 Resumen de Piscinas</h2>
      </div>
      <div id="dashboard-pool-summary">
        <div class="loading-overlay">
          <div class="spinner"></div>
          <span>Cargando piscinas…</span>
        </div>
      </div>
    </div>
  `;
}

export async function initDashboard() {
  try {
    const pools = await fetchPiscinas();
    updateStats(pools);
    renderAlerts(pools);
    renderPoolSummary(pools);
  } catch {
    document.getElementById('dashboard-alerts')!.innerHTML =
      '<p style="color:var(--text-muted); padding:16px;">No se pudieron cargar los datos. Verifique la conexión con el backend.</p>';
    document.getElementById('dashboard-pool-summary')!.innerHTML =
      '<p style="color:var(--text-muted); padding:16px;">Sin datos disponibles.</p>';
  }
}

function updateStats(pools: PiscinaRow[]) {
  const total = pools.length;
  const active = pools.filter(p => p.estado === 'activa').length;
  const alerts = pools.filter(p => p.alerta).length;
  const biomass = pools.reduce((sum, p) => sum + (p.biomasa_kg ? parseFloat(p.biomasa_kg) : 0), 0);

  const animate = (el: HTMLElement, value: string) => {
    el.textContent = value;
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'fadeSlideIn 0.3s var(--ease-out)';
  };

  animate(document.getElementById('stat-total-pools')!, String(total));
  animate(document.getElementById('stat-active-pools')!, String(active));
  animate(document.getElementById('stat-alerts')!, String(alerts));
  animate(document.getElementById('stat-biomass')!, biomass > 0 ? biomass.toLocaleString('es-EC', { maximumFractionDigits: 0 }) : '—');
}

function renderAlerts(pools: PiscinaRow[]) {
  const alertPools = pools.filter(p => p.alerta);
  const container = document.getElementById('dashboard-alerts')!;

  if (alertPools.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:24px; color:var(--success);">
        <div style="font-size:2rem; margin-bottom:8px;">✓</div>
        <p>Sin alertas activas</p>
      </div>
    `;
    return;
  }

  container.innerHTML = alertPools.map(p => `
    <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-color);">
      <span style="color:var(--danger); font-size:1.2rem; animation:pulse 2s infinite;">●</span>
      <div style="flex:1;">
        <div style="font-weight:600; font-size:var(--font-sm);">Piscina ${p.codigo}</div>
        <div style="font-size:var(--font-xs); color:var(--text-muted);">
          O₂: ${p.oxigeno_mg_l || '—'} mg/L · pH: ${p.ph || '—'} · NH₃: ${p.amonio_mg_l || '—'} mg/L
        </div>
      </div>
      <span class="badge badge--danger">Alerta</span>
    </div>
  `).join('');
}

function renderPoolSummary(pools: PiscinaRow[]) {
  const container = document.getElementById('dashboard-pool-summary')!;

  if (pools.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🏊</div>
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
      <table class="table">
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
            <tr style="cursor:pointer;" onclick="location.hash='#/piscinas'">
              <td style="font-weight:600;">${p.codigo}</td>
              <td><span class="badge badge--${statusColor(p.estado)}">${p.estado}</span></td>
              <td>${p.area_ha || '—'}</td>
              <td class="${p.oxigeno_mg_l && parseFloat(p.oxigeno_mg_l) < 4 ? 'pool-metric__value--danger' : ''}">${p.oxigeno_mg_l || '—'}</td>
              <td class="${p.ph && (parseFloat(p.ph) < 7 || parseFloat(p.ph) > 9) ? 'pool-metric__value--warning' : ''}">${p.ph || '—'}</td>
              <td>${p.biomasa_kg ? parseFloat(p.biomasa_kg).toLocaleString('es-EC') : '—'}</td>
              <td>${p.fca || '—'}</td>
              <td>${p.alerta ? '<span class="badge badge--danger" style="animation:pulse 2s infinite;">⚠</span>' : '<span class="badge badge--success">OK</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
