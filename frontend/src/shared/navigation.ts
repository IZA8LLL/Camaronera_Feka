import { escapeHtml, icon, type IconName } from './ui.ts';

interface NavigationItem { path: string; label: string; icon: IconName }
const sections: { label: string; items: NavigationItem[] }[] = [
  { label: 'Vista general', items: [
    { path: '/dashboard', label: 'Resumen operativo', icon: 'overview' },
    { path: '/piscinas', label: 'Piscinas y estanques', icon: 'pools' }
  ] },
  { label: 'Trabajo de campo', items: [
    { path: '/form-muestreo', label: 'Muestreo biométrico', icon: 'sample' },
    { path: '/form-agua', label: 'Calidad del agua', icon: 'water' },
    { path: '/form-alimentacion', label: 'Alimentación', icon: 'feed' }
  ] },
  { label: 'Abastecimiento', items: [
    { path: '/compras', label: 'Compras y proveedores', icon: 'purchases' }
  ] }
];
export function renderNavigation(currentPath: string): string {
  return sections.map(section => `<div class="sidebar-section"><p class="sidebar-section__title">${section.label}</p>${section.items.map(item =>
    `<a href="#${item.path}" class="nav-item${item.path === currentPath ? ' active' : ''}"${item.path === currentPath ? ' aria-current="page"' : ''}>${icon(item.icon)}<span>${escapeHtml(item.label)}</span></a>`
  ).join('')}</div>`).join('');
}

/** Panel móvil con cierre por Escape, control del foco y limpieza al navegar. */
export function initNavigation(): () => void {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const sidebar = document.getElementById('app-sidebar')!;
  const toggle = document.getElementById('btn-toggle-menu')!;
  const backdrop = document.getElementById('menu-backdrop')!;
  const content = document.querySelector<HTMLElement>('.layout__content')!;
  const media = window.matchMedia('(max-width: 900px)');
  let open = false;
  function setOpen(value: boolean, restoreFocus = true) {
    open = value && media.matches;
    sidebar.classList.toggle('is-open', open);
    sidebar.inert = media.matches && !open;
    content.inert = open;
    backdrop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    sidebar.setAttribute('role', open ? 'dialog' : 'complementary');
    if (open) sidebar.setAttribute('aria-modal', 'true');
    else sidebar.removeAttribute('aria-modal');
    document.body.classList.toggle('menu-open', open);
    if (open) sidebar.querySelector<HTMLElement>('button, a')?.focus();
    else if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => setOpen(!open), options);
  document.getElementById('btn-close-menu')!.addEventListener('click', () => setOpen(false), options);
  backdrop.addEventListener('click', () => setOpen(false), options);
  sidebar.addEventListener('click', event => {
    if ((event.target as Element).closest('a') && open) setOpen(false);
  }, options);
  document.addEventListener('keydown', event => {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
    if (event.key !== 'Tab') return;
    const controls = [...sidebar.querySelectorAll<HTMLElement>('a, button')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }, options);
  media.addEventListener('change', () => setOpen(false, false), options);
  setOpen(false, false);
  return () => { controller.abort(); document.body.classList.remove('menu-open'); };
}
