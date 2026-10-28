'use strict';
/* Controlador de Compras: Proveedores y Órdenes de compra.
   Cifra RUC y cuenta bancaria con AES-256-GCM. */
const mongoose = require('mongoose');
const { id, dec, safeText } = require('../config/helpers');
const { encrypt, decrypt } = require('../services/crypto.service');
const { Proveedor } = require('../models/proveedor.model');
const { Orden } = require('../models/orden.model');
const { audit } = require('./auth.controller');

// GET /api/proveedores
async function listarProveedores(req, res, next) {
  try {
    const rows = await Proveedor.find({ tenant_id: req.auth.tenantId })
      .sort({ nombre: 1 })
      .limit(100)
      .select('+ruc_cifrado +ruc_iv +ruc_tag')
      .lean();

    res.json(rows.map(x => {
      let ruc = '🔒 Encriptado';
      if (x.ruc_cifrado && x.ruc_iv && x.ruc_tag) {
        try {
          const bData = Buffer.isBuffer(x.ruc_cifrado) ? x.ruc_cifrado : Buffer.from(x.ruc_cifrado.buffer || x.ruc_cifrado);
          const bIv = Buffer.isBuffer(x.ruc_iv) ? x.ruc_iv : Buffer.from(x.ruc_iv.buffer || x.ruc_iv);
          const bTag = Buffer.isBuffer(x.ruc_tag) ? x.ruc_tag : Buffer.from(x.ruc_tag.buffer || x.ruc_tag);
          const decRuc = decrypt(bData, bIv, bTag);
          ruc = decRuc.slice(0, 4) + '****' + decRuc.slice(-3);
        } catch {
          ruc = '🔒 Encriptado';
        }
      }
      return {
        id: String(x._id),
        _id: String(x._id),
        codigo: x.codigo,
        nombre: x.nombre,
        ruc,
        contacto: x.contacto || '',
        email_contacto: x.contacto || '',
        activo: x.activo
      };
    }));
  } catch (e) { next(e); }
}

// GET /api/ordenes y /api/ordenes-compra
async function listarOrdenes(req, res, next) {
  try {
    const rows = await Orden.find({})
      .sort({ fecha: -1 })
      .limit(100)
      .select('numero fecha estado total proveedor_id')
      .lean();

    res.json(rows.map(x => ({
      id: String(x._id),
      _id: String(x._id),
      numero: x.numero,
      numero_orden: x.numero,
      fecha: x.fecha,
      estado: x.estado,
      total: Number(x.total?.toString() || 0),
      proveedor_id: String(x.proveedor_id)
    })));
  } catch (e) { next(e); }
}

// POST /api/proveedores
async function crearProveedor(req, res, next) {
  try {
    const d = req.data;
    const r = encrypt(d.ruc);
    const a = d.cuenta_bancaria ? encrypt(d.cuenta_bancaria) : null;
    const contact = safeText(d.contacto || d.email || '');
    const codigo = d.codigo || `PRV-${Date.now().toString().slice(-6)}`;

    const doc = await Proveedor.create({
      tenant_id: req.auth.tenantId,
      codigo,
      nombre: safeText(d.nombre),
      ruc_cifrado: r.data, ruc_iv: r.iv, ruc_tag: r.tag,
      ...(a ? { cuenta_cifrada: a.data, cuenta_iv: a.iv, cuenta_tag: a.tag } : {}),
      ...(contact ? { contacto: contact } : {}),
      activo: true
    });

    await audit(req, 'crear', 'proveedores', doc._id, 'exito');
    res.status(201).json({ id: String(doc._id), codigo: doc.codigo, nombre: doc.nombre });
  } catch (e) { next(e); }
}

// POST /api/ordenes-compra
async function crearOrden(req, res, next) {
  try {
    const d = req.data;
    const granja = id(d.granja_id);

    if (!req.auth.granjaIds.some(x => x.equals(granja))) {
      return res.status(403).json({ error: 'Granja fuera de alcance' });
    }

    const [provider, warehouse, products] = await Promise.all([
      Proveedor.exists({ _id: id(d.proveedor_id), tenant_id: req.auth.tenantId, activo: true }),
      mongoose.connection.db.collection('bodegas').findOne(
        { _id: id(d.bodega_id), tenant_id: req.auth.tenantId, granja_id: granja },
        { projection: { _id: 1 } }
      ),
      mongoose.connection.db.collection('insumos_productos').countDocuments({
        _id: { $in: d.lineas.map(x => id(x.producto_id)) },
        tenant_id: req.auth.tenantId,
        activo: true
      })
    ]);

    if (!provider || !warehouse || products !== new Set(d.lineas.map(x => x.producto_id)).size) {
      return res.status(400).json({ error: 'Referencias de compra inválidas' });
    }

    // Cálculo preciso del total con BigInt
    const milliCents = d.lineas.reduce(
      (sum, x) => sum + BigInt(Math.round(x.cantidad * 1000)) * BigInt(Math.round(x.precio_unitario * 100)),
      0n
    );
    const totalCents = (milliCents + 500n) / 1000n;
    const total = `${totalCents / 100n}.${String(totalCents % 100n).padStart(2, '0')}`;

    const doc = await Orden.create({
      tenant_id: req.auth.tenantId,
      granja_id: granja,
      proveedor_id: id(d.proveedor_id),
      bodega_id: id(d.bodega_id),
      numero: d.numero,
      fecha: new Date(),
      estado: 'borrador',
      total: dec(total),
      creado_por: req.auth.userId,
      lineas: d.lineas.map(x => ({
        producto_id: id(x.producto_id),
        cantidad: dec(x.cantidad),
        precio_unitario: dec(x.precio_unitario)
      }))
    });

    await audit(req, 'crear', 'ordenes_compra', doc._id, 'exito');
    res.status(201).json({ id: String(doc._id), numero: doc.numero, total });
  } catch (e) { next(e); }
}

module.exports = { listarProveedores, listarOrdenes, crearProveedor, crearOrden };
