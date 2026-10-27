/* ═══════════════════════════════════════════════════════════
   Compras Page — Proveedores y Órdenes de Insumos
   ═══════════════════════════════════════════════════════════ */
import { fetchProveedores, fetchOrdenes, crearProveedor } from '../../services/compras.service.ts';
import type { Proveedor, OrdenCompra } from '../../core/models/index.ts';
import { showToast } from '../../core/toast.ts';

export function renderCompras(): string {
  return `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">📦 Compras & Proveedores</h1>
        <p class="page-header__subtitle">Control de insumos, proveedores seguros (AES-256) y órdenes</p>
      </div>
      <button class="btn btn--primary btn--sm" id="btn-toggle-modal-prov">
        + Nuevo Proveedor
      </button>
    </div>

    <!-- Modal Nuevo Proveedor -->
    <div id="modal-prov" class="card animate-card-enter" style="display:none; margin-bottom:24px; border:1px solid var(--accent-primary);">
      <div class="card__header">
        <h2 class="card__title">🔒 Registrar Proveedor (Datos Cifrados AES-256)</h2>
        <button class="btn btn--ghost btn--sm" id="btn-close-modal-prov">✕ Cerrar</button>
      </div>
      <form id="form-nuevo-prov">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="prov-nombre">Razón Social / Nombre *</label>
            <input class="form-input" id="prov-nombre" required placeholder="Ej: Balanceados del Pacífico S.A." />
          </div>
          <div class="form-group">
            <label class="form-label" for="prov-ruc">RUC * (Se cifra con AES-256)</label>
            <input class="form-input" id="prov-ruc" required placeholder="0992345678001" pattern="\\d{13}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="prov-contacto">Persona de Contacto</label>
            <input class="form-input" id="prov-contacto" placeholder="Ing. Carlos Mendoza" />
          </div>
          <div class="form-group">
            <label class="form-label" for="prov-email">Correo Electrónico</label>
            <input class="form-input" type="email" id="prov-email" placeholder="ventas@proveedor.com" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="prov-cuenta">Cuenta Bancaria (Cifrada con AES-256)</label>
            <input class="form-input" id="prov-cuenta" placeholder="Cta Cte Banco Pichincha ..." />
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:16px;">
          <button type="submit" class="btn btn--primary" id="btn-submit-prov">Guardar Proveedor Cifrado</button>
        </div>
      </form>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
      <!-- Proveedores -->
      <div class="card animate-card-enter delay-1">
        <div class="card__header">
          <h2 class="card__title">🏢 Directorio de Proveedores</h2>
        </div>
        <div id="container-proveedores">
          <div class="loading-overlay">
            <div class="spinner"></div>
            <span>Cargando proveedores…</span>
          </div>
        </div>
      </div>

      <!-- Órdenes de Compra -->
      <div class="card animate-card-enter delay-2">
        <div class="card__header">
          <h2 class="card__title">📑 Órdenes de Compra de Insumos</h2>
        </div>
        <div id="container-ordenes">
          <div class="loading-overlay">
            <div class="spinner"></div>
            <span>Cargando órdenes…</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initCompras() {
  const containerProv = document.getElementById('container-proveedores')!;
  const containerOrd = document.getElementById('container-ordenes')!;
  const modalProv = document.getElementById('modal-prov')!;
  const btnToggle = document.getElementById('btn-toggle-modal-prov')!;
  const btnClose = document.getElementById('btn-close-modal-prov')!;
  const formProv = document.getElementById('form-nuevo-prov') as HTMLFormElement;

  btnToggle.addEventListener('click', () => {
    modalProv.style.display = modalProv.style.display === 'none' ? 'block' : 'none';
  });

  btnClose.addEventListener('click', () => {
    modalProv.style.display = 'none';
  });

  formProv.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-prov') as HTMLButtonElement;
    btn.disabled = true;
    try {
      await crearProveedor({
        nombre: (document.getElementById('prov-nombre') as HTMLInputElement).value.trim(),
        ruc: (document.getElementById('prov-ruc') as HTMLInputElement).value.trim(),
        contacto: (document.getElementById('prov-contacto') as HTMLInputElement).value.trim(),
        email: (document.getElementById('prov-email') as HTMLInputElement).value.trim(),
        cuenta_bancaria: (document.getElementById('prov-cuenta') as HTMLInputElement).value.trim()
      });
      showToast('Proveedor registrado con datos cifrados', 'success');
      formProv.reset();
      modalProv.style.display = 'none';
      cargarProveedores();
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'error' in err)
        ? (err as { error: string }).error : 'Error al registrar proveedor';
      showToast(msg, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  async function cargarProveedores() {
    try {
      const proveedores = await fetchProveedores();
      if (!proveedores || proveedores.length === 0) {
        containerProv.innerHTML = `
          <div class="empty-state">
            <div class="empty-state__icon">🏢</div>
            <p class="empty-state__text">No hay proveedores registrados aún</p>
          </div>
        `;
        return;
      }
      containerProv.innerHTML = `
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Razón Social</th>
                <th>RUC</th>
                <th>Contacto</th>
                <th>Seguridad</th>
              </tr>
            </thead>
            <tbody>
              ${proveedores.map(p => `
                <tr>
                  <td style="font-weight:600;">${p.nombre}</td>
                  <td>${p.ruc || '🔒 Encriptado'}</td>
                  <td>${p.email_contacto || '—'}</td>
                  <td><span class="badge badge--success">AES-256-GCM</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch {
      containerProv.innerHTML = '<p style="color:var(--text-muted); padding:16px;">Error cargando proveedores.</p>';
    }
  }

  async function cargarOrdenes() {
    try {
      const ordenes = await fetchOrdenes();
      if (!ordenes || ordenes.length === 0) {
        containerOrd.innerHTML = `
          <div class="empty-state">
            <div class="empty-state__icon">📑</div>
            <p class="empty-state__text">No hay órdenes de compra registradas</p>
          </div>
        `;
        return;
      }
      containerOrd.innerHTML = `
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${ordenes.map(o => `
                <tr>
                  <td style="font-weight:600;">${o.numero_orden}</td>
                  <td>${new Date(o.fecha).toLocaleDateString('es-EC')}</td>
                  <td><span class="badge badge--${o.estado === 'recibida' ? 'success' : o.estado === 'aprobada' ? 'info' : 'warning'}">${o.estado}</span></td>
                  <td style="font-weight:600; color:var(--accent-primary);">$${(o.total || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch {
      containerOrd.innerHTML = '<p style="color:var(--text-muted); padding:16px;">Error cargando órdenes.</p>';
    }
  }

  cargarProveedores();
  cargarOrdenes();
}
