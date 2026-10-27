/* ═══════════════════════════════════════════════════════════
   Modelo Proveedor y Órdenes de Compra
   ═══════════════════════════════════════════════════════════ */

export interface Proveedor {
  _id?: string;
  id?: string;
  nombre: string;
  ruc?: string;
  email_contacto?: string;
  telefono?: string;
  activo?: boolean;
}

export interface LineaOrden {
  insumo: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface OrdenCompra {
  _id?: string;
  id?: string;
  proveedor_id: string;
  numero_orden: string;
  fecha: string;
  estado: 'borrador' | 'aprobada' | 'recibida' | 'cancelada';
  lineas: LineaOrden[];
  subtotal: number;
  iva: number;
  total: number;
}
