import { resolveRoute } from './app.routes.ts';
import { getUser, logout } from './services/auth.service.ts';
import { escapeHtml, icon } from './shared/ui.ts';
import { initNavigation, renderNavigation } from './shared/navigation.ts';
import { initThemeToggle, renderThemeToggle } from './shared/theme.ts';

let disposeNavigation: (() => void) | undefined;

export function renderAppShell(): void {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;
  disposeNavigation?.();
  disposeNavigation = undefined;
  const route = resolveRoute();
  document.title = `${route.title} · By Fekas Corp.`;
  if (route.path === '/login') {
    appContainer.innerHTML = `<main id="router-outlet">${route.render()}</main>`;
    initThemeToggle(appContainer);
    route.init?.();
    return;
  }
  const user = getUser();
  const name = user?.nombre || 'Usuario';
  const initial = name.charAt(0).toUpperCase();
  appContainer.innerHTML = `
    <a class="skip-link" href="#router-outlet" id="skip-content">Ir al contenido</a>
    <div class="layout">
      <aside class="layout__sidebar" id="app-sidebar" aria-label="Navegación principal">
        <a class="sidebar-brand" href="#/dashboard" aria-label="By Fekas Corp., inicio">
          <span class="brand-mark">${icon('pools')}</span>
          <span class="sidebar-brand__text"><strong>by fekas<span class="brand-dot">.</span></strong><small>GESTIÓN ACUÍCOLA</small></span>
        </a>
        <button class="btn btn--ghost mobile-menu-close" id="btn-close-menu" aria-label="Cerrar menú">${icon('close')}</button>
        <div class="workspace-label"><span class="workspace-monogram">BF</span><div><strong>By Fekas Corp.</strong><small>Espacio de trabajo</small></div></div>
        <nav class="sidebar-nav" aria-label="Módulos del ERP">${renderNavigation(route.path)}</nav>
        <div class="sidebar-footer">${icon('water')}<div><strong>Del campo a la gestión.</strong><span>Una operación, una visión.</span></div></div>
      </aside>
      <button id="menu-backdrop" class="menu-backdrop" hidden tabindex="-1" aria-label="Cerrar menú"></button>
      <div class="layout__content">
        <header class="layout__topbar">
          <div class="topbar__context">
            <button id="btn-toggle-menu" class="btn btn--ghost mobile-menu-toggle" aria-label="Abrir menú" aria-controls="app-sidebar" aria-expanded="false">${icon('menu')}</button>
            <span class="topbar__workspace">Espacio de trabajo</span><span class="topbar__divider" aria-hidden="true">/</span><span class="topbar__title">${escapeHtml(route.title)}</span>
          </div>
          <div class="topbar__actions">${renderThemeToggle()}<div class="topbar__user"><div class="topbar__avatar" aria-hidden="true">${escapeHtml(initial)}</div><div class="topbar__identity"><span class="topbar__name">${escapeHtml(name)}</span><span class="topbar__email">${escapeHtml(user?.email || '')}</span></div></div>
            <button class="btn btn--ghost btn--sm" id="btn-logout" title="Cerrar sesión" aria-label="Cerrar sesión">${icon('logout')}<span class="logout-label">Salir</span></button>
          </div>
        </header>
        <main class="layout__main" id="router-outlet" tabindex="-1">${route.render()}</main>
        <footer class="layout__footer"><span>By Fekas Corp.</span><span>Gestión acuícola integral</span></footer>
      </div>
    </div>`;
  disposeNavigation = initNavigation();
  initThemeToggle(appContainer);
  document.getElementById('skip-content')?.addEventListener('click', event => {
    event.preventDefault(); document.getElementById('router-outlet')?.focus();
  });
  route.init?.();
  appContainer.querySelectorAll('[data-back]').forEach(button => {
    button.addEventListener('click', () => history.back());
  });
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    if (confirm('¿Está seguro de cerrar sesión en By Fekas Corp.?')) await logout();
  });
}
