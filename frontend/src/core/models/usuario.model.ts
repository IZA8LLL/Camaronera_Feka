/* ═══════════════════════════════════════════════════════════
   Modelo Usuario & Sesión
   ═══════════════════════════════════════════════════════════ */

export interface UserInfo {
  id: string;
  nombre: string;
  email: string;
  tenant_id: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfo;
}

export interface MeResponse {
  id: string;
  granja_ids: string[];
  piscina_ids: string[];
  permisos: string[];
  isAdmin: boolean;
}
