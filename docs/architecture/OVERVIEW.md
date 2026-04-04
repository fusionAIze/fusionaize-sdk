# Architecture Overview

> Architectural principles and structure of the fusionAIze SDK

## Philosophy

The fusionAIze SDK is a **shared, cross‑cutting TypeScript monorepo** that provides foundational types, utilities, and client libraries for the fusionAIze platform.

**Core tenets**:

1. **SDK, not runtime** – Provides contracts and clients, not runtime implementations
2. **Type‑safe first** – TypeScript strict mode, explicit contracts, no magic
3. **Clean boundaries** – Foundation packages vs. service packages, no circular dependencies
4. **Developer experience** – Documentation, examples, predictable APIs
5. **Evolution‑ready** – Designed for independent versioning and gradual adoption

## High‑Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    fusionAIze SDK Monorepo                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Examples  │  │   Schemas   │  │    Docs     │        │
│  │             │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Packages (@fusionaize)             │   │
│  │                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │  Foundation │  │   Service   │  │   Testing   │ │   │
│  │  │   (sdk-*)   │  │   Clients   │  │   (sdk-*)   │ │   │
│  │  │             │  │   (gate-*)  │  │             │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Tooling & Infrastructure              │   │
│  │  • pnpm workspace      • Turborepo                  │   │
│  │  • Changesets          • GitHub Actions             │   │
│  │  • Biome (lint/format) • TypeScript strict          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Package Categories

### 1. Foundation Packages (`@fusionaize/sdk-*`)

**Purpose**: Cross‑cutting utilities used by all fusionAIze clients and services.

| Package | Responsibility | Dependencies |
|---------|----------------|--------------|
| `sdk-core` | Core types (`Result<T,E>`, `JsonValue`, `Metadata`), utilities | None (foundation) |
| `sdk-contracts` | API contracts (`RunRequest`, `RunResponse`, `StreamEvent`) | `sdk-core` |
| `sdk-errors` | Error taxonomy, serializable errors, error utilities | `sdk-core` |
| `sdk-config` | Configuration loading, profile resolution, validation | `sdk-core`, `sdk-errors` |
| `sdk-auth` | Authentication providers, token handling, auth headers | `sdk-core`, `sdk-config`, `sdk-errors` |
| `sdk-transport` | HTTP transport layer, request/response, retries | `sdk-core`, `sdk-errors`, `sdk-auth`, `sdk-tracing` |
| `sdk-tracing` | Tracing, correlation IDs, trace propagation | `sdk-core`, `sdk-contracts` |
| `sdk-testing` | Testing utilities, mocks, fixtures, fake auth | `sdk-core`, `sdk-contracts`, `sdk-errors` |

**Rules**:
- Foundation packages can depend on other foundation packages
- Foundation packages **cannot** depend on service clients (`gate-*`)
- Minimal dependencies, focused scope

### 2. Service Client Packages (`@fusionaize/gate-*`)

**Purpose**: Type‑safe clients for specific fusionAIze services.

| Package | Responsibility | Dependencies |
|---------|----------------|--------------|
| `gate-client` | Typed client for fusionAIze Gate (data‑plane operations) | All relevant `sdk-*` packages |
| `gate-runtime` | Runtime helpers for orchestration, fallback, capabilities | `sdk-core`, `sdk-contracts`, `sdk-errors`, `sdk-transport`, `sdk-tracing` |
| `gate-control` | Control‑plane/admin‑safe client for health, routes, providers | `sdk-core`, `sdk-contracts`, `sdk-errors`, `sdk-config`, `sdk-auth`, `sdk-transport`, `sdk-tracing` |

**Rules**:
- Service clients can depend on foundation packages
- Service clients can depend on other service clients (when appropriate)
- Focus on a single service or concern

### 3. Testing Package (`@fusionaize/sdk-testing`)

**Purpose**: Testing utilities shared across the ecosystem.

**Rules**:
- Dev‑time dependency only
- Can depend on foundation packages
- Should not be required for runtime usage

## Dependency Rules

### Allowed Dependencies

```
foundation → foundation   ✅ (e.g., sdk-auth → sdk-core)
service    → foundation   ✅ (e.g., gate-client → sdk-core)
service    → service      ⚠️ (allowed but should be justified)
testing    → foundation   ✅ (e.g., sdk-testing → sdk-contracts)
```

### Forbidden Dependencies

```
foundation → service      ❌ (e.g., sdk-core → gate-client)
foundation → testing      ❌ (e.g., sdk-core → sdk-testing)
circular   → any          ❌ (detected by check-package-boundaries.mjs)
```

## Type System Strategy

### 1. **Explicit Over Implicit**
   - No implicit type conversions
   - No `any` escape hatches (except in testing utilities)
   - Strict TypeScript configuration

### 2. **Result Types Over Exceptions**
   - `Result<T, E>` for operations that can fail
   - Exceptions only for programmer errors (assertions)

### 3. **Immutable By Default**
   - `readonly` properties where possible
   - Value objects over mutable state

### 4. **Discriminated Unions**
   - `StreamEvent` with `type` discriminator
   - Compile‑time exhaustive checking

## Build & Development Tooling

### Monorepo Management
- **pnpm workspace** – Fast, disk‑efficient package management
- **Turborepo** – Fast incremental builds, task orchestration
- **Changesets** – Independent versioning, changelog generation

### Code Quality
- **TypeScript strict** – Maximum type safety
- **Biome** – Fast linting and formatting (successor to ESLint + Prettier)
- **Validation scripts** – Package boundaries, export maps, release state

### CI/CD
- **GitHub Actions** – Validate, lint, test, build, release workflows
- **CodeQL** – Security analysis
- **Repo safety** – Prevents committing secrets, databases, logs

## Design Decisions

### 1. **Monorepo Over Multi‑repo**
   - **Why**: Coordinated releases, shared tooling, easier refactoring
   - **Trade‑off**: Larger repository, more complex tooling

### 2. **Independent Versioning**
   - **Why**: Packages evolve at different rates, reduces breaking changes
   - **Trade‑off**: More complex release process (Changesets)

### 3. **Foundation vs. Service Packages**
   - **Why**: Clear separation of concerns, prevents dependency cycles
   - **Trade‑off**: More packages to manage

### 4. **Type‑First Design**
   - **Why**: TypeScript is the primary documentation, enables better tooling
   - **Trade‑off**: More upfront type design work

## Evolution Principles

1. **Backward compatibility** – Breaking changes require major version bumps
2. **Gradual adoption** – Packages can be adopted independently
3. **Explicit deprecation** – Mark deprecated APIs with clear migration paths
4. **Documentation parity** – API changes require documentation updates

---

*See also: [Package Boundaries](./PACKAGE_BOUNDARIES.md), [Versioning](../versioning/)*