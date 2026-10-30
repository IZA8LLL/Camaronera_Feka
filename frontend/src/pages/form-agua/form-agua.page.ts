/* ═══════════════════════════════════════════════════════════
   Form Agua Page — Formulario de parámetros de calidad de agua
   Selección mediante menús desplegables (Granja, Piscina, Ciclo)
   ═══════════════════════════════════════════════════════════ */
import {
  crearParametrosAgua,
  fetchGranjas,
  fetchSiguienteCiclo,
  type GranjaRow
} from '../../services/operacion.service.ts';
import { fetchPiscinas } from '../../services/piscina.service.ts';
import { calcularSiguienteCodigoCiclo, formatPiscinaNombre } from '../../core/ciclo-rule.ts';
import type { PiscinaRow } from '../../core/models/index.ts';
import { showToast } from '../../core/toast.ts';

function getParam(key: string): string {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return params.get(key) || '';
}

export function renderFormAgua(): string {
  return `
    <div class="page-header">
      <div>
        <h1 class="page-header__title" id="a-title">Parámetros de Agua</h1>
        <p class="page-header__subtitle">Registro de oxígeno, pH, salinidad, temperatura y amonio</p>
      </div>
      <button class="btn btn--ghost btn--sm" onclick="history.back()">← Volver</button>
    </div>

    <div class="card" style="max-width:680px;">
      <form id="agua-form">
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
          </div>
          <div class="form-group">
            <label class="form-label" for="a-fecha">Fecha y hora *</label>
            <input class="form-input" type="datetime-local" id="a-fecha" required />
          </div>
        </div>

        <div style="background:var(--bg-subsurface); border:1px solid rgba(0,0,0,0.08); border-radius:var(--radius-md); padding:16px; margin-bottom:20px;">
          <div style="font-size:var(--font-sm); font-weight:700; margin-bottom:12px; color:var(--accent-primary);">Parámetros Fisicoquímicos</div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="a-oxigeno">Oxígeno disuelto (mg/L) *</label>
              <input class="form-input" type="number" id="a-oxigeno" step="0.01" min="0.000001" max="30" required placeholder="ej: 6.5" />
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

        <div id="a-preview" style="display:none; margin-bottom:16px;"></div>

        <div style="display:flex; gap:12px; justify-content:flex-end;">
          <button type="button" class="btn btn--secondary" onclick="history.back()">Cancelar</button>
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

      let options = `
        <option value="${res.siguiente_id}" selected>⭐ ${res.siguiente_codigo} (Siguiente ciclo en secuencia)</option>
      `;

      if (res.ciclos_existentes && res.ciclos_existentes.length > 0) {
        options += `<optgroup label="Ciclos registrados anteriormente">`;
        for (const c of res.ciclos_existentes) {
          options += `<option value="${c.id}">${c.codigo} (${c.estado})</option>`;
        }
        options += `</optgroup>`;
      }

      selectCiclo.innerHTML = options;
      hintCiclo.textContent = `Registrados en ${res.year}: ${res.total_registrados} → Siguiente en secuencia: ${res.siguiente_codigo}`;
      titleElem.textContent = `Parámetros de Agua — ${formatPiscinaNombre(pool.codigo)}`;
    } catch {
      const d = fechaVal ? new Date(fechaVal) : new Date();
      const code = calcularSiguienteCodigoCiclo(5, d);
      selectCiclo.innerHTML = `<option value="${pool.ciclo_id || ''}" selected>${code}</option>`;
      hintCiclo.textContent = `Siguiente código calculado: ${code}`;
    }
  }

  try {
    const [granjasData, piscinasData] = await Promise.all([
      fetchGranjas().catch(() => [] as GranjaRow[]),
      fetchPiscinas()
    ]);

    granjas = granjasData;
    piscinas = piscinasData;

    if (piscinas.length === 0) {
      selectPiscina.innerHTML = '<option value="" disabled>No hay piscinas disponibles</option>';
      return;
    }

    // Poblar Granjas
    let granjasOptions = `<option value="all">🌐 Todas las Granjas</option>`;
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

  // Preview de alertas en tiempo real
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
        <div style="font-size:var(--font-xs); font-weight:700; color:var(--danger); margin-bottom:4px;">⚠️ Valores generarán alerta:</div>
        ${alerts.map(a => `<div style="font-size:var(--font-xs); color:var(--danger); margin-left:8px;">• ${a}</div>`).join('')}
      </div>
    `;
  } else {
    preview.style.display = 'none';
  }
}
