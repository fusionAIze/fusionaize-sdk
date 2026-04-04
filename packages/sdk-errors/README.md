# @fusionaize/sdk-errors

Canonical error taxonomy and serializable errors for the fusionAIze SDK.

## Purpose

Defines a standard error taxonomy, serializable error shapes, and classification helpers for consistent error handling across the fusionAIze stack.

## When to use

- Throwing or catching errors in fusionAIze clients or servers
- Serializing errors for logging or transmission
- Classifying errors for retry logic or user feedback
- Building error‑aware middleware or instrumentation

## Public exports

- `FusionAIzeError` – base error class
- `ErrorCode` – enum of canonical error codes
- `SerializableError` – shape for serialized errors
- `isRetryableError`, `isUserError` – classification helpers
- `errorToJSON`, `errorFromJSON` – serialization utilities

## Example

```typescript
import { FusionAIzeError, ErrorCode } from '@fusionaize/sdk-errors';

const err = new FusionAIzeError('Something went wrong', ErrorCode.Internal);
console.log(err.code); // 'internal'
console.log(err.isRetryable()); // true for some codes
```

## Dependency notes

Depends on `@fusionaize/sdk-core` for base types.

## Stability

**Beta** – Error taxonomy may expand as the stack evolves, but core codes will remain stable.