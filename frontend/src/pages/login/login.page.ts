/* ═══════════════════════════════════════════════════════════
   Login Page — Formulario de inicio de sesión
   Acceso monocromático con validación inline
   ═══════════════════════════════════════════════════════════ */
import { login } from '../../services/auth.service';
import { showToast } from '../../core/toast';
import { icon } from '../../shared/ui';
import { renderThemeToggle } from '../../shared/theme';

export function renderLogin(): string {
  return `
    <div class="login-page">
      <aside class="login-story" aria-label="By Fekas Corp.">
        <div class="login-story__bg" aria-hidden="true">
          <div class="login-story__image"></div>
          <div class="login-story__scrim"></div>
        </div>

        <div class="sidebar-brand">
          <span class="brand-mark">${icon('pools')}</span>
          <span class="sidebar-brand__text">
            <strong>by fekas<span class="brand-dot">.</span></strong>
            <small>GESTIÓN ACUÍCOLA</small>
          </span>
        </div>

        <div class="login-story__content">
          <p class="eyebrow story-eyebrow">ERP para granjas camaroneras</p>
          <h2 class="story-headline">Cada piscina.<br>Cada ciclo.<br><span class="story-headline__accent">Todo conectado.</span></h2>
          <p class="login-story__description">Consulta el estado de tus piscinas y registra agua, muestreos y alimentación. Compras y proveedores tienen su propio espacio de trabajo.</p>
          <ul class="login-story__features">
            <li>Piscinas y ciclos de cultivo</li>
            <li>Registros de campo con fecha y unidad</li>
            <li>Inventario y abastecimiento</li>
          </ul>
        </div>

        <p class="login-story__footer">By Fekas Corp. · Del campo a la gestión · Plataforma Acuícola</p>
      </aside>

      <div class="login-panel">
        <div class="login-panel__ambient" aria-hidden="true"></div>
        <div class="login-theme-controls">${renderThemeToggle()}</div>

        <div class="login-card">
          <div class="login-card__brand">
            <div class="login-card__logo brand-mark">${icon('pools')}</div>
            <p class="eyebrow">By Fekas Corp. / Acceso</p>
            <h1 class="login-card__title">Bienvenido de nuevo.</h1>
            <p class="login-card__desc">Ingresa a tu espacio de trabajo para continuar con la operación.</p>
          </div>

          <form id="login-form" autocomplete="on">
            <div class="form-group">
              <label class="form-label" for="login-email">Correo electrónico</label>
              <input class="form-input" type="email" id="login-email"
                placeholder="nombre@empresa.com"
                autocomplete="email" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">Contraseña</label>
              <input class="form-input" type="password" id="login-password"
                placeholder="••••••••••"
                autocomplete="current-password" required minlength="1" />
            </div>

            <div id="login-error" class="form-error" role="alert" style="display:none; margin-bottom:16px;"></div>

            <button type="submit" class="btn btn--primary btn--lg btn--block" id="login-submit">
              <span id="login-btn-text">Iniciar Sesión</span>
              <div id="login-spinner" class="spinner" style="display:none; width:18px; height:18px; border-width:2px;"></div>
            </button>
          </form>

          <p class="login-card__footer">
            Acceso para personal autorizado.<br>© 2026 By Fekas Corp.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function initLogin() {
  const form = document.getElementById('login-form') as HTMLFormElement;
  const errorEl = document.getElementById('login-error')!;
  const btnText = document.getElementById('login-btn-text')!;
  const spinner = document.getElementById('login-spinner')!;
  const submitBtn = document.getElementById('login-submit') as HTMLButtonElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const email = (document.getElementById('login-email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('login-password') as HTMLInputElement).value;

    if (!email || !password) {
      errorEl.textContent = 'Ingrese su correo electrónico y contraseña';
      errorEl.style.display = 'block';
      return;
    }

    // UI loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';

    try {
      await login(email, password);
      showToast('¡Bienvenido al sistema!', 'success');
      window.location.hash = '#/dashboard';
    } catch (err: unknown) {
      const message = (err && typeof err === 'object' && 'error' in err)
        ? (err as { error: string }).error
        : 'Error al conectar con el servidor';
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      spinner.style.display = 'none';
    }
  });
}
