export function formatPiscinaNombre(codigo: string, granjaNombre?: string): string {
  const match = String(codigo || '').match(/(\d+)$/);
  const num = match ? match[1].padStart(2, '0') : '01';
  const farmInfo = granjaNombre ? ` · ${granjaNombre}` : '';
  return `Piscina ${num} (${codigo}${farmInfo})`;
}
