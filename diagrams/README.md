# ACS DevOps & CI/CD Documentation

This directory contains comprehensive workflow diagrams documenting the ACS (Asset Compliance System) deployment process, branch strategy, and release workflows using Mermaid diagrams.

## 📋 Overview

ACS uses **Railway** for deployment with automatic CI/CD pipelines that support multiple environments (PR Preview, Development, Production). Our workflow follows a modified GitFlow strategy with weekly release cycles and emergency hotfix support.

### Key Components:
- **Platform**: Railway (auto-deploy from GitHub)
- **Environments**: PR Preview, Development (develop branch), Production (main branch)
- **Branch Strategy**: feature/* → develop → main (with hotfix/* for emergencies)
- **Release Cycle**: Weekly releases (Monday deployments)
- **CI/CD**: GitHub webhooks trigger Railway auto-deploy

## 📊 Diagram Index

### Core Workflows
1. **[Complete CI/CD Flow](01-complete-cicd-flow.md)** - Full pipeline from development to production with all environments
2. **[Feature Development Workflow](02-feature-development-workflow.md)** - Detailed sequence diagram for feature development lifecycle
3. **[Hotfix Workflow](03-hotfix-workflow.md)** - Emergency fix process for critical production bugs

### Release Management
4. **[Weekly Release Cycle](04-weekly-release-cycle.md)** - Gantt chart showing the weekly release schedule
5. **[Complete Release Workflow](10-complete-release-workflow.md)** - Comprehensive sequence from feature to production

### Deployment Architecture
6. **[Multi-Environment Deployment](05-multi-environment-deployment.md)** - Detailed deployment architecture with resource allocation
7. **[Railway Auto-Deploy Process](06-railway-auto-deploy.md)** - Technical state diagram of Railway's deployment logic
8. **[Environment Promotion Flow](09-environment-promotion.md)** - Code promotion through environments

### Decision Trees & Approvals
9. **[Branch Protection & Approval Flow](07-branch-protection-approval.md)** - Approval gates and merge requirements
10. **[Deployment Decision Tree](08-deployment-decision-tree.md)** - Decision tree for deployment paths
11. **[Monitoring & Rollback](11-monitoring-rollback.md)** - Post-deployment monitoring and rollback decisions

## 🎯 Quick Reference

### Common Workflows

**Starting a New Feature:**
→ See [Feature Development Workflow](02-feature-development-workflow.md)

**Emergency Production Fix:**
→ See [Hotfix Workflow](03-hotfix-workflow.md)

**Weekly Release Process:**
→ See [Weekly Release Cycle](04-weekly-release-cycle.md) and [Complete Release Workflow](10-complete-release-workflow.md)

**Understanding Deployments:**
→ See [Complete CI/CD Flow](01-complete-cicd-flow.md) and [Railway Auto-Deploy](06-railway-auto-deploy.md)

**When Things Go Wrong:**
→ See [Monitoring & Rollback](11-monitoring-rollback.md)

## 📖 How to View These Diagrams

### On GitHub
GitHub automatically renders Mermaid diagrams in Markdown files. Simply click any diagram file above and GitHub will display the flowchart, sequence diagram, or Gantt chart inline.

### Locally
To view these diagrams locally:

1. **VS Code** - Install the "Markdown Preview Mermaid Support" extension
2. **Online** - Use [Mermaid Live Editor](https://mermaid.live/)
3. **CLI** - Install [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli)

### In Documentation Sites
If you're building documentation with MkDocs, Docusaurus, or similar, they typically have Mermaid plugins available.

## 🏗️ Architecture Summary

### Railway Environments

| Environment | Branch | Purpose | Resources | URL Pattern |
|-------------|--------|---------|-----------|-------------|
| **PR Preview** | feature/* | Testing PRs | 256MB RAM, Ephemeral DB | `acs-pr-X.up.railway.app` |
| **Development** | develop | Integration testing | 512MB RAM, 1GB DB | `acs-dev.up.railway.app` |
| **Production** | main | Live application | 1GB RAM, 5GB DB | `kars.up.railway.app` |

### Branch Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (PRs with preview)

hotfix/* → main (emergency)
```

### Release Schedule

- **Monday**: Planning and feature branch creation
- **Tuesday-Thursday**: Development and code reviews
- **Friday**: Code freeze, QA testing, create release PR
- **Monday**: Production deployment and monitoring

## 🔄 Typical Development Flow

1. Developer creates `feature/new-feature` branch
2. Railway automatically creates PR preview environment
3. Developer tests in preview, makes adjustments
4. Code review and approval
5. Merge to `develop` → Railway deploys to Dev environment
6. QA tests in Dev environment
7. Friday: Create release PR (`develop` → `main`)
8. Monday: Merge to `main` → Railway deploys to Production
9. Monitor production for 30 minutes
10. Tag release and update changelog

## 🚨 Emergency Procedures

For critical production bugs:
1. Create `hotfix/*` branch from `main`
2. Test in PR preview
3. Emergency approval process
4. Merge directly to `main`
5. Backport to `develop`
6. Total time: ~20 minutes

See [Hotfix Workflow](03-hotfix-workflow.md) for detailed process.

## 📝 Diagram Maintenance

When updating these diagrams:
1. Test Mermaid syntax at [mermaid.live](https://mermaid.live/)
2. Ensure consistency with actual Railway configuration
3. Update this README if adding new diagrams
4. Keep diagrams focused - one concept per file

## 🤝 Contributing

If you notice any discrepancies between these diagrams and actual processes:
1. Create an issue describing the discrepancy
2. Submit a PR with corrected diagrams
3. Ensure Mermaid syntax is valid before committing

---

**Last Updated**: January 2026  
**Maintained By**: ACS Development Team
