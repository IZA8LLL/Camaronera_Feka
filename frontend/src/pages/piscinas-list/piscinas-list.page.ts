/* ═══════════════════════════════════════════════════════════
   Piscinas List Page — Listado de estanques con tarjetas
   Muestra estado, métricas de agua y acciones por piscina
   ═══════════════════════════════════════════════════════════ */
import { fetchPiscinas } from '../../services/piscina.service.ts';
import type { PiscinaRow } from '../../core/models/index.ts';

export function renderPiscinasList(): string {
  return `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Piscinas / Estanques</h1>
        <p class="page-header__subtitle">Monitoreo en tiempo real de todos los estanques</p>
      </div>
    </div>
    <div id="piscinas-container">
      <div class="loading-overlay">
        <div class="spinner spinner--lg"></div>
        <span>Cargando piscinas…</span>
      </div>
    </div>
  `;
}

export async function initPiscinasList() {
  const container = document.getElementById('piscinas-container')!;

  try {
    const pools = await fetchPiscinas();

    if (pools.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🏊</div>
          <p class="empty-state__text">No hay piscinas registradas en su cuenta</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div class="pool-grid">${pools.map((p, i) => renderPoolCard(p, i)).join('')}</div>`;
  } catch {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <p class="empty-state__text">Error al cargar piscinas. Verifique la conexión.</p>
      </div>
    `;
  }
}

function getO2Color(val: string | null): string {
  if (!val) return '';
  const n = parseFloat(val);
  if (n < 4) return 'pool-metric__value--danger';
  if (n < 5) return 'pool-metric__value--warning';
  return 'pool-metric__value--success';
}

function getPhColor(val: string | null): string {
  if (!val) return '';
  const n = parseFloat(val);
  if (n < 7 || n > 9) return 'pool-metric__value--danger';
  if (n < 7.5 || n > 8.5) return 'pool-metric__value--warning';
  return 'pool-metric__value--success';
}

function renderPoolCard(p: PiscinaRow, index: number): string {
  const statusBadge = p.estado === 'activa'
    ? '<span class="badge badge--success">Activa</span>'
    : p.estado === 'mantenimiento'
    ? '<span class="badge badge--warning">Mantenimiento</span>'
    : '<span class="badge badge--neutral">Inactiva</span>';

  const alertClass = p.alerta ? 'pool-card--alert' : '';
  const delay = `delay-${Math.min(index + 1, 6)}`;

  return `
    <div class="pool-card ${alertClass} animate-card-enter ${delay}">
      <div class="pool-card__header">
        <div>
          <div class="pool-card__code">${p.codigo}</div>
          <div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:2px;">
            ${p.especie || 'Sin ciclo activo'} ${p.ciclo_codigo ? `· ${p.ciclo_codigo}` : ''}
          </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
          ${statusBadge}
          ${p.alerta ? '<span class="badge badge--danger" style="animation:pulse 2s infinite;">⚠ Alerta</span>' : ''}
        </div>
      </div>

      <div class="pool-card__metrics">
        <div class="pool-metric">
          <div class="pool-metric__label">O₂ (mg/L)</div>
          <div class="pool-metric__value ${getO2Color(p.oxigeno_mg_l)}">${p.oxigeno_mg_l ?? '—'}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">pH</div>
          <div class="pool-metric__value ${getPhColor(p.ph)}">${p.ph ?? '—'}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">Salinidad (ppt)</div>
          <div class="pool-metric__value">${p.salinidad_ppt ?? '—'}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">Temp. (°C)</div>
          <div class="pool-metric__value">${p.temperatura_c ?? '—'}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">Biomasa (kg)</div>
          <div class="pool-metric__value">${p.biomasa_kg ? parseFloat(p.biomasa_kg).toLocaleString('es-EC') : '—'}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">FCA</div>
          <div class="pool-metric__value">${p.fca ?? '—'}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">Área (ha)</div>
          <div class="pool-metric__value">${p.area_ha ?? '—'}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">Amonio (mg/L)</div>
          <div class="pool-metric__value ${p.amonio_mg_l && parseFloat(p.amonio_mg_l) > 1 ? 'pool-metric__value--danger' : ''}">${p.amonio_mg_l ?? '—'}</div>
        </div>
      </div>

      ${p.ciclo_id ? `
      <div class="pool-card__actions">
        <button class="btn btn--secondary btn--sm" onclick="event.stopPropagation(); location.hash='#/form-muestreo?piscina=${p.id}&granja=${p.granja_id}&ciclo=${p.ciclo_id}&codigo=${p.codigo}'">
          🔬 Muestreo
        </button>
        <button class="btn btn--secondary btn--sm" onclick="event.stopPropagation(); location.hash='#/form-agua?piscina=${p.id}&granja=${p.granja_id}&ciclo=${p.ciclo_id}&codigo=${p.codigo}'">
          💧 Agua
        </button>
        <button class="btn btn--secondary btn--sm" onclick="event.stopPropagation(); location.hash='#/form-alimentacion?piscina=${p.id}&granja=${p.granja_id}&ciclo=${p.ciclo_id}&codigo=${p.codigo}'">
          🍤 Alimento
        </button>
      </div>
      ` : ''}
    </div>
  `;
}
