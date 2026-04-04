# Contributing to fusionAIze SDK

Thank you for your interest in contributing to the fusionAIze SDK! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Community](#community)

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- **Node.js 20+** – [Download](https://nodejs.org/)
- **pnpm 10+** – `npm install -g pnpm`
- **Git** – Version control

### Setting Up Development Environment

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/fusionaize/fusionaize-sdk.git
   cd fusionaize-sdk
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   pre-commit install        # enforce hooks before every commit — required
   ```

   > `pre-commit install` installs git hooks that run the full hook suite before each commit. **Do not skip this step.**

3. **Build all packages**:
   ```bash
   pnpm build
   ```

4. **Run validation** to ensure everything works:
   ```bash
   pnpm check
   ```

### Project Structure

```
fusionaize-sdk/
├── packages/           # Published npm packages
│   ├── sdk-core/      # Core types and utilities
│   ├── sdk-contracts/ # API contracts
│   └── ...            # Other packages
├── examples/          # Usage examples
├── schemas/           # JSON Schema, OpenAPI definitions
├── docs/              # Documentation
└── scripts/           # Validation and utility scripts
```

## Development Workflow

### 1. Find an Issue

- Check [GitHub Issues](https://github.com/fusionaize/fusionaize-sdk/issues) for open tasks
- Look for issues labeled `good-first-issue` or `help-wanted`
- Discuss proposed changes in issues before starting work

### 2. Create a Branch

```bash
# Create a new branch from main
git checkout -b feature/description
# or
git checkout -b fix/issue-number
```

**Branch naming conventions**:
- `feature/` – New features
- `fix/` – Bug fixes
- `docs/` – Documentation improvements
- `refactor/` – Code refactoring
- `test/` – Test improvements

### 3. Make Changes

Follow the [Coding Standards](#coding-standards) and [Testing](#testing) guidelines.

### 4. Run Validation

Before committing, run:

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Run all checks (recommended)
pnpm check
```

### 5. Create a Changeset (If Needed)

If your changes affect the public API or require a version bump:

```bash
pnpm changeset
```

Follow the interactive prompt to:
1. Select affected packages
2. Choose version bump type (patch/minor/major)
3. Write a changelog entry

**When to create a changeset**:
- New features (minor)
- Bug fixes (patch)
- Breaking changes (major)
- Documentation updates (patch)
- Dependency updates (patch/minor)

**No changeset needed for**:
- Internal refactoring (no API change)
- Test updates
- CI configuration changes

### 6. Commit Changes

```bash
git add .
git commit -m "feat(sdk-core): add Result.map utility"
```

**Commit message format**:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat` – New feature
- `fix` – Bug fix
- `docs` – Documentation
- `style` – Formatting, missing semi-colons
- `refactor` – Code refactoring
- `test` – Adding tests
- `chore` – Build process, tooling

**Scope**: Package name (e.g., `sdk-core`, `gate-client`)

### 7. Push and Create Pull Request

```bash
git push origin feature/description
```

Then create a Pull Request on GitHub.

## Coding Standards

### TypeScript

- **Strict mode** – Always enabled
- **No `any`** – Use `unknown` or proper types (tests are exception)
- **Explicit types** – Avoid type inference for public APIs
- **Immutable by default** – Use `readonly` for properties
- **Result over exceptions** – Use `Result<T, E>` for recoverable errors

### Package Boundaries

- **Foundation packages** (`sdk-*`) cannot depend on service clients (`gate-*`)
- **No circular dependencies** – Use `pnpm check:boundaries` to verify
- **Minimal dependencies** – Prefer `sdk-core` over larger packages

### Export Maps

- Every package must have `exports` field
- Use subpath exports for organized APIs
- Include TypeScript definitions for all exports

### Code Style

- **2-space indentation**
- **Double quotes** for strings
- **Trailing commas** in multiline objects/arrays
- **Biome formatting** – Run `pnpm format` before committing

## Testing

### Test Structure

```
packages/sdk-core/
├── src/
│   └── index.ts
└── test/
    └── basic.test.ts
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { ok, err } from '../src/index';

describe('@fusionaize/sdk-core', () => {
  describe('Result', () => {
    it('ok creates success result', () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });
  });
});
```

### Test Coverage

- Aim for **90%+ coverage**
- Test public APIs thoroughly
- Include edge cases and error conditions
- Use fixtures and mocks from `@fusionaize/sdk-testing`

## Documentation

### Package READMEs

Each package should have a `README.md` with:

1. **Purpose** – What the package does
2. **Installation** – How to install
3. **Usage** – Code examples
4. **API Reference** – Key exports
5. **Related Packages** – Dependencies and related packages

### JSDoc Comments

```typescript
/**
 * Creates a successful result.
 *
 * @example
 * ```typescript
 * const result = ok(42);
 * if (result.ok) {
 *   console.log(result.value); // 42
 * }
 * ```
 *
 * @param value - The success value
 * @returns A successful result
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}
```

### Architecture Documentation

- Update `docs/architecture/` for design changes
- Document breaking changes in migration guides
- Keep examples up to date

## Pull Request Process

### PR Requirements

1. **Description** – Clear description of changes
2. **Related Issues** – Link to GitHub issues
3. **Validation** – CI passes (lint, test, typecheck, build)
4. **Changeset** – If version bump needed
5. **Documentation** – Updated READMEs, JSDoc, examples
6. **Tests** – Added or updated tests

### Review Process

1. **Automated checks** – CI must pass
2. **Code review** – At least one maintainer approves
3. **Discussion** – Address all review comments
4. **Merge** – Squash and merge with descriptive message

### PR Labels

- `bug` – Fixes a bug
- `feature` – New feature
- `documentation` – Docs changes
- `refactor` – Code refactoring
- `dependencies` – Dependency updates
- `breaking-change` – Requires major version bump

## Release Process

### Automated Releases

1. **Changesets merged** – Creates "Version Packages" PR
2. **Version PR merged** – Updates package versions and changelogs
3. **CI publishes** – Publishes to npm, creates GitHub release

### Manual Release (If Needed)

```bash
# Create changesets
pnpm changeset

# Version packages
pnpm version

# Build packages
pnpm build

# Publish to npm
pnpm release
```

## Community

### Getting Help

- **GitHub Issues** – Bug reports, feature requests
- **GitHub Discussions** – Design discussions, Q&A
- **Documentation** – Start with `README.md` and `docs/`

### Recognition

Contributors are recognized via:
- GitHub contributor graph
- Release notes acknowledgments
- Contributor hall of fame (planned)

### Becoming a Maintainer

Consistent, high‑quality contributions may lead to maintainer invitation. Maintainers:
- Review and merge PRs
- Triage issues
- Manage releases
- Uphold quality standards

## License

By contributing, you agree that your contributions will be licensed under the [Apache 2.0 License](./LICENSE).

---

Thank you for contributing to fusionAIze SDK! 🚀