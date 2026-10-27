/* ═══════════════════════════════════════════════════════════
   By Fekas Corp. — Entorno de Configuración Frontend
   ═══════════════════════════════════════════════════════════ */

export const environment = {
  production: false,
  appName: 'By Fekas Corp. — ERP Camaronera',
  // En desarrollo con Vite, el proxy redirige /auth, /api y /health al backend (localhost:3000)
  apiUrl: '',
  // Cloudflare Turnstile Site Key (llave pública de prueba para desarrollo)
  turnstileSiteKey: '1x00000000000000000000AA',
  defaultTenantId: '654321098765432109876543'
};
