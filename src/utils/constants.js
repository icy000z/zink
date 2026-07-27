// ─── Zink Constants ─────────────────────────────────────────────

export const VAULT_FILE = '.env.vault';
export const CONFIG_FILE = '.zinkrc';
export const ENV_FILE = '.env';
export const EXAMPLE_FILE = '.env.example';

export const DEFAULT_ENVIRONMENTS = ['development', 'staging', 'production'];
export const DEFAULT_ENVIRONMENT = 'development';

// Encryption
export const ALGORITHM = 'aes-256-gcm';
export const KDF = 'pbkdf2';
export const KDF_ITERATIONS = 100000;
export const KDF_DIGEST = 'sha512';
export const SALT_LENGTH = 32;
export const IV_LENGTH = 16;
export const KEY_LENGTH = 32;
export const AUTH_TAG_LENGTH = 16;

// Vault format version
export const VAULT_VERSION = 1;

// Secret patterns for scanning
export const SECRET_PATTERNS = [
  { name: 'AWS Access Key', pattern: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g },
  { name: 'AWS Secret Key', pattern: /(?:aws_secret_access_key|aws_secret)\s*[:=]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi },
  { name: 'GitHub Token', pattern: /gh[pousr]_[A-Za-z0-9_]{36,255}/g },
  { name: 'GitHub Personal Access Token', pattern: /github_pat_[A-Za-z0-9_]{22,255}/g },
  { name: 'Google API Key', pattern: /AIza[0-9A-Za-z\-_]{35}/g },
  { name: 'Slack Token', pattern: /xox[baprs]-[0-9]{10,13}-[0-9A-Za-z-]{24,34}/g },
  { name: 'Stripe Key', pattern: /(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24,}/g },
  { name: 'Private Key', pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'Generic Secret', pattern: /(?:secret|password|passwd|token|api_key|apikey|access_key|auth)[\s]*[:=][\s]*['"]?([^\s'"]{8,})['"]?/gi },
  { name: 'Database URL', pattern: /(?:postgres|mysql|mongodb|redis):\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/gi },
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g },
  { name: 'Heroku API Key', pattern: /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g },
  { name: 'SendGrid API Key', pattern: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/g },
  { name: 'Twilio API Key', pattern: /SK[0-9a-fA-F]{32}/g },
  { name: 'npm Token', pattern: /npm_[A-Za-z0-9]{36}/g },
];

// File extensions to scan
export const SCAN_EXTENSIONS = [
  '**/*.{js,jsx,ts,tsx,py,rb,go,java,php,rs,c,cpp,cs,swift,kt}',
  '**/*.{json,yaml,yml,toml,xml,ini,cfg,conf}',
  '**/*.{sh,bash,zsh,fish,ps1,bat,cmd}',
  '**/*.{html,htm,css,scss,less}',
  '**/*.{md,txt,log}',
  '**/Dockerfile*',
  '**/docker-compose*.{yml,yaml}',
  '**/.github/**',
];

// Directories to ignore during scanning
export const SCAN_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/vendor/**',
  '**/__pycache__/**',
  '**/venv/**',
  '**/.env.vault',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/*.min.js',
  '**/*.min.css',
  '**/*.map',
  '**/*.woff*',
  '**/*.ttf',
  '**/*.eot',
  '**/*.ico',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.svg',
  '**/*.mp4',
  '**/*.webm',
  '**/*.pdf',
];
