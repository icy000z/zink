import chalk from 'chalk';
import { loadConfig, resolveEnvironment } from '../core/config.js';
import { loadEnvFile, getEnvFileName } from '../core/vault.js';
import { parse } from '../core/parser.js';
import { logger } from '../utils/logger.js';

// ─── zink get ───────────────────────────────────────────────────

export async function getCommand(key, options) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const environment = resolveEnvironment(options.env, config);

  if (!key) {
    logger.error('No key provided.');
    logger.dim('Usage: zink get KEY');
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

  if (!(key in envVars)) {
    logger.error(`Key "${key}" not found in ${getEnvFileName(environment)}.`);
    process.exit(1);
  }

  if (options.raw) {
    // Raw mode — just print the value (useful for scripting)
    process.stdout.write(envVars[key]);
  } else {
    logger.kv(key, envVars[key], { masked: options.masked });
  }
}
