# Stability Labels

> Stability annotations for fusionAIze SDK APIs

## Overview

The fusionAIze SDK uses JSDoc stability labels to communicate API stability and compatibility guarantees. These labels help consumers understand which APIs are safe for production use and which are subject to change.

## Stability Tiers

### `@stable` (Production-Ready)

**Guarantee**: Stable API, follows semantic versioning, safe for production use.

**When to use**:
- Core APIs that won't change without a major version bump
- Public interfaces with extensive usage
- Well-tested, well-documented functionality

**Examples**:
- Core types (`Result<T, E>`, `Envelope<T>`)
- Error taxonomy (`FusionAIzeError`, `ErrorCode`)
- HTTP transport basics (`Transport`, `RequestOptions`)

**Versioning**: Breaking changes require **major version bump** (1.0.0 → 2.0.0)

### `@beta` (Preview)

**Guarantee**: API may change based on feedback, but changes will be documented.

**When to use**:
- New features undergoing validation
- APIs that need real-world feedback
- Experimental integrations

**Examples**:
- New authentication providers
- Experimental runtime features
- Integration adapters

**Versioning**: Breaking changes allowed in **minor versions** (1.2.0 → 1.3.0)

### `@experimental` (Unstable)

**Guarantee**: Highly likely to change, use at your own risk.

**When to use**:
- Proof-of-concept implementations
- Cutting-edge features
- APIs with known design issues

**Examples**:
- Research features
- Temporary workarounds
- Vendor-specific extensions

**Versioning**: Breaking changes allowed in **any version**, including patches

### `@internal` (Private)

**Guarantee**: Not part of public API, subject to change without notice.

**When to use**:
- Implementation details
- Package-private utilities
- Internal abstractions

**Examples**:
- Package-specific helpers
- Internal adapters
- Configuration loaders

**Versioning**: Can change at any time, not covered by semver

## Usage in Code

```typescript
/**
 * Stable API - safe for production
 * @stable
 */
export interface RunRequest {
  model: string;
  messages: Message[];
}

/**
 * Beta feature - may change based on feedback
 * @beta
 */
export interface ExperimentalFeature {
  // ...
}

/**
 * Internal implementation - not for public use
 * @internal
 */
export function internalHelper() {
  // ...
}
```

## Label Migration

### Promoting from Beta to Stable

**Requirements**:
1. **Usage validation**: Used in production by at least 3 external consumers
2. **Test coverage**: 90%+ test coverage
3. **Documentation**: Complete API documentation with examples
4. **No major issues**: No open critical bugs for at least 1 month

**Process**:
```typescript
// Before
/**
 * @beta
 */
export interface BetaFeature { /* ... */ }

// After
/**
 * @stable
 * @since 1.3.0
 */
export interface StableFeature { /* ... */ }
```

### Demoting from Stable

**When**:
- Security vulnerability requiring API change
- Fundamental design flaw discovered
- Better alternative available

**Process**:
1. Mark as `@deprecated` with migration guide
2. Keep in next major version for compatibility
3. Remove in following major version

## Package-Level Stability

### Foundation Packages

| Package | Current Stability | Target 1.0 |
|---------|-------------------|------------|
| `@fusionaize/sdk-core` | `@stable` | Stable |
| `@fusionaize/sdk-errors` | `@stable` | Stable |
| `@fusionaize/sdk-contracts` | `@stable` | Stable |
| `@fusionaize/sdk-config` | `@stable` (mostly) | Stable |
| `@fusionaize/sdk-auth` | Mixed (`@stable` + `@beta`) | Stable |
| `@fusionaize/sdk-transport` | Mixed (`@stable` + `@beta`) | Stable |
| `@fusionaize/sdk-tracing` | Mixed (`@stable` + `@beta`) | Stable |
| `@fusionaize/sdk-testing` | `@stable` | Stable |

### Gate Packages

| Package | Current Stability | Target 1.0 |
|---------|-------------------|------------|
| `@fusionaize/gate-client` | `@stable` | Stable |
| `@fusionaize/gate-control` | `@beta` | Stable |
| `@fusionaize/gate-runtime` | `@beta` | Stable |

## Consumer Guidance

### For Production Use

**Recommended**:
```typescript
import { RunRequest } from "@fusionaize/sdk-contracts"; // @stable
import { FusionAIzeError } from "@fusionaize/sdk-errors"; // @stable
import { createTransport } from "@fusionaize/sdk-transport"; // @stable
```

**With Caution**:
```typescript
import { ExperimentalProvider } from "@fusionaize/sdk-auth"; // @beta
// Monitor release notes for changes
```

**Avoid in Production**:
```typescript
// @experimental or @internal APIs
// Not guaranteed between versions
```

### Version Pinning Strategy

| Stability | Version Range | Reason |
|-----------|---------------|--------|
| `@stable` | `^1.0.0` | Safe to accept minor/patch updates |
| `@beta` | `~1.2.0` | Pin to minor version, review changes |
| `@experimental` | `1.2.3` | Exact version, manual updates |

## Tooling Support

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "stripInternal": true // Removes @internal from .d.ts
  }
}
```

### Documentation Generation

- `@stable` APIs appear in main documentation
- `@beta` APIs appear with warning banners
- `@experimental` APIs appear in separate section
- `@internal` APIs omitted from public docs

### Linting Rules

- Warn when `@experimental` APIs used in `@stable` code
- Error when `@internal` APIs imported outside package
- Validate stability label consistency

## FAQ

### Q: Can I use `@beta` APIs in production?
**A**: Yes, but be prepared to update code when APIs change. Monitor release notes closely.

### Q: What happens if I ignore stability labels?
**A**: You may encounter breaking changes without warning. Stable APIs provide compatibility guarantees; others don't.

### Q: How are stability labels enforced?
**A**: Through CI validation, TypeScript configuration, and documentation generation.

### Q: Can stability labels change between patch versions?
**A**: Yes, but only to increase stability (e.g., `@beta` → `@stable`). Decreasing stability requires at least a minor version bump.

### Q: Where should I report issues with unstable APIs?
**A**: Use GitHub issues with the "api-feedback" label. Your feedback helps stabilize APIs.

## Related Documents

- [Versioning Guide](./README.md) - Overall versioning strategy
- [Breaking Changes Policy](./README.md#breaking-changes-policy) - Handling API changes
- [Export Maps](./EXPORT_MAPS.md) - Public API design