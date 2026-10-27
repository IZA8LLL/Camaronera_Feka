/* ═══════════════════════════════════════════════════════════
   By Fekas Corp. — Modelos Core Frontend (Barrel Export)
   ═══════════════════════════════════════════════════════════ */

export * from './usuario.model.ts';
export * from './piscina.model.ts';
export * from './muestreo.model.ts';
export * from './agua.model.ts';
export * from './orden-compra.model.ts';

export interface AlimentacionPayload {
  granja_id: string;
  piscina_id: string;
  ciclo_id: string;
  lote_id: string;
  fecha: string;
  cantidad_kg: number;
  fca?: number;
  biomasa_kg?: number;
  observacion?: string;
}

export interface ApiError {
  error: string;
  issues?: Array<{ campo: string; mensaje: string }>;
}
