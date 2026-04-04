# Package Boundaries

> Dependency rules and package relationships in the fusionAIze SDK

## Overview

This document defines the dependency rules between packages in the fusionAIze SDK monorepo. Adherence to these rules prevents dependency cycles, maintains clean separation of concerns, and enables independent evolution.

## Package Categories

### 1. Foundation Packages (`@fusionaize/sdk-*`)

**Purpose**: Cross‑cutting utilities, types, and infrastructure used throughout the fusionAIze ecosystem.

**List**:
- `@fusionaize/sdk-core` – Core types, utilities, foundational abstractions
- `@fusionaize/sdk-contracts` – API contracts, request/response types
- `@fusionaize/sdk-errors` – Error taxonomy, serializable errors
- `@fusionaize/sdk-config` – Configuration loading, profile resolution
- `@fusionaize/sdk-auth` – Authentication providers, token handling
- `@fusionaize/sdk-transport` – HTTP transport layer, request/response
- `@fusionaize/sdk-tracing` – Tracing, correlation IDs, propagation
- `@fusionaize/sdk-testing` – Testing utilities, mocks, fixtures

**Rules**:
- Can depend on other foundation packages
- **Cannot** depend on service client packages (`gate-*`)
- **Cannot** depend on the testing package (except `sdk-testing` itself)
- Should have minimal external dependencies
- Must be framework‑agnostic

### 2. Service Client Packages (`@fusionaize/gate-*`)

**Purpose**: Type‑safe clients for specific fusionAIze services.

**List**:
- `@fusionaize/gate-client` – Typed client for fusionAIze Gate (data‑plane)
- `@fusionaize/gate-runtime` – Runtime helpers for orchestration
- `@fusionaize/gate-control` – Control‑plane/admin‑safe client

**Rules**:
- Can depend on any foundation package
- Can depend on other service client packages (with justification)
- Should not depend on `sdk-testing` (testing is dev‑time only)
- Must not create circular dependencies with foundation packages

### 3. Testing Package (`@fusionaize/sdk-testing`)

**Purpose**: Testing utilities shared across the ecosystem.

**Rules**:
- Can depend on foundation packages
- Can depend on service client packages (for integration testing)
- **Should not** be depended on by runtime packages
- Dev‑time dependency only

## Dependency Matrix

| From \ To | Foundation | Service Client | Testing |
|-----------|------------|----------------|---------|
| **Foundation** | ✅ Allowed | ❌ Forbidden | ❌ Forbidden |
| **Service Client** | ✅ Allowed | ⚠️ With justification | ❌ Forbidden |
| **Testing** | ✅ Allowed | ✅ Allowed | ✅ Allowed |

## Concrete Examples

### ✅ Allowed

```json
// packages/sdk-auth/package.json
{
  "dependencies": {
    "@fusionaize/sdk-core": "workspace:*",
    "@fusionaize/sdk-config": "workspace:*",
    "@fusionaize/sdk-errors": "workspace:*"
  }
}

// packages/gate-client/package.json
{
  "dependencies": {
    "@fusionaize/sdk-core": "workspace:*",
    "@fusionaize/sdk-contracts": "workspace:*",
    "@fusionaize/sdk-errors": "workspace:*",
    "@fusionaize/sdk-config": "workspace:*",
    "@fusionaize/sdk-auth": "workspace:*",
    "@fusionaize/sdk-transport": "workspace:*",
    "@fusionaize/sdk-tracing": "workspace:*"
  }
}
```

### ❌ Forbidden

```json
// packages/sdk-core/package.json
{
  "dependencies": {
    "@fusionaize/gate-client": "workspace:*"  // ❌ Foundation cannot depend on service
  }
}

// packages/gate-client/package.json
{
  "dependencies": {
    "@fusionaize/sdk-testing": "workspace:*"  // ❌ Runtime cannot depend on testing
  }
}
```

## Circular Dependency Prevention

Circular dependencies are detected and prevented by the `check-package-boundaries.mjs` script:

```bash
# Run boundary check
pnpm check:boundaries
```

The script:
1. Identifies package categories (foundation vs. service vs. testing)
2. Validates dependency rules
3. Detects circular dependencies using graph traversal
4. Reports violations with clear error messages

## Adding New Packages

When adding a new package, follow this checklist:

### 1. Category Determination
- [ ] **Foundation**: Cross‑cutting utility used by multiple services?
- [ ] **Service Client**: Client for a specific fusionAIze service?
- [ ] **Testing**: Dev‑time testing utilities?

### 2. Dependency Review
- [ ] Dependencies follow the matrix above
- [ ] No circular dependencies introduced
- [ ] Minimal dependencies (prefer `sdk-core` over larger packages)

### 3. Export Design
- [ ] Clear public API (see [Export Maps](../versioning/EXPORT_MAPS.md))
- [ ] No internal modules exposed accidentally
- [ ] Type‑safe exports with proper TypeScript definitions

### 4. Validation
- [ ] `pnpm check:boundaries` passes
- [ ] `pnpm check:exports` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes

## Common Patterns

### Pattern 1: Layered Foundation

```
sdk-core → sdk-contracts → sdk-errors → sdk-config → sdk-auth → sdk-transport
```

Foundation packages form a directed acyclic graph (DAG) where higher‑level packages depend on lower‑level ones.

### Pattern 2: Service Client Composition

```
gate-client → [sdk-core, sdk-contracts, sdk-errors, sdk-config, sdk-auth, sdk-transport, sdk-tracing]
```

Service clients compose multiple foundation packages to provide a complete client experience.

### Pattern 3: Testing Utilities

```
sdk-testing → [sdk-core, sdk-contracts, sdk-errors, sdk-auth]
```

Testing packages depend on foundation packages to provide test doubles and fixtures.

## Exception Process

In rare cases, exceptions to these rules may be necessary:

1. **Document the exception** – Add a comment in both package.json files
2. **Justify the need** – Explain why the exception is necessary
3. **Review required** – Get approval from architecture review
4. **Add to exceptions list** – Document in this file

Current exceptions: *None*

## Tooling

### Validation Scripts

- `scripts/check-package-boundaries.mjs` – Validates dependency rules
- `scripts/check-exports.mjs` – Validates export maps
- `scripts/verify-release-state.mjs` – Validates release readiness

### CI/CD Integration

These checks run automatically in CI:
- `validate` job runs all validation scripts
- PRs must pass boundary checks before merging
- Releases are blocked if boundaries are violated

## FAQ

### Q: Can a foundation package depend on another foundation package that depends on it indirectly?
**A**: No, this creates a circular dependency. The dependency graph must be a DAG.

### Q: What if two foundation packages need shared types?
**A**: Move the shared types to `sdk-core` or create a new lower‑level foundation package.

### Q: Can a service client package be split into foundation and service parts?
**A**: Yes, if a utility is generally useful, extract it to a foundation package.

### Q: How do I know if my package is foundation or service?
**A**: Ask: "Is this specific to a fusionAIze service?" If yes → service; if no → foundation.

---

*See also: [Architecture Overview](./OVERVIEW.md), [Versioning](../versioning/)*