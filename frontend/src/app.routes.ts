/* ═══════════════════════════════════════════════════════════
   By Fekas Corp. — Enrutador SPA (Hash-based Routing)
   ═══════════════════════════════════════════════════════════ */
import { authGuard } from './core/guards/auth.guard.ts';
import { renderLogin, initLogin } from './pages/login/login.page.ts';
import { renderDashboard, initDashboard } from './pages/dashboard/dashboard.page.ts';
import { renderPiscinasList, initPiscinasList } from './pages/piscinas-list/piscinas-list.page.ts';
import { renderFormMuestreo, initFormMuestreo } from './pages/form-muestreo/form-muestreo.page.ts';
import { renderFormAgua, initFormAgua } from './pages/form-agua/form-agua.page.ts';
import { renderFormAlimentacion, initFormAlimentacion } from './pages/form-alimentacion/form-alimentacion.page.ts';
import { renderCompras, initCompras } from './pages/compras/compras.page.ts';
import { isAuthenticated } from './services/auth.service.ts';

export interface RouteDefinition {
  path: string;
  render: () => string;
  init?: () => void | Promise<void>;
  requiresAuth?: boolean;
  title: string;
}

export const routes: Record<string, RouteDefinition> = {
  '/login': {
    path: '/login',
    render: renderLogin,
    init: initLogin,
    requiresAuth: false,
    title: 'Iniciar Sesión'
  },
  '/dashboard': {
    path: '/dashboard',
    render: renderDashboard,
    init: initDashboard,
    requiresAuth: true,
    title: 'Dashboard de Operaciones'
  },
  '/piscinas': {
    path: '/piscinas',
    render: renderPiscinasList,
    init: initPiscinasList,
    requiresAuth: true,
    title: 'Piscinas y Estanques'
  },
  '/form-muestreo': {
    path: '/form-muestreo',
    render: renderFormMuestreo,
    init: initFormMuestreo,
    requiresAuth: true,
    title: 'Muestreo Biométrico'
  },
  '/form-agua': {
    path: '/form-agua',
    render: renderFormAgua,
    init: initFormAgua,
    requiresAuth: true,
    title: 'Parámetros de Calidad de Agua'
  },
  '/form-alimentacion': {
    path: '/form-alimentacion',
    render: renderFormAlimentacion,
    init: initFormAlimentacion,
    requiresAuth: true,
    title: 'Registro de Alimentación'
  },
  '/compras': {
    path: '/compras',
    render: renderCompras,
    init: initCompras,
    requiresAuth: true,
    title: 'Compras & Proveedores'
  }
};

/**
 * Obtiene la ruta actual desde window.location.hash
 */
export function getCurrentRoute(): { path: string; query: URLSearchParams } {
  const hash = window.location.hash.slice(1) || '';
  const [pathWithSlash, queryString] = hash.split('?');
  const path = pathWithSlash ? (pathWithSlash.startsWith('/') ? pathWithSlash : '/' + pathWithSlash) : '';
  const query = new URLSearchParams(queryString || '');
  return { path, query };
}

/**
 * Redirige si la ruta no existe o si no está autenticado
 */
export function resolveRoute(): RouteDefinition {
  const { path } = getCurrentRoute();

  if (!path || path === '/') {
    return isAuthenticated() ? routes['/dashboard'] : routes['/login'];
  }

  const matched = routes[path];
  if (!matched) {
    return isAuthenticated() ? routes['/dashboard'] : routes['/login'];
  }

  if (matched.requiresAuth && !authGuard()) {
    return routes['/login'];
  }

  if (path === '/login' && isAuthenticated()) {
    window.location.hash = '#/dashboard';
    return routes['/dashboard'];
  }

  return matched;
}
