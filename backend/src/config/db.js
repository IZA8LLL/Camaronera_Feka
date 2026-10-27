'use strict';
/* Conexión a MongoDB con TLS y validación de Replica Set.
   Rechaza cuentas con roles administrativos por seguridad. */
const mongoose = require('mongoose');
const { env, isDev } = require('./env');
const { containsWhere } = require('./helpers');

// Configuración estricta de Mongoose
mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

// Plugin global: bloquear operador $where en todas las operaciones
mongoose.plugin(schema => {
  const ops = [
    'find', 'findOne', 'countDocuments',
    'updateOne', 'updateMany', 'findOneAndUpdate',
    'deleteOne', 'deleteMany', 'findOneAndDelete'
  ];
  for (const operation of ops) {
    schema.pre(operation, function () {
      if (containsWhere(this.getFilter())) {
        throw new Error('Operador $where prohibido');
      }
    });
  }
  schema.pre('aggregate', function () {
    if (containsWhere(this.pipeline())) {
      throw new Error('Operador $where prohibido');
    }
  });
});

async function connectDB() {
  const opts = {
    serverSelectionTimeoutMS: 10000,
    autoIndex: false
  };

  // TLS solo en producción o si la URI lo incluye
  if (!isDev || env.MONGO_URI.includes('tls=true')) {
    opts.tls = true;
  }
  if (env.MONGO_TLS_CA_FILE) opts.tlsCAFile = env.MONGO_TLS_CA_FILE;
  if (env.MONGO_TLS_CERT_KEY_FILE) opts.tlsCertificateKeyFile = env.MONGO_TLS_CERT_KEY_FILE;

  await mongoose.connect(env.MONGO_URI, opts);
  console.log('✓ MongoDB conectado');

  // Verificar que sea replica set o Atlas (necesario para transacciones)
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (!hello.setName && hello.msg !== 'isdbgrid') {
      console.warn('⚠ Se recomienda MongoDB replica set para transacciones de inventario');
    }
  } catch (e) {
    console.warn('⚠ No se pudo verificar el tipo de deployment MongoDB');
  }

  // Verificar roles (solo en producción)
  if (!isDev) {
    try {
      const auth = await mongoose.connection.db.admin().command({ connectionStatus: 1 });
      const forbidden = new Set([
        'root', 'atlasAdmin', 'readWriteAnyDatabase',
        'dbOwner', 'userAdminAnyDatabase', 'dbAdminAnyDatabase'
      ]);
      if ((auth.authInfo?.authenticatedUserRoles || []).some(r => forbidden.has(r.role))) {
        await mongoose.disconnect();
        throw new Error('La cuenta MongoDB tiene permisos administrativos; use un rol limitado');
      }
    } catch (e) {
      if (e.message.includes('permisos administrativos')) throw e;
      console.warn('⚠ No se pudo verificar los roles de la cuenta MongoDB');
    }
  }
}

module.exports = { connectDB, mongoose };
