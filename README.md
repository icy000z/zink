<div align="center">

# 🔐 Zink

**Smart .env vault — encrypt, sync, diff & manage your secrets.**

Git-safe team sharing. Never leak secrets again.

[![CI](https://github.com/icy000z/zink/actions/workflows/ci.yml/badge.svg)](https://github.com/icy000z/zink/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/zink-vault.svg)](https://www.npmjs.com/package/zink-vault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

</div>

---

## The Problem

Environment variables are **critical** but managing them is a mess:

- 🚫 `.env` files can't be committed to git (they contain secrets)
- 😰 New team members ask "can you send me the .env file?"
- 🤷 No way to diff environments (dev vs prod)
- 💀 Secrets leak into codebases constantly

## The Solution

**Zink** encrypts your `.env` files into a git-safe `.env.vault` file using **AES-256-GCM** encryption. Your team commits the vault, and each member decrypts with a shared password.

```bash
# Encrypt your .env → .env.vault (safe to commit!)
zink encrypt

# New team member clones the repo and decrypts
zink decrypt
```

---

## ⚡ Quick Start

```bash
# Install globally
npm install -g zink-vault

# Initialize in your project
cd your-project
zink init

# Add some variables
zink set DATABASE_URL=postgres://localhost:5432/mydb
zink set API_KEY=sk_live_abc123
zink set JWT_SECRET=super-secret-token

# Encrypt into vault
zink encrypt

# Commit the vault (it's encrypted!)
git add .env.vault .zinkrc .env.example
git commit -m "Add encrypted environment vault"
```

---

## 📖 Commands

### `zink init`
Initialize a new vault in your project.

```bash
zink init
zink init --env production    # Set default environment
zink init --force             # Reinitialize
```

Creates `.zinkrc` (config) and `.env.vault` (encrypted store). Automatically updates `.gitignore`.

---

### `zink encrypt`
Encrypt your `.env` file into the vault.

```bash
zink encrypt                  # Encrypt default environment
zink encrypt -e production    # Encrypt production
zink encrypt -e staging       # Encrypt staging
```

Each environment is encrypted independently with its own salt and IV.

---

### `zink decrypt`
Decrypt the vault back to a `.env` file.

```bash
zink decrypt                  # Decrypt default environment
zink decrypt -e production    # Decrypt production
zink decrypt --stdout         # Print to stdout (for piping)
zink decrypt --force          # Overwrite without confirmation
```

---

### `zink set`
Set one or more environment variables.

```bash
zink set DATABASE_URL=postgres://localhost:5432/db
zink set API_KEY=abc123 JWT_SECRET=xyz789    # Multiple at once
zink set PORT=3000 -e production             # Set in specific environment
```

---

### `zink get`
Retrieve a variable's value.

```bash
zink get DATABASE_URL
zink get API_KEY --raw        # Raw value (for scripting)
zink get API_KEY --masked     # Show masked value
```

**Scripting example:**
```bash
export DB_URL=$(zink get DATABASE_URL --raw)
```

---

### `zink ls`
List all variables in an environment.

```bash
zink ls                       # List with masked values
zink ls --show                # Reveal actual values
zink ls -e production         # List production vars
```

---

### `zink rm`
Remove variable(s).

```bash
zink rm OLD_API_KEY
zink rm KEY1 KEY2 KEY3        # Remove multiple
zink rm KEY --force           # Skip confirmation
```

---

### `zink diff`
Compare variables between two environments.

```bash
zink diff development production
zink diff staging production --values    # Show value differences
```

Shows which keys are missing, added, or have different values.

---

### `zink validate`
Check your `.env` file for common issues.

```bash
zink validate
zink validate -e production
```

Checks for:
- ❌ Duplicate keys
- ❌ Invalid key names
- ⚠️ Empty values
- ⚠️ Placeholder values (`TODO`, `CHANGE_ME`, etc.)
- ⚠️ Short secrets
- ⚠️ Localhost in production
- ⚠️ Missing keys from `.env.example`

---

### `zink template`
Generate a `.env.example` template (safe to commit).

```bash
zink template                         # Generate from default env
zink template -e production           # From production
zink template --output .env.sample    # Custom filename
zink template --bare                  # Without description comments
```

Auto-generates human-readable descriptions for common variable names.

---

### `zink scan`
Scan your codebase for leaked secrets.

```bash
zink scan                    # Scan current directory
zink scan --path ./src       # Scan specific directory
zink scan --strict           # Exit with error if secrets found (for CI)
```

Detects:
- AWS keys & secrets
- GitHub tokens
- Stripe keys
- Google API keys
- Private keys
- Database URLs
- JWT tokens
- Generic secrets & passwords
- And more...

---

### `zink export`
Export variables to other formats.

```bash
zink export --format json             # Export as JSON
zink export --format yaml             # Export as YAML
zink export --format docker           # Docker env-file format
zink export --stdout                  # Print to stdout
zink export -o config.json            # Custom output file
```

---

### `zink import`
Import variables from external formats.

```bash
zink import config.json               # Import from JSON
zink import env.yaml                  # Import from YAML
zink import .env.backup               # Import from .env file
zink import config.json --merge       # Merge with existing vars
zink import config.json -e staging    # Import into specific env
```

---

## 🔒 Security

Zink uses industry-standard encryption:

| Feature | Detail |
|---------|--------|
| **Algorithm** | AES-256-GCM (authenticated encryption) |
| **Key Derivation** | PBKDF2 with SHA-512 |
| **Iterations** | 100,000 |
| **Salt** | 32 bytes, unique per environment |
| **IV** | 16 bytes, unique per encryption |
| **Auth Tag** | 16-byte tamper detection |

The `.env.vault` file is safe to commit — without the master password, the data is cryptographically secure.

---

## 📁 File Overview

| File | Purpose | Git? |
|------|---------|------|
| `.env` | Your actual secrets | ❌ Never commit |
| `.env.vault` | Encrypted vault | ✅ Safe to commit |
| `.zinkrc` | Zink configuration | ✅ Commit this |
| `.env.example` | Template (no values) | ✅ Commit this |

---

## 🔄 Team Workflow

```
Developer A                        Developer B
─────────────                      ─────────────
1. zink set KEY=VALUE
2. zink encrypt
3. git push                   →    4. git pull
                                   5. zink decrypt
                                   6. Has all the secrets! 🎉
```

Share the master password securely (password manager, in-person, etc.) — **never** in git or chat.

---

## 🤖 CI/CD Integration

```yaml
# GitHub Actions example
- name: Decrypt secrets
  run: |
    npm install -g zink-vault
    echo "$VAULT_PASSWORD" | zink decrypt --force
  env:
    VAULT_PASSWORD: ${{ secrets.VAULT_PASSWORD }}
```

Use `zink scan --strict` in CI to prevent secret leaks:

```yaml
- name: Scan for secrets
  run: zink scan --strict
```

---

## 📦 Requirements

- **Node.js** ≥ 18.0.0
- **npm** ≥ 8

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with 🔐 by [icyz](https://github.com/icy000z)**

</div>
