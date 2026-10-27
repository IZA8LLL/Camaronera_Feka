'use strict';
/* Validación estricta de variables de entorno con Zod.
   En development se relajan ciertos requisitos (TLS, HTTPS). */
require('dotenv').config();
const { z } = require('zod');
const path = require('node:path');

const isDev = (process.env.NODE_ENV || 'development') === 'development';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGO_URI: z.string().min(20),
  MONGO_TLS_CA_FILE: z.string().optional(),
  MONGO_TLS_CERT_KEY_FILE: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY_BASE64: z.string().min(43),
  TURNSTILE_SECRET: z.string().min(10).optional(),
  TURNSTILE_HOSTNAME: z.string().min(3).optional(),
  APP_ORIGIN: z.string().url(),
  PRIVATE_UPLOAD_DIR: z.string().min(2).default('../uploads'),
  BOOTSTRAP_EMAIL: z.string().email().optional(),
  BOOTSTRAP_PASSWORD: z.string().min(14).optional()
}).strict();

const envInput = Object.fromEntries(
  Object.keys(envSchema.shape)
    .filter(k => process.env[k] !== undefined)
    .map(k => [k, process.env[k]])
);

const env = envSchema.parse(envInput);

// Clave AES de 32 bytes para cifrado AES-256-GCM
const aesKey = Buffer.from(env.ENCRYPTION_KEY_BASE64, 'base64');
if (aesKey.length !== 32) {
  throw new Error('Se exige clave AES de 32 bytes (ENCRYPTION_KEY_BASE64 inválido)');
}

// En producción, validar TLS y HTTPS
if (!isDev) {
  if (!env.MONGO_URI.includes('tls=true')) {
    throw new Error('MONGO_URI debe incluir tls=true en producción');
  }
  const mongoUrl = new URL(env.MONGO_URI);
  if (!['mongodb:', 'mongodb+srv:'].includes(mongoUrl.protocol) ||
      mongoUrl.pathname !== '/by_fekas_corp_db') {
    throw new Error('URI MongoDB debe apuntar a by_fekas_corp_db');
  }
  if (['tlsInsecure', 'tlsAllowInvalidCertificates', 'tlsAllowInvalidHostnames']
      .some(k => mongoUrl.searchParams.get(k) === 'true')) {
    throw new Error('URI MongoDB no debe permitir TLS inseguro');
  }
  if (new URL(env.APP_ORIGIN).protocol !== 'https:') {
    throw new Error('APP_ORIGIN debe usar HTTPS en producción');
  }
}

// Directorio de uploads privado
const privateUploadDir = path.resolve(env.PRIVATE_UPLOAD_DIR);
if (privateUploadDir === __dirname || privateUploadDir.startsWith(__dirname + path.sep)) {
  throw new Error('PRIVATE_UPLOAD_DIR debe estar fuera del directorio público');
}

module.exports = { env, aesKey, privateUploadDir, isDev };
