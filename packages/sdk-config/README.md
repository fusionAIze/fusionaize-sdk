# @fusionaize/sdk-config

Configuration loading and profile resolution for fusionAIze SDK.

## Purpose

Provides utilities for loading configuration from environment variables, config files, and profiles, with merging and validation.

## When to use

- Building a CLI or service that needs fusionAIze configuration
- Resolving endpoint URLs, API keys, and other settings
- Managing multiple profiles (development, staging, production)
- Validating configuration before use

## Public exports

- `loadConfig` – load configuration from defaults, env, and files
- `resolveProfile` – resolve a named profile with inheritance
- `Config` – typed configuration interface
- `validateConfig` – validate configuration against schema
- `mergeConfigs` – deep merge configuration objects

## Example

```typescript
import { loadConfig } from '@fusionaize/sdk-config';

const config = await loadConfig({ profile: 'production' });
console.log(config.gateEndpoint); // 'http://localhost:8090'
```

## Dependency notes

Depends on `@fusionaize/sdk-core` for base types.

## Stability

**Experimental** – Configuration format may evolve as the stack matures.