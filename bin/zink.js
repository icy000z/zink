#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Load package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

// ─── Zink CLI ───────────────────────────────────────────────────

const program = new Command();

program
  .name('zink')
  .description(
    chalk.hex('#7C3AED').bold('🔐 zink') +
    chalk.dim(' — Smart .env vault. Encrypt, sync & manage secrets.')
  )
  .version(pkg.version, '-v, --version');

// ─── init ───────────────────────────────────────────────────────
program
  .command('init')
  .description('Initialize a new zink vault in the current project')
  .option('-e, --env <environment>', 'Default environment', 'development')
  .option('-f, --force', 'Force reinitialize')
  .action(async (options) => {
    const { initCommand } = await import('../src/commands/init.js');
    await initCommand(options);
  });

// ─── encrypt ────────────────────────────────────────────────────
program
  .command('encrypt')
  .description('Encrypt .env file into the vault')
  .option('-e, --env <environment>', 'Target environment')
  .action(async (options) => {
    const { encryptCommand } = await import('../src/commands/encrypt.js');
    await encryptCommand(options);
  });

// ─── decrypt ────────────────────────────────────────────────────
program
  .command('decrypt')
  .description('Decrypt vault back to .env file')
  .option('-e, --env <environment>', 'Target environment')
  .option('-f, --force', 'Overwrite existing .env without confirmation')
  .option('--stdout', 'Output to stdout instead of file')
  .action(async (options) => {
    const { decryptCommand } = await import('../src/commands/decrypt.js');
    await decryptCommand(options);
  });

// ─── set ────────────────────────────────────────────────────────
program
  .command('set')
  .description('Set environment variable(s)')
  .argument('<pairs...>', 'KEY=VALUE pairs (e.g., DB_HOST=localhost DB_PORT=5432)')
  .option('-e, --env <environment>', 'Target environment')
  .action(async (pairs, options) => {
    const { setCommand } = await import('../src/commands/set.js');
    await setCommand(pairs, options);
  });

// ─── get ────────────────────────────────────────────────────────
program
  .command('get')
  .description('Get a variable\'s value')
  .argument('<key>', 'Variable name')
  .option('-e, --env <environment>', 'Target environment')
  .option('-r, --raw', 'Output raw value (no formatting)')
  .option('-m, --masked', 'Mask the value')
  .action(async (key, options) => {
    const { getCommand } = await import('../src/commands/get.js');
    await getCommand(key, options);
  });

// ─── ls ─────────────────────────────────────────────────────────
program
  .command('ls')
  .description('List all variables in an environment')
  .option('-e, --env <environment>', 'Target environment')
  .option('-s, --show', 'Show actual values (default: masked)')
  .action(async (options) => {
    const { lsCommand } = await import('../src/commands/ls.js');
    await lsCommand(options);
  });

// ─── rm ─────────────────────────────────────────────────────────
program
  .command('rm')
  .description('Remove variable(s)')
  .argument('<keys...>', 'Variable name(s) to remove')
  .option('-e, --env <environment>', 'Target environment')
  .option('-f, --force', 'Skip confirmation')
  .action(async (keys, options) => {
    const { rmCommand } = await import('../src/commands/rm.js');
    await rmCommand(keys, options);
  });

// ─── diff ───────────────────────────────────────────────────────
program
  .command('diff')
  .description('Compare variables between two environments')
  .argument('<env1>', 'First environment (e.g., development)')
  .argument('<env2>', 'Second environment (e.g., production)')
  .option('--values', 'Show actual value differences')
  .action(async (env1, env2, options) => {
    const { diffCommand } = await import('../src/commands/diff.js');
    await diffCommand(env1, env2, options);
  });

// ─── validate ───────────────────────────────────────────────────
program
  .command('validate')
  .description('Validate .env file for common issues')
  .option('-e, --env <environment>', 'Target environment')
  .action(async (options) => {
    const { validateCommand } = await import('../src/commands/validate.js');
    await validateCommand(options);
  });

// ─── template ───────────────────────────────────────────────────
program
  .command('template')
  .description('Generate .env.example from current environment')
  .option('-e, --env <environment>', 'Source environment')
  .option('-o, --output <file>', 'Output filename', '.env.example')
  .option('-f, --force', 'Overwrite existing file')
  .option('--bare', 'Skip auto-generated descriptions')
  .action(async (options) => {
    const { templateCommand } = await import('../src/commands/template.js');
    await templateCommand(options);
  });

// ─── scan ───────────────────────────────────────────────────────
program
  .command('scan')
  .description('Scan codebase for leaked secrets')
  .option('-p, --path <directory>', 'Directory to scan', '.')
  .option('--strict', 'Exit with error code if secrets found')
  .action(async (options) => {
    const { scanCommand } = await import('../src/commands/scan.js');
    await scanCommand(options);
  });

// ─── export ─────────────────────────────────────────────────────
program
  .command('export')
  .description('Export variables to other formats')
  .option('-e, --env <environment>', 'Source environment')
  .option('-f, --format <format>', 'Output format (json, yaml, docker, env)', 'json')
  .option('-o, --output <file>', 'Output filename')
  .option('--stdout', 'Output to stdout')
  .action(async (options) => {
    const { exportCommand } = await import('../src/commands/exportEnv.js');
    await exportCommand(options);
  });

// ─── import ─────────────────────────────────────────────────────
program
  .command('import')
  .description('Import variables from external formats')
  .argument('<file>', 'Input file path')
  .option('-e, --env <environment>', 'Target environment')
  .option('-f, --format <format>', 'Input format (json, yaml, env)')
  .option('-m, --merge', 'Merge with existing variables')
  .action(async (file, options) => {
    const { importCommand } = await import('../src/commands/importEnv.js');
    await importCommand(file, options);
  });

// ─── Error handling ─────────────────────────────────────────────
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (err) {
  if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
    process.exit(0);
  }
  if (err.code === 'commander.missingArgument' || err.code === 'commander.unknownCommand') {
    process.exit(1);
  }
  // Unexpected errors
  if (err.code !== 'ERR_USE_AFTER_CLOSE' && err.message !== 'User force closed the prompt with 0 null') {
    console.error(chalk.red(`\n✖ ${err.message}`));
    if (process.env.ZINK_DEBUG) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
