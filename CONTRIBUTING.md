# Contributing to Zink

Thank you for your interest in contributing to Zink! 🔐

## Getting Started

1. **Fork & clone** the repository
2. **Install dependencies**: `npm install`
3. **Run tests**: `npm test`
4. **Link locally**: `npm link` (to test the `zink` command globally)

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Test the CLI directly
node bin/zink.js --help
```

## Project Structure

```
zink/
├── bin/zink.js          # CLI entry point
├── src/
│   ├── commands/        # One file per CLI command
│   ├── core/            # Business logic (crypto, parser, vault, config)
│   └── utils/           # Helpers (logger, constants)
└── tests/               # Test files (vitest)
```

## Guidelines

- **Write tests** for any new functionality
- **Use ESM** (`import`/`export`) — no CommonJS
- **Follow the existing code style** — clean, well-documented functions
- **Keep dependencies minimal** — avoid adding new deps unless absolutely necessary
- **Update the README** if adding new commands or features

## Adding a New Command

1. Create `src/commands/yourCommand.js` with an exported async function
2. Wire it up in `bin/zink.js` using Commander
3. Add tests in `tests/yourCommand.test.js`
4. Update the README

## Reporting Issues

- Use GitHub Issues
- Include your Node.js version (`node --version`)
- Include the Zink version (`zink --version`)
- Provide steps to reproduce

## Code of Conduct

Be kind, respectful, and constructive. We're all here to build cool stuff. 🚀

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
