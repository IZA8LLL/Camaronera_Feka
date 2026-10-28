/* ═══════════════════════════════════════════════════════════
   Login Page — Formulario de inicio de sesión
   Diseño glassmorphism con validación inline
   ═══════════════════════════════════════════════════════════ */
import { login } from '../../services/auth.service.ts';
import { showToast } from '../../core/toast.ts';

export function renderLogin(): string {
  return `
    <div class="login-page">
      <div class="login-page__bg"></div>
      <div class="login-card">
        <div class="login-card__brand">
          <div class="login-card__logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#FFA726;">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
              <path d="M12 6a6 6 0 0 0-6 6c0 2.5 1.5 4.5 4 5.5"/>
              <circle cx="15" cy="9" r="1"/>
            </svg>
          </div>
          <h1 class="login-card__title">By Fekas Corp.</h1>
          <p class="login-card__desc">Sistema de Gestión de Camaroneras</p>
        </div>

        <form id="login-form" autocomplete="on">
          <div class="form-group">
            <label class="form-label" for="login-email">Correo electrónico</label>
            <input class="form-input" type="email" id="login-email"
              placeholder="admin@fekascorp.com"
              autocomplete="email" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">Contraseña</label>
            <input class="form-input" type="password" id="login-password"
              placeholder="••••••••••"
              autocomplete="current-password" required minlength="1" />
          </div>

          <div id="login-error" class="form-error" style="display:none; margin-bottom:16px; text-align:center;"></div>

          <button type="submit" class="btn btn--primary btn--lg btn--block" id="login-submit">
            <span id="login-btn-text">Iniciar Sesión</span>
            <div id="login-spinner" class="spinner" style="display:none; width:18px; height:18px; border-width:2px;"></div>
          </button>
        </form>

        <p style="text-align:center; margin-top:20px; font-size:0.75rem; color:var(--text-muted);">
          © 2026 By Fekas Corp. — Todos los derechos reservados
        </p>
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
