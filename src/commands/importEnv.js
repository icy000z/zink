import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { loadConfig, resolveEnvironment } from '../core/config.js';
import { saveEnvFile, getEnvFileName, loadEnvFile } from '../core/vault.js';
import { parse, serialize, fromJSON, fromYAML } from '../core/parser.js';
import { logger } from '../utils/logger.js';

// ─── zink import ────────────────────────────────────────────────

export async function importCommand(file, options) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const environment = resolveEnvironment(options.env, config);

  if (!file) {
    logger.error('No input file specified.');
    logger.dim('Usage: zink import <file> [--format json|yaml|env]');
    process.exit(1);
  }

  const filePath = path.resolve(cwd, file);

  // Check file exists
  try {
    await fs.access(filePath);
  } catch {
    logger.error(`File not found: ${file}`);
    process.exit(1);
  }

  const content = await fs.readFile(filePath, 'utf8');

  // Detect or use specified format
  const format = options.format || detectFormat(file);

  let imported;
  try {
    switch (format) {
      case 'json':
        imported = fromJSON(content);
        break;
      case 'yaml':
      case 'yml':
        imported = fromYAML(content);
        break;
      case 'env':
        imported = parse(content);
        break;
      default:
        logger.error(`Unknown format: "${format}"`);
        logger.dim('Supported: json, yaml, env');
        process.exit(1);
    }
  } catch (err) {
    logger.error(`Failed to parse ${file}: ${err.message}`);
    process.exit(1);
  }

  const varCount = Object.keys(imported).length;

  if (varCount === 0) {
    logger.warn('No variables found in the import file.');
    return;
  }

  // Merge with existing if --merge flag
  let finalVars = imported;
  if (options.merge) {
    const existingContent = (await loadEnvFile(cwd, environment)) || '';
    const existing = parse(existingContent);
    finalVars = { ...existing, ...imported };
    logger.info(`Merging with existing ${getEnvFileName(environment)}`);
  }

  // Save
  const serialized = serialize(finalVars, { sort: false });
  await saveEnvFile(cwd, environment, serialized);

  logger.success(
    `Imported ${chalk.bold(varCount)} variables from ${file} → ${getEnvFileName(environment)}`
  );

  if (options.merge) {
    logger.dim(`Total variables: ${Object.keys(finalVars).length}`);
  }

  logger.br();
  logger.dim(`Don't forget to encrypt: zink encrypt -e ${environment}`);
}

/**
 * Detect format from file extension.
 */
function detectFormat(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.json':
      return 'json';
    case '.yaml':
    case '.yml':
      return 'yaml';
    default:
      return 'env';
  }
}
