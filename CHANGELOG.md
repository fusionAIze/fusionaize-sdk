# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial monorepo structure with pnpm workspace, Turborepo, Changesets
- 11 foundation packages: `sdk-core`, `sdk-contracts`, `sdk-errors`, `sdk-config`, `sdk-auth`, `sdk-transport`, `sdk-tracing`, `sdk-testing`, `gate-client`, `gate-runtime`, `gate-control`
- GitHub Actions CI/CD workflows (validate, lint, test, build, release, codeql, repo-safety)
- Validation scripts for package boundaries, export maps, and release state
- Documentation structure (`docs/architecture`, `docs/packages`, `docs/versioning`, `docs/governance`)
- Examples and schemas directories

### Changed
- N/A (initial release)

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A