import chalk from 'chalk';
import { loadConfig, resolveEnvironment } from '../core/config.js';
import { loadEnvFile, getEnvFileName } from '../core/vault.js';
import { parse } from '../core/parser.js';
import { logger } from '../utils/logger.js';

// ─── zink validate ──────────────────────────────────────────────

export async function validateCommand(options) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const environment = resolveEnvironment(options.env, config);

  // Load env file
  const envContent = await loadEnvFile(cwd, environment);
  if (!envContent) {
    logger.error(`No ${getEnvFileName(environment)} file found.`);
    process.exit(1);
  }

  logger.section(`Validating: ${getEnvFileName(environment)}`);

  const issues = [];
  const warnings = [];
  const envVars = parse(envContent);
  const lines = envContent.split('\n');

  // Check 1: Empty values
  for (const [key, value] of Object.entries(envVars)) {
    if (value === '') {
      warnings.push(`${key} has an empty value`);
    }
  }

  // Check 2: Duplicate keys
  const seenKeys = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const cleaned = line.startsWith('export ') ? line.slice(7).trim() : line;
    const eqIdx = cleaned.indexOf('=');
    if (eqIdx === -1) continue;

    const key = cleaned.slice(0, eqIdx).trim();
    if (seenKeys[key] !== undefined) {
      issues.push(`Duplicate key "${key}" on lines ${seenKeys[key] + 1} and ${i + 1}`);
    }
    seenKeys[key] = i;
  }

  // Check 3: Invalid key names
  for (const key of Object.keys(envVars)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      issues.push(`Invalid key name: "${key}" (must be alphanumeric with underscores)`);
    }
  }

  // Check 4: Potential security issues
  for (const [key, value] of Object.entries(envVars)) {
    // Check for localhost in production-like keys
    if (
      environment === 'production' &&
      (value.includes('localhost') || value.includes('127.0.0.1'))
    ) {
      warnings.push(`${key} contains localhost (production env)`);
    }

    // Check for common placeholder values
    const placeholders = [
      'your_', 'xxx', 'TODO', 'FIXME', 'CHANGE_ME', 'replace_',
      'example', 'test_key', 'sk_test_', 'pk_test_',
    ];
    for (const p of placeholders) {
      if (value.toLowerCase().includes(p.toLowerCase())) {
        warnings.push(`${key} may contain a placeholder value ("${p}")`);
        break;
      }
    }

    // Check for very short secrets
    const secretKeys = ['SECRET', 'PASSWORD', 'TOKEN', 'KEY', 'PRIVATE'];
    if (
      secretKeys.some((s) => key.toUpperCase().includes(s)) &&
      value.length > 0 &&
      value.length < 8
    ) {
      warnings.push(`${key} looks like a secret but is very short (${value.length} chars)`);
    }
  }

  // Check 5: Compare with .env.example if it exists
  try {
    const { loadEnvFile: loadFile } = await import('../core/vault.js');
    const exampleContent = await loadEnvFile(cwd, 'example');
    if (exampleContent) {
      const exampleVars = parse(exampleContent);
      for (const key of Object.keys(exampleVars)) {
        if (!(key in envVars)) {
          issues.push(`Missing key "${key}" (defined in .env.example)`);
        }
      }
    }
  } catch {
    // No .env.example, skip
  }

  // Report results
  const varCount = Object.keys(envVars).length;
  logger.info(`Found ${chalk.bold(varCount)} variables`);
  logger.br();

  if (issues.length > 0) {
    console.log(chalk.red.bold('  Errors:'));
    for (const issue of issues) {
      console.log(chalk.red(`  ✖ ${issue}`));
    }
    logger.br();
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow.bold('  Warnings:'));
    for (const warning of warnings) {
      console.log(chalk.yellow(`  ⚠ ${warning}`));
    }
    logger.br();
  }

  if (issues.length === 0 && warnings.length === 0) {
    logger.success('No issues found! ✨');
  } else {
    logger.dim(`${issues.length} error${issues.length !== 1 ? 's' : ''}, ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`);
  }

  // Exit with error code if there are issues
  if (issues.length > 0) {
    process.exit(1);
  }
}
