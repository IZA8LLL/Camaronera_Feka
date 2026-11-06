/* ═══════════════════════════════════════════════════════════
   Piscinas List Page — Listado de estanques con tarjetas
   Muestra estado, métricas de agua y acciones por piscina
   ═══════════════════════════════════════════════════════════ */
import { fetchPiscinas } from '../../services/piscina.service';
import type { PiscinaRow } from '../../core/models/index';
import { escapeHtml, pageHeader } from '../../shared/ui';

export function renderPiscinasList(): string {
  return `
    ${pageHeader('Piscinas y estanques', 'Revisa las últimas mediciones y registra el trabajo de cada piscina.', 'Producción / Piscinas')}
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
          <p class="empty-state__text">No hay piscinas registradas en su cuenta</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div class="pool-grid">${pools.map(renderPoolCard).join('')}</div>`;
  } catch {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__text">Error al cargar piscinas. Verifique la conexión con el servidor.</p>
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

function renderPoolCard(p: PiscinaRow): string {
  const statusBadge = p.estado === 'activa'
    ? '<span class="badge badge--success">Activa</span>'
    : p.estado === 'mantenimiento'
    ? '<span class="badge badge--warning">Mantenimiento</span>'
    : '<span class="badge badge--neutral">Inactiva</span>';

  const alertClass = p.alerta ? 'pool-card--alert' : '';
  const query = new URLSearchParams({ piscina: p.id, granja: p.granja_id, ciclo: p.ciclo_id || '', codigo: p.codigo });
  const actionLink = (path: string, label: string) => `<a class="btn btn--secondary btn--sm" href="#/${path}?${escapeHtml(query.toString())}">${label}</a>`;

  return `
    <article class="pool-card ${alertClass} animate-card-enter">
      <div class="pool-card__header">
        <div>
          <h2 class="pool-card__code">${escapeHtml(p.codigo)}</h2>
          <div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:2px;">
            ${escapeHtml(p.especie || 'Sin ciclo activo')} ${p.ciclo_codigo ? `· ${escapeHtml(p.ciclo_codigo)}` : ''}
          </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
          ${statusBadge}
          ${p.alerta ? '<span class="badge badge--danger">Alerta</span>' : ''}
        </div>
      </div>

      <div class="pool-card__metrics">
        <div class="pool-metric">
          <div class="pool-metric__label">O₂ (mg/L)</div>
          <div class="pool-metric__value ${getO2Color(p.oxigeno_mg_l)}">${escapeHtml(p.oxigeno_mg_l ?? '—')}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">pH</div>
          <div class="pool-metric__value ${getPhColor(p.ph)}">${escapeHtml(p.ph ?? '—')}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">Salinidad (ppt)</div>
          <div class="pool-metric__value">${escapeHtml(p.salinidad_ppt ?? '—')}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">Temp. (°C)</div>
          <div class="pool-metric__value">${escapeHtml(p.temperatura_c ?? '—')}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">Biomasa (kg)</div>
          <div class="pool-metric__value">${p.biomasa_kg ? parseFloat(p.biomasa_kg).toLocaleString('es-EC') : '—'}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">FCA</div>
          <div class="pool-metric__value">${escapeHtml(p.fca ?? '—')}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">Área (ha)</div>
          <div class="pool-metric__value">${escapeHtml(p.area_ha ?? '—')}</div>
        </div>
        <div class="pool-metric">
          <div class="pool-metric__label">Amonio (mg/L)</div>
          <div class="pool-metric__value ${p.amonio_mg_l && parseFloat(p.amonio_mg_l) > 1 ? 'pool-metric__value--danger' : ''}">${escapeHtml(p.amonio_mg_l ?? '—')}</div>
        </div>
      </div>

      ${p.ciclo_id ? `
      <div class="pool-card__actions">
        ${actionLink('form-muestreo', 'Muestreo')}
        ${actionLink('form-agua', 'Agua')}
        ${actionLink('form-alimentacion', 'Alimento')}
      </div>
      ` : ''}
    </article>
  `;
}
