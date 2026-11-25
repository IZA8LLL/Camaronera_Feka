const dateFormatter = new Intl.DateTimeFormat('es-EC', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export function formatMeasurementDate(value: string | null | undefined, missing = 'Sin lectura registrada'): string {
  if (!value) return missing;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : dateFormatter.format(date);
}

export function latestMeasurementDate(values: (string | null | undefined)[]): string | null {
  const timestamps = values.map(value => value ? new Date(value).getTime() : NaN)
    .filter(Number.isFinite);
  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;
}
