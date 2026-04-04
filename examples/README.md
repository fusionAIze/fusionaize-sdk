# Examples

> Example usage of the fusionAIze SDK packages

## Overview

This directory contains examples demonstrating how to use the fusionAIze SDK in various scenarios. Each example is self‑contained and includes setup instructions.

## Structure

```
examples/
├── gate-client-basic/     # Basic Gate client usage
├── gate-client-streaming/ # Streaming responses (planned)
├── gate-control-admin/    # Admin/control operations (planned)
├── sdk-config-profiles/   # Configuration profiles (planned)
├── sdk-auth-providers/    # Custom auth providers (planned)
├── sdk-testing-mocks/     # Testing with mocks (planned)
└── README.md             # This file
```

## Running Examples

### Prerequisites

- Node.js 20+
- pnpm 10+
- A running fusionAIze Gate instance (for client examples)

### Setup

1. **Install dependencies** (from repository root):
   ```bash
   pnpm install
   ```

2. **Build packages**:
   ```bash
   pnpm build
   ```

3. **Navigate to example**:
   ```bash
   cd examples/gate-client-basic
   ```

4. **Run the example**:
   ```bash
   pnpm start
   # or
   node index.js
   ```

## Example Descriptions

### `gate-client-basic`

**Purpose**: Basic usage of `@fusionaize/gate-client` for creating runs and handling responses.

**Key Concepts**:
- Loading configuration
- Creating a Gate client
- Sending run requests
- Handling responses and errors

**Files**:
- `index.js` – Main example code
- `package.json` – Example dependencies
- `README.md` – Example‑specific instructions

### `gate-client-streaming` (Planned)

**Purpose**: Streaming responses from fusionAIze Gate.

**Key Concepts**:
- Server‑Sent Events (SSE)
- Async iteration over stream events
- Handling partial responses

### `gate-control-admin` (Planned)

**Purpose**: Administrative operations using `@fusionaize/gate-control`.

**Key Concepts**:
- Health checks
- Route management
- Provider status
- Metrics collection

### `sdk-config-profiles` (Planned)

**Purpose**: Advanced configuration management with `@fusionaize/sdk-config`.

**Key Concepts**:
- Multiple configuration profiles
- Environment‑specific configuration
- Configuration validation
- Profile merging

### `sdk-auth-providers` (Planned)

**Purpose**: Custom authentication providers with `@fusionaize/sdk-auth`.

**Key Concepts**:
- API key authentication
- Token‑based authentication
- Custom auth providers
- Auth header management

### `sdk-testing-mocks` (Planned)

**Purpose**: Testing with mocks from `@fusionaize/sdk-testing`.

**Key Concepts**:
- Mock transport
- Test fixtures
- Fake auth providers
- Integration testing patterns

## Creating New Examples

### Template

```bash
# Create new example directory
mkdir examples/new-example
cd examples/new-example

# Create package.json
cat > package.json << EOF
{
  "name": "new-example",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@fusionaize/sdk-core": "workspace:*",
    "@fusionaize/gate-client": "workspace:*"
  }
}
EOF

# Create example code
cat > index.js << EOF
import { GateClient } from '@fusionaize/gate-client';
import { loadConfig } from '@fusionaize/sdk-config';

async function main() {
  const config = await loadConfig();
  const client = new GateClient(config);
  
  console.log('Example running...');
}

main().catch(console.error);
EOF
```

### Guidelines

1. **Self‑contained** – Each example should run independently
2. **Documented** – Include README with setup and explanation
3. **Minimal** – Focus on one concept or package
4. **Type‑safe** – Use TypeScript where possible
5. **Realistic** – Show real‑world usage patterns

## Testing Examples

Examples should be tested as part of CI:

```bash
# Run all examples
pnpm examples:test

# Run specific example
cd examples/gate-client-basic && pnpm test
```

## Contributing Examples

We welcome new examples! Follow these steps:

1. **Check for existing examples** – Avoid duplication
2. **Create new directory** – Use kebab‑case naming
3. **Add example code** – Focus on one concept
4. **Add documentation** – README with setup and explanation
5. **Test locally** – Ensure example runs correctly
6. **Submit PR** – Include example in CI testing

## Common Issues

### Missing Dependencies

If you see `Cannot find module` errors:

```bash
# From repository root
pnpm install
pnpm build
```

### Configuration Errors

Examples may require a running fusionAIze Gate instance. For local development:

```bash
# Start Gate locally (if available)
gate --port 8090

# Or use environment variables
export FUSIONAIZE_GATE_ENDPOINT=http://localhost:8090
```

### TypeScript Errors

Some examples use TypeScript. Compile first:

```bash
npx tsc --build
```

## Resources

- [fusionAIze SDK Documentation](../docs/)
- [Package READMEs](../packages/)
- [GitHub Repository](https://github.com/fusionaize/fusionaize-sdk)

---

*Examples make the SDK approachable and demonstrate best practices.*