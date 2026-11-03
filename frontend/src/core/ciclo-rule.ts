/* ═══════════════════════════════════════════════════════════
   Regla de Negocio: Código de Ciclo Secuencial Dinámico
   Formato: CIC-{AÑO}-P{NUM_SECUENCIAL}
   Ejemplo:
   - Actualmente hay 5 registrados en 2026: el siguiente es CIC-2026-P06
   - Si cambia a 2027 (0 registrados): se actualiza a CIC-2027-P01
   ═══════════════════════════════════════════════════════════ */

export function calcularSiguienteCodigoCiclo(totalRegistradosEnAño: number, fecha?: string | Date): string {
  const d = fecha ? new Date(fecha) : new Date();
  const year = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  const nextNum = totalRegistradosEnAño + 1;
  return `CIC-${year}-P${String(nextNum).padStart(2, '0')}`;
}

export function formatPiscinaNombre(codigo: string, granjaNombre?: string): string {
  const match = String(codigo || '').match(/(\d+)$/);
  const num = match ? match[1].padStart(2, '0') : '01';
  const farmInfo = granjaNombre ? ` · ${granjaNombre}` : '';
  return `Piscina ${num} (${codigo}${farmInfo})`;
}
