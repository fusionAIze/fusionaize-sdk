# fusionAIze SDK

> Shared TypeScript SDK for the fusionAIze platform

[![CI](https://github.com/fusionaize/fusionaize-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/fusionaize/fusionaize-sdk/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange)](https://pnpm.io/)

> [!NOTE]
> **Canonical repository: self-hosted Forgejo** — `git.langevc.com/fusionaize/fusionaize-sdk`.
> This GitHub copy is a synced mirror. Develop on Forgejo (see [Development](#development));
> pull requests are opened there.

The fusionAIze SDK is a shared, cross‑cutting TypeScript monorepo that provides:

- **Core types and utilities** for the fusionAIze platform
- **Contract definitions** for API interactions
- **Client libraries** for fusionAIze Gate and related services
- **Developer‑grade foundation** for building on fusionAIze

## Architecture

```
fusionaize-sdk/
├── packages/           # Published npm packages
│   ├── sdk-core/      # Core types, Result<T,E>, utilities
│   ├── sdk-contracts/ # API contracts, request/response types
│   ├── sdk-errors/    # Error taxonomy, serializable errors
│   ├── sdk-config/    # Configuration loading, profile resolution
│   ├── sdk-auth/      # Authentication providers, token handling
│   ├── sdk-transport/ # HTTP transport layer, request/response
│   ├── sdk-tracing/   # Tracing, correlation IDs, propagation
│   ├── sdk-testing/   # Testing utilities, mocks, fixtures
│   ├── gate-client/   # Typed client for fusionAIze Gate (data plane)
│   ├── gate-runtime/  # Runtime helpers for orchestration
│   └── gate-control/  # Control‑plane/admin‑safe client
├── examples/          # Example usage across different scenarios
├── schemas/           # JSON Schema, OpenAPI, protocol definitions
└── docs/              # Architecture, packages, versioning, governance
```

## Getting Started

### Installation

```bash
# Install individual packages as needed
pnpm add @fusionaize/sdk-core @fusionaize/gate-client

# Or install all packages (not recommended for production)
pnpm add @fusionaize/sdk-core @fusionaize/sdk-contracts @fusionaize/sdk-errors
```

### Basic Usage

```typescript
import { GateClient } from '@fusionaize/gate-client';
import { loadConfig } from '@fusionaize/sdk-config';

async function main() {
  const config = await loadConfig();
  const client = new GateClient(config);
  
  const response = await client.createRun({
    model: 'claude-3-haiku',
    messages: [{ role: 'user', content: 'Hello' }],
  });
  
  console.log(response.choices[0].message.content);
}
```

## Development

### Prerequisites

- Node.js 20+
- pnpm 10+

### Setup

```bash
# Clone the canonical repository (self-hosted Forgejo)
git clone git@git.langevc.com:fusionaize/fusionaize-sdk.git
cd fusionaize-sdk

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run lint
pnpm lint

# Run type checking
pnpm typecheck
```

### Monorepo Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm dev` | Watch mode for all packages |
| `pnpm test` | Run tests across all packages |
| `pnpm lint` | Lint all packages with Biome |
| `pnpm typecheck` | TypeScript compilation check |
| `pnpm changeset` | Create a changeset for versioning |
| `pnpm check:boundaries` | Validate package dependency boundaries |
| `pnpm check:exports` | Validate package export maps |
| `pnpm check:release` | Verify release state |

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@fusionaize/sdk-core`](./packages/sdk-core) | `0.1.0` | Core types, utilities, and foundational abstractions |
| [`@fusionaize/sdk-contracts`](./packages/sdk-contracts) | `0.1.0` | API contracts, request/response types, StreamEvent |
| [`@fusionaize/sdk-errors`](./packages/sdk-errors) | `0.1.0` | Error taxonomy, serializable errors, error utilities |
| [`@fusionaize/sdk-config`](./packages/sdk-config) | `0.1.0` | Configuration loading, profile resolution, validation |
| [`@fusionaize/sdk-auth`](./packages/sdk-auth) | `0.1.0` | Authentication providers, token handling, auth headers |
| [`@fusionaize/sdk-transport`](./packages/sdk-transport) | `0.1.0` | HTTP transport layer, request/response, retries |
| [`@fusionaize/sdk-tracing`](./packages/sdk-tracing) | `0.1.0` | Tracing, correlation IDs, trace propagation |
| [`@fusionaize/sdk-testing`](./packages/sdk-testing) | `0.1.0` | Testing utilities, mocks, fixtures, fake auth |
| [`@fusionaize/gate-client`](./packages/gate-client) | `0.1.0` | Typed client for fusionAIze Gate data‑plane operations |
| [`@fusionaize/gate-runtime`](./packages/gate-runtime) | `0.1.0` | Runtime helpers for orchestration, fallback, capabilities |
| [`@fusionaize/gate-control`](./packages/gate-control) | `0.1.0` | Control‑plane/admin‑safe client for health, routes, providers |

## Governance

- **Versioning**: [Semantic Versioning](https://semver.org/) via [Changesets](./.changeset/README.md)
- **Code Quality**: TypeScript strict, Biome for linting/formatting, Turborepo for orchestration
- **Package Boundaries**: Clear separation between foundation (`sdk-*`) and gate (`gate-*`) packages
- **Release Process**: Automated via GitHub Actions with Changesets
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

Apache 2.0 - see [LICENSE](./LICENSE) for details.

---

**Note**: This is a developer‑grade foundation SDK. It does not contain runtime logic from `faigate`, provider‑native core logic, or UI‑specific components. The focus is on clear contracts, types, and client utilities.