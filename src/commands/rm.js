import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { loadConfig, resolveEnvironment } from '../core/config.js';
import { loadEnvFile, saveEnvFile, getEnvFileName } from '../core/vault.js';
import { parse, serialize } from '../core/parser.js';
import { logger } from '../utils/logger.js';

// ─── zink rm ────────────────────────────────────────────────────

export async function rmCommand(keys, options) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const environment = resolveEnvironment(options.env, config);

  if (!keys || keys.length === 0) {
    logger.error('No keys provided.');
    logger.dim('Usage: zink rm KEY [KEY2 ...]');
    process.exit(1);
  }

  // Load env file
  const envContent = await loadEnvFile(cwd, environment);
  if (!envContent) {
    const envFileName = getEnvFileName(environment);
    logger.error(`No ${envFileName} file found.`);
    process.exit(1);
  }

  const envVars = parse(envContent);
  const found = [];
  const notFound = [];

  for (const key of keys) {
    if (key in envVars) {
      found.push(key);
    } else {
      notFound.push(key);
    }
  }

  if (found.length === 0) {
    logger.warn('None of the specified keys were found.');
    return;
  }

  // Confirm removal
  if (!options.force) {
    logger.section('Variables to remove');
    for (const key of found) {
      logger.kv(key, envVars[key], { masked: true });
    }
    logger.br();

    const proceed = await confirm({
      message: `Remove ${found.length} variable${found.length !== 1 ? 's' : ''}?`,
      default: false,
    });

    if (!proceed) {
      logger.info('Aborted.');
      return;
    }
  }

  // Remove keys
  for (const key of found) {
    delete envVars[key];
    logger.success(`Removed ${chalk.bold(key)}`);
  }

  for (const key of notFound) {
    logger.warn(`Key "${key}" not found (skipped)`);
  }

  // Save
  const serialized = serialize(envVars, { sort: false });
  await saveEnvFile(cwd, environment, serialized);

  logger.br();
  logger.dim(`Don't forget to re-encrypt: zink encrypt -e ${environment}`);
}
