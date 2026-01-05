# Environment Promotion - KARS

Code promotion from development to production.

```mermaid
flowchart LR
    subgraph Local["Local Dev"]
        A[feature/*<br/>Branch] --> B[Local Testing]
    end
    
    subgraph Development["Development (kars-dev)"]
        B --> C[Merge to<br/>kars-dev]
        C --> D[Auto-Deploy<br/>Railway Dev]
        D --> E[kars-dev.keydatalab.ca]
        E --> F[Developer<br/>Testing]
    end
    
    subgraph QA["QA Environment"]
        F --> G[Friday QA<br/>Testing]
        G --> H{All Tests<br/>Pass?}
        H -->|No| I[Fix Bugs]
        I --> C
        H -->|Yes| J[QA Sign-Off]
    end
    
    subgraph Production["Production (kars-prod)"]
        J --> K[Monday 10 AM<br/>Merge Approved]
        K --> L[Merge kars-dev<br/>→ kars-prod]
        L --> M[Auto-Deploy<br/>Railway Prod]
        M --> N[kars.keydatalab.ca]
        N --> O[End Users]
    end
    
    style E fill:#fff9c4
    style N fill:#c8e6c9
```

## Promotion Stages

### Stage 1: Local Development
- **Branch:** feature/*
- **Testing:** Unit tests, local validation
- **Users:** Individual developer
- **Duration:** 2-5 days

### Stage 2: Development Environment
- **Branch:** kars-dev
- **URL:** https://kars-dev.keydatalab.ca
- **Testing:** Integration, developer validation
- **Users:** All developers, initial QA
- **Duration:** 1-7 days (until Friday QA)

### Stage 3: QA Validation
- **Environment:** kars-dev (same)
- **Testing:** Full regression, performance, security
- **Users:** QA team
- **Duration:** Friday (full day)

### Stage 4: Production
- **Branch:** kars-prod
- **URL:** https://kars.keydatalab.ca
- **Testing:** Smoke tests, monitoring
- **Users:** All end users
- **Duration:** Ongoing

---

## Promotion Criteria

### Development → QA
**Automatic** (continuous)
- Code merged to kars-dev
- CI tests pass
- Auto-deployed by Railway

### QA → Production
**Manual** (weekly)
- All QA tests pass
- QA team sign-off
- No critical bugs
- Code freeze respected
- Monday deployment window

---

**Last Updated:** January 2025
