'use strict';
/**
 * ══════════════════════════════════════════════════════════════════════════════
 * BY FEKAS CORP. — ERP CAMARONERA
 * SCRIPT DE POBLADO DE DATOS (SEEDER) Y DICCIONARIO DE DATOS COMENTADO
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Este archivo contiene 5 documentos estructurados y relacionados para cada una
 * de las 26 colecciones de la base de datos MongoDB Atlas ('by_fekas_corp_db').
 * 
 * ESTRUCTURA DE RELACIONES (MODELO ACUÍCOLA INTEGRAL):
 * 1. TENANT MULTI-EMPRESA:
 *    - Todas las entidades pertenecen al Tenant 'By Fekas Corp' (aislamiento lógico).
 * 
 * 2. FLUJO OPERATIVO ACUÍCOLA:
 *    - Granjas Camaroneras -> Piscinas / Estanques -> Ciclos de Cultivo
 *    - Siembras de Post-Larvas -> Parámetros Físico-Químicos del Agua
 *    - Planes de Alimentación -> Consumo Diario de Balanceado -> Muestreos Biométricos
 *    - Registro de Mortalidad -> Cosechas / Pescas -> Control de Calidad Organoléptico
 * 
 * 3. FLUJO DE CADENA DE SUMINISTRO Y LOGÍSTICA:
 *    - Proveedores (RUC cifrado AES-256-GCM) -> Catálogo de Insumos/Productos
 *    - Órdenes de Compra -> Bodegas de Granja -> Lotes de Inventario
 *    - Movimientos de Kardex (Entradas por compra, Salidas a piscinas, Ajustes)
 * 
 * 4. FLUJO COMERCIAL Y FINANCIERO:
 *    - Clientes Empacadoras (RUC cifrado) -> Facturas de Venta de Camarón
 *    - Cuentas por Pagar (a Proveedores) y Cuentas por Cobrar (a Empacadoras)
 *    - Nómina de Personal de Campo (Roles de pago con cuentas cifradas)
 * 
 * 5. SEGURIDAD, RBAC Y AUDITORÍA:
 *    - Permisos Granulares -> Roles Profesionales (Biólogo, Operador, Bodeguero, etc.)
 *    - Usuarios (Argon2id + Cédulas Cifradas) -> Sesiones JWT Activas
 *    - Logs de Auditoría Inmutables con Hashing de Direcciones IP
 * ══════════════════════════════════════════════════════════════════════════════
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const argon2 = require('argon2');
const { createHash } = require('node:crypto');
const { connectDB } = require('../src/config/db');
const { encrypt } = require('../src/services/crypto.service');

// Tipos BSON exactos requeridos por los validadores estrictos $jsonSchema
const ObjectId = (idStr) => idStr ? new mongoose.Types.ObjectId(idStr) : new mongoose.Types.ObjectId();
const Decimal = (val) => mongoose.Types.Decimal128.fromString(String(val));
const Int = (val) => new mongoose.mongo.BSON.Int32(Math.round(Number(val)));
const SHA256 = (str) => createHash('sha256').update(str).digest('hex');

// Fechas estándar consistentes para la simulación histórica del cultivo
const FECHA_BASE = new Date('2026-08-01T08:00:00.000Z');
const FECHA_NOW = new Date('2026-10-28T12:00:00.000Z');

async function seedDatabase() {
  console.log('🦐 Iniciando poblado integral de datos para ERP Camaronera...\n');
  await connectDB();
  const db = mongoose.connection.db;

  // ──────────────────────────────────────────────────────────────────────────
  // 0. IDENTIFICADORES MAESTROS PRE-ASIGNADOS PARA MANTENER LA INTEGRIDAD
  // ──────────────────────────────────────────────────────────────────────────
  // Obtenemos el tenant y usuario administrador creados durante el bootstrap inicial
  const existingUser = await db.collection('usuarios').findOne({ email: 'admin@fekascorp.com' });
  const existingRole = await db.collection('roles').findOne({ codigo: 'administrador' });

  const TENANT_ID = existingUser ? existingUser.tenant_id : ObjectId('6adf7a45b4b88592783c081c');
  const ADMIN_USER_ID = existingUser ? existingUser._id : ObjectId('6adf7a47b4b88592783c0827');
  const ADMIN_ROLE_ID = existingRole ? existingRole._id : ObjectId('6adf7a47b4b88592783c0826');

  // IDs para Granjas Camaroneras
  const G1 = ObjectId(); // Granja Santa Rosa
  const G2 = ObjectId(); // Granja Mar Azul (Archipiélago de Jambelí)
  const G3 = ObjectId(); // Granja El Salitral (Puerto Bolívar)
  const G4 = ObjectId(); // Granja Estero Hondo (Arenillas)
  const G5 = ObjectId(); // Granja San Carlos (Balao)

  // IDs para Piscinas / Estanques
  const P1 = ObjectId(); // Piscina P-01 (en G1)
  const P2 = ObjectId(); // Piscina P-02 (en G1)
  const P3 = ObjectId(); // Piscina P-03 (en G2)
  const P4 = ObjectId(); // Piscina P-04 (en G3)
  const P5 = ObjectId(); // Piscina P-05 (en G4)

  // IDs para Ciclos de Cultivo
  const C1 = ObjectId(); // Ciclo Activo en P-01
  const C2 = ObjectId(); // Ciclo Activo en P-02
  const C3 = ObjectId(); // Ciclo Cerrado con Cosecha en P-03
  const C4 = ObjectId(); // Ciclo Cerrado con Cosecha en P-04
  const C5 = ObjectId(); // Ciclo Planificado en P-05

  // IDs para Proveedores
  const PRV1 = ObjectId(); // Laboratorio de Larvas
  const PRV2 = ObjectId(); // Fábrica de Balanceados
  const PRV3 = ObjectId(); // Insumos Químicos y Tratamiento
  const PRV4 = ObjectId(); // Probióticos y Biorremediación
  const PRV5 = ObjectId(); // Cal y Carbonatos

  // IDs para Productos / Insumos
  const PROD1 = ObjectId(); // Balanceado Iniciador 35%
  const PROD2 = ObjectId(); // Balanceado Engorde 28%
  const PROD3 = ObjectId(); // Probiótico Concentrado
  const PROD4 = ObjectId(); // Carbonato de Calcio Micronizado
  const PROD5 = ObjectId(); // Fertilizante de Fondo Nitrato

  // IDs para Bodegas
  const BOD1 = ObjectId(); // Bodega Central Santa Rosa
  const BOD2 = ObjectId(); // Bodega Insumos Químicos Santa Rosa
  const BOD3 = ObjectId(); // Bodega Isla Jambelí (Mar Azul)
  const BOD4 = ObjectId(); // Bodega Puerto Bolívar
  const BOD5 = ObjectId(); // Bodega Arenillas

  // IDs para Lotes de Inventario
  const LOT1 = ObjectId(); // Lote Balanceado Iniciador
  const LOT2 = ObjectId(); // Lote Balanceado Engorde
  const LOT3 = ObjectId(); // Lote Probiótico AquaBac
  const LOT4 = ObjectId(); // Lote Carbonato de Calcio
  const LOT5 = ObjectId(); // Lote Fertilizante Fondo

  // IDs para Órdenes de Compra
  const ORD1 = ObjectId(); // OC Recibida Lote 1
  const ORD2 = ObjectId(); // OC Recibida Lote 2
  const ORD3 = ObjectId(); // OC Aprobada Lote 3
  const ORD4 = ObjectId(); // OC Borrador Lote 4
  const ORD5 = ObjectId(); // OC Cancelada Lote 5

  // IDs para Planes de Alimentación
  const PLAN1 = ObjectId(); // Plan Iniciador C1
  const PLAN2 = ObjectId(); // Plan Engorde C1
  const PLAN3 = ObjectId(); // Plan Engorde C2
  const PLAN4 = ObjectId(); // Plan Engorde C3
  const PLAN5 = ObjectId(); // Plan Preliminar C5

  // IDs para Cosechas
  const COS1 = ObjectId(); // Cosecha Ejecutada C3
  const COS2 = ObjectId(); // Cosecha Ejecutada C4
  const COS3 = ObjectId(); // Cosecha Programada C1
  const COS4 = ObjectId(); // Cosecha Programada C2
  const COS5 = ObjectId(); // Cosecha Anulada C5

  // IDs para Clientes Empacadoras
  const CLI1 = ObjectId(); // Santa Priscila
  const CLI2 = ObjectId(); // Omarsa
  const CLI3 = ObjectId(); // Songa
  const CLI4 = ObjectId(); // Promarisco
  const CLI5 = ObjectId(); // Expalsa

  // IDs para Facturas de Venta
  const FAC1 = ObjectId(); // Factura Cosecha 1
  const FAC2 = ObjectId(); // Factura Cosecha 2
  const FAC3 = ObjectId(); // Factura Cosecha 3
  const FAC4 = ObjectId(); // Factura Cosecha 4
  const FAC5 = ObjectId(); // Factura Anulada

  // IDs para Usuarios del Sistema
  const U_BIOLOGO = ObjectId();
  const U_OPERADOR = ObjectId();
  const U_BODEGUERO = ObjectId();
  const U_CALIDAD = ObjectId();
  const U_CONTADOR = ObjectId();

  // IDs para Roles del Sistema
  const ROL_BIOLOGO = ObjectId();
  const ROL_OPERADOR = ObjectId();
  const ROL_BODEGUERO = ObjectId();
  const ROL_CALIDAD = ObjectId();
  const ROL_CONTADOR = ObjectId();

  // IDs para Nuevos Permisos del Sistema
  const PERM_GRANJAS_LEER = ObjectId();
  const PERM_COSECHAS_CREAR = ObjectId();
  const PERM_COSECHAS_APROBAR = ObjectId();
  const PERM_CALIDAD_CREAR = ObjectId();
  const PERM_NOMINA_APROBAR = ObjectId();

  // Contraseña encriptada con Argon2id para los nuevos usuarios
  const passwordHash = await argon2.hash('CamaronSeguro2026!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. COLECCIÓN: granjas_camaroneras (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Representa los centros productivos de camaroneras ubicados en zonas
  // estratégicas del litoral ecuatoriano (El Oro y Guayas).
  const granjas = [
    {
      _id: G1,
      tenant_id: TENANT_ID,
      codigo: 'GRA-SR-01',
      nombre: 'Granja Camaronera Santa Rosa',
      ubicacion: 'Sector El Retiro, Cantón Santa Rosa, Provincia de El Oro',
      superficie_ha: Decimal('120.50'), // Superficie total de la concesión acuícola
      activa: true,
      responsable_id: ADMIN_USER_ID,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: G2,
      tenant_id: TENANT_ID,
      codigo: 'GRA-MA-02',
      nombre: 'Granja Isla Mar Azul',
      ubicacion: 'Archipiélago de Jambelí, Isla Pongal, El Oro',
      superficie_ha: Decimal('85.00'),
      activa: true,
      responsable_id: U_BIOLOGO,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: G3,
      tenant_id: TENANT_ID,
      codigo: 'GRA-ES-03',
      nombre: 'Granja El Salitral de Machala',
      ubicacion: 'Vía a Balneario El Faro, Puerto Bolívar, Machala',
      superficie_ha: Decimal('150.00'),
      activa: true,
      responsable_id: ADMIN_USER_ID,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: G4,
      tenant_id: TENANT_ID,
      codigo: 'GRA-EH-04',
      nombre: 'Granja Estero Hondo',
      ubicacion: 'Sector La Pitahaya, Cantón Arenillas, El Oro',
      superficie_ha: Decimal('95.25'),
      activa: true,
      responsable_id: U_BIOLOGO,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: G5,
      tenant_id: TENANT_ID,
      codigo: 'GRA-SC-05',
      nombre: 'Granja San Carlos del Golfo',
      ubicacion: 'Sector Puerto Balao, Provincia del Guayas',
      superficie_ha: Decimal('110.75'),
      activa: true,
      responsable_id: ADMIN_USER_ID,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 2. COLECCIÓN: piscinas_estanques (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Estanques de cultivo con sus dimensiones físicas, profundidad hidráulica
  // y volumen en m3 para cálculo preciso de biomasa y dosificación de tratamientos.
  const piscinas = [
    {
      _id: P1,
      tenant_id: TENANT_ID,
      granja_id: G1,
      codigo: 'PSC-G1-01',
      area_ha: Decimal('4.50'),
      profundidad_m: Decimal('1.40'),
      estado: 'activa', // Piscina con ciclo activo de engorde
      capacidad_m3: Decimal('63000.00'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: P2,
      tenant_id: TENANT_ID,
      granja_id: G1,
      codigo: 'PSC-G1-02',
      area_ha: Decimal('5.20'),
      profundidad_m: Decimal('1.50'),
      estado: 'activa', // Piscina con cultivo activo en desarrollo
      capacidad_m3: Decimal('78000.00'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: P3,
      tenant_id: TENANT_ID,
      granja_id: G2,
      codigo: 'PSC-G2-01',
      area_ha: Decimal('6.00'),
      profundidad_m: Decimal('1.45'),
      estado: 'activa', // Piscina cosechada recientemente
      capacidad_m3: Decimal('87000.00'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: P4,
      tenant_id: TENANT_ID,
      granja_id: G3,
      codigo: 'PSC-G3-01',
      area_ha: Decimal('4.80'),
      profundidad_m: Decimal('1.35'),
      estado: 'mantenimiento', // En secado al sol y desinfección con cal
      capacidad_m3: Decimal('64800.00'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: P5,
      tenant_id: TENANT_ID,
      granja_id: G4,
      codigo: 'PSC-G4-01',
      area_ha: Decimal('5.50'),
      profundidad_m: Decimal('1.50'),
      estado: 'inactiva', // Lista para llenado y siembra planificada
      capacidad_m3: Decimal('82500.00'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 3. COLECCIÓN: ciclos_cultivo (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Cada ciclo agrupa la vida productiva de una piscina desde la siembra hasta
  // la cosecha, manteniendo trazabilidad de biomasa estimada y especie criada.
  const ciclos = [
    {
      _id: C1,
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P1,
      codigo: 'CIC-2026-P01',
      fecha_inicio: new Date('2026-08-01T06:00:00.000Z'),
      estado: 'activo', // Cultivo en curso: día 88
      biomasa_estimada_kg: Decimal('6800.00'),
      especie: 'Litopenaeus vannamei', // Camarón blanco del Pacífico
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: C2,
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P2,
      codigo: 'CIC-2026-P02',
      fecha_inicio: new Date('2026-08-15T06:00:00.000Z'),
      estado: 'activo', // Cultivo en curso: día 74
      biomasa_estimada_kg: Decimal('7950.00'),
      especie: 'Litopenaeus vannamei',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: C3,
      tenant_id: TENANT_ID,
      granja_id: G2,
      piscina_id: P3,
      codigo: 'CIC-2026-P03',
      fecha_inicio: new Date('2026-07-10T06:00:00.000Z'),
      fecha_fin: new Date('2026-10-20T18:00:00.000Z'),
      estado: 'cerrado', // Cosecha completada exitosamente
      biomasa_estimada_kg: Decimal('9400.00'),
      especie: 'Litopenaeus vannamei',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: C4,
      tenant_id: TENANT_ID,
      granja_id: G3,
      piscina_id: P4,
      codigo: 'CIC-2026-P04',
      fecha_inicio: new Date('2026-06-01T06:00:00.000Z'),
      fecha_fin: new Date('2026-09-25T18:00:00.000Z'),
      estado: 'cerrado', // Ciclo completado y cerrado
      biomasa_estimada_kg: Decimal('8100.00'),
      especie: 'Litopenaeus vannamei',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: C5,
      tenant_id: TENANT_ID,
      granja_id: G4,
      piscina_id: P5,
      codigo: 'CIC-2026-P05',
      fecha_inicio: new Date('2026-11-05T06:00:00.000Z'),
      estado: 'planificado', // Siembra programada para el próximo aguaje
      biomasa_estimada_kg: Decimal('0.00'),
      especie: 'Litopenaeus vannamei',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 4. COLECCIÓN: proveedores (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Proveedores estratégicos de larvas, alimentos balanceados e insumos biológicos.
  // Cumplen con cifrado obligatorio AES-256-GCM para RUC y números de cuenta bancaria.
  const ruc1 = encrypt('0992345678001');
  const cta1 = encrypt('2100456789');
  const ruc2 = encrypt('0791789456001');
  const cta2 = encrypt('3200876543');
  const ruc3 = encrypt('1792123456001');
  const cta3 = encrypt('4500987612');
  const ruc4 = encrypt('0993876543001');
  const cta4 = encrypt('1800654321');
  const ruc5 = encrypt('0790456123001');
  const cta5 = encrypt('5600123478');

  const proveedores = [
    {
      _id: PRV1,
      tenant_id: TENANT_ID,
      codigo: 'PRV-LARV-01',
      nombre: 'Laboratorio de Larvas del Pacífico S.A. (Larvimar)',
      ruc_cifrado: ruc1.data,
      ruc_iv: ruc1.iv,
      ruc_tag: ruc1.tag,
      cuenta_cifrada: cta1.data,
      cuenta_iv: cta1.iv,
      cuenta_tag: cta1.tag,
      contacto: 'Ing. Roberto Solís - 0991234567 - ventas@larvimar.ec',
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PRV2,
      tenant_id: TENANT_ID,
      codigo: 'PRV-BAL-02',
      nombre: 'Balcamaron Alimentos Balanceados Cía. Ltda.',
      ruc_cifrado: ruc2.data,
      ruc_iv: ruc2.iv,
      ruc_tag: ruc2.tag,
      cuenta_cifrada: cta2.data,
      cuenta_iv: cta2.iv,
      cuenta_tag: cta2.tag,
      contacto: 'Lcda. Andrea Mendoza - 0987654321 - pedidos@balcamaron.com',
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PRV3,
      tenant_id: TENANT_ID,
      codigo: 'PRV-QUIM-03',
      nombre: 'AquaTech Soluciones Químicas & Equipos Acuícolas',
      ruc_cifrado: ruc3.data,
      ruc_iv: ruc3.iv,
      ruc_tag: ruc3.tag,
      cuenta_cifrada: cta3.data,
      cuenta_iv: cta3.iv,
      cuenta_tag: cta3.tag,
      contacto: 'Dr. Carlos Viteri - 0976543210 - soporte@aquatech.ec',
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PRV4,
      tenant_id: TENANT_ID,
      codigo: 'PRV-PROB-04',
      nombre: 'Probióticos Marinos BioAqua Ecuador S.A.',
      ruc_cifrado: ruc4.data,
      ruc_iv: ruc4.iv,
      ruc_tag: ruc4.tag,
      cuenta_cifrada: cta4.data,
      cuenta_iv: cta4.iv,
      cuenta_tag: cta4.tag,
      contacto: 'MSc. Elena Morales - 0965432109 - contacto@bioaqua.ec',
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PRV5,
      tenant_id: TENANT_ID,
      codigo: 'PRV-MIN-05',
      nombre: 'Distribuidora de Minerales & Cal Agrícola El Oro',
      ruc_cifrado: ruc5.data,
      ruc_iv: ruc5.iv,
      ruc_tag: ruc5.tag,
      cuenta_cifrada: cta5.data,
      cuenta_iv: cta5.iv,
      cuenta_tag: cta5.tag,
      contacto: 'Sr. Jaime Paredes - 0954321098 - ventas@caleloro.ec',
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 5. COLECCIÓN: siembras_larvas (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Registro técnico de siembra: cantidad de post-larvas (PL-10 a PL-12),
  // densidad por metro cuadrado, lote genético y supervivencia esperada.
  const siembras = [
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      ciclo_id: C1,
      proveedor_id: PRV1,
      fecha: new Date('2026-08-01T07:30:00.000Z'),
      cantidad: Int(450000), // 450,000 post-larvas sembradas en 4.5 ha
      densidad_m2: Decimal('10.00'), // 10 camarones por m2 (semi-intensivo)
      lote_larvas: 'LOT-PL12-LARV-2026-081',
      supervivencia_estimada_pct: Decimal('75.50'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      ciclo_id: C2,
      proveedor_id: PRV1,
      fecha: new Date('2026-08-15T07:00:00.000Z'),
      cantidad: Int(520000), // 520,000 post-larvas en 5.2 ha
      densidad_m2: Decimal('10.00'),
      lote_larvas: 'LOT-PL12-LARV-2026-088',
      supervivencia_estimada_pct: Decimal('78.00'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G2,
      ciclo_id: C3,
      proveedor_id: PRV1,
      fecha: new Date('2026-07-10T06:30:00.000Z'),
      cantidad: Int(600000), // 600,000 post-larvas en 6.0 ha
      densidad_m2: Decimal('10.00'),
      lote_larvas: 'LOT-PL12-LARV-2026-072',
      supervivencia_estimada_pct: Decimal('80.00'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G3,
      ciclo_id: C4,
      proveedor_id: PRV1,
      fecha: new Date('2026-06-01T06:00:00.000Z'),
      cantidad: Int(480000), // 480,000 post-larvas en 4.8 ha
      densidad_m2: Decimal('10.00'),
      lote_larvas: 'LOT-PL12-LARV-2026-061',
      supervivencia_estimada_pct: Decimal('72.00'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G4,
      ciclo_id: C5,
      proveedor_id: PRV1,
      fecha: new Date('2026-11-05T07:00:00.000Z'),
      cantidad: Int(550000), // 550,000 post-larvas planificadas para piscina 5
      densidad_m2: Decimal('10.00'),
      lote_larvas: 'LOT-PL12-LARV-2026-115',
      supervivencia_estimada_pct: Decimal('82.00'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 6. COLECCIÓN: insumos_productos (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Catálogo estandarizado de balanceados, probióticos, fertilizantes y correctores.
  const insumos = [
    {
      _id: PROD1,
      tenant_id: TENANT_ID,
      sku: 'BAL-INIC-35P',
      nombre: 'Balanceado Extruido Iniciador 35% Proteína (Pellet 1.2mm)',
      categoria: 'balanceado',
      unidad: 'kg',
      stock_minimo: Decimal('1000.00'),
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PROD2,
      tenant_id: TENANT_ID,
      sku: 'BAL-ENG-28P',
      nombre: 'Balanceado de Engorde Comercial 28% Proteína (Pellet 2.0mm)',
      categoria: 'balanceado',
      unidad: 'kg',
      stock_minimo: Decimal('2500.00'),
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PROD3,
      tenant_id: TENANT_ID,
      sku: 'BIO-AQUABAC-01',
      nombre: 'Probiótico Biológico Líquido AquaBac Pro (Biorremediador)',
      categoria: 'probiotico',
      unidad: 'l',
      stock_minimo: Decimal('100.00'),
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PROD4,
      tenant_id: TENANT_ID,
      sku: 'QUIM-CAL-CARB',
      nombre: 'Carbonato de Calcio Agrícola Micronizado para Regulación de pH',
      categoria: 'quimico',
      unidad: 'kg',
      stock_minimo: Decimal('2000.00'),
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PROD5,
      tenant_id: TENANT_ID,
      sku: 'FERT-NITR-SOD',
      nombre: 'Nitrato de Sodio Técnico para Fertilización y Bloom de Algas',
      categoria: 'fertilizante',
      unidad: 'kg',
      stock_minimo: Decimal('500.00'),
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 7. COLECCIÓN: bodegas (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Almacenes físicos de cada granja dedicados al control y resguardo de alimentos,
  // reactivos químicos y herramientas de campo.
  const bodegas = [
    {
      _id: BOD1,
      tenant_id: TENANT_ID,
      granja_id: G1,
      codigo: 'BOD-SR-ALIM',
      nombre: 'Bodega Principal de Alimentos Santa Rosa',
      ubicacion: 'Campamento Central, Bodega Climatizada A',
      responsable_id: U_BODEGUERO,
      activa: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: BOD2,
      tenant_id: TENANT_ID,
      granja_id: G1,
      codigo: 'BOD-SR-QUIM',
      nombre: 'Bodega de Químicos & Probióticos Santa Rosa',
      ubicacion: 'Sector Muelle 1, Bodega de Sustancias Controladas',
      responsable_id: U_BODEGUERO,
      activa: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: BOD3,
      tenant_id: TENANT_ID,
      granja_id: G2,
      codigo: 'BOD-MA-ISLA',
      nombre: 'Bodega Insular Mar Azul',
      ubicacion: 'Isla Jambelí, Puelle Principal Granja 2',
      responsable_id: U_OPERADOR,
      activa: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: BOD4,
      tenant_id: TENANT_ID,
      granja_id: G3,
      codigo: 'BOD-ES-CENT',
      nombre: 'Bodega El Salitral',
      ubicacion: 'Puerto Bolívar, Almacén General de Insumos',
      responsable_id: ADMIN_USER_ID,
      activa: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: BOD5,
      tenant_id: TENANT_ID,
      granja_id: G4,
      codigo: 'BOD-EH-CAMP',
      nombre: 'Bodega Estero Hondo',
      ubicacion: 'Arenillas Km 12, Módulo Operativo',
      responsable_id: U_OPERADOR,
      activa: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 8. COLECCIÓN: ordenes_compra (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Órdenes de abastecimiento emitidas a proveedores para reabastecer bodegas.
  const ordenes = [
    {
      _id: ORD1,
      tenant_id: TENANT_ID,
      granja_id: G1,
      proveedor_id: PRV2,
      bodega_id: BOD1,
      numero: 'OC-2026-0001',
      fecha: new Date('2026-07-20T10:00:00.000Z'),
      estado: 'recibida',
      total: Decimal('3250.00'),
      creado_por: ADMIN_USER_ID,
      aprobado_por: ADMIN_USER_ID,
      lineas: [
        {
          producto_id: PROD1,
          cantidad: Decimal('2500.00'),
          precio_unitario: Decimal('1.30')
        }
      ],
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ORD2,
      tenant_id: TENANT_ID,
      granja_id: G1,
      proveedor_id: PRV2,
      bodega_id: BOD1,
      numero: 'OC-2026-0002',
      fecha: new Date('2026-08-10T10:30:00.000Z'),
      estado: 'recibida',
      total: Decimal('4200.00'),
      creado_por: U_BODEGUERO,
      aprobado_por: ADMIN_USER_ID,
      lineas: [
        {
          producto_id: PROD2,
          cantidad: Decimal('3500.00'),
          precio_unitario: Decimal('1.20')
        }
      ],
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ORD3,
      tenant_id: TENANT_ID,
      granja_id: G2,
      proveedor_id: PRV4,
      bodega_id: BOD3,
      numero: 'OC-2026-0003',
      fecha: new Date('2026-08-15T11:00:00.000Z'),
      estado: 'aprobada',
      total: Decimal('1750.00'),
      creado_por: U_BIOLOGO,
      aprobado_por: ADMIN_USER_ID,
      lineas: [
        {
          producto_id: PROD3,
          cantidad: Decimal('50.00'),
          precio_unitario: Decimal('35.00')
        }
      ],
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ORD4,
      tenant_id: TENANT_ID,
      granja_id: G3,
      proveedor_id: PRV5,
      bodega_id: BOD4,
      numero: 'OC-2026-0004',
      fecha: new Date('2026-09-01T09:15:00.000Z'),
      estado: 'borrador',
      total: Decimal('900.00'),
      creado_por: U_BODEGUERO,
      aprobado_por: ADMIN_USER_ID,
      lineas: [
        {
          producto_id: PROD4,
          cantidad: Decimal('3000.00'),
          precio_unitario: Decimal('0.30')
        }
      ],
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ORD5,
      tenant_id: TENANT_ID,
      granja_id: G4,
      proveedor_id: PRV3,
      bodega_id: BOD5,
      numero: 'OC-2026-0005',
      fecha: new Date('2026-09-15T14:00:00.000Z'),
      estado: 'cancelada',
      total: Decimal('1200.00'),
      creado_por: U_BODEGUERO,
      aprobado_por: ADMIN_USER_ID,
      lineas: [
        {
          producto_id: PROD5,
          cantidad: Decimal('1000.00'),
          precio_unitario: Decimal('1.20')
        }
      ],
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 9. COLECCIÓN: lotes_inventario (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Seguimiento de inventario por lote de fabricación, fecha de caducidad
  // y costo promedio unitario para valoración FIFO.
  const lotes = [
    {
      _id: LOT1,
      tenant_id: TENANT_ID,
      granja_id: G1,
      bodega_id: BOD1,
      producto_id: PROD1,
      proveedor_id: PRV2,
      codigo_lote: 'LOT-BAL-35P-2026-01',
      fecha_ingreso: new Date('2026-07-25T08:00:00.000Z'),
      vence_at: new Date('2027-01-25T23:59:59.000Z'),
      cantidad_inicial: Decimal('2500.00'),
      cantidad_actual: Decimal('1850.00'),
      costo_unitario: Decimal('1.30'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: LOT2,
      tenant_id: TENANT_ID,
      granja_id: G1,
      bodega_id: BOD1,
      producto_id: PROD2,
      proveedor_id: PRV2,
      codigo_lote: 'LOT-BAL-28P-2026-02',
      fecha_ingreso: new Date('2026-08-12T08:00:00.000Z'),
      vence_at: new Date('2027-02-12T23:59:59.000Z'),
      cantidad_inicial: Decimal('3500.00'),
      cantidad_actual: Decimal('2900.00'),
      costo_unitario: Decimal('1.20'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: LOT3,
      tenant_id: TENANT_ID,
      granja_id: G2,
      bodega_id: BOD3,
      producto_id: PROD3,
      proveedor_id: PRV4,
      codigo_lote: 'LOT-BIO-AQUA-2026-03',
      fecha_ingreso: new Date('2026-08-20T09:00:00.000Z'),
      vence_at: new Date('2027-08-20T23:59:59.000Z'),
      cantidad_inicial: Decimal('50.00'),
      cantidad_actual: Decimal('42.00'),
      costo_unitario: Decimal('35.00'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: LOT4,
      tenant_id: TENANT_ID,
      granja_id: G3,
      bodega_id: BOD4,
      producto_id: PROD4,
      proveedor_id: PRV5,
      codigo_lote: 'LOT-CAL-AGR-2026-04',
      fecha_ingreso: new Date('2026-09-05T10:00:00.000Z'),
      vence_at: new Date('2028-09-05T23:59:59.000Z'),
      cantidad_inicial: Decimal('3000.00'),
      cantidad_actual: Decimal('2500.00'),
      costo_unitario: Decimal('0.30'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: LOT5,
      tenant_id: TENANT_ID,
      granja_id: G4,
      bodega_id: BOD5,
      producto_id: PROD5,
      proveedor_id: PRV3,
      codigo_lote: 'LOT-FERT-NIT-2026-05',
      fecha_ingreso: new Date('2026-09-20T11:00:00.000Z'),
      vence_at: new Date('2027-09-20T23:59:59.000Z'),
      cantidad_inicial: Decimal('1000.00'),
      cantidad_actual: Decimal('900.00'),
      costo_unitario: Decimal('1.20'),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 10. COLECCIÓN: movimientos_kardex (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Histórico transaccional de movimientos en bodega: entradas, salidas
  // por alimentación a piscinas y ajustes auditables con saldo posterior.
  const kardex = [
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      bodega_id: BOD1,
      lote_id: LOT1,
      usuario_id: U_BODEGUERO,
      fecha: new Date('2026-07-25T08:30:00.000Z'),
      tipo: 'entrada',
      cantidad: Decimal('2500.00'),
      saldo_posterior: Decimal('2500.00'),
      referencia: 'KDX-ING-001',
      motivo: 'Recepción inicial por compra según orden OC-2026-0001',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      bodega_id: BOD1,
      lote_id: LOT1,
      usuario_id: U_OPERADOR,
      fecha: new Date('2026-08-10T16:00:00.000Z'),
      tipo: 'salida',
      cantidad: Decimal('650.00'),
      saldo_posterior: Decimal('1850.00'),
      referencia: 'KDX-SAL-001',
      motivo: 'Despacho de balanceado iniciador a Piscina P-01 (Semana 1-2)',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      bodega_id: BOD1,
      lote_id: LOT2,
      usuario_id: U_BODEGUERO,
      fecha: new Date('2026-08-12T09:00:00.000Z'),
      tipo: 'entrada',
      cantidad: Decimal('3500.00'),
      saldo_posterior: Decimal('3500.00'),
      referencia: 'KDX-ING-002',
      motivo: 'Recepción de balanceado de engorde según orden OC-2026-0002',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      bodega_id: BOD1,
      lote_id: LOT2,
      usuario_id: U_OPERADOR,
      fecha: new Date('2026-09-01T15:30:00.000Z'),
      tipo: 'salida',
      cantidad: Decimal('600.00'),
      saldo_posterior: Decimal('2900.00'),
      referencia: 'KDX-SAL-002',
      motivo: 'Despacho de alimento de engorde a Piscina P-02',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G2,
      bodega_id: BOD3,
      lote_id: LOT3,
      usuario_id: U_BIOLOGO,
      fecha: new Date('2026-08-25T11:00:00.000Z'),
      tipo: 'ajuste',
      cantidad: Decimal('8.00'),
      saldo_posterior: Decimal('42.00'),
      referencia: 'KDX-AJU-001',
      motivo: 'Dosificación emergente de probióticos en estanque P-03 por materia orgánica',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 11. COLECCIÓN: planes_alimentacion (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Tabla de alimentación recomendada por el biólogo según la curva de crecimiento,
  // peso proyectado y biomasa estimada.
  const planes = [
    {
      _id: PLAN1,
      tenant_id: TENANT_ID,
      granja_id: G1,
      ciclo_id: C1,
      producto_id: PROD1,
      fecha_inicio: new Date('2026-08-01T06:00:00.000Z'),
      fecha_fin: new Date('2026-09-15T18:00:00.000Z'),
      racion_diaria_kg: Decimal('45.00'),
      frecuencia_diaria: Int(4), // 4 comidas al día en comederos y bandejas
      aprobado_por: U_BIOLOGO,
      estado: 'cerrado',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PLAN2,
      tenant_id: TENANT_ID,
      granja_id: G1,
      ciclo_id: C1,
      producto_id: PROD2,
      fecha_inicio: new Date('2026-09-16T06:00:00.000Z'),
      fecha_fin: new Date('2026-11-15T18:00:00.000Z'),
      racion_diaria_kg: Decimal('85.00'),
      frecuencia_diaria: Int(3),
      aprobado_por: U_BIOLOGO,
      estado: 'aprobado',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PLAN3,
      tenant_id: TENANT_ID,
      granja_id: G1,
      ciclo_id: C2,
      producto_id: PROD2,
      fecha_inicio: new Date('2026-09-01T06:00:00.000Z'),
      fecha_fin: new Date('2026-11-30T18:00:00.000Z'),
      racion_diaria_kg: Decimal('95.00'),
      frecuencia_diaria: Int(3),
      aprobado_por: U_BIOLOGO,
      estado: 'aprobado',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PLAN4,
      tenant_id: TENANT_ID,
      granja_id: G2,
      ciclo_id: C3,
      producto_id: PROD2,
      fecha_inicio: new Date('2026-08-01T06:00:00.000Z'),
      fecha_fin: new Date('2026-10-15T18:00:00.000Z'),
      racion_diaria_kg: Decimal('110.00'),
      frecuencia_diaria: Int(4),
      aprobado_por: U_BIOLOGO,
      estado: 'cerrado',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PLAN5,
      tenant_id: TENANT_ID,
      granja_id: G4,
      ciclo_id: C5,
      producto_id: PROD1,
      fecha_inicio: new Date('2026-11-05T06:00:00.000Z'),
      fecha_fin: new Date('2026-12-15T18:00:00.000Z'),
      racion_diaria_kg: Decimal('50.00'),
      frecuencia_diaria: Int(4),
      aprobado_por: U_BIOLOGO,
      estado: 'borrador',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 12. COLECCIÓN: consumo_alimento_diario (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Consumos ejecutados en campo con cálculo del Factor de Conversión Alimenticia (FCA)
  // y actualización de biomasa estimada.
  const consumos = [
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P1,
      ciclo_id: C1,
      plan_id: PLAN2,
      lote_id: LOT2,
      usuario_id: U_OPERADOR,
      fecha: new Date('2026-10-24T10:00:00.000Z'),
      cantidad_kg: Decimal('85.50'),
      fca: Decimal('1.25'), // FCA óptimo menor a 1.30 en camarón ecuatoriano
      biomasa_kg: Decimal('6750.00'),
      observacion: 'Consumo al 100% en platos testigos, agua con buen color verde esmeralda',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P1,
      ciclo_id: C1,
      plan_id: PLAN2,
      lote_id: LOT2,
      usuario_id: U_OPERADOR,
      fecha: new Date('2026-10-25T10:00:00.000Z'),
      cantidad_kg: Decimal('86.00'),
      fca: Decimal('1.26'),
      biomasa_kg: Decimal('6800.00'),
      observacion: 'Camarón voraz con tracto digestivo completamente lleno',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P2,
      ciclo_id: C2,
      plan_id: PLAN3,
      lote_id: LOT2,
      usuario_id: U_OPERADOR,
      fecha: new Date('2026-10-25T10:30:00.000Z'),
      cantidad_kg: Decimal('94.50'),
      fca: Decimal('1.28'),
      biomasa_kg: Decimal('7900.00'),
      observacion: 'Alimentación matutina y vespertina sin desperdicio',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P2,
      ciclo_id: C2,
      plan_id: PLAN3,
      lote_id: LOT2,
      usuario_id: U_OPERADOR,
      fecha: new Date('2026-10-26T10:30:00.000Z'),
      cantidad_kg: Decimal('95.00'),
      fca: Decimal('1.28'),
      biomasa_kg: Decimal('7950.00'),
      observacion: 'Distribución homogénea con tolva y soplador en todo el estanque',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G2,
      piscina_id: P3,
      ciclo_id: C3,
      plan_id: PLAN4,
      lote_id: LOT1,
      usuario_id: U_OPERADOR,
      fecha: new Date('2026-10-18T10:00:00.000Z'),
      cantidad_kg: Decimal('108.00'),
      fca: Decimal('1.32'),
      biomasa_kg: Decimal('9350.00'),
      observacion: 'Última ración previa a la suspensión de alimento por precosecha',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 13. COLECCIÓN: parametros_agua (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Mediciones de sonda multiparamétrica en estanques (oxígeno disuelto,
  // salinidad, pH, temperatura y amonio tóxico) con disparo de alerta temprana.
  const parametrosAgua = [
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P1,
      ciclo_id: C1,
      usuario_id: U_BIOLOGO,
      fecha: new Date('2026-10-26T06:00:00.000Z'),
      oxigeno_mg_l: Decimal('5.80'), // Oxígeno óptimo al amanecer
      salinidad_ppt: Decimal('22.50'),
      ph: Decimal('7.85'),
      temperatura_c: Decimal('28.50'),
      amonio_mg_l: Decimal('0.05'),
      alerta: false,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P1,
      ciclo_id: C1,
      usuario_id: U_BIOLOGO,
      fecha: new Date('2026-10-27T06:00:00.000Z'),
      oxigeno_mg_l: Decimal('5.60'),
      salinidad_ppt: Decimal('23.00'),
      ph: Decimal('7.90'),
      temperatura_c: Decimal('28.80'),
      amonio_mg_l: Decimal('0.06'),
      alerta: false,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P2,
      ciclo_id: C2,
      usuario_id: U_BIOLOGO,
      fecha: new Date('2026-10-27T05:30:00.000Z'),
      oxigeno_mg_l: Decimal('4.10'), // Oxígeno bajo crítico (< 4.2 mg/l)
      salinidad_ppt: Decimal('21.00'),
      ph: Decimal('7.60'),
      temperatura_c: Decimal('29.20'),
      amonio_mg_l: Decimal('0.18'), // Amonio elevado
      alerta: true, // ALERTA ACTIVA: requirió encendido de 4 aireadores
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G2,
      piscina_id: P3,
      ciclo_id: C3,
      usuario_id: U_BIOLOGO,
      fecha: new Date('2026-10-19T06:15:00.000Z'),
      oxigeno_mg_l: Decimal('6.10'),
      salinidad_ppt: Decimal('25.00'),
      ph: Decimal('8.10'),
      temperatura_c: Decimal('27.90'),
      amonio_mg_l: Decimal('0.02'),
      alerta: false,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G3,
      piscina_id: P4,
      ciclo_id: C4,
      usuario_id: U_BIOLOGO,
      fecha: new Date('2026-09-24T06:00:00.000Z'),
      oxigeno_mg_l: Decimal('5.40'),
      salinidad_ppt: Decimal('24.50'),
      ph: Decimal('7.75'),
      temperatura_c: Decimal('28.10'),
      amonio_mg_l: Decimal('0.04'),
      alerta: false,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 14. COLECCIÓN: muestreos_biometricos (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Muestreos con atarraya para pesaje con balanza de precisión, medición de talla
  // y proyección del crecimiento semanal del camarón (GPD = gramos por día).
  const muestreos = [
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P1,
      ciclo_id: C1,
      usuario_id: U_BIOLOGO,
      fecha: new Date('2026-09-15T08:00:00.000Z'),
      peso_promedio_g: Decimal('8.50'),
      talla_promedio_cm: Decimal('9.20'),
      muestra_individuos: Int(150),
      biomasa_estimada_kg: Decimal('3200.00'),
      observacion: 'Muestreo día 45 de cultivo - Crecimiento regular en rango esperado',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P1,
      ciclo_id: C1,
      usuario_id: U_BIOLOGO,
      fecha: new Date('2026-10-15T08:00:00.000Z'),
      peso_promedio_g: Decimal('15.80'),
      talla_promedio_cm: Decimal('13.10'),
      muestra_individuos: Int(180),
      biomasa_estimada_kg: Decimal('5800.00'),
      observacion: 'Muestreo día 75 de cultivo - Excelente incremento semanal de 1.8g/semana',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P1,
      ciclo_id: C1,
      usuario_id: U_BIOLOGO,
      fecha: new Date('2026-10-25T08:00:00.000Z'),
      peso_promedio_g: Decimal('18.20'),
      talla_promedio_cm: Decimal('14.30'),
      muestra_individuos: Int(200),
      biomasa_estimada_kg: Decimal('6800.00'),
      observacion: 'Muestreo pre-cosecha talla comercial 50/60 piezas por libra',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P2,
      ciclo_id: C2,
      usuario_id: U_BIOLOGO,
      fecha: new Date('2026-10-20T08:30:00.000Z'),
      peso_promedio_g: Decimal('16.50'),
      talla_promedio_cm: Decimal('13.50'),
      muestra_individuos: Int(175),
      biomasa_estimada_kg: Decimal('7950.00'),
      observacion: 'Muestreo día 66 de cultivo - Salud branquial y hepatopáncreas limpio',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G2,
      piscina_id: P3,
      ciclo_id: C3,
      usuario_id: U_BIOLOGO,
      fecha: new Date('2026-10-18T08:00:00.000Z'),
      peso_promedio_g: Decimal('22.40'),
      talla_promedio_cm: Decimal('15.80'),
      muestra_individuos: Int(220),
      biomasa_estimada_kg: Decimal('9400.00'),
      observacion: 'Muestreo final previo a pesca - Talla comercial premium 40/50',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 15. COLECCIÓN: registro_mortalidad (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Conteo de mermas y detección oportuna de eventos sanitarios en orillas y filtros.
  const mortalidad = [
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P1,
      ciclo_id: C1,
      usuario_id: U_OPERADOR,
      fecha: new Date('2026-08-05T09:00:00.000Z'),
      cantidad: Int(350),
      causa: 'Estrés post-siembra por transporte de larvas desde laboratorio',
      observacion: 'Mortalidad normal dentro de la curva de aclimatación de las primeras 96h',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P1,
      ciclo_id: C1,
      usuario_id: U_OPERADOR,
      fecha: new Date('2026-09-02T09:00:00.000Z'),
      cantidad: Int(120),
      causa: 'Muda masiva post-luna llena con ligero canibalismo',
      observacion: 'Se incrementó la ración de carbonato de calcio para acelerar endurecimiento',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P2,
      ciclo_id: C2,
      usuario_id: U_OPERADOR,
      fecha: new Date('2026-09-20T08:30:00.000Z'),
      cantidad: Int(210),
      causa: 'Descenso transitorio de oxígeno disuelto en madrugada nublada',
      observacion: 'Se arrancaron 2 aireadores diesel de respaldo en cabecera',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G2,
      piscina_id: P3,
      ciclo_id: C3,
      usuario_id: U_OPERADOR,
      fecha: new Date('2026-08-15T09:00:00.000Z'),
      cantidad: Int(95),
      causa: 'Depredación por avistamiento de aves acuáticas en bajamar',
      observacion: 'Se repararon mallas y líneas de espantapájaros perimetrales',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G3,
      piscina_id: P4,
      ciclo_id: C4,
      usuario_id: U_OPERADOR,
      fecha: new Date('2026-07-28T09:00:00.000Z'),
      cantidad: Int(180),
      causa: 'Estrés osmótico por lluvia torrencial con baja repentina de salinidad',
      observacion: 'Se realizó recambio de agua por compuerta de marea alta',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 16. COLECCIÓN: cosechas_pesca (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Pesca y extracción de camarón: pesaje con bines calibrados, hielo líquido
  // y metamisulfito de sodio para fijación de calidad.
  const cosechas = [
    {
      _id: COS1,
      tenant_id: TENANT_ID,
      granja_id: G2,
      piscina_id: P3,
      ciclo_id: C3,
      fecha: new Date('2026-10-20T22:00:00.000Z'),
      peso_bruto_kg: Decimal('9650.00'),
      peso_neto_kg: Decimal('9400.00'),
      cantidad_estimada: Int(420000),
      responsable_id: U_OPERADOR,
      estado: 'ejecutada',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: COS2,
      tenant_id: TENANT_ID,
      granja_id: G3,
      piscina_id: P4,
      ciclo_id: C4,
      fecha: new Date('2026-09-25T23:00:00.000Z'),
      peso_bruto_kg: Decimal('8350.00'),
      peso_neto_kg: Decimal('8100.00'),
      cantidad_estimada: Int(390000),
      responsable_id: U_OPERADOR,
      estado: 'ejecutada',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: COS3,
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P1,
      ciclo_id: C1,
      fecha: new Date('2026-11-10T22:00:00.000Z'),
      peso_bruto_kg: Decimal('7050.00'),
      peso_neto_kg: Decimal('6850.00'),
      cantidad_estimada: Int(375000),
      responsable_id: U_OPERADOR,
      estado: 'programada',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: COS4,
      tenant_id: TENANT_ID,
      granja_id: G1,
      piscina_id: P2,
      ciclo_id: C2,
      fecha: new Date('2026-11-20T22:30:00.000Z'),
      peso_bruto_kg: Decimal('8200.00'),
      peso_neto_kg: Decimal('8000.00'),
      cantidad_estimada: Int(410000),
      responsable_id: U_OPERADOR,
      estado: 'programada',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: COS5,
      tenant_id: TENANT_ID,
      granja_id: G4,
      piscina_id: P5,
      ciclo_id: C5,
      fecha: new Date('2026-12-15T21:00:00.000Z'),
      peso_bruto_kg: Decimal('0.00'),
      peso_neto_kg: Decimal('0.00'),
      cantidad_estimada: Int(0),
      responsable_id: U_OPERADOR,
      estado: 'anulada',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 17. COLECCIÓN: control_calidad_cosecha (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Análisis de inocuidad y laboratorio post-cosecha: concentración de metabisulfito
  // (PPM residual < 100 ppm permitido), textura muscular y ausencia de manchas.
  const controlCalidad = [
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G2,
      cosecha_id: COS1,
      analista_id: U_CALIDAD,
      fecha: new Date('2026-10-21T01:30:00.000Z'),
      gramaje_g: Decimal('22.38'),
      metabisulfito_ppm: Decimal('45.50'),
      textura: 'firme',
      aprobado: true,
      observacion: 'Excelente calidad organoléptica, apto para exportación a la Unión Europea',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G3,
      cosecha_id: COS2,
      analista_id: U_CALIDAD,
      fecha: new Date('2026-09-26T02:00:00.000Z'),
      gramaje_g: Decimal('20.76'),
      metabisulfito_ppm: Decimal('52.00'),
      textura: 'firme',
      aprobado: true,
      observacion: 'Camarón Grado A con coloración homogénea y cero melanosis',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      cosecha_id: COS3,
      analista_id: U_CALIDAD,
      fecha: new Date('2026-11-10T23:30:00.000Z'),
      gramaje_g: Decimal('18.25'),
      metabisulfito_ppm: Decimal('40.00'),
      textura: 'firme',
      aprobado: true,
      observacion: 'Inspección preliminar de tolva aprobada en tolva de enfriamiento',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      cosecha_id: COS4,
      analista_id: U_CALIDAD,
      fecha: new Date('2026-11-20T23:50:00.000Z'),
      gramaje_g: Decimal('19.50'),
      metabisulfito_ppm: Decimal('48.00'),
      textura: 'media',
      aprobado: true,
      observacion: 'Textura media aceptable, dentro de tolerancias de la planta empacadora',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G4,
      cosecha_id: COS5,
      analista_id: U_CALIDAD,
      fecha: new Date('2026-12-15T22:00:00.000Z'),
      gramaje_g: Decimal('12.00'),
      metabisulfito_ppm: Decimal('115.00'),
      textura: 'blanda',
      aprobado: false,
      observacion: 'RECHAZADO: Exceso de metabisulfito (>100ppm) y porcentaje elevado de muda blanda',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 18. COLECCIÓN: clientes_empacadoras (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Principales empacadoras y exportadoras ecuatorianas de camarón.
  // Cumplen con cifrado obligatorio AES-256-GCM para RUC.
  const rucEmp1 = encrypt('0990045612001');
  const rucEmp2 = encrypt('0991238901001');
  const rucEmp3 = encrypt('0990345678001');
  const rucEmp4 = encrypt('0990123499001');
  const rucEmp5 = encrypt('0990765412001');

  const clientes = [
    {
      _id: CLI1,
      tenant_id: TENANT_ID,
      codigo: 'CLI-EMP-01',
      nombre: 'Industrial Pesquera Santa Priscila S.A.',
      ruc_cifrado: rucEmp1.data,
      ruc_iv: rucEmp1.iv,
      ruc_tag: rucEmp1.tag,
      contacto: 'Ing. Xavier Durán - 0998877665 - compras@santapriscila.com',
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: CLI2,
      tenant_id: TENANT_ID,
      codigo: 'CLI-EMP-02',
      nombre: 'Omarsa Operadora y Empacadora del Mar S.A.',
      ruc_cifrado: rucEmp2.data,
      ruc_iv: rucEmp2.iv,
      ruc_tag: rucEmp2.tag,
      contacto: 'Lcda. Patricia Noboa - 0981122334 - recepcion@omarsa.com.ec',
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: CLI3,
      tenant_id: TENANT_ID,
      codigo: 'CLI-EMP-03',
      nombre: 'Sociedad Nacional de Galápagos SONGA C.A.',
      ruc_cifrado: rucEmp3.data,
      ruc_iv: rucEmp3.iv,
      ruc_tag: rucEmp3.tag,
      contacto: 'Ing. Fernando Arosemena - 0974455667 - ventas@songa.com',
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: CLI4,
      tenant_id: TENANT_ID,
      codigo: 'CLI-EMP-04',
      nombre: 'Promarisco S.A. - Grupo Nueva Pescanova',
      ruc_cifrado: rucEmp4.data,
      ruc_iv: rucEmp4.iv,
      ruc_tag: rucEmp4.tag,
      contacto: 'Dr. Gabriel Icaza - 0969988776 - planta@promarisco.com',
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: CLI5,
      tenant_id: TENANT_ID,
      codigo: 'CLI-EMP-05',
      nombre: 'Exportadora de Alimentos EXPALSA C.A.',
      ruc_cifrado: rucEmp5.data,
      ruc_iv: rucEmp5.iv,
      ruc_tag: rucEmp5.tag,
      contacto: 'Ing. Daniela Baquerizo - 0953344556 - comercial@expalsa.com',
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 19. COLECCIÓN: facturas_venta (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Facturas electrónicas por venta de libras/kilos de camarón entero o cola
  // entregado en planta empacadora (Tarifa 0% IVA en exportación de mariscos en Ecuador).
  const facturas = [
    {
      _id: FAC1,
      tenant_id: TENANT_ID,
      granja_id: G2,
      cliente_id: CLI1,
      cosecha_id: COS1,
      numero: 'FAC-001-001-00000451',
      fecha: new Date('2026-10-21T10:00:00.000Z'),
      vence_at: new Date('2026-11-20T23:59:59.000Z'),
      subtotal: Decimal('35720.00'), // 9,400 kg * $3.80/kg
      impuestos: Decimal('0.00'),
      total: Decimal('35720.00'),
      estado: 'pagada',
      creado_por: U_CONTADOR,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: FAC2,
      tenant_id: TENANT_ID,
      granja_id: G3,
      cliente_id: CLI2,
      cosecha_id: COS2,
      numero: 'FAC-001-001-00000452',
      fecha: new Date('2026-09-26T11:00:00.000Z'),
      vence_at: new Date('2026-10-26T23:59:59.000Z'),
      subtotal: Decimal('29970.00'), // 8,100 kg * $3.70/kg
      impuestos: Decimal('0.00'),
      total: Decimal('29970.00'),
      estado: 'pagada',
      creado_por: U_CONTADOR,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: FAC3,
      tenant_id: TENANT_ID,
      granja_id: G1,
      cliente_id: CLI3,
      cosecha_id: COS3,
      numero: 'FAC-001-001-00000453',
      fecha: new Date('2026-11-11T12:00:00.000Z'),
      vence_at: new Date('2026-12-11T23:59:59.000Z'),
      subtotal: Decimal('24660.00'), // 6,850 kg * $3.60/kg
      impuestos: Decimal('0.00'),
      total: Decimal('24660.00'),
      estado: 'emitida',
      creado_por: U_CONTADOR,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: FAC4,
      tenant_id: TENANT_ID,
      granja_id: G1,
      cliente_id: CLI4,
      cosecha_id: COS4,
      numero: 'FAC-001-001-00000454',
      fecha: new Date('2026-11-21T12:00:00.000Z'),
      vence_at: new Date('2026-12-21T23:59:59.000Z'),
      subtotal: Decimal('28800.00'), // 8,000 kg * $3.60/kg
      impuestos: Decimal('0.00'),
      total: Decimal('28800.00'),
      estado: 'emitida',
      creado_por: U_CONTADOR,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: FAC5,
      tenant_id: TENANT_ID,
      granja_id: G4,
      cliente_id: CLI5,
      cosecha_id: COS5,
      numero: 'FAC-001-001-00000455',
      fecha: new Date('2026-12-16T10:00:00.000Z'),
      vence_at: new Date('2027-01-16T23:59:59.000Z'),
      subtotal: Decimal('0.00'),
      impuestos: Decimal('0.00'),
      total: Decimal('0.00'),
      estado: 'anulada',
      creado_por: U_CONTADOR,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 20. COLECCIÓN: cuentas_por_pagar_cobrar (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Gestión de tesorería y flujo de caja (CXP a proveedores y CXC a empacadoras).
  const cuentas = [
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      tipo: 'pagar', // Deuda a proveedor de balanceado
      proveedor_id: PRV2,
      orden_compra_id: ORD1,
      fecha_emision: new Date('2026-07-20T10:00:00.000Z'),
      vence_at: new Date('2026-08-20T23:59:59.000Z'),
      monto_original: Decimal('3250.00'),
      saldo_pendiente: Decimal('0.00'),
      estado: 'pagada',
      aprobado_por: ADMIN_USER_ID,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      tipo: 'pagar',
      proveedor_id: PRV2,
      orden_compra_id: ORD2,
      fecha_emision: new Date('2026-08-10T10:30:00.000Z'),
      vence_at: new Date('2026-09-10T23:59:59.000Z'),
      monto_original: Decimal('4200.00'),
      saldo_pendiente: Decimal('1500.00'),
      estado: 'parcial', // Se abonaron $2,700
      aprobado_por: ADMIN_USER_ID,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G2,
      tipo: 'pagar',
      proveedor_id: PRV4,
      orden_compra_id: ORD3,
      fecha_emision: new Date('2026-08-15T11:00:00.000Z'),
      vence_at: new Date('2026-11-15T23:59:59.000Z'),
      monto_original: Decimal('1750.00'),
      saldo_pendiente: Decimal('1750.00'),
      estado: 'pendiente',
      aprobado_por: ADMIN_USER_ID,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G2,
      tipo: 'cobrar', // Cobro a Empacadora Santa Priscila por Cosecha
      cliente_id: CLI1,
      factura_id: FAC1,
      fecha_emision: new Date('2026-10-21T10:00:00.000Z'),
      vence_at: new Date('2026-11-20T23:59:59.000Z'),
      monto_original: Decimal('35720.00'),
      saldo_pendiente: Decimal('0.00'),
      estado: 'pagada', // Transferencia recibida y conciliada
      aprobado_por: ADMIN_USER_ID,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      tipo: 'cobrar', // Cobro a Empacadora Songa por Cosecha 3
      cliente_id: CLI3,
      factura_id: FAC3,
      fecha_emision: new Date('2026-11-11T12:00:00.000Z'),
      vence_at: new Date('2026-12-11T23:59:59.000Z'),
      monto_original: Decimal('24660.00'),
      saldo_pendiente: Decimal('24660.00'),
      estado: 'pendiente',
      aprobado_por: ADMIN_USER_ID,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 21. COLECCIÓN: nomina_empleados_campo (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Rol de pagos para biólogos, operadores de bombeo, atarrayadores y bodegueros.
  // Cumple con deducción de aporte personal IESS (9.45% en Ecuador) y cuentas cifradas.
  const ctaEmp1 = encrypt('1200112233');
  const ctaEmp2 = encrypt('1200223344');
  const ctaEmp3 = encrypt('1200334455');
  const ctaEmp4 = encrypt('1200445566');
  const ctaEmp5 = encrypt('1200556677');

  const nomina = [
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      usuario_id: U_BIOLOGO,
      periodo_inicio: new Date('2026-10-01T00:00:00.000Z'),
      periodo_fin: new Date('2026-10-31T23:59:59.000Z'),
      dias_trabajados: Int(30),
      sueldo_bruto: Decimal('1450.00'),
      deducciones: Decimal('137.03'), // Aporte personal 9.45%
      sueldo_neto: Decimal('1312.97'),
      cuenta_cifrada: ctaEmp1.data,
      cuenta_iv: ctaEmp1.iv,
      cuenta_tag: ctaEmp1.tag,
      aprobado_por: ADMIN_USER_ID,
      estado: 'pagada',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      usuario_id: U_OPERADOR,
      periodo_inicio: new Date('2026-10-01T00:00:00.000Z'),
      periodo_fin: new Date('2026-10-31T23:59:59.000Z'),
      dias_trabajados: Int(30),
      sueldo_bruto: Decimal('650.00'),
      deducciones: Decimal('61.43'),
      sueldo_neto: Decimal('588.57'),
      cuenta_cifrada: ctaEmp2.data,
      cuenta_iv: ctaEmp2.iv,
      cuenta_tag: ctaEmp2.tag,
      aprobado_por: ADMIN_USER_ID,
      estado: 'pagada',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      usuario_id: U_BODEGUERO,
      periodo_inicio: new Date('2026-10-01T00:00:00.000Z'),
      periodo_fin: new Date('2026-10-31T23:59:59.000Z'),
      dias_trabajados: Int(30),
      sueldo_bruto: Decimal('900.00'),
      deducciones: Decimal('85.05'),
      sueldo_neto: Decimal('814.95'),
      cuenta_cifrada: ctaEmp3.data,
      cuenta_iv: ctaEmp3.iv,
      cuenta_tag: ctaEmp3.tag,
      aprobado_por: ADMIN_USER_ID,
      estado: 'aprobada',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G2,
      usuario_id: U_CALIDAD,
      periodo_inicio: new Date('2026-10-01T00:00:00.000Z'),
      periodo_fin: new Date('2026-10-31T23:59:59.000Z'),
      dias_trabajados: Int(30),
      sueldo_bruto: Decimal('1100.00'),
      deducciones: Decimal('103.95'),
      sueldo_neto: Decimal('996.05'),
      cuenta_cifrada: ctaEmp4.data,
      cuenta_iv: ctaEmp4.iv,
      cuenta_tag: ctaEmp4.tag,
      aprobado_por: ADMIN_USER_ID,
      estado: 'aprobada',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      granja_id: G1,
      usuario_id: U_CONTADOR,
      periodo_inicio: new Date('2026-10-01T00:00:00.000Z'),
      periodo_fin: new Date('2026-10-31T23:59:59.000Z'),
      dias_trabajados: Int(30),
      sueldo_bruto: Decimal('1350.00'),
      deducciones: Decimal('127.58'),
      sueldo_neto: Decimal('1222.42'),
      cuenta_cifrada: ctaEmp5.data,
      cuenta_iv: ctaEmp5.iv,
      cuenta_tag: ctaEmp5.tag,
      aprobado_por: ADMIN_USER_ID,
      estado: 'borrador',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 22. COLECCIÓN: permisos (5 Nuevos Registros RBAC)
  // ──────────────────────────────────────────────────────────────────────────
  // Permisos granulares orientados al control de operaciones de cultivo y cosecha.
  const permisos = [
    {
      _id: PERM_GRANJAS_LEER,
      tenant_id: TENANT_ID,
      codigo: 'granjas:leer',
      recurso: 'granjas',
      accion: 'leer',
      descripcion: 'Visualización y monitoreo cartográfico de granjas camaroneras',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PERM_COSECHAS_CREAR,
      tenant_id: TENANT_ID,
      codigo: 'cosechas:crear',
      recurso: 'cosechas',
      accion: 'crear',
      descripcion: 'Programación y apertura de turnos de pesca y cosecha',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PERM_COSECHAS_APROBAR,
      tenant_id: TENANT_ID,
      codigo: 'cosechas:aprobar',
      recurso: 'cosechas',
      accion: 'aprobar',
      descripcion: 'Validación técnica final y cierre contable de cosechas',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PERM_CALIDAD_CREAR,
      tenant_id: TENANT_ID,
      codigo: 'calidad:crear',
      recurso: 'calidad',
      accion: 'crear',
      descripcion: 'Ingreso de pruebas organolépticas y de metabisulfito',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: PERM_NOMINA_APROBAR,
      tenant_id: TENANT_ID,
      codigo: 'nomina:aprobar',
      recurso: 'nomina',
      accion: 'aprobar',
      descripcion: 'Autorización y desembolso de roles de pago de trabajadores',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 23. COLECCIÓN: roles (5 Nuevos Roles)
  // ──────────────────────────────────────────────────────────────────────────
  // Perfiles de puesto con asignación de permisos según el principio de menor privilegio.
  const roles = [
    {
      _id: ROL_BIOLOGO,
      tenant_id: TENANT_ID,
      codigo: 'biologo_campo',
      nombre: 'Biólogo y Especialista en Sanidad Acuícola',
      permiso_ids: [PERM_GRANJAS_LEER, PERM_CALIDAD_CREAR],
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ROL_OPERADOR,
      tenant_id: TENANT_ID,
      codigo: 'operador_estanques',
      nombre: 'Operador de Estanques y Alimentación',
      permiso_ids: [PERM_GRANJAS_LEER],
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ROL_BODEGUERO,
      tenant_id: TENANT_ID,
      codigo: 'jefe_bodega',
      nombre: 'Jefe de Bodega, Insumos y Logística',
      permiso_ids: [PERM_GRANJAS_LEER],
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ROL_CALIDAD,
      tenant_id: TENANT_ID,
      codigo: 'analista_calidad',
      nombre: 'Analista de Control de Calidad e Inocuidad',
      permiso_ids: [PERM_GRANJAS_LEER, PERM_CALIDAD_CREAR, PERM_COSECHAS_APROBAR],
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ROL_CONTADOR,
      tenant_id: TENANT_ID,
      codigo: 'contador_general',
      nombre: 'Contador General y Finanzas Acuícolas',
      permiso_ids: [PERM_GRANJAS_LEER, PERM_NOMINA_APROBAR],
      activo: true,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 24. COLECCIÓN: usuarios (5 Nuevos Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Usuarios operativos con contraseñas encriptadas mediante Argon2id,
  // cédulas cifradas con AES-256-GCM y asignación de alcance (granjas y piscinas).
  const ced1 = encrypt('0704561234');
  const ced2 = encrypt('0705672345');
  const ced3 = encrypt('0706783456');
  const ced4 = encrypt('0707894567');
  const ced5 = encrypt('0708905678');

  const usuarios = [
    {
      _id: U_BIOLOGO,
      tenant_id: TENANT_ID,
      email: 'biologo.campo@fekascorp.com',
      password_hash: passwordHash,
      nombre: 'MSc. Javier Andrade (Biólogo Jefe)',
      activo: true,
      rol_ids: [ROL_BIOLOGO],
      granja_ids: [G1, G2, G3],
      piscina_ids: [P1, P2, P3],
      ultimo_acceso: new Date('2026-10-28T07:15:00.000Z'),
      cedula_cifrada: ced1.data,
      cedula_iv: ced1.iv,
      cedula_tag: ced1.tag,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: U_OPERADOR,
      tenant_id: TENANT_ID,
      email: 'operador.piscina@fekascorp.com',
      password_hash: passwordHash,
      nombre: 'Manuel Chimbo (Técnico Operador de Estanques)',
      activo: true,
      rol_ids: [ROL_OPERADOR],
      granja_ids: [G1, G2],
      piscina_ids: [P1, P2, P3],
      ultimo_acceso: new Date('2026-10-28T06:30:00.000Z'),
      cedula_cifrada: ced2.data,
      cedula_iv: ced2.iv,
      cedula_tag: ced2.tag,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: U_BODEGUERO,
      tenant_id: TENANT_ID,
      email: 'bodega.insumos@fekascorp.com',
      password_hash: passwordHash,
      nombre: 'Gonzalo Loor (Jefe de Bodega y Logística)',
      activo: true,
      rol_ids: [ROL_BODEGUERO],
      granja_ids: [G1, G2, G3, G4],
      piscina_ids: [],
      ultimo_acceso: new Date('2026-10-28T08:00:00.000Z'),
      cedula_cifrada: ced3.data,
      cedula_iv: ced3.iv,
      cedula_tag: ced3.tag,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: U_CALIDAD,
      tenant_id: TENANT_ID,
      email: 'calidad.cosecha@fekascorp.com',
      password_hash: passwordHash,
      nombre: 'Ing. Mariela Cedeño (Analista de Calidad)',
      activo: true,
      rol_ids: [ROL_CALIDAD],
      granja_ids: [G1, G2, G3, G4, G5],
      piscina_ids: [P1, P2, P3, P4, P5],
      ultimo_acceso: new Date('2026-10-28T09:10:00.000Z'),
      cedula_cifrada: ced4.data,
      cedula_iv: ced4.iv,
      cedula_tag: ced4.tag,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: U_CONTADOR,
      tenant_id: TENANT_ID,
      email: 'contabilidad@fekascorp.com',
      password_hash: passwordHash,
      nombre: 'CPA. Lorena Zambrano (Contadora General)',
      activo: true,
      rol_ids: [ROL_CONTADOR],
      granja_ids: [G1, G2, G3, G4, G5],
      piscina_ids: [],
      ultimo_acceso: new Date('2026-10-28T08:45:00.000Z'),
      cedula_cifrada: ced5.data,
      cedula_iv: ced5.iv,
      cedula_tag: ced5.tag,
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 25. COLECCIÓN: sesiones_activas (5 Nuevos Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Sesiones JWT autenticadas con hash SHA-256 de JTI, rotación y huella de navegador.
  const sesiones = [
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      usuario_id: U_BIOLOGO,
      jti_hash: SHA256('jti_biologo_token_active_2026_01'),
      refresh_hash: SHA256('refresh_biologo_secret_2026_01'),
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000), // Válido por 7 días
      revocada: false,
      ip_hash: SHA256('190.152.10.45'),
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      rotada_en: new Date(),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      usuario_id: U_OPERADOR,
      jti_hash: SHA256('jti_operador_token_active_2026_02'),
      refresh_hash: SHA256('refresh_operador_secret_2026_02'),
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      revocada: false,
      ip_hash: SHA256('186.42.88.19'),
      user_agent: 'Mozilla/5.0 (Linux; Android 14; SM-A546B) Mobile Safari/537.36',
      rotada_en: new Date(),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      usuario_id: U_BODEGUERO,
      jti_hash: SHA256('jti_bodega_token_active_2026_03'),
      refresh_hash: SHA256('refresh_bodega_secret_2026_03'),
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      revocada: false,
      ip_hash: SHA256('190.152.12.90'),
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
      rotada_en: new Date(),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      usuario_id: U_CALIDAD,
      jti_hash: SHA256('jti_calidad_token_active_2026_04'),
      refresh_hash: SHA256('refresh_calidad_secret_2026_04'),
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      revocada: false,
      ip_hash: SHA256('186.42.95.112'),
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) Safari/605.1.15',
      rotada_en: new Date(),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      usuario_id: U_CONTADOR,
      jti_hash: SHA256('jti_contador_token_active_2026_05'),
      refresh_hash: SHA256('refresh_contador_secret_2026_05'),
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      revocada: false,
      ip_hash: SHA256('190.152.8.21'),
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/121.0.2277.128',
      rotada_en: new Date(),
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 26. COLECCIÓN: logs_auditoria (5 Registros)
  // ──────────────────────────────────────────────────────────────────────────
  // Pistas de auditoría inmutables para operaciones críticas en el ERP camaronero.
  const auditoria = [
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      usuario_id: U_BIOLOGO,
      accion: 'REGISTRO_PARAMETROS_AGUA',
      recurso: 'parametros_agua',
      recurso_id: P1,
      fecha: new Date('2026-10-26T06:10:00.000Z'),
      ip_hash: SHA256('190.152.10.45'),
      resultado: 'exito',
      detalle: 'Ingreso rutinario matutino de calidad de agua en Piscina P-01 (Oxígeno: 5.8 mg/l)',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      usuario_id: U_OPERADOR,
      accion: 'REGISTRO_CONSUMO_ALIMENTO',
      recurso: 'consumo_alimento_diario',
      recurso_id: P2,
      fecha: new Date('2026-10-26T11:00:00.000Z'),
      ip_hash: SHA256('186.42.88.19'),
      resultado: 'exito',
      detalle: 'Despacho y aplicación de 95 kg de balanceado de engorde en Piscina P-02',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      usuario_id: U_BODEGUERO,
      accion: 'RECEPCION_INVENTARIO_KARDEX',
      recurso: 'movimientos_kardex',
      recurso_id: LOT2,
      fecha: new Date('2026-08-12T09:15:00.000Z'),
      ip_hash: SHA256('190.152.12.90'),
      resultado: 'exito',
      detalle: 'Recepción y entrada a bodega de 3,500 kg de balanceado lote LOT-BAL-28P-2026-02',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      usuario_id: U_CALIDAD,
      accion: 'EVALUACION_CALIDAD_COSECHA',
      recurso: 'control_calidad_cosecha',
      recurso_id: COS1,
      fecha: new Date('2026-10-21T02:00:00.000Z'),
      ip_hash: SHA256('186.42.95.112'),
      resultado: 'exito',
      detalle: 'Certificado de calidad emitido y aprobado para Cosecha COS-001 (45.5 ppm metabisulfito)',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    },
    {
      _id: ObjectId(),
      tenant_id: TENANT_ID,
      usuario_id: U_CONTADOR,
      accion: 'EMISION_FACTURA_VENTA',
      recurso: 'facturas_venta',
      recurso_id: FAC1,
      fecha: new Date('2026-10-21T10:15:00.000Z'),
      ip_hash: SHA256('190.152.8.21'),
      resultado: 'exito',
      detalle: 'Emisión electrónica de Factura FAC-001-001-00000451 a Industrial Pesquera Santa Priscila',
      created_at: FECHA_BASE,
      updated_at: FECHA_NOW
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // EJECUCIÓN SECUENCIAL DE INSERCIÓN EN MONGODB ATLAS
  // ──────────────────────────────────────────────────────────────────────────
  const colecciones = [
    { name: 'granjas_camaroneras', docs: granjas },
    { name: 'piscinas_estanques', docs: piscinas },
    { name: 'ciclos_cultivo', docs: ciclos },
    { name: 'proveedores', docs: proveedores },
    { name: 'siembras_larvas', docs: siembras },
    { name: 'insumos_productos', docs: insumos },
    { name: 'bodegas', docs: bodegas },
    { name: 'ordenes_compra', docs: ordenes },
    { name: 'lotes_inventario', docs: lotes },
    { name: 'movimientos_kardex', docs: kardex },
    { name: 'planes_alimentacion', docs: planes },
    { name: 'consumo_alimento_diario', docs: consumos },
    { name: 'parametros_agua', docs: parametrosAgua },
    { name: 'muestreos_biometricos', docs: muestreos },
    { name: 'registro_mortalidad', docs: mortalidad },
    { name: 'cosechas_pesca', docs: cosechas },
    { name: 'control_calidad_cosecha', docs: controlCalidad },
    { name: 'clientes_empacadoras', docs: clientes },
    { name: 'facturas_venta', docs: facturas },
    { name: 'cuentas_por_pagar_cobrar', docs: cuentas },
    { name: 'nomina_empleados_campo', docs: nomina },
    { name: 'permisos', docs: permisos },
    { name: 'roles', docs: roles },
    { name: 'usuarios', docs: usuarios },
    { name: 'sesiones_activas', docs: sesiones },
    { name: 'logs_auditoria', docs: auditoria }
  ];

  console.log('📦 Insertando 5 registros con sus relaciones en las 26 colecciones...');

  for (const col of colecciones) {
    try {
      const res = await db.collection(col.name).insertMany(col.docs, { ordered: true });
      console.log(`   ✓ [${col.name}] Insertados ${res.insertedCount} registros exitosamente.`);
    } catch (err) {
      console.error(`   ❌ Error insertando en [${col.name}]:`, err.message);
      if (err.errInfo) {
        console.error('      Detalles de schema validator:', JSON.stringify(err.errInfo.details, null, 2));
      }
      throw err;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACTUALIZACIÓN DEL USUARIO ADMINISTRADOR CON ACCESO A LAS GRANJAS Y PISCINAS
  // ──────────────────────────────────────────────────────────────────────────
  if (existingUser) {
    await db.collection('usuarios').updateOne(
      { _id: existingUser._id },
      {
        $set: {
          granja_ids: [G1, G2, G3, G4, G5],
          piscina_ids: [P1, P2, P3, P4, P5],
          updated_at: new Date()
        }
      }
    );
    console.log('\n✓ Asignadas las 5 granjas y 5 piscinas al usuario Administrador para operación total.');
  }

  console.log('\n🎉 ¡Poblado completado con éxito! Se añadieron 5 datos relacionales a todas las colecciones.');
}

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('Fallo en la ejecución:', e);
      await mongoose.disconnect();
      process.exit(1);
    });
}

module.exports = { seedDatabase };
