/* ═══════════════════════════════════════════════════════════
   By Fekas Corp. — Shell Principal de la Aplicación
   Sidebar oceánico, barra superior y enrutador dinámico
   ═══════════════════════════════════════════════════════════ */
import { resolveRoute, getCurrentRoute } from './app.routes.ts';
import { getUser, logout } from './services/auth.service.ts';

export function renderAppShell(): void {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  const currentRoute = resolveRoute();
  const { path } = getCurrentRoute();
  const user = getUser();

  // Si es la página de login, renderizar en pantalla completa sin sidebar
  if (currentRoute.path === '/login') {
    appContainer.innerHTML = `
      <div id="router-outlet">
        ${currentRoute.render()}
      </div>
    `;
    currentRoute.init?.();
    return;
  }

  // Shell para usuarios autenticados
  const userInitial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U';
  const tenantShort = user?.tenant_id ? `${user.tenant_id.slice(0, 6)}...` : 'FekasCorp';

  appContainer.innerHTML = `
    <div class="layout">
      <!-- Sidebar -->
      <aside class="layout__sidebar" id="app-sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand__icon">🦐</div>
          <div class="sidebar-brand__text">
            <h2>BY FEKAS CORP</h2>
            <span>ERP Camaronera</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="sidebar-section">
            <div class="sidebar-section__title">Operaciones</div>
            <a href="#/dashboard" class="nav-item ${path === '/dashboard' ? 'active' : ''}">
              <span class="nav-item__icon">📊</span>
              <span>Dashboard</span>
            </a>
            <a href="#/piscinas" class="nav-item ${path === '/piscinas' ? 'active' : ''}">
              <span class="nav-item__icon">🏊</span>
              <span>Piscinas / Estanques</span>
            </a>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section__title">Registros de Campo</div>
            <a href="#/form-muestreo" class="nav-item ${path === '/form-muestreo' ? 'active' : ''}">
              <span class="nav-item__icon">🔬</span>
              <span>Muestreo Biométrico</span>
            </a>
            <a href="#/form-agua" class="nav-item ${path === '/form-agua' ? 'active' : ''}">
              <span class="nav-item__icon">💧</span>
              <span>Parámetros de Agua</span>
            </a>
            <a href="#/form-alimentacion" class="nav-item ${path === '/form-alimentacion' ? 'active' : ''}">
              <span class="nav-item__icon">🍤</span>
              <span>Alimentación (Kardex)</span>
            </a>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section__title">Cadena de Suministro</div>
            <a href="#/compras" class="nav-item ${path === '/compras' ? 'active' : ''}">
              <span class="nav-item__icon">📦</span>
              <span>Compras & Proveedores</span>
            </a>
          </div>
        </nav>

        <div style="padding:16px; margin-top:auto; border-top:1px solid var(--border-color); font-size:var(--font-xs); color:var(--text-muted);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span style="color:var(--success); font-size:0.8rem;">●</span>
            <span style="font-weight:600; color:var(--text-secondary);">by_fekas_corp_db</span>
          </div>
          <div>Tenant: <span style="font-family:monospace; color:var(--accent-primary);">${tenantShort}</span></div>
        </div>
      </aside>

      <!-- Contenedor Principal -->
      <div class="layout__content">
        <header class="layout__topbar">
          <div style="display:flex; align-items:center; gap:16px;">
            <button id="btn-toggle-menu" class="btn btn--ghost btn--sm" style="display:none;" aria-label="Abrir menú">
              ☰
            </button>
            <h1 class="topbar__title">${currentRoute.title}</h1>
          </div>

          <div class="topbar__actions">
            <div class="topbar__user">
              <div class="topbar__avatar">${userInitial}</div>
              <div style="display:flex; flex-direction:column;">
                <span class="topbar__name">${user?.nombre || 'Operador'}</span>
                <span style="font-size:0.7rem; color:var(--text-muted);">${user?.email || 'admin@byfekas.com'}</span>
              </div>
            </div>

            <button class="btn btn--secondary btn--sm" id="btn-logout" title="Cerrar Sesión">
              <span>Salir</span> ✕
            </button>
          </div>
        </header>

        <main class="layout__main" id="router-outlet">
          ${currentRoute.render()}
        </main>
      </div>
    </div>
  `;

  // Inicializar controlador de la página
  currentRoute.init?.();

  // Enlazar botón de logout
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('¿Está seguro de cerrar sesión en By Fekas Corp.?')) {
        await logout();
      }
    });
  }
}
