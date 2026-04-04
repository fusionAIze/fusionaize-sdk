# Release Metrics

> Monitoring and metrics for SDK releases

## Overview

Tracking release metrics helps maintainers understand adoption, stability, and performance of SDK packages. This document outlines key metrics to monitor for each release.

## Goals

1. **Measure adoption** - How quickly are users upgrading?
2. **Assess stability** - Are there regressions or increased errors?
3. **Track performance** - Is the SDK getting faster or slower?
4. **Guide prioritization** - What areas need improvement?

## Core Metrics

### 1. Adoption Metrics

#### Version Distribution
- **What**: Percentage of installs by version
- **Source**: npm downloads, package manager analytics
- **Frequency**: Weekly
- **Target**: >80% on latest minor version within 30 days

**Example**:
```
@fusionaize/sdk-core:
  v1.2.3: 65% (current)
  v1.2.2: 20% 
  v1.1.x: 10%
  v1.0.x: 5%
```

#### Upgrade Lag
- **What**: Time between release and adoption
- **Calculation**: Median time to upgrade across users
- **Target**: <7 days for patch, <30 days for minor

### 2. Stability Metrics

#### Error Rates
- **What**: Error frequency per version
- **Source**: Error tracking (Sentry, application logs)
- **Metrics**:
  - Total errors per million requests
  - Error rate change vs previous version
  - New error types introduced

**Thresholds**:
- **Critical**: Error rate increase >5%
- **Warning**: Error rate increase 1-5%
- **Healthy**: Error rate stable or decreasing

#### Regression Detection
- **What**: New issues reported per version
- **Source**: GitHub issues, support tickets
- **Metrics**:
  - Issue count by severity (critical, high, medium, low)
  - Time to first report
  - Resolution rate

### 3. Performance Metrics

#### Bundle Size
- **What**: Package size impact
- **Tools**: `bundlesize`, `webpack-bundle-analyzer`
- **Targets**:
  - Core packages: <50KB minified+gzipped
  - Client packages: <100KB minified+gzipped
  - Maximum increase: 5% per minor version

#### Runtime Performance
- **What**: Execution time, memory usage
- **Tools**: Benchmarks, profiling
- **Metrics**:
  - API call latency (p50, p95, p99)
  - Memory footprint
  - Startup time

### 4. Quality Metrics

#### Test Coverage
- **What**: Code coverage per package
- **Target**: >90% for stable packages
- **Tools**: `vitest`, coverage reports

#### Type Safety
- **What**: TypeScript strictness compliance
- **Metrics**:
  - `any` usage count
  - Implicit `any` warnings
  - Type completeness score

#### Documentation Coverage
- **What**: API documentation completeness
- **Metrics**:
  - Public APIs with JSDoc: 100%
  - Examples per major feature
  - Documentation freshness (last update)

## Data Sources

### npm Registry
```bash
# Get download counts
npm show @fusionaize/sdk-core downloads

# Version distribution (requires npm Enterprise or proxy)
```

### Error Tracking
- **Sentry**: Error frequency, stack traces
- **Application Logs**: Custom error reporting
- **User Reports**: GitHub issues, support tickets

### Performance Monitoring
- **Bundle Analyzers**: `webpack-bundle-analyzer`
- **Benchmarks**: Custom performance tests
- **RUM**: Real User Monitoring (if applicable)

### Code Quality
- **CI/CD**: Test results, coverage reports
- **Static Analysis**: TypeScript, linters
- **Security Scans**: `npm audit`, `snyk`

## Dashboard & Reporting

### Weekly Release Health Report
```
Week: 2025-W15
Packages Released: 3

ADOPTION
- sdk-core v1.2.3: 65% adoption (+15% from last week)
- gate-client v2.1.0: 40% adoption (+10%)
- Upgrade lag: 5.2 days (improving)

STABILITY  
- Error rate: 0.02% (stable)
- Critical issues: 0
- Regression reports: 1 (low severity)

PERFORMANCE
- Bundle size: +2% (within threshold)
- Latency p95: 142ms (-3ms)
- Memory: stable

QUALITY
- Test coverage: 92% (+1%)
- Type safety: 100% strict
- Docs coverage: 95%
```

### Release Scorecard
| Metric | Weight | Score | Trend |
|--------|--------|-------|-------|
| Adoption Rate | 30% | 85/100 | ↗ |
| Error Rate | 25% | 95/100 | → |
| Performance | 20% | 88/100 | ↗ |
| Bundle Size | 15% | 92/100 | → |
| Documentation | 10% | 90/100 | ↗ |
| **Overall** | **100%** | **88/100** | **↗** |

## Automated Monitoring

### GitHub Actions Workflow
```yaml
# .github/workflows/metrics.yml
name: Release Metrics
on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday
  workflow_dispatch:

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Collect npm download stats
        run: node scripts/collect-npm-metrics.js
        
      - name: Check error rates
        run: node scripts/check-error-metrics.js
        
      - name: Generate report
        run: node scripts/generate-metrics-report.js
        
      - name: Upload to GitHub
        uses: actions/upload-artifact@v4
        with:
          name: metrics-report
          path: metrics-report.md
```

### Metrics Collection Scripts
```javascript
// scripts/collect-npm-metrics.js
import { getPackageStats } from './utils/npm-metrics.js';

const packages = [
  '@fusionaize/sdk-core',
  '@fusionaize/gate-client',
  // ...
];

for (const pkg of packages) {
  const stats = await getPackageStats(pkg);
  console.log(`${pkg}: ${stats.downloads.lastWeek} downloads`);
}
```

## Alerting & Thresholds

### Critical Alerts (Immediate Action)
- Error rate increase >10%
- Security vulnerability in current version
- Bundle size increase >10%
- Test coverage drop below 80%

### Warning Alerts (Review Required)
- Error rate increase 5-10%
- Adoption lag >14 days
- Performance regression >5%
- Documentation coverage <85%

### Informational (Monitoring)
- New version released
- Download trends
- Coverage improvements

## Post-Release Checklist

### Day 1
- [ ] Monitor error rates for spikes
- [ ] Check initial download counts
- [ ] Review first user feedback
- [ ] Verify documentation deployment

### Week 1
- [ ] Calculate early adoption rate
- [ ] Analyze performance benchmarks
- [ ] Review issue reports
- [ ] Update metrics dashboard

### Month 1
- [ ] Assess full adoption rate
- [ ] Evaluate stability metrics
- [ ] Plan next release based on data
- [ ] Archive old version metrics

## Continuous Improvement

### Metric Refinement
- Quarterly review of metric relevance
- Adjust weights based on business impact
- Add new metrics as needed

### Tooling Updates
- Automate data collection
- Improve visualization
- Integrate with existing monitoring

### Process Optimization
- Reduce time to detect regressions
- Improve alerting precision
- Streamline reporting

## FAQ

### Q: How do we track error rates without user instrumentation?
**A**: Use error boundary reporting in the SDK itself. Include telemetry (opt-in) for error reporting.

### Q: What if npm download counts are inaccurate?
**A**: Supplement with other signals: GitHub stars, dependency graphs, and community feedback.

### Q: How do we measure adoption for private packages?
**A**: Use internal registry metrics, or proxy downloads through internal CDN.

### Q: Can we automate regression detection?
**A**: Yes, using canary releases, A/B testing, and automated performance comparisons.

### Q: What's the minimum viable metrics setup?
**A**: Start with:
1. npm download counts
2. GitHub issue tracking
3. Basic performance benchmarks
4. Bundle size monitoring

## Related Documents

- [Release Workflow](./RELEASE_WORKFLOW.md) - Release process
- [Stability Labels](./STABILITY_LABELS.md) - API stability guarantees
- [Migration Guides](./MIGRATION_GUIDES.md) - Version upgrade guidance