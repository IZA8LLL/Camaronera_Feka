/* ═══════════════════════════════════════════════════════════
   Piscina Service — Peticiones de piscinas y estados
   ═══════════════════════════════════════════════════════════ */
import { apiFetch } from './api.service.ts';
import type { PiscinaRow } from '../core/models/index.ts';

export async function fetchPiscinas(): Promise<PiscinaRow[]> {
  return apiFetch<PiscinaRow[]>('/api/piscinas');
}
