/* ═══════════════════════════════════════════════════════════
   Piscina Service — Peticiones de piscinas y estados
   ═══════════════════════════════════════════════════════════ */
import { apiFetch } from './api.service';
import type { PiscinaRow } from '../core/models/index';

export async function fetchPiscinas(): Promise<PiscinaRow[]> {
  return apiFetch<PiscinaRow[]>('/api/piscinas');
}
