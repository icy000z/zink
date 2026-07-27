# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-27

### 🎉 Initial Release

#### Added
- **`zink init`** — Initialize a vault in any project with auto `.gitignore` configuration
- **`zink encrypt`** — Encrypt `.env` files using AES-256-GCM with PBKDF2 key derivation
- **`zink decrypt`** — Decrypt vault back to `.env` with overwrite protection
- **`zink set`** — Set one or more environment variables with validation
- **`zink get`** — Retrieve variable values with `--raw` mode for scripting
- **`zink ls`** — List variables with smart value masking
- **`zink rm`** — Remove variables with confirmation prompt
- **`zink diff`** — Compare variables between two environments (dev vs prod, etc.)
- **`zink validate`** — Check for duplicates, invalid keys, placeholder values, and short secrets
- **`zink template`** — Generate `.env.example` with auto-generated descriptions
- **`zink scan`** — Scan codebase for 15+ types of leaked secrets (AWS, GitHub, Stripe, etc.)
- **`zink export`** — Export to JSON, YAML, and Docker env-file formats
- **`zink import`** — Import from JSON, YAML, and `.env` files with merge support

#### Security
- AES-256-GCM authenticated encryption
- PBKDF2 key derivation (SHA-512, 100,000 iterations)
- 32-byte salts, 16-byte IVs, unique per environment per encryption
- Tamper detection via authentication tags

#### Developer Experience
- Beautiful branded terminal output with colors and box drawing
- Smart value masking in `ls` command
- Auto-generated `.env.example` descriptions for 25+ common variable names
- CI-ready with `--strict` flag on scan command
- 49 unit tests with full coverage of crypto, parser, and vault layers

[1.0.0]: https://github.com/icy000z/zink/releases/tag/v1.0.0
