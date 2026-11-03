// Se ejecuta antes del primer render para evitar destellos al restaurar el tema.
// La clave debe coincidir con shared/theme.ts.
try {
  document.documentElement.dataset.theme =
    localStorage.getItem('by-fekas-theme') === 'dark' ? 'dark' : 'light';
} catch {
  document.documentElement.dataset.theme = 'light';
}
