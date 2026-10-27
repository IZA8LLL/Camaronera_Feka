/* ═══════════════════════════════════════════════════════════
   Compras & Proveedores Service
   Gestión de proveedores (cifrado AES) y órdenes de insumos
   ═══════════════════════════════════════════════════════════ */
import { apiFetch } from './api.service.ts';
import type { Proveedor, OrdenCompra } from '../core/models/index.ts';

export async function fetchProveedores(): Promise<Proveedor[]> {
  return apiFetch<Proveedor[]>('/api/proveedores');
}

export async function crearProveedor(data: {
  nombre: string;
  ruc: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  cuenta_bancaria?: string;
}): Promise<Proveedor> {
  return apiFetch<Proveedor>('/api/proveedores', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function fetchOrdenes(): Promise<OrdenCompra[]> {
  return apiFetch<OrdenCompra[]>('/api/ordenes');
}

export async function crearOrdenCompra(data: {
  proveedor_id: string;
  numero_orden: string;
  lineas: Array<{
    insumo: string;
    cantidad: number;
    precio_unitario: number;
  }>;
  observacion?: string;
}): Promise<OrdenCompra> {
  return apiFetch<OrdenCompra>('/api/ordenes', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
