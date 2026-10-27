/* ═══════════════════════════════════════════════════════════
   Form Alimentación Page — Registro de consumo de alimento
   ═══════════════════════════════════════════════════════════ */
import { crearAlimentacion } from '../../services/operacion.service.ts';
import { showToast } from '../../core/toast.ts';

function getParam(key: string): string {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return params.get(key) || '';
}

export function renderFormAlimentacion(): string {
  const codigo = getParam('codigo');
  const titleExtra = codigo ? ` — Piscina ${codigo}` : '';

  return `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">🍤 Registro de Alimentación${titleExtra}</h1>
        <p class="page-header__subtitle">Consumo diario de alimento con descuento de inventario</p>
      </div>
      <button class="btn btn--ghost btn--sm" onclick="history.back()">← Volver</button>
    </div>

    <div class="card" style="max-width:680px;">
      <form id="alimentacion-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="al-granja">Granja ID</label>
            <input class="form-input" type="text" id="al-granja" value="${getParam('granja')}" required pattern="[a-fA-F0-9]{24}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="al-piscina">Piscina ID</label>
            <input class="form-input" type="text" id="al-piscina" value="${getParam('piscina')}" required pattern="[a-fA-F0-9]{24}" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="al-ciclo">Ciclo ID</label>
            <input class="form-input" type="text" id="al-ciclo" value="${getParam('ciclo')}" required pattern="[a-fA-F0-9]{24}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="al-lote">Lote de Inventario ID</label>
            <input class="form-input" type="text" id="al-lote" required pattern="[a-fA-F0-9]{24}" placeholder="ObjectId del lote de alimento" />
            <span class="form-hint">Se descontará del inventario</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="al-fecha">Fecha y hora</label>
            <input class="form-input" type="datetime-local" id="al-fecha" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="al-cantidad">Cantidad (kg)</label>
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
            💡 Esta operación descuenta el alimento del inventario y registra un movimiento en el Kardex de forma transaccional.
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

export function initFormAlimentacion() {
  const fechaInput = document.getElementById('al-fecha') as HTMLInputElement;
  fechaInput.value = new Date().toISOString().slice(0, 16);

  const form = document.getElementById('alimentacion-form') as HTMLFormElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('al-submit') as HTMLButtonElement;
    const btnText = document.getElementById('al-btn-text')!;
    const spinner = document.getElementById('al-spinner')!;

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';

    try {
      const fecha = new Date((document.getElementById('al-fecha') as HTMLInputElement).value);
      const fca = (document.getElementById('al-fca') as HTMLInputElement).value;
      const biomasa = (document.getElementById('al-biomasa') as HTMLInputElement).value;

      await crearAlimentacion({
        granja_id: (document.getElementById('al-granja') as HTMLInputElement).value.trim(),
        piscina_id: (document.getElementById('al-piscina') as HTMLInputElement).value.trim(),
        ciclo_id: (document.getElementById('al-ciclo') as HTMLInputElement).value.trim(),
        lote_id: (document.getElementById('al-lote') as HTMLInputElement).value.trim(),
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
