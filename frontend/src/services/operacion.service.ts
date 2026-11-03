/* ═══════════════════════════════════════════════════════════
   Operacion Service — Muestreos, Agua, Alimentación, Lotes, Granjas, Ciclos
   ═══════════════════════════════════════════════════════════ */
import { apiFetch } from './api.service.ts';
import type { MuestreoPayload, AguaPayload, AlimentacionPayload } from '../core/models/index.ts';

export interface LoteRow {
  id: string;
  _id: string;
  granja_id: string;
  bodega_id: string;
  codigo_lote: string;
  cantidad_actual: number;
  costo_unitario: number;
}

export interface GranjaRow {
  id: string;
  _id: string;
  codigo: string;
  nombre: string;
  ubicacion?: string;
}

export interface CicloItem {
  id: string;
  codigo: string;
  estado: string;
  piscina_id: string;
  granja_id: string;
}

export interface SiguienteCicloResponse {
  year: number;
  total_registrados: number;
  siguiente_codigo: string;
  siguiente_id: string | null;
  ciclos_existentes: CicloItem[];
}

export async function crearMuestreo(payload: MuestreoPayload) {
  return apiFetch('/api/muestreos', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function crearParametrosAgua(payload: AguaPayload) {
  return apiFetch('/api/parametros-agua', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function crearAlimentacion(payload: AlimentacionPayload) {
  return apiFetch('/api/alimentacion', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchLotes(): Promise<LoteRow[]> {
  return apiFetch<LoteRow[]>('/api/lotes');
}

export async function fetchGranjas(): Promise<GranjaRow[]> {
  return apiFetch<GranjaRow[]>('/api/granjas');
}

export async function fetchSiguienteCiclo(params: {
  piscina_id?: string;
  granja_id?: string;
  fecha?: string;
}): Promise<SiguienteCicloResponse> {
  const query = new URLSearchParams();
  if (params.piscina_id) query.set('piscina_id', params.piscina_id);
  if (params.granja_id) query.set('granja_id', params.granja_id);
  if (params.fecha) query.set('fecha', params.fecha);
  return apiFetch<SiguienteCicloResponse>(`/api/ciclos/siguiente?${query.toString()}`);
}
