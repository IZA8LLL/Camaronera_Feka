/* ═══════════════════════════════════════════════════════════
   By Fekas Corp. — Modelos Core Frontend (Barrel Export)
   ═══════════════════════════════════════════════════════════ */

export * from './usuario.model';
export * from './piscina.model';
export * from './muestreo.model';
export * from './agua.model';
export * from './orden-compra.model';

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
