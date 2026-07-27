import fs from 'node:fs/promises';
import path from 'node:path';
import {
  CONFIG_FILE,
  DEFAULT_ENVIRONMENTS,
  DEFAULT_ENVIRONMENT,
} from '../utils/constants.js';

// ─── Zink Config Manager ───────────────────────────────────────

const DEFAULT_CONFIG = {
  defaultEnvironment: DEFAULT_ENVIRONMENT,
  environments: DEFAULT_ENVIRONMENTS,
};

/**
 * Load the project's .zinkrc config file.
 * @param {string} projectDir
 * @returns {Promise<Object>}
 */
export async function loadConfig(projectDir) {
  const configPath = path.join(projectDir, CONFIG_FILE);
  try {
    const content = await fs.readFile(configPath, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch (err) {
    if (err.code === 'ENOENT') return { ...DEFAULT_CONFIG };
    throw new Error(`Failed to read config: ${err.message}`);
  }
}

/**
 * Save the project's .zinkrc config file.
 * @param {string} projectDir
 * @param {Object} config
 */
export async function saveConfig(projectDir, config) {
  const configPath = path.join(projectDir, CONFIG_FILE);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

/**
 * Check if zink is initialized in the project.
 * @param {string} projectDir
 * @returns {Promise<boolean>}
 */
export async function isInitialized(projectDir) {
  const configPath = path.join(projectDir, CONFIG_FILE);
  try {
    await fs.access(configPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the environment name — use provided or fall back to default.
 * @param {string|undefined} env
 * @param {Object} config
 * @returns {string}
 */
export function resolveEnvironment(env, config) {
  return env || config.defaultEnvironment || DEFAULT_ENVIRONMENT;
}
