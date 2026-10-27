/* ═══════════════════════════════════════════════════════════
   Operacion Service — Muestreos, Agua, Alimentación
   ═══════════════════════════════════════════════════════════ */
import { apiFetch } from './api.service.ts';
import type { MuestreoPayload, AguaPayload, AlimentacionPayload } from '../core/models/index.ts';

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
