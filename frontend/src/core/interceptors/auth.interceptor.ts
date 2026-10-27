/* ═══════════════════════════════════════════════════════════
   Auth Interceptor — Inyección automática de Bearer Token
   ═══════════════════════════════════════════════════════════ */
import { getAccessToken } from '../../services/api.service.ts';

/**
 * Adjunta la cabecera Authorization con el token JWT si está disponible.
 */
export function applyAuthHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getAccessToken() || localStorage.getItem('access_token');
  if (!token) return headers;

  const currentHeaders = new Headers(headers);
  if (!currentHeaders.has('Authorization')) {
    currentHeaders.set('Authorization', `Bearer ${token}`);
  }
  return currentHeaders;
}
