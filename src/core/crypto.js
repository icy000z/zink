import crypto from 'node:crypto';
import {
  ALGORITHM,
  KDF,
  KDF_ITERATIONS,
  KDF_DIGEST,
  SALT_LENGTH,
  IV_LENGTH,
  KEY_LENGTH,
  AUTH_TAG_LENGTH,
} from '../utils/constants.js';

// ─── Zink Crypto Engine ─────────────────────────────────────────

/**
 * Derive an encryption key from a password using PBKDF2.
 * @param {string} password - The master password
 * @param {Buffer} salt - The salt buffer
 * @returns {Promise<Buffer>} The derived key
 */
export function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, KDF_ITERATIONS, KEY_LENGTH, KDF_DIGEST, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

/**
 * Encrypt plaintext data using AES-256-GCM.
 * @param {string} plaintext - The data to encrypt
 * @param {string} password - The master password
 * @returns {Promise<{salt: string, iv: string, authTag: string, data: string}>}
 */
export async function encrypt(plaintext, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = await deriveKey(password, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted,
  };
}

/**
 * Decrypt encrypted data using AES-256-GCM.
 * @param {{salt: string, iv: string, authTag: string, data: string}} envelope - The encrypted envelope
 * @param {string} password - The master password
 * @returns {Promise<string>} The decrypted plaintext
 */
export async function decrypt(envelope, password) {
  const salt = Buffer.from(envelope.salt, 'hex');
  const iv = Buffer.from(envelope.iv, 'hex');
  const authTag = Buffer.from(envelope.authTag, 'hex');
  const key = await deriveKey(password, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(envelope.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a secure random password.
 * @param {number} length - Password length
 * @returns {string}
 */
export function generatePassword(length = 32) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

/**
 * Hash a value with SHA-256 (for fingerprinting, not security).
 * @param {string} value
 * @returns {string}
 */
export function fingerprint(value) {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 12);
}
