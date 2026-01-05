# Deployment Decision Tree - KARS

Logic for making deployment decisions.

```mermaid
flowchart TB
    A[Code Change Ready] --> B{What Type<br/>of Change?}
    
    B -->|New Feature| C{Feature<br/>Complete?}
    C -->|No| D[Continue Development<br/>in feature/* branch]
    C -->|Yes| E[Create PR<br/>feature/* → kars-dev]
    
    B -->|Bug Fix| F{Severity?}
    F -->|P2/P3 Minor| E
    F -->|P0/P1 Critical| G[Create Hotfix Branch<br/>hotfix/*]
    
    B -->|Documentation| H[Merge to kars-dev<br/>Deploy Immediately]
    
    B -->|Refactoring| I{Affects<br/>Functionality?}
    I -->|No| E
    I -->|Yes| J[Extensive Testing<br/>Required]
    J --> E
    
    E --> K[CI Tests Pass?]
    K -->|No| D
    K -->|Yes| L[Code Review<br/>Approved?]
    L -->|No| D
    L -->|Yes| M[Merge to kars-dev]
    
    M --> N[Deploy to Dev<br/>kars-dev.keydatalab.ca]
    N --> O{Is it<br/>Thursday?}
    
    O -->|Yes| P[Code Freeze Active<br/>Wait for Monday]
    O -->|No| Q[Available for<br/>Friday QA]
    
    G --> R[Emergency Review<br/>< 1 hour]
    R --> S{Approved?}
    S -->|No| T[Fix Issues]
    T --> R
    S -->|Yes| U[Merge to kars-prod<br/>Immediate Deploy]
    U --> V[Monitor Closely<br/>30 minutes]
    V --> W[Backport to kars-dev]
    
    P --> X{Friday<br/>QA Pass?}
    Q --> X
    X -->|No| Y[Fix Issues<br/>Retest]
    Y --> X
    X -->|Yes| Z[QA Sign-Off]
    
    Z --> AA{Is it<br/>Monday<br/>10:00 AM?}
    AA -->|No| AB[Wait for Monday<br/>Deployment Window]
    AA -->|Yes| AC[Create PR<br/>kars-dev → kars-prod]
    
    AC --> AD[Team Review<br/>2 Approvals Required]
    AD --> AE[Merge to kars-prod]
    AE --> AF[Deploy to Production<br/>kars.keydatalab.ca]
    AF --> AG{Deploy<br/>Success?}
    AG -->|No| AH[Rollback<br/>Immediately]
    AG -->|Yes| AI[Monitor 30 Minutes]
    AI --> AJ{All<br/>Metrics<br/>Normal?}
    AJ -->|No| AK[Investigate<br/>or Rollback]
    AJ -->|Yes| AL[✅ Deployment<br/>Complete]
    
    style AL fill:#4caf50
    style U fill:#fff9c4
    style AH fill:#ffcdd2
```

## Decision Factors

### 1. Change Type

| Type | Path | Timeline |
|------|------|----------|
| **New Feature** | feature/* → kars-dev → Friday QA → Monday prod | 1-3 weeks |
| **Minor Bug** | feature/* → kars-dev → Friday QA → Monday prod | 1-2 weeks |
| **Critical Bug** | hotfix/* → kars-prod (immediate) | 2-4 hours |
| **Documentation** | kars-dev (immediate) | Same day |
| **Refactoring** | feature/* → kars-dev → Extended QA | 2-4 weeks |

### 2. Severity Level

**P0 - Critical (Hotfix):**
- ✅ Deploy immediately to kars-prod
- ✅ Skip weekly cycle
- ✅ Emergency approval process
- ⚠️ Risk: Higher chance of issues

**P1 - High:**
- ❓ Evaluate: Can it wait until Monday?
- If yes: Normal cycle
- If no: Hotfix process

**P2/P3 - Medium/Low:**
- ✅ Always use normal cycle
- ✅ Include in Monday release

### 3. Testing Requirements

**New Features:**
- Unit tests required
- Integration tests required
- QA testing on Friday
- Browser compatibility

**Bug Fixes:**
- Test must reproduce bug
- Test must verify fix
- Regression testing

**Hotfixes:**
- Minimal testing (time-critical)
- Focus on fix verification
- Extended monitoring after deploy

### 4. Timing

**Monday - Wednesday:**
- ✅ Normal development
- ✅ Merge to kars-dev anytime
- ✅ Features available for Friday QA

**Thursday:**
- ⚠️ Code freeze at 5:00 PM EST
- ❌ No new features after freeze
- ✅ Critical bugs only

**Friday:**
- ❌ No merges to kars-dev (frozen)
- ✅ QA testing all day
- ✅ Bug fixes if needed

**Weekend:**
- ❌ No planned deployments
- ✅ Hotfixes for P0 only

**Monday:**
- ✅ Production deployment (10:00 AM)
- ✅ Code freeze lifts (11:00 AM)
- ✅ Development resumes

---

## Decision Flowcharts

### Should I Deploy Today?

```mermaid
flowchart LR
    A[Should I<br/>Deploy?] --> B{What Day?}
    B -->|Mon-Wed| C{To kars-dev?}
    C -->|Yes| D[✅ Yes,<br/>Deploy]
    C -->|No| E[❌ Wait for<br/>Monday]
    
    B -->|Thursday| F{Before<br/>5 PM?}
    F -->|Yes| C
    F -->|No| G[❌ Code<br/>Freeze]
    
    B -->|Friday| H[❌ QA Day<br/>No Deploys]
    
    B -->|Weekend| I{P0<br/>Hotfix?}
    I -->|Yes| J[✅ Emergency<br/>Only]
    I -->|No| K[❌ Wait for<br/>Monday]
    
    B -->|Monday| L{Is it<br/>10 AM?}
    L -->|Yes| M[✅ Prod<br/>Deploy]
    L -->|No| N{After<br/>11 AM?}
    N -->|Yes| C
    N -->|No| E
```

### Should This Be a Hotfix?

```mermaid
flowchart LR
    A[Bug Found<br/>in Production] --> B{Service<br/>Down?}
    B -->|Yes| C[✅ Hotfix<br/>P0]
    B -->|No| D{Data at<br/>Risk?}
    D -->|Yes| C
    D -->|No| E{Critical<br/>Feature<br/>Broken?}
    E -->|Yes| F{Affects<br/>All Users?}
    F -->|Yes| G[✅ Hotfix<br/>P1]
    F -->|No| H{Workaround<br/>Available?}
    H -->|Yes| I[❌ Regular<br/>Release]
    H -->|No| G
    E -->|No| J{Can Wait<br/>Until<br/>Monday?}
    J -->|Yes| I
    J -->|No| K[Consider<br/>Hotfix]
```

---

## Common Scenarios

### Scenario 1: New Feature on Wednesday
**Decision:** Merge to kars-dev, include in Friday QA

**Rationale:**
- Enough time for QA testing
- Follows normal cycle
- Low risk

### Scenario 2: Bug Found on Thursday 6 PM
**Decision:** Create ticket, fix Monday

**Rationale:**
- Code freeze active
- Not critical (P2/P3)
- Can wait for normal cycle

### Scenario 3: Production Down on Saturday
**Decision:** Immediate hotfix to kars-prod

**Rationale:**
- P0 severity
- Service unusable
- Emergency override justified

### Scenario 4: Feature Ready on Friday
**Decision:** Merge to kars-dev, deploy next Monday

**Rationale:**
- Missed Friday QA window
- Will be tested next Friday
- Follows standard process

---

**Last Updated:** January 2025  
**Related:** [Hotfix Workflow](03-hotfix-workflow.md), [Weekly Release Cycle](04-weekly-release-cycle.md)
