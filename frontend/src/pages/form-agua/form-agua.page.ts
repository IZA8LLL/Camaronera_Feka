/* ═══════════════════════════════════════════════════════════
   Form Agua Page — Formulario de parámetros de calidad de agua
   Selección mediante menús desplegables (Granja, Piscina, Ciclo)
   ═══════════════════════════════════════════════════════════ */
import {
  crearParametrosAgua,
  crearCiclo,
  fetchGranjas,
  fetchSiguienteCiclo,
  type GranjaRow
} from '../../services/operacion.service';
import { fetchPiscinas } from '../../services/piscina.service';
import { formatPiscinaNombre } from '../../core/ciclo-rule';
import type { PiscinaRow } from '../../core/models/index';
import { showToast } from '../../core/toast';
import { escapeHtml, formIntro } from '../../shared/ui';

function getParam(key: string): string {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return escapeHtml(params.get(key) || '');
}

export function renderFormAgua(): string {
  const codigo = new URLSearchParams(window.location.hash.split('?')[1] || '').get('codigo');
  const titleExtra = codigo ? ` — Piscina ${escapeHtml(codigo)}` : '';

  return `
    <div class="page-header">
      <div>
        <p class="eyebrow">Trabajo de campo / Agua</p>
        <h1 class="page-header__title" id="a-title">Calidad del agua${titleExtra}</h1>
        <p class="page-header__subtitle">Registro de oxígeno, pH, salinidad, temperatura y amonio</p>
      </div>
      <button class="btn btn--ghost btn--sm" data-back onclick="history.back()">← Volver</button>
    </div>

    <div class="card form-card">
      <form id="agua-form">
        ${formIntro('01', 'Ubicación del registro', 'Seleccione la granja, piscina y ciclo correspondiente.')}
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="a-granja">Granja *</label>
            <select class="form-input" id="a-granja" required>
              <option value="" disabled selected>Cargando granjas…</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="a-piscina">Piscina / Estanque *</label>
            <select class="form-input" id="a-piscina" required>
              <option value="" disabled selected>Cargando piscinas…</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="a-ciclo">Ciclo de Cultivo *</label>
            <select class="form-input" id="a-ciclo" required>
              <option value="" disabled selected>Calculando ciclo…</option>
            </select>
            <span class="form-hint" id="a-ciclo-hint">Siguiente en secuencia según registros del año</span>
            <button class="btn btn--ghost btn--sm" id="a-crear-ciclo" type="button" hidden>Crear ciclo activo</button>
          </div>
          <div class="form-group">
            <label class="form-label" for="a-fecha">Fecha y hora *</label>
            <input class="form-input" type="datetime-local" id="a-fecha" required />
          </div>
        </div>

        <div class="form-section">
          ${formIntro('02', 'Parámetros Fisicoquímicos', 'Ingresa cada valor en la unidad indicada.')}

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="a-oxigeno">Oxígeno disuelto (mg/L) *</label>
              <input class="form-input" type="number" id="a-oxigeno" step="any" min="0.000001" max="30" required placeholder="ej: 6.5" />
              <span class="form-hint">Alerta si &lt; 4 mg/L</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="a-salinidad">Salinidad (ppt) *</label>
              <input class="form-input" type="number" id="a-salinidad" step="0.1" min="0" max="60" required placeholder="ej: 25" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="a-ph">pH *</label>
              <input class="form-input" type="number" id="a-ph" step="0.01" min="0" max="14" required placeholder="ej: 7.8" />
              <span class="form-hint">Alerta si &lt; 7 o &gt; 9</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="a-temp">Temperatura (°C) *</label>
              <input class="form-input" type="number" id="a-temp" step="0.1" min="0" max="45" required placeholder="ej: 28" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="a-amonio">Amonio (mg/L) *</label>
            <input class="form-input" type="number" id="a-amonio" step="0.01" min="0" max="50" required placeholder="ej: 0.5" />
            <span class="form-hint">Alerta si &gt; 1 mg/L</span>
          </div>
        </div>

        <div id="a-preview" role="status" aria-live="polite" style="display:none; margin-bottom:16px;"></div>

        <div class="form-actions">
          <button type="button" class="btn btn--secondary" data-back onclick="history.back()">Cancelar</button>
          <button type="submit" class="btn btn--primary" id="a-submit">
            <span id="a-btn-text">Registrar Parámetros</span>
            <div id="a-spinner" class="spinner" style="display:none; width:16px; height:16px; border-width:2px;"></div>
          </button>
        </div>
      </form>
    </div>
  `;
}

export async function initFormAgua() {
  const fechaInput = document.getElementById('a-fecha') as HTMLInputElement;
  fechaInput.value = new Date().toISOString().slice(0, 16);

  const selectGranja = document.getElementById('a-granja') as HTMLSelectElement;
  const selectPiscina = document.getElementById('a-piscina') as HTMLSelectElement;
  const selectCiclo = document.getElementById('a-ciclo') as HTMLSelectElement;
  const crearCicloButton = document.getElementById('a-crear-ciclo') as HTMLButtonElement;
  const hintCiclo = document.getElementById('a-ciclo-hint')!;
  const titleElem = document.getElementById('a-title')!;
  const form = document.getElementById('agua-form') as HTMLFormElement;

  let granjas: GranjaRow[] = [];
  let piscinas: PiscinaRow[] = [];

  function rellenarPiscinas(granjaFiltro?: string, piscinaASeleccionar?: string) {
    const lista = (granjaFiltro && granjaFiltro !== 'all')
      ? piscinas.filter(p => p.granja_id === granjaFiltro)
      : piscinas;

    if (lista.length === 0) {
      selectPiscina.innerHTML = '<option value="" disabled>No hay piscinas para esta granja</option>';
      return;
    }

    selectPiscina.innerHTML = lista.map(p => `
      <option value="${p.id}">${formatPiscinaNombre(p.codigo, p.granja_nombre)}</option>
    `).join('');

    if (piscinaASeleccionar && lista.some(p => p.id === piscinaASeleccionar)) {
      selectPiscina.value = piscinaASeleccionar;
    } else {
      selectPiscina.selectedIndex = 0;
    }
  }

  async function actualizarCiclo() {
    const poolId = selectPiscina.value;
    const pool = piscinas.find(p => p.id === poolId);
    if (!pool) return;

    const granjaReal = pool.granja_id;
    if (selectGranja.value !== granjaReal) {
      selectGranja.value = granjaReal;
    }

    const fechaVal = fechaInput.value;

    try {
      const res = await fetchSiguienteCiclo({
        piscina_id: pool.id,
        granja_id: granjaReal,
        fecha: fechaVal
      });

      const activeCycles = (res.ciclos_existentes || []).filter(c =>
        c.estado === 'activo' && c.piscina_id === pool.id && c.granja_id === granjaReal);
      const preferred = activeCycles.find(c => c.id === getParam('ciclo'))?.id || activeCycles[0]?.id;
      selectCiclo.innerHTML = activeCycles.length
        ? activeCycles.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.codigo)}</option>`).join('')
        : '<option value="" selected>No hay ciclo activo</option>';
      selectCiclo.value = preferred || '';
      crearCicloButton.hidden = activeCycles.length > 0;
      hintCiclo.textContent = `Registrados en ${res?.year ?? new Date().getFullYear()}: ${res?.total_registrados ?? 0} → Siguiente en secuencia: ${res?.siguiente_codigo ?? ''}`;
      titleElem.textContent = `Calidad del agua — ${formatPiscinaNombre(pool.codigo)}`;
    } catch {
      selectCiclo.innerHTML = '<option value="" selected>No se pudo consultar el ciclo</option>';
      crearCicloButton.hidden = true;
      hintCiclo.textContent = 'No se pudo verificar el ciclo activo';
    }
  }

  try {
    const [granjasData, piscinasData] = await Promise.all([
      fetchGranjas().catch(() => [] as GranjaRow[]),
      fetchPiscinas()
    ]);

    granjas = Array.isArray(granjasData) ? granjasData : [];
    piscinas = Array.isArray(piscinasData) ? piscinasData : [];

    if (piscinas.length === 0) {
      selectPiscina.innerHTML = '<option value="" disabled>No hay piscinas disponibles</option>';
      return;
    }

    // Poblar Granjas
    let granjasOptions = `<option value="all">Todas las Granjas</option>`;
    if (granjas.length > 0) {
      granjasOptions += granjas.map(g => `
        <option value="${g.id}">${g.nombre} (${g.codigo})</option>
      `).join('');
    } else {
      const uniqueGranjas = Array.from(new Set(piscinas.map(p => p.granja_id)));
      granjasOptions += uniqueGranjas.map(gid => {
        const p = piscinas.find(x => x.granja_id === gid);
        return `<option value="${gid}">${p?.granja_nombre || `Granja ${gid.slice(-4)}`}</option>`;
      }).join('');
    }
    selectGranja.innerHTML = granjasOptions;

    // Pre-selección por URL params
    const paramPiscina = getParam('piscina');
    const paramGranja = getParam('granja');
    const paramCodigo = getParam('codigo');

    let poolPreseleccionada: PiscinaRow | undefined;
    if (paramPiscina || paramCodigo) {
      poolPreseleccionada = piscinas.find(p => p.id === paramPiscina || p.codigo === paramCodigo);
    }

    if (poolPreseleccionada) {
      selectGranja.value = poolPreseleccionada.granja_id;
      rellenarPiscinas(poolPreseleccionada.granja_id, poolPreseleccionada.id);
    } else if (paramGranja && granjas.some(g => g.id === paramGranja)) {
      selectGranja.value = paramGranja;
      rellenarPiscinas(paramGranja);
    } else {
      selectGranja.value = 'all';
      rellenarPiscinas('all');
    }

    await actualizarCiclo();
  } catch {
    selectGranja.innerHTML = '<option value="" disabled>Error al cargar granjas</option>';
    selectPiscina.innerHTML = '<option value="" disabled>Error al cargar piscinas</option>';
    showToast('Error al cargar datos operativos', 'error');
  }

  // Eventos reactivos
  selectGranja.addEventListener('change', async () => {
    rellenarPiscinas(selectGranja.value);
    await actualizarCiclo();
  });

  selectPiscina.addEventListener('change', async () => {
    const p = piscinas.find(x => x.id === selectPiscina.value);
    if (p && selectGranja.value !== p.granja_id && selectGranja.value !== 'all') {
      selectGranja.value = p.granja_id;
    }
    await actualizarCiclo();
  });

  fechaInput.addEventListener('change', actualizarCiclo);
  fechaInput.addEventListener('input', actualizarCiclo);
  crearCicloButton.addEventListener('click', async () => {
    const pool = piscinas.find(p => p.id === selectPiscina.value);
    if (!pool || !fechaInput.value) return;
    crearCicloButton.disabled = true;
    try {
      await crearCiclo({ granja_id: pool.granja_id, piscina_id: pool.id, fecha_inicio: new Date(fechaInput.value).toISOString() });
      await actualizarCiclo();
      showToast('Ciclo activo creado', 'success');
    } catch (error: unknown) {
      showToast(error && typeof error === 'object' && 'error' in error ? String(error.error) : 'No se pudo crear el ciclo', 'error');
    } finally {
      crearCicloButton.disabled = false;
    }
  });

  // Vista previa local de alertas mientras se completa el formulario.
  const inputs = ['a-oxigeno', 'a-ph', 'a-amonio'];
  inputs.forEach(inputId => {
    document.getElementById(inputId)?.addEventListener('input', updatePreview);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('a-submit') as HTMLButtonElement;
    const btnText = document.getElementById('a-btn-text')!;
    const spinner = document.getElementById('a-spinner')!;

    const selectedPool = piscinas.find(p => p.id === selectPiscina.value);
    const granjaIdFinal = selectedPool ? selectedPool.granja_id : selectGranja.value;

    if (!granjaIdFinal || granjaIdFinal === 'all' || !selectPiscina.value || !selectCiclo.value) {
      showToast('Por favor seleccione Granja, Piscina y Ciclo', 'warning');
      return;
    }

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';

    try {
      const fecha = new Date(fechaInput.value);

      const result = await crearParametrosAgua({
        granja_id: granjaIdFinal.trim(),
        piscina_id: selectPiscina.value.trim(),
        ciclo_id: selectCiclo.value.trim(),
        fecha: fecha.toISOString(),
        oxigeno_mg_l: parseFloat((document.getElementById('a-oxigeno') as HTMLInputElement).value),
        salinidad_ppt: parseFloat((document.getElementById('a-salinidad') as HTMLInputElement).value),
        ph: parseFloat((document.getElementById('a-ph') as HTMLInputElement).value),
        temperatura_c: parseFloat((document.getElementById('a-temp') as HTMLInputElement).value),
        amonio_mg_l: parseFloat((document.getElementById('a-amonio') as HTMLInputElement).value)
      });

      const alerta = (result as { alerta?: boolean })?.alerta;
      if (alerta) {
        showToast('Parámetros registrados — Se generó una ALERTA por valores fuera de rango', 'warning');
      } else {
        showToast('Parámetros de agua registrados exitosamente', 'success');
      }
      setTimeout(() => history.back(), 1200);
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'error' in err)
        ? (err as { error: string }).error : 'Error al registrar parámetros';
      showToast(msg, 'error');
    } finally {
      btn.disabled = false;
      btnText.style.display = 'inline';
      spinner.style.display = 'none';
    }
  });
}

function updatePreview() {
  const preview = document.getElementById('a-preview')!;
  const o2 = parseFloat((document.getElementById('a-oxigeno') as HTMLInputElement).value);
  const ph = parseFloat((document.getElementById('a-ph') as HTMLInputElement).value);
  const amonio = parseFloat((document.getElementById('a-amonio') as HTMLInputElement).value);

  const alerts: string[] = [];
  if (!isNaN(o2) && o2 < 4) alerts.push(`O₂ bajo: ${o2} mg/L (mínimo recomendado: 4 mg/L)`);
  if (!isNaN(ph) && (ph < 7 || ph > 9)) alerts.push(`pH fuera de rango óptimo: ${ph} (rango: 7 – 9)`);
  if (!isNaN(amonio) && amonio > 1) alerts.push(`Amonio alto: ${amonio} mg/L (máximo recomendado: 1 mg/L)`);

  if (alerts.length > 0) {
    preview.style.display = 'block';
    preview.innerHTML = `
      <div style="background:var(--danger-dim); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-sm); padding:10px 14px;">
        <div style="font-size:var(--font-xs); font-weight:700; color:var(--danger); margin-bottom:4px;">Valores generarán alerta:</div>
        ${alerts.map(a => `<div style="font-size:var(--font-xs); color:var(--danger); margin-left:8px;">• ${a}</div>`).join('')}
      </div>
    `;
  } else {
    preview.style.display = 'none';
  }
}
