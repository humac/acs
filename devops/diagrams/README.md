# KARS Workflow Diagrams

Visual documentation of KARS (KeyData Asset Registration System) deployment workflows, CI/CD pipelines, and operational procedures.

**Project:** ACS - Asset Compliance System  
**Code Name:** KARS  
**Repository:** humac/acs  
**Domain:** kars.keydatalab.ca

---

## Diagram Index

### CI/CD & Deployment Workflows

1. **[Complete CI/CD Flow](01-complete-cicd-flow.md)** - End-to-end continuous integration and deployment pipeline
2. **[Feature Development Workflow](02-feature-development-workflow.md)** - Feature branch to production promotion workflow
3. **[Hotfix Workflow](03-hotfix-workflow.md)** - Emergency production fix procedures
4. **[Weekly Release Cycle](04-weekly-release-cycle.md)** - Friday QA → Monday deployment schedule
5. **[Multi-Environment Deployment](05-multi-environment-deployment.md)** - Development and production environment architecture

### Railway Platform

6. **[Railway Auto-Deploy](06-railway-auto-deploy.md)** - Railway automatic deployment on git push
7. **[Branch Protection & Approval](07-branch-protection-approval.md)** - PR review and merge approval process
8. **[Deployment Decision Tree](08-deployment-decision-tree.md)** - Logic for deployment decisions

### Operations

9. **[Environment Promotion](09-environment-promotion.md)** - Code promotion from dev to production
10. **[Complete Release Workflow](10-complete-release-workflow.md)** - Full weekly release process with all stakeholders
11. **[Monitoring & Rollback](11-monitoring-rollback.md)** - Post-deployment monitoring and rollback procedures

---

## Diagram Conventions

### Branch Names
- **kars-prod** - Production branch (main deployment)
- **kars-dev** - Development branch (QA environment)
- **feature/** - Feature branches (local/PR)
- **hotfix/** - Emergency fix branches

### Environments
- **Production** - https://kars.keydatalab.ca (kars-prod branch)
- **Development** - https://kars-dev.keydatalab.ca (kars-dev branch)
- **Local** - Developer workstation (feature branches)

### Services
- **kars-backend-prod** - Production backend service
- **kars-frontend-prod** - Production frontend service
- **kars-db-prod** - Production PostgreSQL database
- **kars-backend-dev** - Development backend service
- **kars-frontend-dev** - Development frontend service
- **kars-db-dev** - Development PostgreSQL database

### Communication Channels
- **#kars-releases** - Release announcements and coordination (Microsoft Teams)
- **#kars-support** - User support and general questions (Microsoft Teams)
- **#kars-incidents** - Incident response and emergency communication (Microsoft Teams)

### Deployment Schedule
- **Thursday 5:00 PM EST** - Code freeze begins
- **Friday (all day)** - QA testing on kars-dev
- **Monday 10:00 AM EST** - Production deployment window
- **Monday 10:30 AM EST** - Post-deployment verification

---

## How to Use These Diagrams

### For Developers
- Reference **Feature Development Workflow** when creating new features
- Reference **Hotfix Workflow** for emergency production fixes
- Check **Branch Protection** before attempting to merge

### For DevOps Engineers
- Reference **Railway Auto-Deploy** for deployment troubleshooting
- Use **Deployment Decision Tree** for deployment planning
- Follow **Complete Release Workflow** for weekly releases

### For QA Team
- Follow **Weekly Release Cycle** for Friday QA process
- Reference **Environment Promotion** to understand data flow
- Check **Multi-Environment Deployment** for environment differences

### For Managers
- Review **Complete Release Workflow** for stakeholder communication
- Reference **Weekly Release Cycle** for schedule planning
- Check **Monitoring & Rollback** for incident response procedures

---

## Viewing Diagrams

All diagrams are written in Mermaid syntax and render automatically on GitHub.

**Online Viewers:**
- GitHub (automatic rendering)
- Mermaid Live Editor: https://mermaid.live
- VS Code with Mermaid extension

**Editing:**
- Use any text editor
- Validate at https://mermaid.live
- Follow Mermaid syntax: https://mermaid.js.org/intro/

---

## Diagram Maintenance

### When to Update

Update diagrams when:
- Deployment process changes
- New environments added
- Branch strategy changes
- New stakeholders involved
- Tools or platforms change

### How to Update

1. Edit the `.md` file
2. Test rendering at https://mermaid.live
3. Commit with descriptive message
4. Reference in PR description

---

## Related Documentation

- **[Runbook](../RUNBOOK.md)** - Detailed deployment procedures
- **[Release Checklist](../RELEASE-CHECKLIST.md)** - Step-by-step release process
- **[Incident Response](../INCIDENT-RESPONSE.md)** - Emergency procedures
- **[Railway Setup](../railway/SETUP-GUIDE.md)** - Platform configuration

---

**Last Updated:** January 2025  
**Diagram Count:** 11  
**Format:** Mermaid  
**Project:** KARS (KeyData Asset Registration System)  
**Repository:** https://github.com/humac/acs
