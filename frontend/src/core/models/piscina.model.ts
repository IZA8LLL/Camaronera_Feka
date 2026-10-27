/* ═══════════════════════════════════════════════════════════
   Modelo Piscina / Estanque y Vista Desnormalizada
   ═══════════════════════════════════════════════════════════ */

export interface PiscinaRow {
  id: string;
  codigo: string;
  granja_id: string;
  area_ha: string | null;
  profundidad_m: string | null;
  capacidad_m3: string | null;
  estado: string;
  ciclo_id: string | null;
  ciclo_codigo: string | null;
  especie: string | null;
  fecha_inicio_ciclo: string | null;
  oxigeno_mg_l: string | null;
  salinidad_ppt: string | null;
  ph: string | null;
  temperatura_c: string | null;
  amonio_mg_l: string | null;
  alerta: boolean;
  ultima_lectura_agua: string | null;
  biomasa_kg: string | null;
  fca: string | null;
  ultimo_consumo_kg: string | null;
}
