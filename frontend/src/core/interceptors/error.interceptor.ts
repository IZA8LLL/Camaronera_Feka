/* ═══════════════════════════════════════════════════════════
   Error Interceptor — Manejo global de errores HTTP (401, 403, 500)
   ═══════════════════════════════════════════════════════════ */
import { showToast } from '../toast.ts';

export interface HttpErrorResponse {
  status: number;
  message: string;
  issues?: Array<{ campo: string; mensaje: string }>;
}

/**
 * Procesa errores de respuesta HTTP y muestra notificaciones adecuadas.
 */
export function handleHttpError(status: number, data: unknown): void {
  const errorObj = data as { error?: string; message?: string; issues?: Array<{ campo: string; mensaje: string }> };
  const errorMsg = errorObj?.error || errorObj?.message || 'Error en la operación';

  switch (status) {
    case 401:
      showToast('Sesión no autorizada o expirada. Por favor inicie sesión.', 'warning');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
      break;

    case 403:
      showToast(`Permiso denegado: ${errorMsg}`, 'error');
      break;

    case 422:
    case 400:
      if (errorObj?.issues && errorObj.issues.length > 0) {
        const details = errorObj.issues.map(i => `${i.campo}: ${i.mensaje}`).join(', ');
        showToast(`Validación: ${details}`, 'error');
      } else {
        showToast(`Datos incorrectos: ${errorMsg}`, 'error');
      }
      break;

    case 429:
      showToast('Demasiadas solicitudes. Espere un momento antes de reintentar.', 'warning');
      break;

    case 500:
    case 502:
    case 503:
      showToast('Error interno del servidor. Verifique la conexión con MongoDB Atlas.', 'error');
      break;

    default:
      showToast(errorMsg, 'error');
      break;
  }
}
