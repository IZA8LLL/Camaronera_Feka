/* ═══════════════════════════════════════════════════════════
   Login Page — Formulario de inicio de sesión
   Acceso monocromático con validación inline
   ═══════════════════════════════════════════════════════════ */
import { login } from '../../services/auth.service.ts';
import { showToast } from '../../core/toast.ts';
import { icon } from '../../shared/ui.ts';
import { renderThemeToggle } from '../../shared/theme.ts';

export function renderLogin(): string {
  return `
    <div class="login-page">
      <aside class="login-story" aria-label="By Fekas Corp.">
        <div class="sidebar-brand"><span class="brand-mark">${icon('pools')}</span><span class="sidebar-brand__text"><strong>by fekas<span class="brand-dot">.</span></strong><small>GESTIÓN ACUÍCOLA</small></span></div>
        <div class="login-story__content">
          <p class="eyebrow">Una visión completa de tu camaronera</p>
          <h2>Cada piscina.<br>Cada ciclo.<br><span>Todo conectado.</span></h2>
          <p class="login-story__description">Producción, calidad del agua y abastecimiento en un mismo espacio de trabajo.</p>
          <svg class="pond-art" viewBox="0 0 460 180" fill="none" aria-hidden="true">
            <path d="M0 170H460M0 10H460" stroke="currentColor" opacity=".25"/>
            <g stroke="currentColor"><rect x="10" y="30" width="130" height="120" rx="20"/><rect x="165" y="30" width="130" height="120" rx="20"/><rect x="320" y="30" width="130" height="120" rx="20"/></g>
            <g stroke="currentColor" opacity=".4"><path d="M25 80c30-25 55 25 100 0m-100 15c30-25 55 25 100 0M180 80c30-25 55 25 100 0m-100 15c30-25 55 25 100 0M335 80c30-25 55 25 100 0m-100 15c30-25 55 25 100 0"/></g>
          </svg>
        </div>
        <p class="login-story__footer">By Fekas Corp. · Del campo a la gestión</p>
      </aside>
      <div class="login-panel">
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
