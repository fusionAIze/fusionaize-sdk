# Migration Scripts

> Codemods and migration guides for breaking changes

## Overview

This directory contains automated migration scripts (codemods) for breaking changes between major versions of the fusionAIze SDK. These scripts help users upgrade their codebases with minimal manual effort.

## Philosophy

- **Automate repetitive changes** – Scripts handle bulk transformations
- **Provide safety nets** – Dry-run mode, backups, and validation
- **Document manual steps** – Some changes require human judgment
- **Test thoroughly** – Migration scripts have their own test suite

## Structure

```
migrations/
├── README.md              # This file
├── package.json          # Migration tool dependencies
├── src/
│   ├── index.ts          # Migration runner
│   ├── types.ts          # Type definitions
│   └── migrations/       # Individual migration scripts
│       ├── v1-to-v2/     # Migration from 1.x to 2.x
│       │   ├── index.ts
│       │   ├── transform.ts
│       │   └── test.ts
│       └── v2-to-v3/
└── bin/
    └── run-migration.ts  # CLI entry point
```

## Creating a Migration

### 1. Set up the migration directory

```bash
mkdir -p migrations/src/migrations/v1-to-v2
cd migrations/src/migrations/v1-to-v2
```

### 2. Create the migration script

```typescript
// migrations/src/migrations/v1-to-v2/transform.ts
import type { Migration, FileTransform } from '../types';

export const v1ToV2Migration: Migration = {
  name: 'v1-to-v2',
  description: 'Migrate from SDK v1.x to v2.x',
  fromVersion: '^1.0.0',
  toVersion: '^2.0.0',

  async *transform(file: FileTransform): AsyncGenerator<FileTransform> {
    // Example: Rename deprecated function
    if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) {
      let content = file.content;
      
      // Replace oldFunction with newFunction
      content = content.replace(
        /oldFunction\(/g,
        'newFunction('
      );
      
      // Update imports
      content = content.replace(
        /from ['"]@fusionaize\/sdk-core\/oldModule['"]/g,
        'from \'@fusionaize/sdk-core/newModule\''
      );
      
      if (content !== file.content) {
        yield { ...file, content };
      }
    }
  }
};
```

### 3. Add tests

```typescript
// migrations/src/migrations/v1-to-v2/test.ts
import { describe, it, expect } from 'vitest';
import { v1ToV2Migration } from './transform';

describe('v1-to-v2 migration', () => {
  it('should rename oldFunction to newFunction', async () => {
    const file = {
      path: 'src/index.ts',
      content: `import { oldFunction } from '@fusionaize/sdk-core';
      
const result = oldFunction('test');`
    };

    const transforms = [];
    for await (const transform of v1ToV2Migration.transform(file)) {
      transforms.push(transform);
    }

    expect(transforms).toHaveLength(1);
    expect(transforms[0].content).toContain('newFunction');
    expect(transforms[0].content).not.toContain('oldFunction');
  });
});
```

### 4. Register the migration

```typescript
// migrations/src/migrations/v1-to-v2/index.ts
export { v1ToV2Migration } from './transform';
```

## Running Migrations

### CLI Usage

```bash
# Dry run (show changes without applying)
npx @fusionaize/sdk-migrate v1-to-v2 --dry-run ./src

# Apply changes
npx @fusionaize/sdk-migrate v1-to-v2 ./src

# Create backup before applying
npx @fusionaize/sdk-migrate v1-to-v2 ./src --backup

# Limit to specific file types
npx @fusionaize/sdk-migrate v1-to-v2 ./src --ext ts,tsx
```

### Programmatic Usage

```typescript
import { runMigration } from '@fusionaize/sdk-migrations';

await runMigration('v1-to-v2', {
  targetDir: './src',
  dryRun: true,
  backup: true
});
```

## Best Practices

### 1. Conservative Changes
- Only transform what's necessary
- Preserve formatting where possible
- Don't rewrite unrelated code

### 2. Safety First
- Always provide `--dry-run` option
- Create backups with `--backup`
- Validate changes after transformation

### 3. Clear Documentation
- Document what the migration does
- List manual steps required
- Provide examples before/after

### 4. Testing
- Test with real code examples
- Handle edge cases
- Test with different file structures

## Example Migration: Removing a Deprecated API

### 1. Deprecation (in v1.5.0)
```typescript
// In the SDK source
/**
 * @deprecated Use `newFunction` instead. Will be removed in v2.0.0.
 */
export function oldFunction() { ... }
```

### 2. Migration Script (for v2.0.0)
```typescript
// Transform oldFunction() calls to newFunction()
export const migration = {
  name: 'remove-old-function',
  async *transform(file) {
    if (file.path.endsWith('.ts')) {
      const newContent = file.content.replace(
        /oldFunction\(/g,
        'newFunction('
      );
      
      if (newContent !== file.content) {
        yield { ...file, content: newContent };
      }
    }
  }
};
```

### 3. Migration Guide
```markdown
## Migration from v1.x to v2.x

### Automated Changes
Run the migration script:
```bash
npx @fusionaize/sdk-migrate v1-to-v2 ./src
```

This will:
- Replace all `oldFunction()` calls with `newFunction()`
- Update imports from deprecated modules

### Manual Changes
1. Update TypeScript configuration if needed
2. Review any custom error handling
3. Test with your specific use cases
```

## Integration with Release Process

1. **Pre-release** – Migration scripts are published with beta releases
2. **Release** – Migration guide included in release notes
3. **Post-release** – Scripts available via npm for 6 months

## Tooling

The migration system uses:
- [jscodeshift](https://github.com/facebook/jscodeshift) – AST transformations
- [ts-morph](https://ts-morph.com/) – TypeScript-aware refactoring
- [vitest](https://vitest.dev/) – Testing framework

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on creating migration scripts.

---

*Related: [Migration Guides](../docs/versioning/MIGRATION_GUIDES.md)*