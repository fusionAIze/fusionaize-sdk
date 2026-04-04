# Documentation

> Documentation for the fusionAIze SDK monorepo

## Overview

This directory contains comprehensive documentation for the fusionAIze SDK, organized by topic.

## Structure

| Directory | Purpose |
|-----------|---------|
| [`architecture/`](./architecture/) | Architectural decisions, diagrams, design principles |
| [`packages/`](./packages/) | Package‑specific documentation, APIs, usage examples |
| [`versioning/`](./versioning/) | Versioning strategy, release process, Changesets guide |
| [`governance/`](./governance/) | Contribution guidelines, code of conduct, decision making |
| [`api/`](./api/) | API reference, type definitions, generated documentation |
| [`guides/`](./guides/) | Tutorials, how‑to guides, migration guides |

## Quick Links

- [Architecture Overview](./architecture/OVERVIEW.md) – High‑level architecture and design principles
- [Package Boundaries](./architecture/PACKAGE_BOUNDARIES.md) – Dependency rules and package relationships
- [Getting Started](../README.md#getting-started) – Installation and basic usage
- [Contributing](../CONTRIBUTING.md) – How to contribute to the SDK
- [Roadmap](../ROADMAP.md) – Planned evolution and milestones

## Documentation Philosophy

1. **Developer‑first** – Documentation should help developers build with the SDK
2. **Type‑driven** – TypeScript types are the primary source of truth
3. **Example‑rich** – Every concept should have concrete examples
4. **Living documentation** – Docs evolve with the codebase

## Generating Documentation

API documentation can be generated from TypeScript source:

```bash
# Generate API documentation
pnpm docs:generate

# Serve documentation locally
pnpm docs:serve
```

## Contributing to Documentation

Documentation improvements are welcome! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

*Documentation is a first‑class citizen in the fusionAIze SDK.*