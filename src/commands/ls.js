import chalk from 'chalk';
import { loadConfig, resolveEnvironment } from '../core/config.js';
import { loadEnvFile, getEnvFileName } from '../core/vault.js';
import { parse } from '../core/parser.js';
import { logger } from '../utils/logger.js';

// ─── zink ls ────────────────────────────────────────────────────

export async function lsCommand(options) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const environment = resolveEnvironment(options.env, config);

  // Load env file
  const envContent = await loadEnvFile(cwd, environment);
  if (!envContent) {
    const envFileName = getEnvFileName(environment);
    logger.error(`No ${envFileName} file found.`);
    logger.dim(`Create variables with: zink set KEY=VALUE -e ${environment}`);
    process.exit(1);
  }

  const envVars = parse(envContent);
  const keys = Object.keys(envVars);

  if (keys.length === 0) {
    logger.info('No variables found.');
    return;
  }

  const showValues = options.show || false;

  logger.section(`${environment} (${keys.length} variables)`);

  for (const key of keys) {
    const value = envVars[key];
    if (showValues) {
      logger.kv(key, value);
    } else {
      // Show masked preview
      const preview = maskValue(value);
      logger.kv(key, preview, { color: 'gray' });
    }
  }

  logger.br();
  if (!showValues) {
    logger.dim('Use --show to reveal values');
  }
}

/**
 * Mask a value for display, showing only first and last characters.
 */
function maskValue(value) {
  if (!value || value.length <= 4) {
    return '••••••••';
  }
  if (value.length <= 8) {
    return value[0] + '•'.repeat(value.length - 2) + value[value.length - 1];
  }
  return value.slice(0, 2) + '•'.repeat(Math.min(value.length - 4, 12)) + value.slice(-2);
}
