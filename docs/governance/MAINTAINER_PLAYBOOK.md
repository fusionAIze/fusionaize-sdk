# Maintainer Playbook

> Day-to-day guide for fusionAIze SDK maintainers

## Overview

This playbook provides practical guidance for maintainers of the fusionAIze SDK. It covers common tasks, decision frameworks, and troubleshooting steps.

## Daily Responsibilities

### Morning Check (15 minutes)

1. **Review notifications**
   - GitHub notifications (mentions, review requests)
   - Security alerts
   - CI failures

2. **Triage issues**
   - Label new issues (bug, feature, question)
   - Assign to appropriate maintainer
   - Set priority (P0 critical, P1 high, P2 normal, P3 low)

3. **Check CI status**
   - Verify main branch builds pass
   - Review failing tests
   - Check release pipeline

### PR Review (As needed)

**Review Checklist**:
- [ ] Code follows package boundaries
- [ ] TypeScript strict mode compliance
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Changeset present (if version bump needed)
- [ ] No breaking changes without major version
- [ ] Performance considered

**Review Priority**:
1. **P0**: Security fixes, critical bugs
2. **P1**: Feature PRs with changesets
3. **P2**: Documentation, minor improvements
4. **P3**: Refactoring, dependency updates

### Weekly Tasks

#### Monday: Planning
- Review upcoming releases
- Check dependency updates
- Plan focus areas for week

#### Wednesday: Mid-week Check
- PR backlog review
- Issue triage catch-up
- CI pipeline health

#### Friday: Release Day
- Release manager responsibilities (see Release Process)

## Common Scenarios & Actions

### 1. New Feature Request

**Process**:
1. **Validate**: Does it align with SDK vision? Check package boundaries.
2. **Scope**: Small enough for single PR? Consider RFC for larger features.
3. **API Design**: Review stability labels (@stable vs @beta).
4. **Implementation**: Assign to contributor or implement.

**Template Response**:
```
Thanks for the feature request!

**Alignment**: [Explain how it fits/doesn't fit SDK vision]
**Complexity**: [Small/Medium/Large - needs RFC?]
**Package**: [Which package should implement?]
**Next Steps**: [Will implement, needs design, etc.]
```

### 2. Bug Report

**Process**:
1. **Reproduce**: Verify bug with provided steps.
2. **Priority**: Assess impact (P0 critical, P1 high, etc.).
3. **Root Cause**: Identify package and component.
4. **Fix**: Implement or assign fix.

**Template Response**:
```
Thanks for the bug report!

**Status**: [Reproduced/Cannot reproduce/Needs more info]
**Priority**: [P0/P1/P2/P3 with explanation]
**Package**: [Affected package]
**ETA**: [If known]
```

### 3. Security Vulnerability

**Process**:
1. **Acknowledge**: Respond within 24 hours.
2. **Assess**: Determine severity (critical/high/medium/low).
3. **Fix**: Implement security patch.
4. **Release**: Emergency release if critical.
5. **Disclose**: Follow coordinated disclosure.

**Emergency Release Checklist**:
- [ ] Security fix implemented
- [ ] Changeset with `security` label
- [ ] Emergency review (security team + package owner)
- [ ] Release immediately after approval
- [ ] Security advisory published

### 4. Breaking Change Proposal

**Process**:
1. **RFC Required**: Document in `docs/rfc/`.
2. **Review**: Architecture review by platform team.
3. **Migration Path**: Plan migration strategy.
4. **Communication**: Announce to consumers.

**Breaking Change Checklist**:
- [ ] RFC approved
- [ ] Major version bump planned
- [ ] Deprecation period (if applicable)
- [ ] Migration guide
- [ ] Communication plan

## Release Management

### Release Manager Duties (Weekly Rotation)

**Thursday (Preparation)**:
1. Review pending changesets
2. Verify breaking changes have migration guides
3. Check CI status
4. Coordinate with package owners

**Friday (Release Day)**:

| Time | Task | Owner |
|------|------|-------|
| 10:00 AM | Create version PR | Release Manager |
| 10:00-12:00 | Review version PR | Package Owners |
| 12:00 PM | Merge if approved | Release Manager |
| 12:00-3:00 PM | CI publishes | Automated |
| 3:00 PM | Verify publication | Release Manager |
| 4:00 PM | Announce release | Release Manager |

**Release Verification Checklist**:
- [ ] All packages built successfully
- [ ] npm packages published
- [ ] GitHub release created
- [ ] Changelogs updated
- [ ] No regression in examples

### Handling Release Failures

**Build Failure**:
1. Check build logs
2. Fix immediate issue
3. Re-run workflow
4. If persistent, roll back problematic changeset

**Publish Failure**:
1. Check npm credentials
2. Verify package names/versions
3. Manual publish if needed: `pnpm release --no-verify`

**Version PR Conflicts**:
1. Resolve conflicts manually
2. Re-run version command: `pnpm changeset version`
3. Verify version accuracy

## Quality Assurance

### Code Review Standards

**Must Have**:
- TypeScript strict mode compliance
- No `any` types (except tests)
- Package boundary adherence
- Test coverage maintained

**Should Have**:
- Performance considerations documented
- Edge cases handled
- Error messages helpful

**Nice to Have**:
- Benchmark comparisons
- Alternative approaches considered

### Testing Standards

**Unit Tests**:
- Pure functions: 100% coverage target
- Complex logic: 90%+ coverage
- Mock external dependencies

**Integration Tests**:
- Use `MockTransport` and `MockGateServer`
- Test happy paths and error cases
- Avoid network calls

**Contract Tests**:
- Validate public API contracts
- Use `ContractValidator` from `@fusionaize/sdk-testing`

### Documentation Standards

**API Documentation**:
- JSDoc for all public exports
- Examples for complex APIs
- Stability labels (@stable, @beta, etc.)

**README Updates**:
- Usage examples
- Migration guides for breaking changes
- Link to related packages

## Communication Guidelines

### Issue & PR Management

**Response Times**:
- Critical issues: < 24 hours
- Normal PRs: < 48 hours
- Feature requests: < 1 week

**Labels**:
- `bug`: Functional issue
- `feature`: New functionality
- `documentation`: Docs improvement
- `question`: User question
- `security`: Security-related
- `breaking-change`: Requires major version

**Milestones**:
- Use for tracking release scope
- Clear deliverables and deadlines

### Community Interaction

**Positive Tone**:
- Thank contributors
- Explain decisions
- Offer guidance

**Setting Expectations**:
- Clear timelines
- Realistic scope
- Honest about limitations

**Escalation**:
- Technical disputes: involve platform team
- Community issues: follow code of conduct
- Security: immediate escalation path

## Tooling & Automation

### Daily Commands

```bash
# Check CI status
pnpm check

# Run tests for specific package
pnpm test --filter=@fusionaize/sdk-core

# Create changeset
pnpm changeset

# Update dependencies
pnpm update
```

### Debugging Helpers

**Build Issues**:
```bash
# Clean build
pnpm clean && pnpm build

# Build specific package
pnpm build --filter=@fusionaize/sdk-core
```

**Test Issues**:
```bash
# Run tests with debug output
pnpm test --reporter=verbose

# Update snapshots
pnpm test --update
```

**Release Issues**:
```bash
# Check release state
pnpm check:release

# Manual version bump (if needed)
pnpm changeset version
```

### Monitoring

**Key Metrics**:
- Build time per package
- Test coverage trends
- Issue resolution time
- Release frequency

**Alert Thresholds**:
- Build time > 5 minutes
- Test coverage < 85%
- Critical issue open > 48 hours
- Failed CI > 24 hours

## Troubleshooting

### Common Issues & Solutions

**TypeScript Compilation Errors**:
1. Check `tsconfig.base.json` changes
2. Verify dependency versions
3. Run `pnpm typecheck` for details

**Package Boundary Violations**:
1. Run `pnpm check:boundaries`
2. Check `scripts/check-package-boundaries.mjs`
3. Update package.json dependencies

**CI Pipeline Failures**:
1. Check GitHub Actions logs
2. Verify secrets (NPM_TOKEN, etc.)
3. Check for flaky tests

**Release Pipeline Blocked**:
1. Check for missing changesets
2. Verify version PR approval
3. Check npm publishing permissions

### Emergency Procedures

**Critical Bug in Production**:
1. Create hotfix branch
2. Implement fix with changeset
3. Emergency review and release
4. Communicate to consumers

**Security Vulnerability**:
1. Follow security protocol
2. Private fix development
3. Coordinated disclosure
4. Emergency release

**Infrastructure Outage**:
1. Identify root cause
2. Workaround if possible
3. Communicate status
4. Post-mortem after resolution

## Knowledge Sharing

### Maintaining Institutional Knowledge

**Documentation**:
- Update playbook with new scenarios
- Document decisions in ADRs (Architecture Decision Records)
- Keep onboarding guide current

**Pairing**:
- Senior + junior maintainer pairing
- Cross-training on different packages
- Shadowing for new maintainers

**Regular Syncs**:
- Weekly maintainer sync
- Monthly architecture review
- Quarterly planning

### Onboarding New Maintainers

**Week 1-2: Orientation**
- Review architecture docs
- Set up development environment
- Shadow PR reviews

**Week 3-4: Contribution**
- Handle simple PRs
- Triage issues
- Participate in release

**Month 2: Ownership**
- Own specific package
- Lead releases
- Mentor new contributors

## Appendix

### Quick Reference

**Release Command Sequence**:
```bash
# Normal release
pnpm changeset          # Create changeset
pnpm version           # Version packages
pnpm build             # Build packages
pnpm release           # Publish to npm

# Emergency release
pnpm changeset --add   # Add changeset with emergency label
# ... follow emergency process
```

**Useful Scripts**:
- `pnpm check:boundaries` - Validate package dependencies
- `pnpm check:exports` - Validate export maps
- `pnpm check:release` - Validate release state
- `pnpm verify:all` - Run all validations

**Key Files**:
- `.changeset/config.json` - Release configuration
- `docs/architecture/PACKAGE_BOUNDARIES.md` - Dependency rules
- `docs/versioning/README.md` - Versioning strategy
- `docs/governance/OWNERSHIP.md` - Ownership model

### Template Responses

**PR Approval**:
```
LGTM! Thanks for the contribution.

**Changes made**:
- [Brief summary of changes]

**Testing**:
- [Test results or verification]

Merging now.
```

**PR Changes Requested**:
```
Thanks for the PR! Some changes needed:

**Issues**:
1. [Specific issue 1]
2. [Specific issue 2]

**Suggestions**:
- [Improvement suggestions]

Please address these and we'll review again.
```

**Issue Triage**:
```
Thanks for reporting this issue.

**Status**: [Triaged/Needs more info/Duplicate]
**Priority**: [P0/P1/P2/P3]
**Next Steps**: [Will fix/Help wanted/Needs design]

[Additional guidance]
```

---

*See also: [Ownership Model](./OWNERSHIP.md), [Governance](../governance/README.md), [Versioning Guide](../versioning/README.md)*