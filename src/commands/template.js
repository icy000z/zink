import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { loadConfig, resolveEnvironment } from '../core/config.js';
import { loadEnvFile, getEnvFileName } from '../core/vault.js';
import { parse, toTemplate } from '../core/parser.js';
import { logger } from '../utils/logger.js';
import { EXAMPLE_FILE } from '../utils/constants.js';

// ─── zink template ──────────────────────────────────────────────

export async function templateCommand(options) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const environment = resolveEnvironment(options.env, config);

  // Load env file
  const envContent = await loadEnvFile(cwd, environment);
  if (!envContent) {
    logger.error(`No ${getEnvFileName(environment)} file found.`);
    logger.dim('Create variables first: zink set KEY=VALUE');
    process.exit(1);
  }

  const envVars = parse(envContent);
  const varCount = Object.keys(envVars).length;

  if (varCount === 0) {
    logger.warn('No variables found to create a template from.');
    return;
  }

  // Generate template
  const template = toTemplate(envVars, {
    withDescriptions: !options.bare,
  });

  const outputPath = options.output || EXAMPLE_FILE;
  const fullPath = path.join(cwd, outputPath);

  // Check for overwrite
  try {
    await fs.access(fullPath);
    if (!options.force) {
      logger.warn(`${outputPath} already exists. Use --force to overwrite.`);
      return;
    }
  } catch {
    // File doesn't exist, good
  }

  await fs.writeFile(fullPath, template, 'utf8');
  logger.success(`Generated ${chalk.bold(outputPath)} with ${varCount} variables`);
  logger.br();
  logger.dim(`This file is safe to commit — it contains no secret values.`);
}
