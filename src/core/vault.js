import fs from 'node:fs/promises';
import path from 'node:path';
import { encrypt, decrypt, fingerprint } from './crypto.js';
import { parse, serialize } from './parser.js';
import {
  VAULT_FILE,
  VAULT_VERSION,
  ALGORITHM,
  KDF,
  KDF_ITERATIONS,
} from '../utils/constants.js';

// ─── Zink Vault Manager ────────────────────────────────────────

/**
 * Create an empty vault structure.
 * @returns {Object}
 */
export function createEmptyVault() {
  return {
    version: VAULT_VERSION,
    tool: 'zink',
    algorithm: ALGORITHM,
    kdf: KDF,
    iterations: KDF_ITERATIONS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    environments: {},
  };
}

/**
 * Load the vault file from the project directory.
 * @param {string} projectDir - Project root directory
 * @returns {Promise<Object|null>} The vault object or null if not found
 */
export async function loadVault(projectDir) {
  const vaultPath = path.join(projectDir, VAULT_FILE);
  try {
    const content = await fs.readFile(vaultPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw new Error(`Failed to read vault file: ${err.message}`);
  }
}

/**
 * Save the vault file to the project directory.
 * @param {string} projectDir - Project root directory
 * @param {Object} vault - The vault object
 */
export async function saveVault(projectDir, vault) {
  const vaultPath = path.join(projectDir, VAULT_FILE);
  vault.updatedAt = new Date().toISOString();
  await fs.writeFile(vaultPath, JSON.stringify(vault, null, 2) + '\n', 'utf8');
}

/**
 * Check if a vault exists in the project directory.
 * @param {string} projectDir
 * @returns {Promise<boolean>}
 */
export async function vaultExists(projectDir) {
  const vaultPath = path.join(projectDir, VAULT_FILE);
  try {
    await fs.access(vaultPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Encrypt an environment's .env content and store it in the vault.
 * @param {Object} vault - The vault object
 * @param {string} environment - Environment name (e.g., "development")
 * @param {string} envContent - Raw .env file content
 * @param {string} password - Master password
 * @returns {Promise<Object>} Updated vault
 */
export async function encryptEnvironment(vault, environment, envContent, password) {
  const encrypted = await encrypt(envContent, password);
  vault.environments[environment] = {
    ...encrypted,
    fingerprint: fingerprint(envContent),
    encryptedAt: new Date().toISOString(),
    variableCount: Object.keys(parse(envContent)).length,
  };
  return vault;
}

/**
 * Decrypt an environment's data from the vault.
 * @param {Object} vault - The vault object
 * @param {string} environment - Environment name
 * @param {string} password - Master password
 * @returns {Promise<string>} Decrypted .env content
 */
export async function decryptEnvironment(vault, environment, password) {
  const envData = vault.environments[environment];
  if (!envData) {
    throw new Error(`Environment "${environment}" not found in vault`);
  }

  try {
    return await decrypt(envData, password);
  } catch (err) {
    if (err.message.includes('Unsupported state') || err.message.includes('unable to authenticate')) {
      throw new Error('Wrong password or corrupted vault data');
    }
    throw err;
  }
}

/**
 * List all environments in the vault.
 * @param {Object} vault - The vault object
 * @returns {string[]} Environment names
 */
export function listEnvironments(vault) {
  return Object.keys(vault.environments);
}

/**
 * Get metadata about an environment in the vault.
 * @param {Object} vault
 * @param {string} environment
 * @returns {Object|null}
 */
export function getEnvironmentMeta(vault, environment) {
  const env = vault.environments[environment];
  if (!env) return null;
  return {
    fingerprint: env.fingerprint,
    encryptedAt: env.encryptedAt,
    variableCount: env.variableCount,
  };
}

/**
 * Remove an environment from the vault.
 * @param {Object} vault
 * @param {string} environment
 * @returns {Object} Updated vault
 */
export function removeEnvironment(vault, environment) {
  delete vault.environments[environment];
  return vault;
}

/**
 * Load a .env file from the project directory.
 * @param {string} projectDir
 * @param {string} environment
 * @returns {Promise<string|null>}
 */
export async function loadEnvFile(projectDir, environment) {
  const filename = getEnvFileName(environment);
  const envPath = path.join(projectDir, filename);

  try {
    return await fs.readFile(envPath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Save a .env file to the project directory.
 * @param {string} projectDir
 * @param {string} environment
 * @param {string} content
 */
export async function saveEnvFile(projectDir, environment, content) {
  const filename =
    environment === 'development' ? '.env' : `.env.${environment}`;
  const envPath = path.join(projectDir, filename);
  await fs.writeFile(envPath, content, 'utf8');
}

/**
 * Get the .env filename for an environment.
 * @param {string} environment
 * @returns {string}
 */
export function getEnvFileName(environment) {
  return environment === 'development' ? '.env' : `.env.${environment}`;
}
