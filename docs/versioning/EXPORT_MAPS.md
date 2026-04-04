# Export Maps

> Package export configuration and public API design

## Overview

Export maps (`package.json` `exports` field) define the public API of each package. They control what consumers can import and how modules are resolved.

## Why Export Maps?

1. **Explicit Public API** – Only exported paths are available to consumers
2. **Conditional Exports** – Different exports for different environments (ESM, CJS, browser, node)
3. **Subpath Exports** – Organized internal structure without exposing internals
4. **Future‑Proofing** – Prepare for ESM‑only future
5. **Tooling Support** – TypeScript, bundlers, Node.js understand export maps

## Basic Structure

```json
{
  "name": "@fusionaize/sdk-core",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

## Export Patterns

### Pattern 1: Single Entry Point (Recommended)

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

**Usage**:
```typescript
import { Result, ok, err } from '@fusionaize/sdk-core';
```

### Pattern 2: Subpath Exports

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./errors": {
      "types": "./dist/errors.d.ts",
      "import": "./dist/errors.js"
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.js"
    }
  }
}
```

**Usage**:
```typescript
import { Result } from '@fusionaize/sdk-core';
import { ValidationError } from '@fusionaize/sdk-core/errors';
import { formatDate } from '@fusionaize/sdk-core/utils';
```

### Pattern 3: Conditional Exports

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/cjs/index.cjs",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  }
}
```

## Rules for fusionAIze SDK

### 1. **Always Define Exports**
   - Every package must have an `exports` field
   - No fallback to `main`/`module`/`types` for new packages

### 2. **TypeScript Support**
   - Include `"types"` for every export condition
   - Type definitions must match JavaScript exports

### 3. **ESM First**
   - Primary export is `"import"` (ES modules)
   - CJS support optional (via `"require"` if needed)

### 4. **No Internal Paths**
   - Don't expose `./src/` or `./internal/`
   - Use subpath exports for organized public API

### 5. **Consistent Patterns**
   - All packages use similar export structure
   - Subpath exports follow naming conventions

## Validation

The `check-exports.mjs` script validates export maps:

```bash
pnpm check:exports
```

Checks:
1. `exports` field exists
2. Root export (`"."`) is defined
3. `types` and `import` are present
4. No conflicting configurations
5. Subpath exports start with `./`

## Examples

### Foundation Package

```json
{
  "name": "@fusionaize/sdk-errors",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

### Service Client with Subpaths

```json
{
  "name": "@fusionaize/gate-client",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./streaming": {
      "types": "./dist/streaming.d.ts",
      "import": "./dist/streaming.js"
    },
    "./tools": {
      "types": "./dist/tools.d.ts",
      "import": "./dist/tools.js"
    }
  }
}
```

## Migration from Legacy

### Before (Legacy)
```json
{
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts"
}
```

### After (Export Maps)
```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

## TypeScript Configuration

### `tsconfig.json` for Packages

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Declaration Maps

Enable declaration maps for better developer experience:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

## Common Issues

### Issue: TypeScript Can't Find Types
**Solution**: Ensure `"types"` points to the correct `.d.ts` file.

### Issue: Subpath Export Not Working
**Solution**: Check that the exported file exists and is built.

### Issue: Circular Reference in Exports
**Solution**: Simplify export structure, avoid complex conditions.

### Issue: Bundler Can't Resolve
**Solution**: Test with actual bundlers (Vite, Webpack, Rollup).

## Best Practices

1. **Start Simple** – Single entry point first, add subpaths as needed
2. **Test Imports** – Verify imports work in different environments
3. **Document Exports** – List available exports in package README
4. **Version Exports** – Changing exports is a breaking change
5. **Use Tools** – `attw` (Are The Types Wrong) for validation

## Tools

- [`attw`](https://github.com/arethetypeswrong/arethetypeswrong.github.io) – Check TypeScript compatibility
- [`publint`](https://publint.dev/) – Validate package configuration
- `check-exports.mjs` – Custom validation for fusionAIze SDK

## FAQ

### Q: Should I use `"default"` export condition?
**A**: Not needed for ESM‑first packages. Use `"import"` for ESM, `"require"` for CJS if supporting both.

### Q: Can I export `package.json`?
**A**: Yes, useful for tooling: `"./package.json": "./package.json"`

### Q: What about browser‑specific builds?
**A**: Use conditions: `"browser"`, `"node"`, `"react-native"` as needed.

### Q: How do I deprecate an export?
**A**: Mark deprecated in JSDoc, add to changelog, remove in next major.

---

*See also: [Versioning](./README.md), [Package Boundaries](../architecture/PACKAGE_BOUNDARIES.md)*