import fs from 'node:fs/promises';
import chalk from 'chalk';
import { loadConfig, resolveEnvironment } from '../core/config.js';
import { loadEnvFile, saveEnvFile, getEnvFileName } from '../core/vault.js';
import { parse, serialize } from '../core/parser.js';
import { logger } from '../utils/logger.js';

// ─── zink set ───────────────────────────────────────────────────

export async function setCommand(pairs, options) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const environment = resolveEnvironment(options.env, config);

  if (!pairs || pairs.length === 0) {
    logger.error('No KEY=VALUE pairs provided.');
    logger.dim('Usage: zink set KEY=VALUE [KEY2=VALUE2 ...]');
    process.exit(1);
  }

  // Parse the pairs
  const newVars = {};
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) {
      logger.error(`Invalid format: "${pair}". Use KEY=VALUE.`);
      process.exit(1);
    }
    const key = pair.slice(0, eqIdx).trim();
    const value = pair.slice(eqIdx + 1);

    if (!key) {
      logger.error('Key cannot be empty.');
      process.exit(1);
    }

    // Validate key format
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      logger.error(`Invalid key: "${key}". Keys must be alphanumeric with underscores.`);
      process.exit(1);
    }

    newVars[key] = value;
  }

  // Load existing env
  const envContent = (await loadEnvFile(cwd, environment)) || '';
  const envVars = parse(envContent);

  // Track changes
  const added = [];
  const updated = [];

  for (const [key, value] of Object.entries(newVars)) {
    if (key in envVars) {
      if (envVars[key] !== value) {
        updated.push(key);
      }
    } else {
      added.push(key);
    }
    envVars[key] = value;
  }

  // Save
  const serialized = serialize(envVars, { sort: false, quote: true });
  await saveEnvFile(cwd, environment, serialized);

  // Report
  const envFileName = getEnvFileName(environment);
  if (added.length > 0) {
    for (const key of added) {
      logger.success(`Added ${chalk.bold(key)} to ${envFileName}`);
    }
  }
  if (updated.length > 0) {
    for (const key of updated) {
      logger.info(`Updated ${chalk.bold(key)} in ${envFileName}`);
    }
  }
  if (added.length === 0 && updated.length === 0) {
    logger.dim('No changes made (values are the same).');
  }

  logger.br();
  logger.dim(`Don't forget to re-encrypt: zink encrypt -e ${environment}`);
}
