import { password as passwordPrompt, confirm } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadConfig, resolveEnvironment } from '../core/config.js';
import {
  loadVault,
  vaultExists,
  decryptEnvironment,
  saveEnvFile,
  getEnvFileName,
  listEnvironments,
} from '../core/vault.js';
import { parse } from '../core/parser.js';
import { logger } from '../utils/logger.js';

// ─── zink decrypt ───────────────────────────────────────────────

export async function decryptCommand(options) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const environment = resolveEnvironment(options.env, config);

  // Check vault exists
  if (!(await vaultExists(cwd))) {
    logger.error('No .env.vault file found. Run `zink init` first.');
    process.exit(1);
  }

  const vault = await loadVault(cwd);
  const environments = listEnvironments(vault);

  if (environments.length === 0) {
    logger.warn('Vault is empty. No environments to decrypt.');
    logger.dim('Encrypt first with: zink encrypt');
    return;
  }

  if (!vault.environments[environment]) {
    logger.error(`Environment "${environment}" not found in vault.`);
    logger.dim(`Available: ${environments.join(', ')}`);
    process.exit(1);
  }

  logger.section(`Decrypting: ${environment}`);

  // Check if .env file already exists
  const envFileName = getEnvFileName(environment);
  const envFilePath = path.join(cwd, envFileName);
  try {
    await fs.access(envFilePath);
    if (!options.force) {
      const overwrite = await confirm({
        message: `${envFileName} already exists. Overwrite?`,
        default: false,
      });
      if (!overwrite) {
        logger.info('Aborted.');
        return;
      }
    }
  } catch {
    // File doesn't exist, good to go
  }

  // Get password
  const masterPassword = await passwordPrompt({
    message: 'Enter master password:',
    mask: '•',
  });

  // Decrypt
  const spinner = ora('Decrypting environment...').start();

  try {
    const content = await decryptEnvironment(vault, environment, masterPassword);
    const envVars = parse(content);
    const varCount = Object.keys(envVars).length;

    if (options.stdout) {
      spinner.stop();
      process.stdout.write(content);
    } else {
      await saveEnvFile(cwd, environment, content);
      spinner.succeed(`Decrypted ${chalk.bold(varCount)} variables → ${envFileName}`);
      logger.br();
      logger.warn(`Remember: ${envFileName} contains secrets — do NOT commit it.`);
    }
  } catch (err) {
    spinner.fail('Decryption failed');
    logger.error(err.message);
    process.exit(1);
  }
}
