import chalk from 'chalk';
import { loadConfig } from '../core/config.js';
import { loadEnvFile, getEnvFileName } from '../core/vault.js';
import { parse } from '../core/parser.js';
import { logger } from '../utils/logger.js';

// ─── zink diff ──────────────────────────────────────────────────

export async function diffCommand(env1, env2, options) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);

  if (!env1 || !env2) {
    logger.error('Two environment names required.');
    logger.dim('Usage: zink diff development production');
    process.exit(1);
  }

  // Load both env files
  const content1 = await loadEnvFile(cwd, env1);
  const content2 = await loadEnvFile(cwd, env2);

  if (!content1) {
    logger.error(`No env file found for "${env1}".`);
    process.exit(1);
  }
  if (!content2) {
    logger.error(`No env file found for "${env2}".`);
    process.exit(1);
  }

  const vars1 = parse(content1);
  const vars2 = parse(content2);

  const allKeys = [...new Set([...Object.keys(vars1), ...Object.keys(vars2)])].sort();

  const onlyIn1 = [];
  const onlyIn2 = [];
  const different = [];
  const same = [];

  for (const key of allKeys) {
    const in1 = key in vars1;
    const in2 = key in vars2;

    if (in1 && !in2) {
      onlyIn1.push(key);
    } else if (!in1 && in2) {
      onlyIn2.push(key);
    } else if (vars1[key] !== vars2[key]) {
      different.push(key);
    } else {
      same.push(key);
    }
  }

  logger.section(`Diff: ${env1} ↔ ${env2}`);

  // Summary
  logger.info(`${chalk.bold(allKeys.length)} total keys`);
  logger.dim(`  ${chalk.green(same.length)} identical  •  ${chalk.yellow(different.length)} different  •  ${chalk.red(onlyIn1.length + onlyIn2.length)} missing`);
  logger.br();

  // Only in env1
  if (onlyIn1.length > 0) {
    console.log(chalk.red.bold(`  Only in ${env1}:`));
    for (const key of onlyIn1) {
      console.log(chalk.red(`  - ${key}`));
    }
    logger.br();
  }

  // Only in env2
  if (onlyIn2.length > 0) {
    console.log(chalk.green.bold(`  Only in ${env2}:`));
    for (const key of onlyIn2) {
      console.log(chalk.green(`  + ${key}`));
    }
    logger.br();
  }

  // Different values
  if (different.length > 0) {
    console.log(chalk.yellow.bold('  Different values:'));
    for (const key of different) {
      console.log(chalk.yellow(`  ~ ${key}`));
      if (options.values) {
        console.log(chalk.red(`    - ${vars1[key]}`));
        console.log(chalk.green(`    + ${vars2[key]}`));
      }
    }
    logger.br();
  }

  // All same
  if (onlyIn1.length === 0 && onlyIn2.length === 0 && different.length === 0) {
    logger.success('Environments are identical! 🎉');
  }
}
