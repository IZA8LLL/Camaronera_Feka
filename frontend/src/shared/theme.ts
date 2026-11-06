import { icon } from './ui';

const STORAGE_KEY = 'by-fekas-theme';
type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function renderThemeToggle(): string {
  const dark = currentTheme() === 'dark';
  return `<button type="button" class="btn theme-toggle" data-theme-toggle aria-label="Modo oscuro" aria-pressed="${dark}" title="Cambiar al tema ${dark ? 'claro' : 'oscuro'}">${icon(dark ? 'moon' : 'sun')}<span class="theme-toggle__label">Modo oscuro</span></button>`;
}

/** Actualiza solo el tema y el botón: conserva campos, foco y estado de la página. */
export function initThemeToggle(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach(button => {
    if (button.dataset['themeBound']) return;
    button.dataset['themeBound'] = 'true';
    button.addEventListener('click', () => {
      const theme: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Sigue funcionando en esta página aunque el navegador bloquee el almacenamiento.
      }
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.title = `Cambiar al tema ${theme === 'dark' ? 'claro' : 'oscuro'}`;
      button.innerHTML = `${icon(theme === 'dark' ? 'moon' : 'sun')}<span class="theme-toggle__label">Modo oscuro</span>`;
    });
  });
}
