/* ═══════════════════════════════════════════════════════════
   Form Alimentación Page — Registro de consumo diario de alimento
   Selección mediante menús desplegables (Granja, Piscina, Ciclo, Lote)
   ═══════════════════════════════════════════════════════════ */
import {
  crearAlimentacion,
  fetchGranjas,
  fetchLotes,
  fetchSiguienteCiclo,
  type GranjaRow,
  type LoteRow
} from '../../services/operacion.service.ts';
import { fetchPiscinas } from '../../services/piscina.service.ts';
import { calcularSiguienteCodigoCiclo, formatPiscinaNombre } from '../../core/ciclo-rule.ts';
import type { PiscinaRow } from '../../core/models/index.ts';
import { showToast } from '../../core/toast.ts';

function getParam(key: string): string {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return params.get(key) || '';
}

export function renderFormAlimentacion(): string {
  return `
    <div class="page-header">
      <div>
        <h1 class="page-header__title" id="al-title">Registro de Alimentación</h1>
        <p class="page-header__subtitle">Consumo diario de alimento con descuento transaccional de inventario</p>
      </div>
      <button class="btn btn--ghost btn--sm" onclick="history.back()">← Volver</button>
    </div>

    <div class="card" style="max-width:680px;">
      <form id="alimentacion-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="al-granja">Granja *</label>
            <select class="form-input" id="al-granja" required>
              <option value="" disabled selected>Cargando granjas…</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="al-piscina">Piscina / Estanque *</label>
            <select class="form-input" id="al-piscina" required>
              <option value="" disabled selected>Cargando piscinas…</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="al-ciclo">Ciclo de Cultivo *</label>
            <select class="form-input" id="al-ciclo" required>
              <option value="" disabled selected>Calculando ciclo…</option>
            </select>
            <span class="form-hint" id="al-ciclo-hint">Siguiente en secuencia según registros del año</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="al-lote">Lote de Alimento (Inventario) *</label>
            <select class="form-input" id="al-lote" required>
              <option value="" disabled selected>Cargando lotes disponibles…</option>
            </select>
            <span class="form-hint" id="al-lote-hint">Se descontará del inventario en Kardex</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="al-fecha">Fecha y hora *</label>
            <input class="form-input" type="datetime-local" id="al-fecha" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="al-cantidad">Cantidad (kg) *</label>
            <input class="form-input" type="number" id="al-cantidad" step="0.01" min="0.01" max="100000" required placeholder="ej: 125.5" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="al-fca">FCA (opcional)</label>
            <input class="form-input" type="number" id="al-fca" step="0.01" min="0" max="20" placeholder="Factor de conversión alimenticia" />
            <span class="form-hint">Rango: 0 – 20</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="al-biomasa">Biomasa actual (kg, opcional)</label>
            <input class="form-input" type="number" id="al-biomasa" step="0.01" min="0" placeholder="Biomasa estimada actual" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="al-obs">Observación (opcional)</label>
          <textarea class="form-input" id="al-obs" maxlength="1000" rows="3" placeholder="Notas de la alimentación…"></textarea>
        </div>

        <div style="background:var(--info-dim); border:1px solid rgba(139,92,246,0.3); border-radius:var(--radius-sm); padding:12px; margin-bottom:16px;">
          <div style="font-size:var(--font-xs); color:var(--info);">
            Nota: Esta operación descuenta el alimento del inventario y registra un movimiento en el Kardex de forma transaccional.
          </div>
        </div>

        <div style="display:flex; gap:12px; justify-content:flex-end;">
          <button type="button" class="btn btn--secondary" onclick="history.back()">Cancelar</button>
          <button type="submit" class="btn btn--primary" id="al-submit">
            <span id="al-btn-text">Registrar Alimentación</span>
            <div id="al-spinner" class="spinner" style="display:none; width:16px; height:16px; border-width:2px;"></div>
          </button>
        </div>
      </form>
    </div>
  `;
}

export async function initFormAlimentacion() {
  const fechaInput = document.getElementById('al-fecha') as HTMLInputElement;
  fechaInput.value = new Date().toISOString().slice(0, 16);

  const selectGranja = document.getElementById('al-granja') as HTMLSelectElement;
  const selectPiscina = document.getElementById('al-piscina') as HTMLSelectElement;
  const selectCiclo = document.getElementById('al-ciclo') as HTMLSelectElement;
  const hintCiclo = document.getElementById('al-ciclo-hint')!;
  const selectLote = document.getElementById('al-lote') as HTMLSelectElement;
  const hintLote = document.getElementById('al-lote-hint')!;
  const titleElem = document.getElementById('al-title')!;
  const form = document.getElementById('alimentacion-form') as HTMLFormElement;

  let granjas: GranjaRow[] = [];
  let piscinas: PiscinaRow[] = [];
  let lotes: LoteRow[] = [];

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

    filtrarLotesPorGranja(granjaFiltro);
  }

  function filtrarLotesPorGranja(granjaId?: string) {
    if (lotes.length === 0) return;

    const lotesFiltrados = (granjaId && granjaId !== 'all')
      ? lotes.filter(l => l.granja_id === granjaId)
      : lotes;

    const opciones = lotesFiltrados.length > 0 ? lotesFiltrados : lotes;

    selectLote.innerHTML = opciones.map(l => `
      <option value="${l.id}">${l.codigo_lote} (Saldo: ${l.cantidad_actual} kg)</option>
    `).join('');

    const seleccionado = opciones.find(l => l.id === selectLote.value) || opciones[0];
    if (seleccionado) {
      hintLote.textContent = `Stock disponible: ${seleccionado.cantidad_actual} kg en bodega`;
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
      titleElem.textContent = `Registro de Alimentación — ${formatPiscinaNombre(pool.codigo)}`;
    } catch {
      const d = fechaVal ? new Date(fechaVal) : new Date();
      const code = calcularSiguienteCodigoCiclo(5, d);
      selectCiclo.innerHTML = `<option value="${pool.ciclo_id || ''}" selected>${code}</option>`;
      hintCiclo.textContent = `Siguiente código calculado: ${code}`;
    }
  }

  try {
    const [granjasData, poolsData, lotesData] = await Promise.all([
      fetchGranjas().catch(() => [] as GranjaRow[]),
      fetchPiscinas(),
      fetchLotes().catch(() => [] as LoteRow[])
    ]);

    granjas = granjasData;
    piscinas = poolsData;
    lotes = lotesData;

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

    if (lotes.length === 0) {
      selectLote.innerHTML = '<option value="" disabled>No hay lotes con stock disponible</option>';
    }

    // Pre-selección según URL params
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
    selectGranja.innerHTML = '<option value="" disabled>Error al cargar datos</option>';
    selectPiscina.innerHTML = '<option value="" disabled>Error al cargar datos</option>';
    showToast('Error al cargar piscinas e inventario', 'error');
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
      filtrarLotesPorGranja(p.granja_id);
    }
    await actualizarCiclo();
  });

  fechaInput.addEventListener('change', actualizarCiclo);
  fechaInput.addEventListener('input', actualizarCiclo);

  selectLote.addEventListener('change', () => {
    const loteSel = lotes.find(l => l.id === selectLote.value);
    if (loteSel) {
      hintLote.textContent = `Stock disponible: ${loteSel.cantidad_actual} kg en bodega`;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('al-submit') as HTMLButtonElement;
    const btnText = document.getElementById('al-btn-text')!;
    const spinner = document.getElementById('al-spinner')!;

    const selectedPool = piscinas.find(p => p.id === selectPiscina.value);
    const granjaIdFinal = selectedPool ? selectedPool.granja_id : selectGranja.value;

    if (!granjaIdFinal || granjaIdFinal === 'all' || !selectPiscina.value || !selectCiclo.value || !selectLote.value) {
      showToast('Por favor complete la selección de Granja, Piscina, Ciclo y Lote', 'warning');
      return;
    }

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';

    try {
      const fecha = new Date(fechaInput.value);
      const fca = (document.getElementById('al-fca') as HTMLInputElement).value;
      const biomasa = (document.getElementById('al-biomasa') as HTMLInputElement).value;

      await crearAlimentacion({
        granja_id: granjaIdFinal.trim(),
        piscina_id: selectPiscina.value.trim(),
        ciclo_id: selectCiclo.value.trim(),
        lote_id: selectLote.value.trim(),
        fecha: fecha.toISOString(),
        cantidad_kg: parseFloat((document.getElementById('al-cantidad') as HTMLInputElement).value),
        fca: fca ? parseFloat(fca) : undefined,
        biomasa_kg: biomasa ? parseFloat(biomasa) : undefined,
        observacion: (document.getElementById('al-obs') as HTMLTextAreaElement).value.trim() || undefined
      });

      showToast('Alimentación registrada e inventario actualizado', 'success');
      setTimeout(() => history.back(), 1000);
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'error' in err)
        ? (err as { error: string }).error : 'Error al registrar alimentación';
      showToast(msg, 'error');
    } finally {
      btn.disabled = false;
      btnText.style.display = 'inline';
      spinner.style.display = 'none';
    }
  });
}
