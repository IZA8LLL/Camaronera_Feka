/* ═══════════════════════════════════════════════════════════
   Form Muestreo Page — Formulario de muestreo biométrico
   ═══════════════════════════════════════════════════════════ */
import { crearMuestreo } from '../../services/operacion.service.ts';
import { showToast } from '../../core/toast.ts';
import { escapeHtml, formIntro, pageHeader } from '../../shared/ui.ts';

function getParam(key: string): string {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return escapeHtml(params.get(key) || '');
}

export function renderFormMuestreo(): string {
  const codigo = new URLSearchParams(window.location.hash.split('?')[1] || '').get('codigo');
  const titleExtra = codigo ? ` — Piscina ${codigo}` : '';

  return `
    ${pageHeader(`Muestreo biométrico${titleExtra}`, 'Registra el crecimiento y la biomasa estimada de tu cultivo.', 'Trabajo de campo / Muestreo', '<button class="btn btn--ghost btn--sm" data-back>← Volver</button>')}

    <div class="card form-card">
      <form id="muestreo-form">
        ${formIntro('01', 'Ubicación del registro', 'Los identificadores se completan al ingresar desde una piscina.')}
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="m-granja">Granja ID</label>
            <input class="form-input" type="text" id="m-granja" value="${getParam('granja')}" required pattern="[a-fA-F0-9]{24}" placeholder="Identificador de la granja" />
          </div>
          <div class="form-group">
            <label class="form-label" for="m-piscina">Piscina ID</label>
            <input class="form-input" type="text" id="m-piscina" value="${getParam('piscina')}" required pattern="[a-fA-F0-9]{24}" placeholder="Identificador de la piscina" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="m-ciclo">Ciclo ID</label>
            <input class="form-input" type="text" id="m-ciclo" value="${getParam('ciclo')}" required pattern="[a-fA-F0-9]{24}" placeholder="Identificador del ciclo activo" />
          </div>
          <div class="form-group">
            <label class="form-label" for="m-fecha">Fecha y hora</label>
            <input class="form-input" type="datetime-local" id="m-fecha" required />
          </div>
        </div>

        ${formIntro('02', 'Datos de la muestra', 'Registra peso, talla y cantidad de individuos observados.')}
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="m-peso">Peso promedio (g)</label>
            <input class="form-input" type="number" id="m-peso" step="0.01" min="0.01" max="100" required placeholder="ej: 18.5" />
            <span class="form-hint">Rango: 0.01 – 100 g</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="m-talla">Talla promedio (cm)</label>
            <input class="form-input" type="number" id="m-talla" step="0.1" min="0.1" max="50" required placeholder="ej: 12.3" />
            <span class="form-hint">Rango: 0.1 – 50 cm</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="m-individuos">Individuos muestreados</label>
            <input class="form-input" type="number" id="m-individuos" min="1" max="10000" required placeholder="ej: 50" />
          </div>
          <div class="form-group">
            <label class="form-label" for="m-biomasa">Biomasa estimada (kg)</label>
            <input class="form-input" type="number" id="m-biomasa" step="0.01" min="0" required placeholder="ej: 4500" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="m-obs">Observación (opcional)</label>
          <textarea class="form-input" id="m-obs" maxlength="1000" rows="3" placeholder="Notas del muestreo…"></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn--secondary" data-back>Cancelar</button>
          <button type="submit" class="btn btn--primary" id="m-submit">
            <span id="m-btn-text">Registrar Muestreo</span>
            <div id="m-spinner" class="spinner" style="display:none; width:16px; height:16px; border-width:2px;"></div>
          </button>
        </div>
      </form>
    </div>
  `;
}

export function initFormMuestreo() {
  // Set current datetime
  const fechaInput = document.getElementById('m-fecha') as HTMLInputElement;
  fechaInput.value = new Date().toISOString().slice(0, 16);

  const form = document.getElementById('muestreo-form') as HTMLFormElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('m-submit') as HTMLButtonElement;
    const btnText = document.getElementById('m-btn-text')!;
    const spinner = document.getElementById('m-spinner')!;

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';

    try {
      const fecha = new Date((document.getElementById('m-fecha') as HTMLInputElement).value);

      await crearMuestreo({
        granja_id: (document.getElementById('m-granja') as HTMLInputElement).value.trim(),
        piscina_id: (document.getElementById('m-piscina') as HTMLInputElement).value.trim(),
        ciclo_id: (document.getElementById('m-ciclo') as HTMLInputElement).value.trim(),
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
