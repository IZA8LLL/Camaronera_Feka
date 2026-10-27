/* ═══════════════════════════════════════════════════════════
   Auth Service — Login, Refresh, Logout, estado de sesión
   ═══════════════════════════════════════════════════════════ */
import { apiFetch, setAccessToken } from './api.service.ts';
import type { AuthResponse, MeResponse, UserInfo } from '../core/models/index.ts';

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}

export function getUser(): UserInfo | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function initAuth(): void {
  const token = localStorage.getItem('access_token');
  if (token) setAccessToken(token);
}

export async function login(
  email: string,
  password: string,
  tenantId?: string
): Promise<AuthResponse> {
  const payload: Record<string, string> = {
    email,
    password,
    turnstile_token: 'dev-token'
  };
  if (tenantId) payload.tenant_id = tenantId;

  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  setAccessToken(data.access_token);
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
}

export async function fetchMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/api/me');
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/logout', { method: 'POST' });
  } catch {
    // Ignorar errores de logout
  } finally {
    setAccessToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.hash = '#/login';
  }
}
