/* ═══════════════════════════════════════════════════════════
   Auth Guard — Protección de Rutas SPA
   Verifica token de sesión en localStorage antes de navegar
   ═══════════════════════════════════════════════════════════ */
import { isAuthenticated } from '../../services/auth.service.ts';
import { showToast } from '../toast.ts';

/**
 * Verifica si el usuario tiene una sesión activa.
 * Si no está autenticado, redirige al login con notificación.
 */
export function authGuard(): boolean {
  if (!isAuthenticated()) {
    showToast('Debe iniciar sesión para acceder al sistema', 'warning');
    window.location.hash = '#/login';
    return false;
  }
  return true;
}
