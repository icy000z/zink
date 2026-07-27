import chalk from 'chalk';

// ─── Zink Logger ────────────────────────────────────────────────

const BRAND = chalk.hex('#7C3AED').bold('zink');

export const logger = {
  // Branded prefix
  brand: () => BRAND,

  // Info messages
  info: (msg) => console.log(`${chalk.blue('ℹ')} ${msg}`),

  // Success messages
  success: (msg) => console.log(`${chalk.green('✔')} ${msg}`),

  // Warning messages
  warn: (msg) => console.log(`${chalk.yellow('⚠')} ${msg}`),

  // Error messages
  error: (msg) => console.error(`${chalk.red('✖')} ${msg}`),

  // Debug messages (only in verbose mode)
  debug: (msg) => {
    if (process.env.ZINK_DEBUG) {
      console.log(`${chalk.gray('⊙')} ${chalk.gray(msg)}`);
    }
  },

  // Key-value display
  kv: (key, value, options = {}) => {
    const { masked = false, color = 'white' } = options;
    const displayValue = masked ? '••••••••' : value;
    console.log(`  ${chalk.gray(key)} ${chalk.dim('=')} ${chalk[color](displayValue)}`);
  },

  // Section header
  section: (title) => {
    console.log();
    console.log(`${chalk.hex('#7C3AED').bold('▸')} ${chalk.bold(title)}`);
    console.log(chalk.gray('─'.repeat(50)));
  },

  // Blank line
  br: () => console.log(),

  // Dimmed text
  dim: (msg) => console.log(`  ${chalk.dim(msg)}`),

  // Table-like row
  row: (col1, col2, col3 = '') => {
    const c1 = col1.padEnd(25);
    const c2 = col2.padEnd(20);
    console.log(`  ${chalk.white(c1)} ${chalk.dim(c2)} ${chalk.gray(col3)}`);
  },

  // Box message
  box: (title, lines) => {
    const maxLen = Math.max(title.length, ...lines.map((l) => l.length)) + 4;
    const border = chalk.gray('─'.repeat(maxLen));
    console.log();
    console.log(`  ${chalk.gray('┌')}${border}${chalk.gray('┐')}`);
    console.log(`  ${chalk.gray('│')} ${chalk.bold.hex('#7C3AED')(title.padEnd(maxLen - 2))} ${chalk.gray('│')}`);
    console.log(`  ${chalk.gray('├')}${border}${chalk.gray('┤')}`);
    for (const line of lines) {
      console.log(`  ${chalk.gray('│')} ${line.padEnd(maxLen - 2)} ${chalk.gray('│')}`);
    }
    console.log(`  ${chalk.gray('└')}${border}${chalk.gray('┘')}`);
    console.log();
  },
};
