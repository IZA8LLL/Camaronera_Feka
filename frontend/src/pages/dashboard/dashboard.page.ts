/* ═══════════════════════════════════════════════════════════
   Dashboard Page — Panel Principal de Operaciones
   Diseño corporativo en escala pizarra y plata sin emojis
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
        <p class="page-header__subtitle">Bienvenido, ${user?.nombre || 'Administrador Inicial'}</p>
      </div>
      <div>
        <button class="btn corporate-header-btn" onclick="location.hash='#/piscinas'">
          Ver Piscinas
        </button>
      </div>
    </div>

    <!-- 4 KPI Stats Cards Corporativas -->
    <div id="dashboard-stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__value" id="stat-total-pools">—</div>
        <div class="stat-card__label">Piscinas Totales</div>
      </div>

      <div class="stat-card">
        <div class="stat-card__value" id="stat-active-pools">—</div>
        <div class="stat-card__label">Piscinas Activas</div>
      </div>

      <div class="stat-card">
        <div class="stat-card__value" id="stat-alerts">—</div>
        <div class="stat-card__label">Alertas de Agua</div>
      </div>

      <div class="stat-card">
        <div class="stat-card__value" id="stat-biomass">—</div>
        <div class="stat-card__label">Biomasa Total (kg)</div>
      </div>
    </div>

    <!-- 2 Column Section: Alertas Recientes & Acciones Rápidas -->
    <div class="dashboard-columns">
      <!-- Alertas Recientes -->
      <div class="card corporate-card">
        <div class="card__header">
          <h2 class="card__title">Alertas Recientes</h2>
        </div>
        <div id="dashboard-alerts">
          <div class="loading-overlay">
            <div class="spinner"></div>
            <span>Cargando alertas…</span>
          </div>
        </div>
      </div>

      <!-- Acciones Rápidas -->
      <div class="card corporate-card">
        <div class="card__header">
          <h2 class="card__title">Acciones Rápidas</h2>
        </div>
        <div class="quick-actions-corporate">
          <button class="btn-corporate-action" onclick="location.hash='#/form-muestreo'">
            Registrar Muestreo
          </button>
          <button class="btn-corporate-action" onclick="location.hash='#/form-agua'">
            Registrar Parámetros de Agua
          </button>
          <button class="btn-corporate-action" onclick="location.hash='#/form-alimentacion'">
            Registrar Alimentación
          </button>
          <button class="btn-corporate-action" onclick="location.hash='#/piscinas'">
            Ver Todas las Piscinas
          </button>
        </div>
      </div>
    </div>

    <!-- Resumen Operativo de Piscinas -->
    <div class="card corporate-card" style="margin-top:20px;">
      <div class="card__header">
        <h2 class="card__title">Resumen Operativo de Piscinas</h2>
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
      <div style="text-align:center; padding:32px 16px; color:var(--text-muted);">
        <p style="font-weight:600; color:var(--text-primary); font-size:1rem; margin-bottom:4px;">Sin alertas activas</p>
        <span style="font-size:0.85rem;">Todos los estanques se encuentran dentro de los parámetros normales.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = alertPools.map(p => `
    <div class="alert-tile" onclick="location.hash='#/piscinas'" title="Ver detalles de piscina">
      <div class="alert-tile__content">
        <div class="alert-tile__title">Piscina ${p.codigo}</div>
        <div class="alert-tile__subtitle">
          O₂: ${p.oxigeno_mg_l || '—'} mg/L · pH: ${p.ph || '—'} · NH₃: ${p.amonio_mg_l || '—'} mg/L
        </div>
      </div>
      <div class="alert-tile__indicator" title="Alerta activa"></div>
    </div>
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
              <td>${p.alerta ? '<span class="badge badge--danger">Alerta</span>' : '<span class="badge badge--success">OK</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

