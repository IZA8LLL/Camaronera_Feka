/* ═══════════════════════════════════════════════════════════
   Modelo Muestreo Biométrico
   ═══════════════════════════════════════════════════════════ */

export interface MuestreoPayload {
  granja_id: string;
  piscina_id: string;
  ciclo_id: string;
  fecha: string;
  peso_promedio_g: number;
  talla_promedio_cm: number;
  muestra_individuos: number;
  biomasa_estimada_kg: number;
  observacion?: string;
}

export interface MuestreoResponse extends MuestreoPayload {
  id: string;
  tenant_id: string;
  created_at: string;
}
