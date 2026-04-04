# Governance

> Contribution guidelines, decision making, and community standards

## Overview

This document outlines how the fusionAIze SDK project is governed, including contribution processes, decision making, and community standards.

## Principles

1. **Developer‑First** – Decisions prioritize developer experience and productivity
2. **Type‑Safe** – TypeScript strict mode is non‑negotiable
3. **Clean Boundaries** – Package dependencies must follow established rules
4. **Documentation** – Code changes require documentation updates
5. **Iterative Improvement** – Small, incremental changes over big‑bang rewrites

## Contribution Process

### 1. Getting Started

**Prerequisites**:
- Familiarity with TypeScript, Node.js, and monorepos
- Understanding of [package boundaries](../architecture/PACKAGE_BOUNDARIES.md)
- Read [CONTRIBUTING.md](../../CONTRIBUTING.md)

**Setup**:
```bash
git clone https://github.com/fusionaize/fusionaize-sdk.git
cd fusionaize-sdk
pnpm install
pnpm build
```

### 2. Making Changes

**Workflow**:
1. **Create a branch** – `feature/description` or `fix/issue-number`
2. **Make changes** – Follow coding standards
3. **Add tests** – New features require tests
4. **Update documentation** – Code changes need docs updates
5. **Run validation** – `pnpm check` (lint + typecheck + test)
6. **Create changeset** – `pnpm changeset` for version bumps
7. **Open PR** – Link to issue, describe changes

### 3. Code Review

**Reviewers look for**:
- Adherence to package boundaries
- Type safety and proper TypeScript usage
- Test coverage and quality
- Documentation updates
- Performance considerations
- Breaking changes (require major version)

**Review Process**:
1. Automated checks pass (CI)
2. At least one maintainer approves
3. No unresolved discussions
4. Changeset present if needed

### 4. Merging and Releasing

**Merge Requirements**:
- ✅ CI passes
- ✅ Approved review
- ✅ Changeset (if version bump needed)
- ✅ Documentation updated

**Release Process**:
- Changesets automatically create version PRs
- Maintainers review and merge version PR
- CI publishes to npm and creates GitHub release

## Decision Making

### Decision Levels

| Level | Example | Process |
|-------|---------|---------|
| **Tactical** | Bug fix, small feature | PR review, maintainer approval |
| **Strategic** | New package, major API change | RFC, architecture review |
| **Governance** | Contribution policy, tooling changes | Maintainer discussion, documented decision |

### RFC Process

For significant changes:

1. **Draft RFC** – Document in `docs/rfc/` directory
2. **Discussion** – GitHub discussion or issue
3. **Review** – Architecture review by maintainers
4. **Decision** – Approved, rejected, or needs revision
5. **Implementation** – Follow contribution process

### Architecture Review

**Review Board**: Core maintainers and platform architects

**Responsibilities**:
- Evaluate package boundary changes
- Review breaking API changes
- Approve new package additions
- Ensure consistency with platform vision

## Coding Standards

### TypeScript

- **Strict mode** – Always enabled
- **No `any`** – Use `unknown` or proper types (exceptions in tests)
- **Explicit over implicit** – Clear types, no magic
- **Immutable by default** – `readonly` where possible
- **Result over exceptions** – Use `Result<T, E>` for recoverable errors

### Package Design

- **Single responsibility** – Each package has clear purpose
- **Minimal dependencies** – Prefer `sdk-core` over larger packages
- **Clean exports** – Explicit export maps, no internal leaks
- **Documented APIs** – JSDoc comments for public APIs

### Testing

- **Unit tests** – For utilities and pure functions
- **Integration tests** – For package interactions
- **Contract tests** – For API compatibility
- **90% coverage target** – Measured via CI

### Documentation

- **README per package** – Usage examples, API overview
- **JSDoc comments** – Type definitions, examples
- **Architecture docs** – Design decisions, trade‑offs
- **Examples** – Real‑world usage in `examples/`

## Maintenance

### Package Health

**Monthly checks**:
- Dependency updates (`pnpm outdated`)
- Security vulnerabilities (`pnpm audit`)
- TypeScript version updates
- Tooling updates (Biome, Turborepo, Changesets)

**Quarterly review**:
- Package usage statistics
- Issue/PR backlog triage
- Documentation freshness
- Performance benchmarks

### Deprecation Policy

1. **Announce** – Mark deprecated in JSDoc and changelog
2. **Alternative** – Provide migration path
3. **Timeline** – Remove in next major version
4. **Communication** – Release notes, documentation updates

## Community Standards

### Code of Conduct

All contributors must follow the [Code of Conduct](../../CODE_OF_CONDUCT.md).

### Communication

- **Issues** – Bug reports, feature requests
- **Discussions** – Design discussions, Q&A
- **PRs** – Code changes, documentation
- **Documentation** – Improvements, examples

### Recognition

Contributors are recognized via:
- GitHub contributor graph
- Release notes acknowledgments
- Contributor hall of fame (planned)

## Roles

### Contributors
- Anyone who submits a PR
- Follow contribution process
- Respect code of conduct

### Maintainers
- Merge PRs, triage issues
- Review architecture changes
- Manage releases
- Uphold quality standards

### Platform Architects
- Set technical direction
- Review significant changes
- Ensure platform consistency
- Long‑term vision

## Getting Help

### Documentation
- [README](../../README.md) – Getting started
- [Architecture docs](../architecture/) – Design principles
- [Examples](../../examples/) – Usage examples

### Issues
- **Bug reports** – Include reproduction steps
- **Feature requests** – Describe use case
- **Questions** – Check documentation first

### Discussions
- GitHub Discussions for design discussions
- Architecture decisions documented in RFCs

## Tools

### Development
- `pnpm` – Package management
- `turborepo` – Build orchestration
- `biome` – Linting and formatting
- `changesets` – Version management

### CI/CD
- GitHub Actions – Automated testing and releases
- CodeQL – Security analysis
- Coverage reporting – Test coverage

### Validation
- `check-package-boundaries.mjs` – Dependency validation
- `check-exports.mjs` – Export map validation
- `verify-release-state.mjs` – Release validation

## FAQ

### Q: How do I become a maintainer?
**A**: Consistent quality contributions, understanding of architecture, and nomination by existing maintainers.

### Q: What if I disagree with a decision?
**A**: Open a discussion with clear reasoning and alternatives. Decisions are documented for transparency.

### Q: Can I create a new package?
**A**: Follow RFC process. Justify need, define boundaries, propose API.

### Q: How are breaking changes handled?
**A**: RFC required, major version bump, migration guide, announcement.

### Q: What about third‑party dependencies?
**A**: Minimize dependencies, prefer MIT/Apache licenses, security audit required.

---

*See also: [CONTRIBUTING.md](../../CONTRIBUTING.md), [Code of Conduct](../../CODE_OF_CONDUCT.md)*

## Related Documents

- [Ownership Model](./OWNERSHIP.md) - Package ownership and release responsibilities
- [Maintainer Playbook](./MAINTAINER_PLAYBOOK.md) - Day-to-day maintainer guide
- [Versioning Guide](../versioning/README.md) - Release process and versioning strategy
- [Stability Labels](../versioning/STABILITY_LABELS.md) - API stability annotations