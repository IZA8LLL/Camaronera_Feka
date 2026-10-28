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
          <div class="sidebar-brand__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#FFA726;">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
              <path d="M12 6a6 6 0 0 0-6 6c0 2.5 1.5 4.5 4 5.5"/>
              <circle cx="15" cy="9" r="1"/>
            </svg>
          </div>
          <div class="sidebar-brand__text">
            <h2>BY FEKAS CORP</h2>
            <span>ERP Camaronera</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="sidebar-section">
            <div class="sidebar-section__title">OPERACIONES</div>
            <a href="#/dashboard" class="nav-item ${path === '/dashboard' ? 'active' : ''}">
              <span>Dashboard</span>
            </a>
            <a href="#/piscinas" class="nav-item ${path === '/piscinas' ? 'active' : ''}">
              <span>Piscinas / Estanques</span>
            </a>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section__title">REGISTROS DE CAMPO</div>
            <a href="#/form-muestreo" class="nav-item ${path === '/form-muestreo' ? 'active' : ''}">
              <span>Muestreo Biométrico</span>
            </a>
            <a href="#/form-agua" class="nav-item ${path === '/form-agua' ? 'active' : ''}">
              <span>Parámetros de Agua</span>
            </a>
            <a href="#/form-alimentacion" class="nav-item ${path === '/form-alimentacion' ? 'active' : ''}">
              <span>Alimentación (Kardex)</span>
            </a>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section__title">CADENA DE SUMINISTRO</div>
            <a href="#/compras" class="nav-item ${path === '/compras' ? 'active' : ''}">
              <span>Compras & Proveedores</span>
            </a>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-footer__db">
            <span class="db-indicator">●</span>
            <span class="db-name">by_fekas_corp_db</span>
          </div>
          <div class="sidebar-footer__tenant">Tenant: <span class="tenant-code">${tenantShort}</span></div>
        </div>
      </aside>

      <!-- Contenedor Principal -->
      <div class="layout__content">
        <header class="layout__topbar">
          <div style="display:flex; align-items:center; gap:16px;">
            <button id="btn-toggle-menu" class="btn btn--ghost btn--sm" style="display:none;" aria-label="Abrir menú">
              Menú
            </button>
            <h1 class="topbar__title">${currentRoute.title}</h1>
          </div>

          <div class="topbar__actions">
            <div class="topbar__user">
              <div class="topbar__avatar">${userInitial}</div>
              <div style="display:flex; flex-direction:column;">
                <span class="topbar__name">${user?.nombre || 'Administrador Inicial'}</span>
                <span class="topbar__email">${user?.email || 'admin@fekascorp.com'}</span>
              </div>
            </div>

            <button class="btn btn-logout-corporate btn--sm" id="btn-logout" title="Cerrar Sesión">
              Salir
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
