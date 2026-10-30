/* ═══════════════════════════════════════════════════════════
   Form Muestreo Page — Formulario de muestreo biométrico
   Selección mediante menús desplegables (Granja, Piscina, Ciclo)
   ═══════════════════════════════════════════════════════════ */
import {
  crearMuestreo,
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

export function renderFormMuestreo(): string {
  return `
    <div class="page-header">
      <div>
        <h1 class="page-header__title" id="m-title">Muestreo Biométrico</h1>
        <p class="page-header__subtitle">Registro de peso, talla y biomasa estimada</p>
      </div>
      <button class="btn btn--ghost btn--sm" onclick="history.back()">← Volver</button>
    </div>

    <div class="card" style="max-width:680px;">
      <form id="muestreo-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="m-granja">Granja *</label>
            <select class="form-input" id="m-granja" required>
              <option value="" disabled selected>Cargando granjas…</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="m-piscina">Piscina / Estanque *</label>
            <select class="form-input" id="m-piscina" required>
              <option value="" disabled selected>Cargando piscinas…</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="m-ciclo">Ciclo de Cultivo *</label>
            <select class="form-input" id="m-ciclo" required>
              <option value="" disabled selected>Calculando ciclo…</option>
            </select>
            <span class="form-hint" id="m-ciclo-hint">Siguiente en secuencia según registros del año</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="m-fecha">Fecha y hora *</label>
            <input class="form-input" type="datetime-local" id="m-fecha" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="m-peso">Peso promedio (g) *</label>
            <input class="form-input" type="number" id="m-peso" step="0.01" min="0.01" max="100" required placeholder="ej: 18.5" />
            <span class="form-hint">Rango: 0.01 – 100 g</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="m-talla">Talla promedio (cm) *</label>
            <input class="form-input" type="number" id="m-talla" step="0.1" min="0.1" max="50" required placeholder="ej: 12.3" />
            <span class="form-hint">Rango: 0.1 – 50 cm</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="m-individuos">Individuos muestreados *</label>
            <input class="form-input" type="number" id="m-individuos" min="1" max="10000" required placeholder="ej: 50" />
          </div>
          <div class="form-group">
            <label class="form-label" for="m-biomasa">Biomasa estimada (kg) *</label>
            <input class="form-input" type="number" id="m-biomasa" step="0.01" min="0" required placeholder="ej: 4500" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="m-obs">Observación (opcional)</label>
          <textarea class="form-input" id="m-obs" maxlength="1000" rows="3" placeholder="Notas del muestreo…"></textarea>
        </div>

        <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:8px;">
          <button type="button" class="btn btn--secondary" onclick="history.back()">Cancelar</button>
          <button type="submit" class="btn btn--primary" id="m-submit">
            <span id="m-btn-text">Registrar Muestreo</span>
            <div id="m-spinner" class="spinner" style="display:none; width:16px; height:16px; border-width:2px;"></div>
          </button>
        </div>
      </form>
    </div>
  `;
}

export async function initFormMuestreo() {
  const fechaInput = document.getElementById('m-fecha') as HTMLInputElement;
  fechaInput.value = new Date().toISOString().slice(0, 16);

  const selectGranja = document.getElementById('m-granja') as HTMLSelectElement;
  const selectPiscina = document.getElementById('m-piscina') as HTMLSelectElement;
  const selectCiclo = document.getElementById('m-ciclo') as HTMLSelectElement;
  const hintCiclo = document.getElementById('m-ciclo-hint')!;
  const titleElem = document.getElementById('m-title')!;
  const form = document.getElementById('muestreo-form') as HTMLFormElement;

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

    // Asegurar que selectGranja tenga la granja real de la piscina seleccionada
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
      titleElem.textContent = `Muestreo Biométrico — ${formatPiscinaNombre(pool.codigo)}`;
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

    // Poblar Granjas: opción "Todas" + lista de granjas
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('m-submit') as HTMLButtonElement;
    const btnText = document.getElementById('m-btn-text')!;
    const spinner = document.getElementById('m-spinner')!;

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

      await crearMuestreo({
        granja_id: granjaIdFinal.trim(),
        piscina_id: selectPiscina.value.trim(),
        ciclo_id: selectCiclo.value.trim(),
        fecha: fecha.toISOString(),
        peso_promedio_g: parseFloat((document.getElementById('m-peso') as HTMLInputElement).value),
        talla_promedio_cm: parseFloat((document.getElementById('m-talla') as HTMLInputElement).value),
        muestra_individuos: parseInt((document.getElementById('m-individuos') as HTMLInputElement).value),
        biomasa_estimada_kg: parseFloat((document.getElementById('m-biomasa') as HTMLInputElement).value),
        observacion: (document.getElementById('m-obs') as HTMLTextAreaElement).value.trim() || undefined
      });

      showToast('Muestreo registrado exitosamente', 'success');
      setTimeout(() => history.back(), 1000);
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'error' in err)
        ? (err as { error: string }).error : 'Error al registrar muestreo';
      showToast(msg, 'error');
    } finally {
      btn.disabled = false;
      btnText.style.display = 'inline';
      spinner.style.display = 'none';
    }
  });
}
