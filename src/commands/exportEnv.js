import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { loadConfig, resolveEnvironment } from '../core/config.js';
import { loadEnvFile, getEnvFileName } from '../core/vault.js';
import { parse, toJSON, toYAML, toDockerEnv, serialize } from '../core/parser.js';
import { logger } from '../utils/logger.js';

// ─── zink export ────────────────────────────────────────────────

const FORMATS = {
  json: { ext: '.json', converter: toJSON, name: 'JSON' },
  yaml: { ext: '.yaml', converter: toYAML, name: 'YAML' },
  yml: { ext: '.yaml', converter: toYAML, name: 'YAML' },
  docker: { ext: '.env.docker', converter: toDockerEnv, name: 'Docker env-file' },
  env: { ext: '.env.export', converter: (env) => serialize(env, { quote: true }), name: '.env' },
};

export async function exportCommand(options) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const environment = resolveEnvironment(options.env, config);

  const format = (options.format || 'json').toLowerCase();

  if (!FORMATS[format]) {
    logger.error(`Unknown format: "${format}"`);
    logger.dim(`Supported: ${Object.keys(FORMATS).join(', ')}`);
    process.exit(1);
  }

  // Load env file
  const envContent = await loadEnvFile(cwd, environment);
  if (!envContent) {
    logger.error(`No ${getEnvFileName(environment)} file found.`);
    process.exit(1);
  }

  const envVars = parse(envContent);
  const { ext, converter, name } = FORMATS[format];

  // Convert
  const output = converter(envVars);

  if (options.stdout) {
    process.stdout.write(output);
    return;
  }

  // Determine output path
  const outputFile = options.output || `env.${environment}${ext}`;
  const outputPath = path.join(cwd, outputFile);

  await fs.writeFile(outputPath, output, 'utf8');

  const varCount = Object.keys(envVars).length;
  logger.success(`Exported ${chalk.bold(varCount)} variables as ${name} → ${outputFile}`);
}
