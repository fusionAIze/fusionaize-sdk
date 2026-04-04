# Schemas

> JSON Schema, OpenAPI, and protocol definitions for the fusionAIze SDK

## Overview

This directory contains schema definitions for the fusionAIze platform:

- **JSON Schema** – For configuration validation and type generation
- **OpenAPI** – For API documentation and client generation
- **Protocol Buffers** – For high‑performance serialization (planned)
- **TypeScript types** – Generated from schemas for type safety

## Structure

```
schemas/
├── json-schema/     # JSON Schema definitions
│   ├── config/      # Configuration schemas
│   ├── contracts/   # API contract schemas
│   └── errors/      # Error schema definitions
├── openapi/         # OpenAPI specifications
│   ├── gate/        # fusionAIze Gate API
│   └── common/      # Shared OpenAPI components
├── protobuf/        # Protocol Buffer definitions (planned)
└── generated/       # Generated code (TypeScript, etc.)
```

## Usage

### JSON Schema

```bash
# Validate configuration against schema
npx ajv validate -s schemas/json-schema/config/profile.json -d config.json

# Generate TypeScript types from JSON Schema
npx json2ts schemas/json-schema/contracts/run-request.json > src/types/run-request.ts
```

### OpenAPI

```bash
# Generate TypeScript client from OpenAPI
npx openapi-typescript schemas/openapi/gate/v1.yaml --output src/gate-client.ts

# Serve OpenAPI documentation
npx redoc-cli serve schemas/openapi/gate/v1.yaml
```

## Schema Evolution

### Versioning

Schemas are versioned alongside packages:

- **Major version** – Breaking changes (incompatible schema)
- **Minor version** – Additive changes (new fields, endpoints)
- **Patch version** – Non‑breaking corrections

### Compatibility

- **Forward compatibility** – New fields can be added
- **Backward compatibility** – Old clients work with new servers
- **Schema registry** – Track schema versions and compatibility

## Contributing

### Adding a New Schema

1. **Place in appropriate directory**
2. **Include `$schema` reference**
3. **Add comprehensive documentation**
4. **Generate TypeScript types**
5. **Update this README if needed**

### Schema Guidelines

- **Descriptive titles** – Clear purpose of schema
- **Examples** – Include example valid instances
- **Documentation** – JSDoc‑style comments in schemas
- **Testing** – Validate schemas with test data

## Tools

### Validation
- **AJV** – JSON Schema validation
- **Swagger Editor** – OpenAPI validation
- **protoc** – Protocol Buffer compilation

### Generation
- **json2ts** – JSON Schema → TypeScript
- **openapi-typescript** – OpenAPI → TypeScript
- **protobuf‑ts** – Protocol Buffers → TypeScript

### Documentation
- **Redoc** – OpenAPI documentation
- **JSON Schema Viewer** – Schema documentation

## Examples

### JSON Schema Example

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://fusionaize.dev/schemas/config/profile.json",
  "title": "Configuration Profile",
  "description": "A fusionAIze configuration profile",
  "type": "object",
  "properties": {
    "gateEndpoint": {
      "type": "string",
      "format": "uri",
      "description": "URL of the fusionAIze Gate instance"
    },
    "apiKey": {
      "type": "string",
      "description": "API key for authentication"
    }
  },
  "required": ["gateEndpoint"]
}
```

### OpenAPI Example

```yaml
openapi: 3.1.0
info:
  title: fusionAIze Gate API
  version: 1.0.0
paths:
  /v1/runs:
    post:
      summary: Create a run
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RunRequest'
      responses:
        '200':
          description: Run created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RunResponse'
```

## Future Plans

- **Schema registry** – Centralized schema management
- **Code generation** – Generate clients in multiple languages
- **Validation middleware** – Runtime schema validation
- **Migration tools** – Schema evolution tooling

---

*Schemas are a source of truth for the fusionAIze platform.*