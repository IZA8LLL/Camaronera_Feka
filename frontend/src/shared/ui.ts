/** Presentación compartida. Sin dependencias de servicios ni estado de negocio. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]!);
}

const paths = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  pools: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 10c3-3 6 3 9 0s6 3 9 0M3 16c3-3 6 3 9 0s6 3 9 0"/>',
  sample: '<path d="M9 3h6M10 3v6l-6 10a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2L14 9V3M7 15h10"/>',
  water: '<path d="M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  feed: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9M7 5.8l10 5.5"/>',
  purchases: '<path d="M6 7h14l-2 10H8L5 3H2"/><circle cx="9" cy="21" r="1"/><circle cx="17" cy="21" r="1"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  logout: '<path d="M9 4H4v16h5M10 12h11m-4-4 4 4-4 4"/>',
  alert: '<path d="m12 3 10 18H2L12 3ZM12 9v5M12 17h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  scale: '<path d="M12 3v18M5 21h14M4 7h16M6 7l-4 8h8L6 7ZM18 7l-4 8h8l-4-8Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
} as const;
export type IconName = keyof typeof paths;
export function icon(name: IconName): string {
  return `<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
export function pageHeader(title: string, subtitle: string, eyebrow: string, action = ''): string {
  return `<div class="page-header"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1 class="page-header__title">${escapeHtml(title)}</h1><p class="page-header__subtitle">${escapeHtml(subtitle)}</p></div>${action}</div>`;
}
export function formIntro(step: string, title: string, description: string): string {
  return `<div class="form-section-heading"><span class="step-number">${escapeHtml(step)}</span><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div></div>`;
}
