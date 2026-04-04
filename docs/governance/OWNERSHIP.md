# Package Ownership & Release Responsibility

> Clear ownership model and release responsibilities for fusionAIze SDK packages

## Overview

This document defines the ownership model for fusionAIze SDK packages, outlining who is responsible for maintenance, releases, and quality assurance. The model balances distributed ownership with centralized coordination.

## Ownership Model

### Package Categories & Owners

#### Foundation Packages (Platform Team)
**Primary Owner**: Platform Architecture Team  
**Secondary Owners**: All SDK contributors

| Package | Primary Maintainer | Reviewers |
|---------|-------------------|-----------|
| `@fusionaize/sdk-core` | Platform Team | All maintainers |
| `@fusionaize/sdk-errors` | Platform Team | All maintainers |
| `@fusionaize/sdk-contracts` | Platform Team | All maintainers |
| `@fusionaize/sdk-config` | Platform Team | Infrastructure experts |
| `@fusionaize/sdk-auth` | Platform Team + Security | Security reviewers |
| `@fusionaize/sdk-transport` | Platform Team + Networking | Network experts |
| `@fusionaize/sdk-tracing` | Platform Team + Observability | Observability experts |
| `@fusionaize/sdk-testing` | Platform Team + Testing | Testing experts |

#### Gate Packages (Product Teams)
**Primary Owner**: Product Engineering Team  
**Secondary Owners**: Service domain experts

| Package | Primary Maintainer | Reviewers |
|---------|-------------------|-----------|
| `@fusionaize/gate-client` | Product Team | Platform Team + API consumers |
| `@fusionaize/gate-control` | Product Team + Platform | Admin tooling experts |
| `@fusionaize/gate-runtime` | Product Team + Platform | Runtime specialists |

## Roles & Responsibilities

### Package Owner (Primary)

**Responsibilities**:
- **API Design**: Define and evolve package API
- **Quality Assurance**: Ensure test coverage and documentation
- **Issue Triage**: Respond to bug reports and feature requests
- **Release Management**: Coordinate version bumps and releases
- **Dependency Updates**: Review and approve dependency changes
- **Security**: Address security vulnerabilities

**Rights**:
- Merge PRs to owned packages (with required approvals)
- Decide on API changes within semver constraints
- Nominate additional maintainers
- Represent package in architecture discussions

### Package Maintainer (Secondary)

**Responsibilities**:
- **Code Review**: Review PRs for owned packages
- **Documentation**: Ensure docs stay current with changes
- **Testing**: Verify test coverage and quality
- **Community Support**: Help users in discussions and issues

**Rights**:
- Request changes on PRs
- Propose API improvements
- Participate in release planning

### Release Manager (Rotating)

**Responsibilities**:
- **Release Coordination**: Manage the weekly release cycle
- **Change Validation**: Verify changesets and version bumps
- **Quality Gates**: Ensure CI passes before release
- **Communication**: Announce releases and breaking changes

**Rotation**: Weekly among senior maintainers

## Release Process & Responsibilities

### Weekly Release Cycle

**Monday - Wednesday**: Development & PR review
- Package owners review and merge PRs
- Contributors add changesets
- CI validates changes

**Thursday**: Release Preparation
- Release manager reviews pending changesets
- Verifies breaking changes have proper migration paths
- Ensures all packages build successfully

**Friday**: Release Day
1. **10:00 AM**: Release manager creates version PR
2. **12:00 PM**: Package owners review version PR
3. **2:00 PM**: Version PR merged (if approved)
4. **3:00 PM**: CI publishes to npm, creates GitHub release
5. **4:00 PM**: Release announcement in #sdk-releases

### Emergency Releases

**When**: Critical security fixes, major regressions
**Process**:
1. Create changeset with `security` or `hotfix` label
2. Request emergency review from package owner + security team
3. Fast-track version PR
4. Release immediately after approval
5. Post-release notification to all consumers

## Decision Making

### API Changes

| Change Type | Decision Process | Approvers Required |
|-------------|-----------------|-------------------|
| **Patch** (bug fix) | Package owner + 1 maintainer | 2 |
| **Minor** (new feature) | Package owner + 2 maintainers | 3 |
| **Major** (breaking change) | RFC + Architecture review | Platform team majority |
| **Security** | Security team + Package owner | Security lead + Owner |

### Package Dependencies

**Adding Dependencies**:
- Internal (workspace): Package owner approval
- External (npm): Architecture review + security audit
- Peer dependencies: Platform team approval

**Updating Dependencies**:
- Patch updates: Automated (Renovate/Dependabot)
- Minor updates: Package owner review
- Major updates: Architecture review

## Quality Metrics & Accountability

### Package Health Dashboard

Each package owner monitors:
- **Test Coverage**: Minimum 85%, target 90%
- **Issue Response Time**: < 48 hours for critical, < 1 week for normal
- **Release Cadence**: Regular releases (at least monthly)
- **Documentation**: README, API docs, examples
- **Dependency Health**: No critical vulnerabilities

### Performance Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| Build time | < 30 seconds | Package owner |
| Bundle size | < 50KB (minified) | Package owner |
| Type checking | < 10 seconds | Package owner |
| Test execution | < 2 minutes | Package owner |

## Escalation Path

### Issue Resolution

1. **Package maintainer** - First response within 48 hours
2. **Package owner** - Escalation if no response
3. **Platform team** - Technical dispute resolution
4. **Engineering leadership** - Strategic decisions

### Conflict Resolution

**Technical disagreements**:
1. Document alternatives with pros/cons
2. Seek additional maintainer opinions
3. Platform team makes final decision
4. Decision documented for transparency

## Onboarding & Offboarding

### New Package Owner

**Process**:
1. Nomination by existing owner or platform team
2. Shadow current owner for 2 release cycles
3. Demonstrate competence with package codebase
4. Approval by platform team
5. Added to CODEOWNERS file

### Transferring Ownership

**When**:
- Owner leaving team
- Package reassignment
- Performance issues

**Process**:
1. Identify new owner candidate
2. Knowledge transfer period (2-4 weeks)
3. Update documentation and CODEOWNERS
4. Announce transfer to community

## Tooling & Automation

### CODEOWNERS File

```gitignore
# Foundation packages
/packages/sdk-core/ @fusionaize/platform-team
/packages/sdk-errors/ @fusionaize/platform-team
/packages/sdk-contracts/ @fusionaize/platform-team
/packages/sdk-config/ @fusionaize/platform-team @fusionaize/infrastructure
/packages/sdk-auth/ @fusionaize/platform-team @fusionaize/security
/packages/sdk-transport/ @fusionaize/platform-team @fusionaize/networking
/packages/sdk-tracing/ @fusionaize/platform-team @fusionaize/observability
/packages/sdk-testing/ @fusionaize/platform-team @fusionaize/testing

# Gate packages
/packages/gate-client/ @fusionaize/product-team @fusionaize/platform-team
/packages/gate-control/ @fusionaize/product-team @fusionaize/platform-team
/packages/gate-runtime/ @fusionaize/product-team @fusionaize/platform-team
```

### Release Automation

- **Changesets**: Automated version calculation
- **GitHub Actions**: CI/CD pipeline
- **Required Reviews**: CODEOWNERS enforcement
- **Quality Gates**: Automated checks before release

## Communication Channels

### Regular Communication

- **Weekly sync**: Package owners + platform team
- **Monthly review**: Health metrics and roadmap
- **Quarterly planning**: Strategic direction

### Incident Communication

- **Security issues**: Private security channel + direct owner notification
- **Breaking changes**: Release notes + migration guide + announcement
- **Service outages**: Status page + direct consumer notification

## FAQ

### Q: What if a package has no active owner?
**A**: Platform team assumes temporary ownership, seeks new owner, or considers deprecation.

### Q: Can a package have multiple primary owners?
**A**: Yes, for critical packages. Decisions require consensus or escalation.

### Q: How are conflicts between package owners resolved?
**A**: Platform team mediates, with engineering leadership as final arbiter.

### Q: What about packages used by multiple teams?
**A**: Cross-functional ownership with representatives from each consuming team.

### Q: How do consumers provide feedback on ownership?
**A**: GitHub discussions, issue templates, or direct contact to platform team.

## Related Documents

- [Governance](../governance/README.md) - Overall project governance
- [Maintainer Playbook](./MAINTAINER_PLAYBOOK.md) - Day-to-day maintainer guide
- [Versioning Guide](../versioning/README.md) - Release process and versioning