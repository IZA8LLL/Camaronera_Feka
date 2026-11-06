/* ═══════════════════════════════════════════════════════════
   Compras Page — Proveedores y Órdenes de Insumos
   ═══════════════════════════════════════════════════════════ */
import { fetchProveedores, fetchOrdenes, crearProveedor } from '../../services/compras.service';
import { showToast } from '../../core/toast';
import { escapeHtml, icon, pageHeader } from '../../shared/ui';

export function renderCompras(): string {
  return `
    ${pageHeader('Compras y proveedores', 'Tu red de abastecimiento y las órdenes de insumos, en un solo lugar.', 'Abastecimiento', `<button class="btn btn--primary" id="btn-toggle-modal-prov" aria-controls="modal-prov" aria-expanded="false">${icon('plus')} Nuevo proveedor</button>`)}

    <!-- Modal Nuevo Proveedor -->
    <section id="modal-prov" class="card provider-panel animate-card-enter" aria-labelledby="provider-title" style="display:none;">
      <div class="card__header">
        <h2 class="card__title" id="provider-title">Registrar proveedor</h2>
        <button class="btn btn--ghost btn--sm" id="btn-close-modal-prov">Cerrar</button>
      </div>
      <form id="form-nuevo-prov">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="prov-nombre">Razón Social / Nombre *</label>
            <input class="form-input" id="prov-nombre" required placeholder="Ej: Balanceados del Pacífico S.A." />
          </div>
          <div class="form-group">
            <label class="form-label" for="prov-ruc">RUC *</label>
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
            <label class="form-label" for="prov-cuenta">Cuenta bancaria</label>
            <input class="form-input" id="prov-cuenta" placeholder="Cta Cte Banco Pichincha ..." />
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" id="btn-submit-prov">Guardar proveedor</button>
        </div>
      </form>
    </section>

    <div class="purchases-grid">
      <!-- Proveedores -->
      <div class="card animate-card-enter delay-1">
        <div class="card__header">
          <h2 class="card__title">Directorio de Proveedores</h2>
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
          <h2 class="card__title">Órdenes de Compra de Insumos</h2>
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

  function setProviderPanel(open: boolean) {
    modalProv.style.display = open ? 'block' : 'none';
    btnToggle.setAttribute('aria-expanded', String(open));
    if (open) document.getElementById('prov-nombre')?.focus();
    else btnToggle.focus();
  }
  btnToggle.addEventListener('click', () => setProviderPanel(modalProv.style.display === 'none'));

  btnClose.addEventListener('click', () => {
    setProviderPanel(false);
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
      setProviderPanel(false);
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
            <p class="empty-state__text">No hay proveedores registrados aún</p>
          </div>
        `;
        return;
      }
      containerProv.innerHTML = `
        <div class="table-wrapper">
          <table class="table" aria-label="Directorio de proveedores">
            <thead>
              <tr>
                <th>Razón Social</th>
                <th>RUC</th>
                <th>Contacto</th>
                <th>Datos sensibles</th>
              </tr>
            </thead>
            <tbody>
              ${proveedores.map(p => `
                <tr>
                  <td class="text-strong">${escapeHtml(p.nombre)}</td>
                  <td>${escapeHtml(p.ruc || 'Protegido')}</td>
                  <td>${escapeHtml(p.email_contacto || '—')}</td>
                  <td><span class="badge badge--neutral">Protegidos</span></td>
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
            <p class="empty-state__text">No hay órdenes de compra registradas</p>
          </div>
        `;
        return;
      }
      containerOrd.innerHTML = `
        <div class="table-wrapper">
          <table class="table" aria-label="Órdenes de compra">
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
                  <td class="text-strong">${escapeHtml(o.numero_orden)}</td>
                  <td>${new Date(o.fecha).toLocaleDateString('es-EC')}</td>
                  <td><span class="badge badge--${o.estado === 'recibida' ? 'success' : o.estado === 'aprobada' ? 'info' : 'warning'}">${escapeHtml(o.estado)}</span></td>
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
