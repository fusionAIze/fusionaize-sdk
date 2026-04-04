# CI Test Matrix Proposal for fusionAIze SDK

## Overview

This document proposes a minimal CI test matrix for the fusionAIze SDK to ensure reliable testing across different configurations while maintaining reasonable CI execution times.

## Core Principles

1. **Fast feedback**: Unit tests should run quickly (< 5 minutes)
2. **Comprehensive coverage**: Integration tests should cover key scenarios
3. **Platform safety**: Test on multiple Node.js versions
4. **Contract safety**: Validate API contracts across versions
5. **Resource efficiency**: Parallelize where possible, cache aggressively

## Test Matrix

### 1. Unit Tests (Every Commit)

**Scope**: All packages (`@fusionaize/sdk-*`, `@fusionaize/gate-*`)
**Trigger**: On every push to any branch
**Configuration**:
- Node.js: 20.x (LTS)
- OS: ubuntu-latest
- Cache: TurboRepo cache, node_modules
- Parallelism: Run tests in parallel across packages

**Commands**:
```bash
pnpm install
pnpm test:unit  # Runs vitest with coverage
pnpm lint
pnpm typecheck
```

**Expected Duration**: < 3 minutes

### 2. Integration Tests (Pull Requests)

**Scope**: Critical integration paths
- `@fusionaize/gate-client` with `@fusionaize/sdk-transport`
- `@fusionaize/sdk-auth` credential flows
- `@fusionaize/sdk-config` loading scenarios
- `@fusionaize/sdk-testing` mock utilities

**Trigger**: On pull request to main branch
**Configuration**:
- Node.js: 18.x, 20.x (two jobs)
- OS: ubuntu-latest
- Use `MockGateServer` and `MockTransport` for isolation

**Commands**:
```bash
pnpm install
pnpm test:integration  # Runs integration test suite
```

**Expected Duration**: < 5 minutes per Node version

### 3. Contract Compliance Tests (Nightly)

**Scope**: Validate all TypeScript contracts match runtime behavior
**Trigger**: Scheduled (daily at 02:00 UTC)
**Configuration**:
- Node.js: 20.x
- OS: ubuntu-latest
- Run contract validation from `@fusionaize/sdk-testing`

**Commands**:
```bash
pnpm install
pnpm test:contracts  # Validates all API contracts
```

**Expected Duration**: < 2 minutes

### 4. Cross-Platform Tests (Weekly)

**Scope**: Ensure platform compatibility
**Trigger**: Scheduled (weekly on Monday at 03:00 UTC)
**Configuration**:
- Node.js: 20.x
- OS: ubuntu-latest, macos-latest, windows-latest
- Focus on file system operations, environment variables, network

**Commands**:
```bash
pnpm install
pnpm test:cross-platform
```

**Expected Duration**: < 10 minutes

### 5. Performance Benchmarks (Monthly)

**Scope**: Monitor performance regressions
**Trigger**: Scheduled (1st of month at 04:00 UTC)
**Configuration**:
- Node.js: 20.x
- OS: ubuntu-latest
- Isolated environment, no network calls

**Commands**:
```bash
pnpm install
pnpm test:benchmark  # Runs performance benchmarks
```

**Expected Duration**: < 15 minutes

## Package-Specific Test Strategies

### Foundation Packages (`@fusionaize/sdk-*`)

| Package | Test Focus | Key Scenarios |
|---------|------------|---------------|
| `sdk-core` | Unit tests | Type utilities, Result type, Envelope |
| `sdk-errors` | Unit tests | Error serialization, retry logic |
| `sdk-config` | Integration | Environment variables, profile inheritance |
| `sdk-auth` | Integration | Provider chains, credential stores |
| `sdk-transport` | Integration | Retries, middleware, timeouts |
| `sdk-tracing` | Unit tests | Trace context propagation |
| `sdk-contracts` | Contract tests | Type definitions, validation |
| `sdk-testing` | Integration | Mock utilities, fixture builders |

### Gate Packages (`@fusionaize/gate-*`)

| Package | Test Focus | Key Scenarios |
|---------|------------|---------------|
| `gate-client` | Integration | Run creation, streaming, tool calls |
| `gate-control` | Integration | Provider management, health checks |
| `gate-runtime` | Integration | Orchestration, fallback logic |

## Test Environment Setup

### Local Development
```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run specific package tests
pnpm test --filter=@fusionaize/sdk-transport

# Run with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration
```

### CI Environment Variables
```yaml
env:
  NODE_ENV: test
  CI: true
  FUSIONAIZE_TEST_MODE: mock  # Use mock transport by default
  FUSIONAIZE_LOG_LEVEL: warn  # Reduce log noise
```

## Mock-First Testing Strategy

All tests should use the testing utilities from `@fusionaize/sdk-testing`:

1. **Unit Tests**: Use `MockTransport` and `FakeAuthProvider`
2. **Integration Tests**: Use `MockGateServer` for API simulation
3. **Contract Tests**: Use `ContractValidator` from `@fusionaize/sdk-testing`
4. **Streaming Tests**: Use `StreamRecorder` and `StreamReplayer`

## Coverage Targets

| Package Type | Statement Coverage | Branch Coverage | Function Coverage |
|--------------|-------------------|-----------------|-------------------|
| Foundation   | 90%               | 85%             | 90%               |
| Gate Client  | 85%               | 80%             | 85%               |
| Testing      | 95%               | 90%             | 95%               |

## Flaky Test Handling

1. **Retry Logic**: Failed tests automatically retry once
2. **Timeout Configuration**: Liberal timeouts for CI environments
3. **Isolation**: Each test runs in isolated context
4. **Resource Cleanup**: Proper teardown after each test

## Implementation Steps

### Phase 1: Foundation (Week 1)
- [ ] Set up Vitest configuration for all packages
- [ ] Implement basic unit tests for `sdk-core`, `sdk-errors`
- [ ] Configure CI for unit tests
- [ ] Set up test coverage reporting

### Phase 2: Integration (Week 2)
- [ ] Implement `MockTransport` and `MockGateServer`
- [ ] Write integration tests for `sdk-transport`, `sdk-auth`
- [ ] Configure CI for integration tests
- [ ] Set up contract validation tests

### Phase 3: Gate Clients (Week 3)
- [ ] Write integration tests for `gate-client`
- [ ] Test streaming scenarios
- [ ] Test tool calling scenarios
- [ ] Configure cross-platform testing

### Phase 4: Optimization (Week 4)
- [ ] Parallelize test execution
- [ ] Implement test caching
- [ ] Set up performance benchmarks
- [ ] Document testing patterns

## Cost Estimation

| Resource | Monthly Cost Estimate | Justification |
|----------|----------------------|---------------|
| GitHub Actions | $0 (within free tier) | 2000 minutes/month sufficient |
| Test Runners | $0 | Use GitHub-hosted runners |
| Storage | $0 | Cache within free limits |

## Success Metrics

1. **Test Execution Time**: < 10 minutes for full test suite
2. **Test Reliability**: < 1% flaky test rate
3. **Coverage**: Meet or exceed coverage targets
4. **Developer Experience**: Tests run locally in < 2 minutes

## Appendix: Example GitHub Actions Workflow

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x]
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm lint
      - run: pnpm typecheck

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:integration
```

This matrix provides a balanced approach to testing that ensures quality while maintaining development velocity.