/* ═══════════════════════════════════════════════════════════
   By Fekas Corp. — Punto de Entrada Frontend (main.ts)
   ═══════════════════════════════════════════════════════════ */
import './theme/variables.css';
import { initAuth, isAuthenticated } from './services/auth.service.ts';
import { renderAppShell } from './app.component.ts';

// Inicializar sesión y tokens almacenados
initAuth();

// Si no hay hash, redirigir al login o al dashboard
if (!window.location.hash || window.location.hash === '#/') {
  window.location.hash = isAuthenticated() ? '#/dashboard' : '#/login';
}

// Renderizar la aplicación inicial
renderAppShell();

// Escuchar cambios de hash para navegación instantánea SPA
window.addEventListener('hashchange', () => {
  renderAppShell();
});
