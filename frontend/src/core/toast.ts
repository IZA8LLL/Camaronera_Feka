/* ═══════════════════════════════════════════════════════════
   Toast Manager — Sistema de notificaciones
   ═══════════════════════════════════════════════════════════ */

type ToastType = 'success' | 'error' | 'warning' | 'info';


let container: HTMLDivElement | null = null;

function ensureContainer(): HTMLDivElement {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message: string, type: ToastType = 'info', duration = 4000) {
  const c = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span style="font-weight:600;">${message}</span>`;
  c.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast--exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}
