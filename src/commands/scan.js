import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import fg from 'fast-glob';
import { logger } from '../utils/logger.js';
import { SECRET_PATTERNS, SCAN_EXTENSIONS, SCAN_IGNORE } from '../utils/constants.js';

// ─── zink scan ──────────────────────────────────────────────────

export async function scanCommand(options) {
  const cwd = process.cwd();
  const scanPath = options.path || cwd;

  logger.section('Scanning for leaked secrets');

  const spinner = ora('Finding files to scan...').start();

  // Find files to scan
  const files = await fg(SCAN_EXTENSIONS, {
    cwd: scanPath,
    absolute: true,
    ignore: SCAN_IGNORE,
    dot: false,
  });

  spinner.text = `Scanning ${files.length} files...`;

  const findings = [];
  let scannedCount = 0;

  for (const filePath of files) {
    try {
      const stat = await fs.stat(filePath);

      // Skip large files (> 1MB)
      if (stat.size > 1024 * 1024) continue;

      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative(cwd, filePath);

      for (const { name, pattern } of SECRET_PATTERNS) {
        // Reset regex lastIndex
        pattern.lastIndex = 0;

        let match;
        while ((match = pattern.exec(content)) !== null) {
          // Get line number
          const lineNum = content.slice(0, match.index).split('\n').length;
          const line = content.split('\n')[lineNum - 1]?.trim() || '';

          // Skip if it's a common false positive
          if (isFalsePositive(line, match[0], name)) continue;

          findings.push({
            file: relativePath,
            line: lineNum,
            type: name,
            match: maskSecret(match[0]),
            context: truncateLine(line, 80),
          });
        }
      }

      scannedCount++;
      if (scannedCount % 50 === 0) {
        spinner.text = `Scanned ${scannedCount}/${files.length} files...`;
      }
    } catch {
      // Skip files we can't read
    }
  }

  spinner.stop();

  logger.info(`Scanned ${chalk.bold(scannedCount)} files`);
  logger.br();

  if (findings.length === 0) {
    logger.success('No leaked secrets found! 🎉');
    return;
  }

  // Group findings by type
  const grouped = {};
  for (const finding of findings) {
    if (!grouped[finding.type]) {
      grouped[finding.type] = [];
    }
    grouped[finding.type].push(finding);
  }

  // Display findings
  console.log(chalk.red.bold(`  Found ${findings.length} potential secret${findings.length !== 1 ? 's' : ''}:`));
  logger.br();

  for (const [type, items] of Object.entries(grouped)) {
    console.log(chalk.yellow.bold(`  ${type} (${items.length}):`));
    for (const item of items) {
      console.log(chalk.gray(`    ${item.file}:${item.line}`));
      console.log(chalk.dim(`      ${item.context}`));
    }
    logger.br();
  }

  // Recommendations
  logger.box('💡 Recommendations', [
    '1. Move secrets to .env files',
    '2. Use environment variables in your code',
    '3. Add .env to .gitignore',
    '4. Use `zink encrypt` to secure your vault',
  ]);

  if (options.strict) {
    process.exit(1);
  }
}

/**
 * Check if a match is likely a false positive.
 */
function isFalsePositive(line, match, type) {
  const lower = line.toLowerCase();

  // Skip comments
  if (lower.trimStart().startsWith('//') || lower.trimStart().startsWith('#') || lower.trimStart().startsWith('*')) {
    return true;
  }

  // Skip test/example/documentation patterns
  if (
    lower.includes('example') ||
    lower.includes('sample') ||
    lower.includes('placeholder') ||
    lower.includes('your_') ||
    lower.includes('xxx')
  ) {
    return true;
  }

  // Skip common UUID false positives for Heroku pattern
  if (type === 'Heroku API Key' && lower.includes('uuid')) {
    return true;
  }

  // Skip if the match is just "password" or similar common word in a config
  if (type === 'Generic Secret' && match.length < 12) {
    return true;
  }

  return false;
}

/**
 * Mask a secret value for display.
 */
function maskSecret(value) {
  if (value.length <= 8) return '••••••••';
  return value.slice(0, 4) + '•'.repeat(Math.min(value.length - 8, 20)) + value.slice(-4);
}

/**
 * Truncate a line for display.
 */
function truncateLine(line, maxLen) {
  if (line.length <= maxLen) return line;
  return line.slice(0, maxLen - 3) + '...';
}
