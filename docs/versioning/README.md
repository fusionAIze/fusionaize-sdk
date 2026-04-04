# Versioning

> Versioning strategy and release process for the fusionAIze SDK

## Overview

The fusionAIze SDK uses **independent versioning** with [Changesets](https://github.com/changesets/changesets) to manage releases. Each package can evolve at its own pace while maintaining compatibility guarantees.

## Versioning Strategy

### Semantic Versioning (SemVer)

All packages follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** – Breaking changes (incompatible API changes)
- **MINOR** – New features (backward compatible)
- **PATCH** – Bug fixes (backward compatible)

### Package Independence

Each package is versioned independently:

```
@fusionaize/sdk-core: 1.2.3
@fusionaize/sdk-errors: 0.5.0
@fusionaize/gate-client: 2.0.1
```

This allows:
- Packages to evolve at different rates
- Consumers to upgrade only needed packages
- Breaking changes in one package without affecting others

### Version Ranges

| Range | Meaning | Example |
|-------|---------|---------|
| `0.x.y` | Initial development, breaking changes allowed | `0.1.0`, `0.2.0` |
| `1.x.y` | Stable API, semantic versioning enforced | `1.0.0`, `1.1.0` |
| `^1.2.3` | Compatible with `1.2.3` (same major version) | `^1.2.3` |
| `~1.2.3` | Patch updates only (`1.2.x`) | `~1.2.3` |

## Release Process

### 1. Creating Changesets

When making changes that require a version bump:

```bash
# Create a changeset
pnpm changeset

# Follow the interactive prompt:
# 1. Select packages to version
# 2. Choose version bump (major/minor/patch)
# 3. Write changelog entry
```

This creates a file in `.changeset/` with metadata about the change.

### 2. Changeset Format

```markdown
---
"@fusionaize/sdk-core": patch
"@fusionaize/sdk-errors": minor
---

Add new error types for rate limiting

- Add `RateLimitError` class
- Extend `ErrorCode` enum
- Update error serialization
```

### 3. Versioning Packages

When ready to release:

```bash
# Update package versions based on changesets
pnpm version

# This:
# 1. Reads all changesets
# 2. Calculates new versions
# 3. Updates package.json files
# 4. Creates/updates CHANGELOG.md files
# 5. Deletes used changesets
```

### 4. Publishing

```bash
# Build packages
pnpm build

# Publish to npm
pnpm release

# This:
# 1. Runs pre‑publish validation
# 2. Publishes packages to npm
# 3. Creates GitHub release
```

## Automated Releases

The `.github/workflows/release.yml` workflow automates releases:

1. **On push to main** – Checks for changesets
2. **Creates PR** – If changesets exist, creates "Version Packages" PR
3. **Auto‑merges** – After PR approval, versions and publishes
4. **Publishes** – Publishes to npm, creates GitHub release

## Changelog Generation

Each package has its own `CHANGELOG.md`:

```markdown
# Changelog

## [1.2.3] - 2025-01-15

### Added
- New `Result.map()` utility
- TypeScript 5.9 support

### Fixed
- Error serialization edge case
```

The root `CHANGELOG.md` aggregates notable changes across all packages.

## Breaking Changes Policy

### Before 1.0.0
- Breaking changes allowed in minor versions (`0.x.0`)
- Document migration path in changelog
- Announce in release notes

### After 1.0.0
- Breaking changes require major version bump
- Provide migration guide
- Deprecate old API before removal
- Consider compatibility layer

### Deprecation Process
1. Mark API as `@deprecated` in JSDoc
2. Add deprecation notice in changelog
3. Provide alternative API
4. Remove in next major version

## Workspace Dependencies

Within the monorepo, packages use `workspace:*`:

```json
{
  "dependencies": {
    "@fusionaize/sdk-core": "workspace:*"
  }
}
```

During publishing, `workspace:*` is replaced with the actual version.

## Consumer Guidance

### For SDK Consumers

**Install specific versions**:
```bash
pnpm add @fusionaize/sdk-core@^1.0.0
```

**Update all packages**:
```bash
pnpm update @fusionaize/*
```

**Check for updates**:
```bash
pnpm outdated
```

### For SDK Contributors

**Always add a changeset** for:
- New features
- Bug fixes
- Documentation updates
- Dependency updates

**No changeset needed for**:
- Internal refactoring (no API change)
- Test updates
- CI configuration

## Tooling

### Changesets
- `.changeset/config.json` – Configuration
- `.changeset/README.md` – Changeset documentation
- `pnpm changeset` – Interactive changeset creation

### Validation
- `pnpm check:release` – Validates release state
- CI workflows – Automate validation and release

### Release Automation
- GitHub Actions – `.github/workflows/release.yml`
- npm publishing – Requires `NPM_TOKEN` secret

## FAQ

### Q: Why not use synchronized versioning?
**A**: Independent versioning reduces friction. A breaking change in `sdk-core` shouldn't force a major bump in `gate-client` if the API is unchanged.

### Q: How do I know what changed in a package?
**A**: Check the package's `CHANGELOG.md` or the GitHub release notes.

### Q: What if I forget a changeset?
**A**: CI will fail. The `validate` job checks that changesets exist for changed packages.

### Q: Can I version multiple packages together?
**A**: Yes, Changesets supports multi‑package versioning. Select multiple packages when creating a changeset.

### Q: How are pre‑releases handled?
**A**: Changesets supports alpha/beta/rc tags via `prerelease` mode.

---

*See also: [Export Maps](./EXPORT_MAPS.md), [Package Boundaries](../architecture/PACKAGE_BOUNDARIES.md)*

## Related Documents

- [Stability Labels](./STABILITY_LABELS.md) - API stability annotations (@stable, @beta, @experimental, @internal)
- [Migration Guides](./MIGRATION_GUIDES.md) - Guides for migrating between major versions
- [Ownership Model](../governance/OWNERSHIP.md) - Package ownership and release responsibilities
- [Maintainer Playbook](../governance/MAINTAINER_PLAYBOOK.md) - Day-to-day maintainer guide