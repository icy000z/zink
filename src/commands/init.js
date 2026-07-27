import { password as passwordPrompt, select, confirm } from '@inquirer/prompts';
import { saveConfig, loadConfig } from '../core/config.js';
import { createEmptyVault, saveVault, vaultExists } from '../core/vault.js';
import { logger } from '../utils/logger.js';
import { DEFAULT_ENVIRONMENTS, VAULT_FILE, CONFIG_FILE } from '../utils/constants.js';
import fs from 'node:fs/promises';
import path from 'node:path';

// ─── zink init ──────────────────────────────────────────────────

export async function initCommand(options) {
  const cwd = process.cwd();

  // Check if already initialized
  const config = await loadConfig(cwd);
  const hasVault = await vaultExists(cwd);

  if (hasVault && !options.force) {
    logger.warn('Zink is already initialized in this project.');
    logger.dim(`Vault file: ${VAULT_FILE}`);
    logger.dim(`Config file: ${CONFIG_FILE}`);
    logger.br();
    logger.info('Use --force to reinitialize.');
    return;
  }

  logger.section('Initializing Zink Vault');

  // Create config
  const newConfig = {
    defaultEnvironment: options.env || 'development',
    environments: [...DEFAULT_ENVIRONMENTS],
  };

  await saveConfig(cwd, newConfig);
  logger.success(`Created ${CONFIG_FILE}`);

  // Create vault file
  const vault = createEmptyVault();
  await saveVault(cwd, vault);
  logger.success(`Created ${VAULT_FILE}`);

  // Update .gitignore if it exists
  await updateGitignore(cwd);

  // Show summary
  logger.box('🔐 Zink initialized!', [
    `Config:  ${CONFIG_FILE}`,
    `Vault:   ${VAULT_FILE}`,
    `Envs:    ${newConfig.environments.join(', ')}`,
    '',
    'Next steps:',
    '  1. Add vars:    zink set DATABASE_URL=postgres://...',
    '  2. Encrypt:     zink encrypt',
    '  3. Commit:      git add .env.vault .zinkrc',
  ]);
}

async function updateGitignore(projectDir) {
  const gitignorePath = path.join(projectDir, '.gitignore');

  const entriesToAdd = [
    '',
    '# Zink - Environment files (encrypted vault is safe to commit)',
    '.env',
    '.env.*',
    '!.env.vault',
    '!.env.example',
  ];

  try {
    let content = '';
    try {
      content = await fs.readFile(gitignorePath, 'utf8');
    } catch {
      // File doesn't exist, that's fine
    }

    // Check if already has zink entries
    if (content.includes('.env.vault') || content.includes('# Zink')) {
      logger.dim('.gitignore already configured');
      return;
    }

    content += entriesToAdd.join('\n') + '\n';
    await fs.writeFile(gitignorePath, content, 'utf8');
    logger.success('Updated .gitignore');
  } catch (err) {
    logger.warn(`Could not update .gitignore: ${err.message}`);
  }
}
