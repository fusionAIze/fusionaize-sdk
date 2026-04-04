# Package README Template

> Template for package README files with architectural guidance

## Structure

Every package README should include these sections:

```
# @fusionaize/package-name

Brief one‑line description.

## Purpose

What this package exists to provide, its role in the architecture, and what problems it solves.

## Architectural Role

- **Category**: Foundation (`sdk-*`) / Service Client (`gate-*`) / Testing (`sdk-testing`)
- **Layer**: Core / Contracts / Infrastructure / Service
- **Dependencies**: List of allowed dependencies (follows package boundaries)
- **Consumers**: Who should depend on this package

## When to Use

- Scenario 1: When you need...
- Scenario 2: When building...
- Scenario 3: When integrating...

## When NOT to Use

- Anti‑pattern 1: Don't use for...
- Anti‑pattern 2: Avoid when...
- Boundary violation: Never use for...

## Public API

### Primary Exports

```typescript
import { MainClass, utilityFunction } from '@fusionaize/package-name';
```

### Sub‑path Exports (if any)

```typescript
import { SpecializedUtil } from '@fusionaize/package-name/specialized';
```

### Type Definitions

- `InterfaceName` – description
- `TypeAlias` – description
- `Class` – description with methods

## Examples

### Basic Usage

```typescript
// Basic example showing common pattern
```

### Advanced Configuration

```typescript
// Advanced example showing customization
```

### Integration with Other Packages

```typescript
// How this package works with related packages
```

## Dependency Notes

- **Depends on**: `@fusionaize/sdk‑core`, `@fusionaize/sdk‑config`, ...
- **Required by**: `@fusionaize/gate‑client`, ...
- **Dev dependencies**: `@fusionaize/sdk‑testing` (dev‑only)
- **External dependencies**: None (or list if any)

## Architectural Boundaries

### What Belongs Here

- Item 1: Specific responsibility
- Item 2: Related functionality
- Item 3: Types/interfaces for...

### What Does NOT Belong Here

- Item 1: Business logic (belongs in `gate‑*` packages)
- Item 2: HTTP transport (belongs in `sdk‑transport`)
- Item 3: Authentication (belongs in `sdk‑auth`)
- Item 4: Configuration loading (belongs in `sdk‑config`)

## Error Handling

How errors are reported and handled in this package.

## Configuration

Configuration options, environment variables, and defaults.

## Performance Considerations

Any performance implications, caching strategies, or resource usage notes.

## Testing

How to test code that uses this package, including mock utilities.

## Migration & Breaking Changes

Notes on API stability and migration between versions.

## Stability

**Alpha** / **Beta** / **Stable** – API stability level and compatibility guarantees.

---

## Template Usage Notes

1. Copy this template to `packages/<package-name>/README.md`
2. Fill in sections specific to the package
3. Update the architectural boundaries based on package specifications
4. Include realistic examples
5. Keep dependency notes accurate
6. Review with architecture team before publishing

## See Also

- [Package Specifications](../architecture/PACKAGE_SPECIFICATIONS.md)
- [Package Boundaries](../architecture/PACKAGE_BOUNDARIES.md)
- [Architecture Overview](../architecture/OVERVIEW.md)
