/* ═══════════════════════════════════════════════════════════
   Modelo Parámetros de Calidad de Agua
   ═══════════════════════════════════════════════════════════ */

export interface AguaPayload {
  granja_id: string;
  piscina_id: string;
  ciclo_id: string;
  fecha: string;
  oxigeno_mg_l: number;
  salinidad_ppt: number;
  ph: number;
  temperatura_c: number;
  amonio_mg_l: number;
}

export interface AguaResponse extends AguaPayload {
  id: string;
  alerta: boolean;
  tenant_id: string;
  created_at: string;
}
