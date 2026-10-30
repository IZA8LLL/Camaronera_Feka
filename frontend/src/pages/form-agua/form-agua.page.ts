/* ═══════════════════════════════════════════════════════════
   Form Agua Page — Formulario de parámetros de agua
   ═══════════════════════════════════════════════════════════ */
import { crearParametrosAgua } from '../../services/operacion.service.ts';
import { showToast } from '../../core/toast.ts';

function getParam(key: string): string {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return params.get(key) || '';
}

export function renderFormAgua(): string {
  const codigo = getParam('codigo');
  const titleExtra = codigo ? ` — Piscina ${codigo}` : '';

  return `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Parámetros de Agua${titleExtra}</h1>
        <p class="page-header__subtitle">Registro de oxígeno, pH, salinidad, temperatura y amonio</p>
      </div>
      <button class="btn btn--ghost btn--sm" onclick="history.back()">← Volver</button>
    </div>

    <div class="card" style="max-width:680px;">
      <form id="agua-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="a-granja">Granja ID</label>
            <input class="form-input" type="text" id="a-granja" value="${getParam('granja')}" required pattern="[a-fA-F0-9]{24}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="a-piscina">Piscina ID</label>
            <input class="form-input" type="text" id="a-piscina" value="${getParam('piscina')}" required pattern="[a-fA-F0-9]{24}" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="a-ciclo">Ciclo ID</label>
            <input class="form-input" type="text" id="a-ciclo" value="${getParam('ciclo')}" required pattern="[a-fA-F0-9]{24}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="a-fecha">Fecha y hora</label>
            <input class="form-input" type="datetime-local" id="a-fecha" required />
          </div>
        </div>

        <div style="background:var(--bg-glass); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px; margin-bottom:20px;">
          <div style="font-size:var(--font-sm); font-weight:600; margin-bottom:12px; color:var(--accent-primary);">Parámetros Fisicoquímicos</div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="a-oxigeno">Oxígeno disuelto (mg/L)</label>
              <input class="form-input" type="number" id="a-oxigeno" step="0.01" min="0.000001" max="30" required placeholder="ej: 6.5" />
              <span class="form-hint">Alerta si &lt; 4 mg/L</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="a-salinidad">Salinidad (ppt)</label>
              <input class="form-input" type="number" id="a-salinidad" step="0.1" min="0" max="60" required placeholder="ej: 25" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="a-ph">pH</label>
              <input class="form-input" type="number" id="a-ph" step="0.01" min="0" max="14" required placeholder="ej: 7.8" />
              <span class="form-hint">Alerta si &lt; 7 o &gt; 9</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="a-temp">Temperatura (°C)</label>
              <input class="form-input" type="number" id="a-temp" step="0.1" min="0" max="45" required placeholder="ej: 28" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="a-amonio">Amonio (mg/L)</label>
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

export function initFormAgua() {
  const fechaInput = document.getElementById('a-fecha') as HTMLInputElement;
  fechaInput.value = new Date().toISOString().slice(0, 16);

  // Preview de alertas en tiempo real
  const inputs = ['a-oxigeno', 'a-ph', 'a-amonio'];
  inputs.forEach(inputId => {
    document.getElementById(inputId)?.addEventListener('input', updatePreview);
  });

  const form = document.getElementById('agua-form') as HTMLFormElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('a-submit') as HTMLButtonElement;
    const btnText = document.getElementById('a-btn-text')!;
    const spinner = document.getElementById('a-spinner')!;

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';

    try {
      const fecha = new Date((document.getElementById('a-fecha') as HTMLInputElement).value);

      const result = await crearParametrosAgua({
        granja_id: (document.getElementById('a-granja') as HTMLInputElement).value.trim(),
        piscina_id: (document.getElementById('a-piscina') as HTMLInputElement).value.trim(),
        ciclo_id: (document.getElementById('a-ciclo') as HTMLInputElement).value.trim(),
        fecha: fecha.toISOString(),
        oxigeno_mg_l: parseFloat((document.getElementById('a-oxigeno') as HTMLInputElement).value),
        salinidad_ppt: parseFloat((document.getElementById('a-salinidad') as HTMLInputElement).value),
        ph: parseFloat((document.getElementById('a-ph') as HTMLInputElement).value),
        temperatura_c: parseFloat((document.getElementById('a-temp') as HTMLInputElement).value),
        amonio_mg_l: parseFloat((document.getElementById('a-amonio') as HTMLInputElement).value)
      });

      const alerta = (result as { alerta?: boolean })?.alerta;
      if (alerta) {
        showToast('Parámetros registrados — Se generó una ALERTA', 'warning');
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
  if (!isNaN(o2) && o2 < 4) alerts.push(`O₂ bajo: ${o2} mg/L (mínimo recomendado: 4)`);
  if (!isNaN(ph) && (ph < 7 || ph > 9)) alerts.push(`pH fuera de rango: ${ph} (rango seguro: 7–9)`);
  if (!isNaN(amonio) && amonio > 1) alerts.push(`Amonio alto: ${amonio} mg/L (máximo recomendado: 1)`);

  if (alerts.length > 0) {
    preview.style.display = 'block';
    preview.innerHTML = `
      <div style="background:var(--danger-dim); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-sm); padding:12px;">
        <div style="font-weight:600; color:var(--danger); font-size:var(--font-sm); margin-bottom:6px;">Alertas detectadas:</div>
        ${alerts.map(a => `<div style="font-size:var(--font-xs); color:var(--danger); padding:2px 0;">• ${a}</div>`).join('')}
      </div>
    `;
  } else {
    preview.style.display = 'none';
  }
}
