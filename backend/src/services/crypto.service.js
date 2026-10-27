'use strict';
/* Funciones de encriptación/desencriptación AES-256-GCM.
   Cada valor encriptado recibe un IV único de 12 bytes. */
const { randomBytes, createCipheriv, createDecipheriv } = require('node:crypto');
const { aesKey } = require('../config/env');

/**
 * Encripta un texto plano con AES-256-GCM.
 * @param {string} text - Texto a encriptar
 * @returns {{ data: Buffer, iv: Buffer, tag: Buffer }}
 */
function encrypt(text) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { data, iv, tag };
}

/**
 * Desencripta un valor encriptado con AES-256-GCM.
 * @param {Buffer} data - Datos encriptados
 * @param {Buffer} iv - Vector de inicialización
 * @param {Buffer} tag - Tag de autenticación
 * @returns {string} Texto plano
 */
function decrypt(data, iv, tag) {
  const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}

module.exports = { encrypt, decrypt };
