/* ═══════════════════════════════════════════════════════════
   Auth Guard — Protección de Rutas Angular
   Verifica token de sesión en localStorage antes de navegar
   ═══════════════════════════════════════════════════════════ */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isAuthenticated } from '../../services/auth.service';
import { showToast } from '../toast';

/**
 * Verifica si el usuario tiene una sesión activa.
 * Si no está autenticado, redirige al login con notificación.
 */
export function authGuard(_route?: any, _state?: any): boolean {
  if (!isAuthenticated()) {
    showToast('Debe iniciar sesión para acceder al sistema', 'warning');
    try {
      const router = inject(Router);
      router.navigate(['/login']);
    } catch {
      window.location.hash = '#/login';
    }
    return false;
  }
  return true;
}
