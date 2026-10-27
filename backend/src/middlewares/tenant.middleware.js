'use strict';
/* Plugin tenantScope: aislamiento automático por tenant_id y granja_id.
   Inyecta filtros en find, update, delete, aggregate y save.
   Sin contexto de seguridad, la operación falla. */
const { scopeStore } = require('../config/helpers');

function tenantScope(schema) {
  function scopeQuery() {
    const ctx = scopeStore.getStore();
    if (!ctx) throw new Error('Falta contexto de seguridad');

    // Filtro base por tenant y granjas asignadas
    this.where({
      tenant_id: ctx.tenantId,
      granja_id: { $in: ctx.granjaIds }
    });

    // Si el schema tiene piscina_id y no es admin, filtrar por piscinas asignadas
    if (schema.path('piscina_id') && !ctx.isAdmin) {
      this.where({ piscina_id: { $in: ctx.piscinaIds } });
    }
    if (this.model.modelName === 'Piscina' && !ctx.isAdmin) {
      this.where({ _id: { $in: ctx.piscinaIds } });
    }

    // Proteger campos inmutables en operaciones de actualización
    const update = this.getUpdate?.();
    if (update) {
      const keys = [
        ...Object.keys(update),
        ...Object.keys(update.$set || {}),
        ...Object.keys(update.$unset || {})
      ];
      const protectedFields = [
        'tenant_id', 'granja_id', 'piscina_id',
        'created_at', 'aprobado_por', 'rol_ids', 'saldo_aprobado'
      ];
      if (keys.some(k => protectedFields.includes(k))) {
        throw new Error('Campo protegido');
      }
    }
  }

  // Aplicar scope a todas las operaciones de lectura/escritura
  const ops = [
    'find', 'findOne', 'countDocuments',
    'updateOne', 'updateMany', 'findOneAndUpdate',
    'deleteOne', 'deleteMany', 'findOneAndDelete'
  ];
  for (const op of ops) {
    schema.pre(op, scopeQuery);
  }

  // Scope para aggregation pipeline
  schema.pre('aggregate', function () {
    const ctx = scopeStore.getStore();
    if (!ctx) throw new Error('Falta contexto de seguridad');
    const match = {
      tenant_id: ctx.tenantId,
      granja_id: { $in: ctx.granjaIds }
    };
    if (schema.path('piscina_id') && !ctx.isAdmin) {
      match.piscina_id = { $in: ctx.piscinaIds };
    }
    this.pipeline().unshift({ $match: match });
  });

  // Scope para nuevos documentos
  schema.pre('save', function () {
    const ctx = scopeStore.getStore();
    if (!ctx) throw new Error('Falta contexto de seguridad');
    if (!this.tenant_id) this.tenant_id = ctx.tenantId;

    if (!this.tenant_id.equals(ctx.tenantId) ||
        !ctx.granjaIds.some(x => x.equals(this.granja_id))) {
      throw new Error('Granja/tenant fuera de alcance');
    }
    if (this.piscina_id && !ctx.isAdmin &&
        !ctx.piscinaIds.some(x => x.equals(this.piscina_id))) {
      throw new Error('Piscina fuera de alcance');
    }
  });
}

module.exports = { tenantScope };
