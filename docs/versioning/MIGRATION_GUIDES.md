# Migration Guides

> Guidance for migrating between major versions of fusionAIze SDK packages

## Overview

This document provides migration guides for breaking changes in fusionAIze SDK packages. Each major version bump includes a migration guide to help consumers update their code.

## Migration Guide Structure

Each migration guide should include:

1. **Version Info**: From version X to version Y
2. **Summary**: High-level changes
3. **Breaking Changes**: List of incompatible changes
4. **Step-by-Step Migration**: Concrete migration steps
5. **Automated Migration**: Scripts or tools to help
6. **FAQs**: Common questions and answers

## Template

```markdown
# Migration Guide: @fusionaize/{package} v{X} to v{Y}

## Summary

Brief overview of what changed and why.

## Breaking Changes

### 1. Change Name
- **Before**: `oldMethod()`
- **After**: `newMethod()`
- **Reason**: Better alignment with naming conventions
- **Impact**: Medium - requires code changes

### 2. Change Name
- **Before**: `OldType`
- **After**: `NewType`
- **Reason**: Type safety improvement
- **Impact**: Low - TypeScript will catch issues

## Step-by-Step Migration

### Step 1: Update Dependencies

```json
// package.json
{
  "dependencies": {
    "@fusionaize/{package}": "^{Y}.0.0"
  }
}
```

### Step 2: Update Imports

```typescript
// Before
import { oldMethod } from "@fusionaize/{package}";

// After
import { newMethod } from "@fusionaize/{package}";
```

### Step 3: Update Usage

```typescript
// Before
const result = oldMethod(param);

// After
const result = newMethod({ param });
```

## Automated Migration

For large codebases, use this script:

```bash
npx @fusionaize/migrate-{package}@latest
```

Or manually with codemods:

```bash
# Install migration tool
pnpm add -D @fusionaize/migrate-{package}

# Run migration
pnpm migrate-{package}
```

## Common Issues & Solutions

### Issue: Type errors after update
**Solution**: Check import statements and update type annotations.

### Issue: Runtime errors
**Solution**: Review breaking changes list, update method calls.

### Issue: Missing exports
**Solution**: Check if API was moved to different package.

## FAQ

### Q: Is there a compatibility layer?
**A**: [Yes/No] - [Explain compatibility options]

### Q: Can I upgrade incrementally?
**A**: [Yes/No] - [Explain incremental upgrade path]

### Q: How long will v{X} be supported?
**A**: [Support timeline] - [Link to support policy]

## Support

- **Documentation**: [Link to updated docs]
- **Examples**: [Link to updated examples]
- **Issues**: [GitHub issues link]
- **Discussion**: [GitHub discussions link]
```

## Package-Specific Migration Guides

### Foundation Packages

#### `@fusionaize/sdk-core`
- **v0.x → v1.0**: Initial stable release
- **v1.x → v2.0**: Major type system changes
- Key changes: `Result` type enhancements, `Envelope` improvements

#### `@fusionaize/sdk-errors`
- **v0.x → v1.0**: Error taxonomy stabilization
- **v1.x → v2.0**: Serialization format changes
- Key changes: Error code updates, serialization improvements

#### `@fusionaize/sdk-auth`
- **v0.x → v1.0**: Provider API stabilization
- **v1.x → v2.0**: Credential store changes
- Key changes: Auth provider interface, token management

### Gate Packages

#### `@fusionaize/gate-client`
- **v0.x → v1.0**: Client API stabilization
- **v1.x → v2.0**: Streaming API changes
- Key changes: Run creation, tool calling, streaming

## Migration Strategies

### 1. Incremental Migration

**When**: Large codebase, risk-averse team
**How**:
1. Update one package at a time
2. Use dual version support if available
3. Gradually migrate usage patterns

**Example**:
```typescript
// Phase 1: Update imports
import { newMethod } from "@fusionaize/package-v2";
import { oldMethod } from "@fusionaize/package-v1-compat";

// Phase 2: Migrate usage gradually
```

### 2. Big Bang Migration

**When**: Small codebase, clean upgrade path
**How**:
1. Update all packages at once
2. Fix all compilation errors
3. Test thoroughly

**Tools**:
- TypeScript compiler for type errors
- Test suite for runtime errors
- Manual testing for integration issues

### 3. Compatibility Layer

**When**: Breaking changes affect many consumers
**How**:
1. Provide compatibility package
2. Deprecate old API gradually
3. Remove in next major version

**Example**:
```typescript
// Compatibility package
export { newMethod as oldMethod } from "@fusionaize/package-v2";
```

## Migration Tools

### Automated Migration Scripts

**Location**: `migrations/`
**Usage**: See the [migrations README](../migrations/README.md) for detailed instructions.

**Available Scripts**:
- `migrate:core-v1-to-v2` - Core type migrations
- `migrate:errors-v1-to-v2` - Error handling migrations
- `migrate:client-v1-to-v2` - Client API migrations

### Codemods

**Technology**: `jscodeshift` and custom TypeScript transformers
**Location**: `migrations/src/migrations/`

**Example**:
```bash
# Run migration using the CLI
npx @fusionaize/sdk-migrate v1-to-v2 ./src --dry-run

# Or using jscodeshift directly
npx jscodeshift -t migrations/src/migrations/v1-to-v2/transform.js src/
```

### TypeScript Helpers

**Migration Types**: Temporary type definitions to help migration
**Location**: `@fusionaize/sdk-migration-types` (planned)

**Example**:
```typescript
// Install migration types
pnpm add -D @fusionaize/sdk-migration-types

// Use migration helpers
import { migrateResult } from "@fusionaize/sdk-migration-types";
```

## Testing Migration

### Pre-Migration Checklist

- [ ] Backup current code
- [ ] Run existing tests (should pass)
- [ ] Document current behavior
- [ ] Identify critical paths

### Post-Migration Checklist

- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Runtime behavior verified
- [ ] Performance benchmarks stable
- [ ] Documentation updated

### Rollback Plan

**If migration fails**:
1. Revert package.json to previous versions
2. Restore from backup if needed
3. Analyze failure reason
4. Fix issues and retry

## Communication Plan

### Before Release

1. **Announcement**: Blog post, release notes
2. **Timeline**: Migration window (e.g., 3 months)
3. **Support**: Documentation, examples, help channels

### During Migration

1. **Support**: Dedicated support channel
2. **Updates**: Regular progress updates
3. **Feedback**: Collect migration feedback

### After Migration

1. **Success Metrics**: Migration completion rate
2. **Lessons Learned**: Document migration challenges
3. **Cleanup**: Remove compatibility layers

## Version Support Policy

### Support Timeline

| Version | Status | End of Life |
|---------|--------|-------------|
| v2.x | Current | TBD |
| v1.x | Maintenance | 6 months after v2.0 |
| v0.x | Deprecated | Immediately |

### Security Updates

- **Current**: Full security support
- **Maintenance**: Critical security fixes only
- **Deprecated**: No security updates

### Bug Fixes

- **Current**: All bug fixes
- **Maintenance**: Critical bugs only
- **Deprecated**: No bug fixes

## FAQ

### Q: How do I know if I need to migrate?
**A**: Check the package's CHANGELOG.md for breaking changes. Major version bumps (1.0 → 2.0) always require migration.

### Q: What if I can't migrate immediately?
**A**: Use the compatibility layer if available, or pin to the older version while planning migration.

### Q: Are there breaking changes in minor versions?
**A**: No, following semantic versioning. Minor versions (1.1 → 1.2) are backward compatible.

### Q: How can I test migration before updating?
**A**: Use the migration scripts in a test environment, or create a proof-of-concept branch.

### Q: What if I find a migration issue?
**A**: Open a GitHub issue with the "migration" label. Include error details and reproduction steps.

## Examples

### Complete Migration Example

**Scenario**: Migrating `@fusionaize/sdk-errors` from v1 to v2

```bash
# 1. Update package.json
pnpm add @fusionaize/sdk-errors@^2.0.0

# 2. Run migration script
pnpm migrate:errors-v1-to-v2

# 3. Fix remaining issues (if any)
# 4. Run tests
pnpm test

# 5. Verify behavior
# 6. Commit changes
```

### Partial Migration Example

**Scenario**: Large codebase, gradual migration

```typescript
// Phase 1: Update imports only
import { 
  FusionAIzeError,
  // OldErrorCode, // Temporarily keep
  ErrorCode 
} from "@fusionaize/sdk-errors";

// Phase 2: Update usage gradually
function processError(error: Error) {
  // Before
  // if (error.code === OldErrorCode.NetworkError) {
  
  // After
  if (error.code === ErrorCode.NetworkError) {
    // ...
  }
}
```

## Related Documents

- [Versioning Guide](./README.md) - Overall versioning strategy
- [Breaking Changes Policy](./README.md#breaking-changes-policy) - Breaking change guidelines
- [Stability Labels](./STABILITY_LABELS.md) - API stability guarantees