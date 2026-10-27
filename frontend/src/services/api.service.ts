/* ═══════════════════════════════════════════════════════════
   API Service — HttpClient base con interceptors
   Maneja tokens, refresh automático y errores globales
   ═══════════════════════════════════════════════════════════ */
import type { ApiError } from '../core/models/index.ts';

const BASE_URL = '';  // Proxy de Vite redirige a localhost:3000

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.access_token;
    localStorage.setItem('access_token', data.access_token);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  // Si el token expiró, intentar refresh
  if (res.status === 401 && accessToken) {
    if (!refreshPromise) {
      refreshPromise = tryRefresh().finally(() => { refreshPromise = null; });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
        credentials: 'include'
      });
    } else {
      // Sesión expirada, redirigir al login
      accessToken = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
      throw new Error('Sesión expirada');
    }
  }

  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({ error: 'Error de conexión' }));
    throw body;
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}
