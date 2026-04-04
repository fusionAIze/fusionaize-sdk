# Roadmap

> Evolution plan for the fusionAIze SDK monorepo

This document outlines the planned evolution of the fusionAIze SDK, a shared TypeScript foundation for the fusionAIze platform.

## Vision

A developer‑grade, type‑safe SDK that provides:

1. **Clear contracts** – Well‑typed API interfaces for fusionAIze services
2. **Foundation utilities** – Core types, error handling, configuration, tracing
3. **Client libraries** – Easy‑to‑use clients for Gate and related services
4. **Cross‑cutting concerns** – Authentication, transport, testing, documentation
5. **Governance** – Versioning, package boundaries, contribution workflows

## Principles

- **No runtime logic** – SDK provides types and clients, not runtime implementations
- **No provider‑native core logic** – Abstracts over providers, doesn't embed them
- **No UI components** – Focus on data contracts and service interactions
- **Strict TypeScript** – Full type safety, explicit contracts, no `any` escape hatches
- **Clean package boundaries** – Foundation vs. service packages, no circular deps
- **Developer experience first** – Documentation, examples, predictable APIs

## Phases

### Phase 1: Foundation (Current) ✅

**Goal**: Establish monorepo structure, core packages, and development workflow.

**Deliverables**:
- [x] Monorepo setup (pnpm workspace, Turborepo, Changesets)
- [x] Core packages: `sdk-core`, `sdk-contracts`, `sdk-errors`, `sdk-config`
- [x] Cross‑cutting packages: `sdk-auth`, `sdk-transport`, `sdk-tracing`, `sdk-testing`
- [x] Service clients: `gate-client`, `gate-runtime`, `gate-control`
- [x] CI/CD workflows (validate, lint, test, build, release)
- [x] Documentation structure (`docs/`, examples, schemas)
- [x] Validation scripts (package boundaries, exports, release state)

**Status**: Complete

### Phase 2: Polish and Examples (Next)

**Goal**: Refine initial implementations, add comprehensive examples, improve documentation.

**Deliverables**:
- [ ] Complete all package implementations (beyond placeholders)
- [ ] Add real‑world examples for each major use case
- [ ] Create JSON Schema / OpenAPI definitions in `schemas/`
- [ ] Write package‑specific READMEs with usage examples
- [ ] Add integration tests with real Gate instances
- [ ] Establish benchmarking and performance baselines
- [ ] Document contribution workflow and governance

**Timeline**: Q2 2025

### Phase 3: Ecosystem Integration

**Goal**: Integrate with other fusionAIze repos and external tools.

**Deliverables**:
- [ ] Type‑safe bindings for `faigate` REST API
- [ ] Integration with `faisignal` for observability
- [ ] Support for `faistudio` workflow definitions
- [ ] Plugin system for custom transports and auth providers
- [ ] Browser‑friendly builds (ES modules, tree‑shaking)
- [ ] Framework integrations (React, Vue, Svelte hooks)
- [ ] CLI tooling for code generation from schemas

**Timeline**: Q3 2025

### Phase 4: Maturity and Adoption

**Goal**: Reach production readiness, community adoption, and version stability.

**Deliverables**:
- [ ] Version 1.0.0 of all core packages
- [ ] Comprehensive test coverage (>90%)
- [ ] Performance optimization and bundle size reduction
- [ ] Migration guides from earlier versions
- [ ] Community contribution guidelines
- [ ] Security audit and vulnerability scanning
- [ ] Published to npm with automated releases

**Timeline**: Q4 2025

## Package Evolution

### Foundation Packages (`@fusionaize/sdk-*`)

| Package | v0.1 (Now) | v1.0 (Goal) |
|---------|------------|-------------|
| `sdk-core` | Basic types, Result<T,E>, utilities | Full type utilities, metadata, serialization |
| `sdk-contracts` | RunRequest, RunResponse, StreamEvent | Complete API contracts, validation, evolution |
| `sdk-errors` | Error taxonomy, serializable errors | Error recovery, translation, context |
| `sdk-config` | Basic config loading, profiles | Hierarchical config, schema validation, hot reload |
| `sdk-auth` | API key, token, session auth | OAuth2, JWT, custom providers, refresh |
| `sdk-transport` | Basic HTTP transport, fetch wrapper | Retries, timeouts, circuit breakers, streaming |
| `sdk-tracing` | Trace IDs, propagation | Distributed tracing, sampling, exporters |
| `sdk-testing` | Mocks, fixtures, fake auth | Test harness, scenario runner, contract tests |

### Service Clients (`@fusionaize/gate-*`)

| Package | v0.1 (Now) | v1.0 (Goal) |
|---------|------------|-------------|
| `gate-client` | Basic run operations, typed client | Full API coverage, streaming, tool calls |
| `gate-runtime` | Orchestration helpers, fallback | Runtime adapters, capability negotiation |
| `gate-control` | Health, routes, providers | Full admin API, metrics, dynamic config |

## Versioning Strategy

- **0.x.y**: Initial development, breaking changes allowed
- **1.0.0**: Stable API, semantic versioning begins
- **Major bumps**: Breaking API changes
- **Minor bumps**: New features, backward compatible
- **Patch bumps**: Bug fixes, documentation

All packages are versioned independently via [Changesets](https://github.com/changesets/changesets).

## Contribution

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get involved.

---

*This roadmap is a living document and will evolve based on feedback and requirements.*