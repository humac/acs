# Complete CI/CD Flow (All Environments)

## Description
This diagram shows the complete continuous integration and continuous deployment flow for ACS, from developer workstation through GitHub to Railway environments (PR Preview, Dev, Prod) with notifications.

## When to Reference
- Understanding the full deployment pipeline
- Onboarding new developers
- Troubleshooting deployment issues
- Planning infrastructure changes

## Flow Overview
The diagram illustrates how code moves from a developer's local machine through multiple Railway environments with automated testing, deployment, and monitoring at each stage.

```mermaid
graph TB
    subgraph "Developer Workstation"
        A1[Write Code] --> A2[Commit to Feature Branch]
        A2 --> A3[Push to GitHub]
    end
    
    subgraph "GitHub"
        A3 --> B1{Branch Type?}
        B1 -->|feature/*| B2[Create PR]
        B1 -->|develop| B3[Merge to Develop]
        B1 -->|main| B4[Merge to Main]
        B1 -->|hotfix/*| B5[Hotfix PR]
    end
    
    subgraph "Railway - PR Preview"
        B2 --> C1[Detect PR]
        C1 --> C2[Build Backend]
        C1 --> C3[Build Frontend]
        C2 --> C4[Create Ephemeral DB]
        C3 --> C4
        C4 --> C5[Deploy Preview]
        C5 --> C6[Post URL to PR]
        C6 --> C7{Tests Pass?}
        C7 -->|No| A1
        C7 -->|Yes| B3
    end
    
    subgraph "Railway - Development"
        B3 --> D1[Detect Push to Develop]
        D1 --> D2[Build Backend]
        D1 --> D3[Build Frontend]
        D2 --> D4[Deploy to Dev Env]
        D3 --> D4
        D4 --> D5[Run Migrations]
        D5 --> D6[Health Check]
        D6 --> D7{QA Pass?}
        D7 -->|No| A1
        D7 -->|Yes| D8[Approve Release]
    end
    
    subgraph "Railway - Production"
        B4 --> E1[Detect Push to Main]
        D8 --> E1
        B5 --> E1
        E1 --> E2[Build Backend]
        E1 --> E3[Build Frontend]
        E2 --> E4[Run Prod Migrations]
        E3 --> E4
        E4 --> E5[Zero-Downtime Deploy]
        E5 --> E6[Health Check]
        E6 --> E7{Healthy?}
        E7 -->|No| E8[Auto Rollback]
        E7 -->|Yes| E9[Monitor Metrics]
        E8 --> E10[Alert Team]
        E9 --> E11{Issues?}
        E11 -->|Yes| E12[Manual Rollback]
        E11 -->|No| E13[Success!]
    end
    
    subgraph "Notifications"
        C6 -.-> N1[Slack: PR Preview Ready]
        D4 -.-> N2[Slack: Dev Deployed]
        E5 -.-> N3[Slack: Prod Deploying]
        E13 -.-> N4[Slack: Prod Success]
        E10 -.-> N5[PagerDuty: Alert]
    end

    style A1 fill:#e1f5ff
    style E13 fill:#c8e6c9
    style E8 fill:#ffcdd2
    style E12 fill:#ffcdd2
```

## Key Points

### Environment Characteristics
- **PR Preview**: Ephemeral, short-lived, automatically created per PR
- **Development**: Persistent environment for integration testing
- **Production**: Live environment with zero-downtime deployment

### Build Times
- Backend: ~2 minutes
- Frontend: ~2 minutes
- Total deployment: ~5 minutes

### Automatic Rollback Triggers
- Health check failures
- Critical error rate increase
- Service unresponsive

### Manual Intervention Points
1. Code review approval (PR → develop)
2. QA approval (develop → release PR)
3. Release approval (release PR → main)
4. Manual rollback decision (if monitoring detects issues)

## Related Diagrams
- [Feature Development Workflow](02-feature-development-workflow.md) - Detailed developer perspective
- [Railway Auto-Deploy Process](06-railway-auto-deploy.md) - Technical deployment details
- [Monitoring & Rollback](11-monitoring-rollback.md) - Post-deployment procedures
