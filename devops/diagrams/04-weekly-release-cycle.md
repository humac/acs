# Weekly Release Cycle - KARS

Friday QA → Monday deployment schedule.

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'14px'}}}%%
gantt
    title KARS Weekly Release Cycle
    dateFormat  YYYY-MM-DD
    axisFormat  %a %d
    
    section Development
    Feature Development           :done, dev, 2025-01-06, 4d
    Code Freeze (Thu 5PM EST)    :crit, freeze, 2025-01-09, 1h
    
    section QA Testing
    QA Preparation               :done, qaprep, 2025-01-10, 2h
    Functional Testing           :active, func, 2025-01-10, 4h
    Performance Testing          :active, perf, 2025-01-10, 2h
    Security Testing             :active, sec, 2025-01-10, 2h
    Browser Compatibility        :active, browser, 2025-01-10, 2h
    Regression Testing           :active, regression, 2025-01-10, 3h
    QA Sign-Off (Fri 3PM EST)   :milestone, qaok, 2025-01-10, 0h
    
    section Release Prep
    Create Release Notes         :relprep, 2025-01-10, 1h
    Notify Stakeholders          :relprep, 2025-01-10, 30m
    
    section Weekend
    No Deployments               :done, weekend, 2025-01-11, 2d
    
    section Monday Deploy
    Pre-Flight Check (9:45 AM)  :crit, preflight, 2025-01-13, 15m
    Production Deployment        :crit, deploy, 2025-01-13, 30m
    Post-Deploy Verification     :active, verify, 2025-01-13, 30m
    Monitoring Period            :active, monitor, 2025-01-13, 1h
    Release Complete (11:30 AM) :milestone, complete, 2025-01-13, 0h
```

```mermaid
flowchart TB
    subgraph Monday["Monday (Previous Week)"]
        A[Previous Release Complete] --> B[Development Phase Begins]
    end
    
    subgraph TuesdayWednesday["Tuesday - Wednesday"]
        B --> C[Feature Development]
        C --> D[Merge Features to kars-dev]
        D --> E[Continuous Testing on Dev]
    end
    
    subgraph Thursday["Thursday"]
        E --> F[Final Feature Merges]
        F --> G[Code Freeze (5:00 PM EST)<br/>Post in #kars-releases]
        G --> H[No More Merges to kars-dev]
    end
    
    subgraph Friday["Friday - QA Day"]
        H --> I[QA Team Starts Testing<br/>kars-dev.keydatalab.ca]
        I --> J[Functional Testing<br/>All features work]
        I --> K[Performance Testing<br/>Response times OK]
        I --> L[Security Testing<br/>No vulnerabilities]
        I --> M[Browser Testing<br/>Chrome, Firefox, Safari, Edge]
        I --> N[Regression Testing<br/>Existing features work]
        
        J --> O{All<br/>Tests<br/>Pass?}
        K --> O
        L --> O
        M --> O
        N --> O
        
        O -->|No| P[Create Bug Tickets<br/>Assign to Developers]
        P --> Q[Unfreeze kars-dev]
        Q --> R[Fix Critical Bugs]
        R --> S[Re-test Fixes]
        S --> O
        
        O -->|Yes| T[QA Sign-Off (3:00 PM EST)]
        T --> U[Create Release Notes]
        U --> V[Notify Stakeholders<br/>#kars-releases]
    end
    
    subgraph Weekend["Weekend"]
        V --> W[No Deployments]
        W --> X[Emergency Hotfixes Only]
    end
    
    subgraph Monday2["Monday - Deployment Day"]
        X --> Y[Pre-Flight Check (9:45 AM EST)<br/>- Production health<br/>- Database backup<br/>- Rollback plan]
        Y --> Z{Ready<br/>to<br/>Deploy?}
        Z -->|No| AA[Postpone Deployment<br/>Investigate Issues]
        Z -->|Yes| AB[Create PR<br/>kars-dev → kars-prod]
        AB --> AC[Team Review & Approve]
        AC --> AD[Merge to kars-prod<br/>10:00 AM EST]
        AD --> AE[Post #kars-releases<br/>Deployment Starting]
        AE --> AF[Railway Auto-Deploys<br/>kars-backend-prod<br/>kars-frontend-prod]
        AF --> AG[Monitor Deployment Logs<br/>railway logs --follow]
        AG --> AH{Deploy<br/>Success?}
        AH -->|No| AI[❌ Execute Rollback<br/>railway rollback]
        AI --> AJ[Alert #kars-incidents]
        AJ --> AK[Investigate Failure]
        AH -->|Yes| AL[✅ Deployment Complete<br/>10:15 AM EST]
    end
    
    subgraph PostDeploy["Post-Deployment"]
        AL --> AM[Smoke Tests<br/>- Login works<br/>- Assets load<br/>- Admin functions OK]
        AM --> AN[Monitor for 30 Minutes<br/>- Error rates<br/>- Performance<br/>- User feedback]
        AN --> AO{All<br/>Metrics<br/>Normal?}
        AO -->|No| AP[Investigate Issues<br/>Consider Rollback]
        AO -->|Yes| AQ[✅ Release Complete<br/>10:30 AM EST]
        AQ --> AR[Post #kars-releases<br/>Deployment Successful]
        AR --> AS[Lift Code Freeze]
        AS --> AT[Development Resumes]
        AT --> A
    end
    
    style T fill:#c8e6c9
    style AL fill:#c8e6c9
    style AQ fill:#4caf50
    style AI fill:#ffcdd2
    style P fill:#fff9c4
```

## Weekly Schedule

### Monday (Previous Week)
- **All Day:** Development phase begins
- **Status:** Active development, features being implemented

### Tuesday - Wednesday
- **All Day:** Feature development continues
- **Continuous:** Features merged to kars-dev as completed
- **Testing:** Developers test on kars-dev.keydatalab.ca

### Thursday
- **Until 5:00 PM EST:** Final feature merges
- **5:00 PM EST:** **CODE FREEZE** 🔒
  - Post in #kars-releases
  - No more merges to kars-dev (except critical bugs)
  - Developers prepare for next sprint

### Friday - QA Day 🧪
- **9:00 AM - 12:00 PM:** Morning QA session
  - Functional testing
  - Performance testing
  - Security scanning
- **12:00 PM - 1:00 PM:** Lunch break
- **1:00 PM - 3:00 PM:** Afternoon QA session
  - Browser compatibility
  - Regression testing
  - Bug fixes (if needed)
- **3:00 PM EST:** **QA Sign-Off**
  - Create release notes
  - Notify stakeholders
  - Prepare for Monday deployment

### Weekend
- **Saturday - Sunday:** No deployments
- **Emergency only:** Hotfixes for P0 incidents

### Monday - Deployment Day 🚀
- **9:45 AM EST:** Pre-flight check
  - Verify production health
  - Backup database
  - Review rollback plan
- **10:00 AM EST:** **DEPLOYMENT WINDOW**
  - Create PR (kars-dev → kars-prod)
  - Team review and merge
  - Railway auto-deploys
- **10:15 AM EST:** Deployment complete (if successful)
- **10:15 AM - 10:30 AM EST:** Smoke tests
- **10:30 AM - 11:00 AM EST:** Monitoring period
- **11:00 AM EST:** Release complete, lift code freeze

---

## Team Responsibilities

### Developers
- **Tuesday-Thursday:** Develop features, merge to kars-dev
- **Thursday 5PM:** Stop merging, prepare for next sprint
- **Friday:** Available for critical bug fixes only
- **Monday:** On standby during deployment

### QA Team
- **Friday:** Full day testing on kars-dev
  - Test all new features
  - Regression test existing features
  - Document bugs
  - Sign off by 3:00 PM EST
- **Monday:** Verify production deployment

### DevOps
- **Thursday:** Prepare deployment plan
- **Friday:** Monitor kars-dev stability
- **Monday 9:45 AM:** Pre-flight check
- **Monday 10:00 AM:** Execute deployment
- **Monday 10:00-11:00 AM:** Monitor deployment

### Product Manager
- **Thursday:** Review upcoming release
- **Friday:** Approve QA sign-off
- **Friday 3PM:** Notify stakeholders
- **Monday:** Monitor deployment, communicate status

---

## Communication Timeline

### Thursday 5:00 PM EST
```
📢 CODE FREEZE - #kars-releases

Code freeze for weekly release is now active.
No merges to kars-dev until Monday 11:00 AM.

QA testing begins Friday morning.
```

### Friday 3:00 PM EST
```
✅ QA SIGN-OFF - #kars-releases

QA testing complete for this week's release.
All tests passed ✓

Features in this release:
- [Feature 1]
- [Feature 2]
- [Bug Fix 1]

Production deployment: Monday 10:00 AM EST
```

### Monday 9:45 AM EST
```
✈️ PRE-FLIGHT CHECK - #kars-releases

Production deployment starting in 15 minutes.

✅ Production health: OK
✅ Database backup: Complete
✅ Rollback plan: Ready
✅ Team: Standing by
```

### Monday 10:00 AM EST
```
🚀 DEPLOYMENT IN PROGRESS - #kars-releases

Deploying to production: kars.keydatalab.ca
Status: Building and deploying
ETA: 10:15 AM EST
```

### Monday 10:30 AM EST
```
✅ DEPLOYMENT COMPLETE - #kars-releases

Production deployment successful!
All systems operational.

New features live:
- [Feature 1]
- [Feature 2]

Please report any issues in #kars-support.
```

---

## Exceptions

### If QA Finds Critical Bugs Friday

**Option 1: Fix Before Sign-Off**
- Unfreeze kars-dev temporarily
- Developers fix bugs
- Re-test fixes
- QA signs off (may be after 3 PM)
- Proceed with Monday deployment

**Option 2: Postpone Release**
- QA does not sign off
- Release postponed to next week
- Notify stakeholders
- Continue development

### If Monday Deployment Fails

**Immediate Rollback:**
```bash
railway link kars-backend-prod
railway rollback
```

**Communication:**
```
🚨 DEPLOYMENT FAILED - #kars-incidents

Production deployment rolled back.
Previous version restored.

Investigating issue...
Next update in 30 minutes.
```

**Next Steps:**
- Investigate failure
- Fix issue in kars-dev
- Re-test on kars-dev
- Schedule new deployment (same day or next Monday)

---

**Last Updated:** January 2025  
**Related:** [Complete Release Workflow](10-complete-release-workflow.md), [Release Checklist](../RELEASE-CHECKLIST.md)
