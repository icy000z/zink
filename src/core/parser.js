// ─── Zink .env Parser ───────────────────────────────────────────

/**
 * Parse a .env file string into a key-value object.
 * Supports comments (#), empty lines, quoted values, multiline values,
 * and export prefixes.
 *
 * @param {string} content - Raw .env file content
 * @returns {Record<string, string>} Parsed key-value pairs
 */
export function parse(content) {
  const result = {};
  const lines = content.split('\n');

  let currentKey = null;
  let currentValue = '';
  let multilineQuote = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // If we're in a multiline value
    if (multilineQuote) {
      if (line.includes(multilineQuote)) {
        // End of multiline
        const endIdx = line.indexOf(multilineQuote);
        currentValue += '\n' + line.slice(0, endIdx);
        result[currentKey] = currentValue;
        currentKey = null;
        currentValue = '';
        multilineQuote = null;
      } else {
        currentValue += '\n' + line;
      }
      continue;
    }

    // Skip empty lines and comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Remove `export ` prefix
    const cleaned = trimmed.startsWith('export ')
      ? trimmed.slice(7).trim()
      : trimmed;

    // Find the first = sign
    const eqIdx = cleaned.indexOf('=');
    if (eqIdx === -1) continue;

    const key = cleaned.slice(0, eqIdx).trim();
    let value = cleaned.slice(eqIdx + 1).trim();

    // Handle quoted values
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      // Single-line quoted value
      value = value.slice(1, -1);
      // Unescape common sequences for double quotes
      if (cleaned.slice(eqIdx + 1).trim().startsWith('"')) {
        value = value
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
      result[key] = value;
    } else if (
      (value.startsWith('"') || value.startsWith("'")) &&
      !value.endsWith(value[0])
    ) {
      // Start of multiline value
      multilineQuote = value[0];
      currentKey = key;
      currentValue = value.slice(1);
    } else {
      // Unquoted value — strip inline comments
      const commentIdx = value.indexOf(' #');
      if (commentIdx !== -1) {
        value = value.slice(0, commentIdx).trim();
      }
      result[key] = value;
    }
  }

  // Handle unclosed multiline (treat as regular value)
  if (currentKey) {
    result[currentKey] = currentValue;
  }

  return result;
}

/**
 * Serialize a key-value object back into .env file format.
 *
 * @param {Record<string, string>} env - Key-value pairs
 * @param {Object} options - Serialization options
 * @param {boolean} options.sort - Sort keys alphabetically
 * @param {boolean} options.quote - Quote all values
 * @returns {string} .env file content
 */
export function serialize(env, options = {}) {
  const { sort = false, quote = false } = options;

  let keys = Object.keys(env);
  if (sort) {
    keys = keys.sort();
  }

  const lines = [];

  for (const key of keys) {
    const value = env[key];

    // Determine if value needs quoting
    const needsQuoting =
      quote ||
      value.includes(' ') ||
      value.includes('#') ||
      value.includes('\n') ||
      value.includes('"') ||
      value.includes("'") ||
      value === '';

    if (value.includes('\n')) {
      // Multiline value — use double quotes
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      lines.push(`${key}="${escaped}"`);
    } else if (needsQuoting) {
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      lines.push(`${key}="${escaped}"`);
    } else {
      lines.push(`${key}=${value}`);
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Generate a template (.env.example) from parsed env vars.
 * Values are replaced with empty strings or descriptive placeholders.
 *
 * @param {Record<string, string>} env - Key-value pairs
 * @param {Object} options
 * @param {boolean} options.withDescriptions - Add placeholder descriptions
 * @returns {string}
 */
export function toTemplate(env, options = {}) {
  const { withDescriptions = true } = options;

  const lines = ['# Environment Variables Template', '# Copy this to .env and fill in your values', ''];

  const keys = Object.keys(env).sort();

  for (const key of keys) {
    if (withDescriptions) {
      const hint = guessDescription(key);
      if (hint) {
        lines.push(`# ${hint}`);
      }
    }
    lines.push(`${key}=`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Convert env object to JSON string.
 */
export function toJSON(env) {
  return JSON.stringify(env, null, 2) + '\n';
}

/**
 * Convert env object to YAML string.
 */
export function toYAML(env) {
  const lines = [];
  for (const [key, value] of Object.entries(env)) {
    // Quote values that need it in YAML
    const needsQuoting =
      value.includes(':') ||
      value.includes('#') ||
      value.includes('{') ||
      value.includes('}') ||
      value.includes('[') ||
      value.includes(']') ||
      value.includes(',') ||
      value.includes('&') ||
      value.includes('*') ||
      value.includes('?') ||
      value.includes('|') ||
      value.includes('>') ||
      value.includes("'") ||
      value.includes('"') ||
      value.startsWith(' ') ||
      value.endsWith(' ') ||
      value === '' ||
      value === 'true' ||
      value === 'false' ||
      value === 'null' ||
      !isNaN(Number(value));

    if (needsQuoting) {
      const escaped = value.replace(/"/g, '\\"');
      lines.push(`${key}: "${escaped}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join('\n') + '\n';
}

/**
 * Convert env object to Docker env-file format.
 */
export function toDockerEnv(env) {
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n';
}

/**
 * Parse JSON string into env object.
 */
export function fromJSON(content) {
  const parsed = JSON.parse(content);
  const result = {};
  for (const [key, value] of Object.entries(parsed)) {
    result[key] = String(value);
  }
  return result;
}

/**
 * Parse simple YAML into env object (flat key: value only).
 */
export function fromYAML(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim();
    // Remove quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

/**
 * Guess a human-readable description for a common env var key.
 */
function guessDescription(key) {
  const upper = key.toUpperCase();
  const hints = {
    DATABASE_URL: 'Database connection string',
    DB_HOST: 'Database host',
    DB_PORT: 'Database port',
    DB_NAME: 'Database name',
    DB_USER: 'Database username',
    DB_PASSWORD: 'Database password',
    REDIS_URL: 'Redis connection string',
    PORT: 'Application port',
    HOST: 'Application host',
    NODE_ENV: 'Node environment (development, production, test)',
    API_KEY: 'API key',
    API_SECRET: 'API secret',
    SECRET_KEY: 'Application secret key',
    JWT_SECRET: 'JWT signing secret',
    AWS_ACCESS_KEY_ID: 'AWS access key ID',
    AWS_SECRET_ACCESS_KEY: 'AWS secret access key',
    AWS_REGION: 'AWS region',
    S3_BUCKET: 'S3 bucket name',
    SMTP_HOST: 'SMTP mail server host',
    SMTP_PORT: 'SMTP mail server port',
    SMTP_USER: 'SMTP username',
    SMTP_PASSWORD: 'SMTP password',
    STRIPE_SECRET_KEY: 'Stripe secret key',
    STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key',
    SENTRY_DSN: 'Sentry DSN for error tracking',
    NEXT_PUBLIC_API_URL: 'Public API URL',
    VITE_API_URL: 'Vite public API URL',
  };

  if (hints[upper]) return hints[upper];

  // Generic hints based on patterns
  if (upper.includes('SECRET')) return 'Secret key';
  if (upper.includes('PASSWORD') || upper.includes('PASSWD')) return 'Password';
  if (upper.includes('TOKEN')) return 'Authentication token';
  if (upper.includes('API_KEY') || upper.includes('APIKEY')) return 'API key';
  if (upper.includes('URL') || upper.includes('URI')) return 'URL endpoint';
  if (upper.includes('HOST')) return 'Hostname';
  if (upper.includes('PORT')) return 'Port number';
  if (upper.includes('EMAIL') || upper.includes('MAIL')) return 'Email address';

  return null;
}
