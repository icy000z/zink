import { password as passwordPrompt } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { loadConfig, resolveEnvironment } from '../core/config.js';
import {
  loadVault,
  saveVault,
  vaultExists,
  encryptEnvironment,
  loadEnvFile,
  getEnvFileName,
} from '../core/vault.js';
import { parse } from '../core/parser.js';
import { logger } from '../utils/logger.js';

// ─── zink encrypt ───────────────────────────────────────────────

export async function encryptCommand(options) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const environment = resolveEnvironment(options.env, config);

  // Check vault exists
  if (!(await vaultExists(cwd))) {
    logger.error('Zink is not initialized. Run `zink init` first.');
    process.exit(1);
  }

  // Load .env file
  const envContent = await loadEnvFile(cwd, environment);
  if (!envContent) {
    const filename = getEnvFileName(environment);
    logger.error(`No ${filename} file found for environment "${environment}".`);
    logger.dim(`Create one with: zink set KEY=VALUE -e ${environment}`);
    process.exit(1);
  }

  // Parse to show count
  const envVars = parse(envContent);
  const varCount = Object.keys(envVars).length;

  if (varCount === 0) {
    logger.warn('The .env file is empty. Nothing to encrypt.');
    return;
  }

  logger.section(`Encrypting: ${environment}`);
  logger.info(`Found ${chalk.bold(varCount)} variable${varCount !== 1 ? 's' : ''} in ${getEnvFileName(environment)}`);

  // Get password
  const masterPassword = await passwordPrompt({
    message: 'Enter master password:',
    mask: '•',
  });

  if (!masterPassword || masterPassword.length < 8) {
    logger.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  // Confirm password for first-time encryption
  const vault = await loadVault(cwd);
  if (!vault.environments[environment]) {
    const confirmPassword = await passwordPrompt({
      message: 'Confirm master password:',
      mask: '•',
    });

    if (masterPassword !== confirmPassword) {
      logger.error('Passwords do not match.');
      process.exit(1);
    }
  }

  // Encrypt
  const spinner = ora('Encrypting environment...').start();

  try {
    await encryptEnvironment(vault, environment, envContent, masterPassword);
    await saveVault(cwd, vault);
    spinner.succeed(`Encrypted ${chalk.bold(varCount)} variables → .env.vault`);
    logger.br();
    logger.dim('The .env.vault file is safe to commit to git.');
    logger.dim(`Decrypt with: zink decrypt -e ${environment}`);
  } catch (err) {
    spinner.fail('Encryption failed');
    logger.error(err.message);
    process.exit(1);
  }
}
