# Agent Guide for ACS

This document provides AI agents with guidance for working with the ACS (Asset Compliance System) codebase. For comprehensive documentation, see `CLAUDE.md`.

## Project Overview

**ACS** is a SOC2-compliant web application for tracking and managing client assets assigned to consultants. It features multi-factor authentication, role-based access control (RBAC), and comprehensive audit logging.

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js 22 LTS, Express.js, SQLite/PostgreSQL, JWT, WebAuthn, TOTP, OIDC |
| **Frontend** | React 18, Vite, Tailwind CSS, shadcn/ui (Radix), React Router v7 |
| **Testing** | Jest (backend), Vitest (frontend) |
| **DevOps** | Docker multi-platform, GitHub Actions, Portainer |

### Architecture

- **Three-Tier**: React SPA → Express REST API → SQLite/PostgreSQL
- **Database Abstraction**: Single interface supporting both SQLite and PostgreSQL
- **RBAC**: Four roles (employee, manager, coordinator, admin) with scoped data access

## Repository Structure

```
/
├── backend/                    # Node.js Express API
│   ├── server.js              # Main server - all API routes
│   ├── database.js            # DB abstraction layer (SQLite/Postgres)
│   ├── auth.js                # JWT authentication & RBAC
│   ├── mfa.js                 # TOTP/backup codes
│   ├── oidc.js                # SSO integration
│   ├── hubspot.js             # HubSpot integration
│   └── *.test.js              # Jest test suites
│
├── .env.example                # Environment template (root)
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── App.jsx            # Main app with routing
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui primitives
│   │   │   └── *.jsx          # Feature components
│   │   ├── contexts/          # AuthContext, UsersContext
│   │   ├── hooks/             # Custom hooks (use-toast)
│   │   ├── pages/             # Page components
│   │   └── utils/             # Utilities (webauthn.js)
│   └── vite.config.js         # Vite config with API proxy
│
├── .github/workflows/         # CI/CD pipelines
├── docker-compose*.yml        # Docker configurations
├── CLAUDE.md                  # Comprehensive AI guide
└── README.md                  # User documentation
```

## General Conventions

### Code Style

- **ES Modules Only**: Use `import`/`export`, never CommonJS (`require`/`module.exports`)
- **Async/Await**: Prefer async/await over callbacks or raw promises
- **Functional Components**: React components use hooks, not classes
- **Import Order**: Node built-ins → External packages → Local modules
- **Imports Alias**: Frontend uses `@/` for `src/` directory

### Naming Conventions

- **Backend Files**: `kebab-case.js` (e.g., `asset-authorization.test.js`)
- **Frontend Components**: `PascalCase.jsx` (e.g., `AssetTable.jsx`)
- **UI Components**: `kebab-case.jsx` (e.g., `alert-dialog.jsx`)
- **Database Columns**: `snake_case` (e.g., `employee_first_name`)

### 2026 UI Design System

ACS uses a spatial depth design system with three layers:

| Layer | CSS Class | Usage |
|-------|-----------|-------|
| Floor | `floor` | Base background |
| Surface | `glass-panel`, `bento-card` | Content containers |
| Overlay | `glass-overlay` | Modals, dropdowns |

**Key Patterns:**
- **Buttons**: Always add `btn-interactive` for micro-interactions
- **Status Badges**: Use `glow-success`, `glow-warning`, `glow-destructive`, etc.
- **Headers**: Use `text-gradient` for H1/H2
- **Metadata**: Use `caption-label` for labels
- **Loading**: Use `shimmer` class for skeletons
- **Icons**: Wrap in `icon-box icon-box-sm/md/lg`

**Example Component:**
```jsx
<div className="glass-panel rounded-2xl p-6">
  <h2 className="text-gradient text-xl">Title</h2>
  <Badge className="glow-success">Active</Badge>
  <Button className="btn-interactive">Action</Button>
</div>
```

See `CLAUDE.md` for comprehensive design system documentation.

### API Response Format

```javascript
// Success
{ success: true, data: { ... }, message: "Optional message" }

// Error
{ success: false, message: "User-friendly error" }
```

## Backend Guidance

### Database Operations

All database operations use specialized objects from `database.js`:

```javascript
import {
  assetDb,              // Asset CRUD
  companyDb,            // Company management
  auditDb,              // Audit logs (CRITICAL)
  userDb,               // User authentication & profiles
  passkeyDb,            // WebAuthn credentials
  oidcSettingsDb,       // SSO configuration
  brandingSettingsDb,   // Custom branding
  passkeySettingsDb,    // Passkey settings
  hubspotSettingsDb,    // HubSpot integration
  smtpSettingsDb,       // Email/SMTP configuration
  systemSettingsDb,     // System settings (proxy, rate limiting)
  assetTypeDb,          // Asset type management
  emailTemplateDb,      // Email template customization
  passwordResetTokenDb, // Password reset tokens
  // Attestation workflow
  attestationCampaignDb,     // Campaign management
  attestationRecordDb,       // Employee attestation records
  attestationAssetDb,        // Asset attestation status
  attestationNewAssetDb,     // New assets reported in attestation
  attestationPendingInviteDb,// Pending invites for unregistered users
  syncAssetOwnership,   // Manager change propagation
} from './database.js';
```

**Common Patterns:**
```javascript
// Read
const assets = await assetDb.getAll();
const asset = await assetDb.getById(id);
const userAssets = await assetDb.getByEmployeeEmail(email);

// Create (includes optional issued_date/returned_date fields)
const newAsset = await assetDb.create({ ...data });

// Update
const updated = await assetDb.update(id, { ...changes });

// Delete
await assetDb.delete(id);
```

### Authentication & Authorization

```javascript
import { authenticate, authorize } from './auth.js';

// Any authenticated user
app.get('/api/profile', authenticate, async (req, res) => { ... });

// Admin only
app.post('/api/companies', authenticate, authorize('admin'), async (req, res) => { ... });

// Multiple roles
app.get('/api/users', authenticate, authorize('admin', 'manager', 'coordinator'), async (req, res) => { ... });

// Attestation coordinator example
app.post('/api/attestation/campaigns', authenticate, authorize('admin', 'coordinator'), async (req, res) => { ... });
```

### Role-Based Data Filtering

```javascript
// Use getScopedForUser for proper role-based filtering
const assets = await assetDb.getScopedForUser(user);
// Admin, Manager, and Coordinator see all assets
// Employee sees only own assets
```

### Role Hierarchy and Permissions

| Role | Description |
|------|-------------|
| **admin** | Full access to all resources including admin settings, user management, company management |
| **coordinator** | Manage attestation campaigns; read-only access to assets, users, companies, audit logs; no admin settings access |
| **manager** | View all assets/audit logs, bulk import assets, read-only user access; cannot edit other users' assets |
| **employee** | View/edit own assets and audit logs only |

**Authorization Examples:**
```javascript
// Attestation coordinator access
app.get('/api/attestation/campaigns',
  authenticate,
  authorize('admin', 'coordinator'),
  async (req, res) => { ... });

// Read-only access for multiple roles
app.get('/api/users',
  authenticate,
  authorize('admin', 'manager', 'coordinator'),
  async (req, res) => { ... });
```

### Audit Logging (CRITICAL)

**All data mutations MUST create audit logs:**

```javascript
await assetDb.create(data);
await auditDb.create({
  action: 'CREATE',           // CREATE, UPDATE, DELETE, STATUS_CHANGE
  resource_type: 'asset',     // asset, user, company, setting
  resource_id: newAsset.id,
  user_email: req.user.email,
  details: 'Created laptop asset ASSET-001'
});
```

### Input Validation

```javascript
// Validate required fields
if (!employee_email || !company || !asset_type) {
  return res.status(400).json({ success: false, message: 'Missing required fields' });
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(employee_email)) {
  return res.status(400).json({ success: false, message: 'Invalid email format' });
}

// Validate asset types (configurable via assetTypeDb)
const activeTypes = await assetTypeDb.getActive();
const validTypes = activeTypes.map(t => t.name);
if (!validTypes.includes(asset_type)) {
  return res.status(400).json({ success: false, message: 'Invalid asset type' });
}
```

## Frontend Guidance

### Component Structure

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function MyComponent() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <Card className="p-6">
      {isAdmin && <AdminFeature />}
      {loading ? <p>Loading...</p> : <DataDisplay data={data} />}
    </Card>
  );
}
```

### Available Contexts

```javascript
// Authentication
import { useAuth } from '@/contexts/AuthContext';
const { user, isAuthenticated, loading, login, logout } = useAuth();

// User management (admin/manager)
import { useUsers } from '@/contexts/UsersContext';
const { users, loading, fetchUsers, addUser, updateUser, deleteUser } = useUsers();
```

### UI Components (shadcn/ui)

Available in `/frontend/src/components/ui/`:
- `button`, `card`, `dialog`, `alert-dialog`
- `dropdown-menu`, `select`, `table`
- `input`, `textarea`, `label`, `checkbox`, `switch`
- `date-picker` - Custom themed date picker (replaces `<Input type="date">`)
- `number-input` - Custom themed number input with +/- buttons (replaces `<Input type="number">`)
- `tabs`, `toast`, `toaster`, `badge`, `avatar`, `separator`

### No Native Browser Form Controls

**NEVER use native HTML form controls.** Native controls render differently across browsers and break in dark mode. Always use the project's custom themed components:

| Instead of | Use |
|------------|-----|
| `<Input type="date">` | `<DatePicker>` from `@/components/ui/date-picker` |
| `<Input type="number">` | `<NumberInput>` from `@/components/ui/number-input` |
| `<Input type="datetime-local">` | `<DatePicker>` from `@/components/ui/date-picker` |
| Native `<select>` | `<Select>` from `@/components/ui/select` |
| Native `<input type="checkbox">` | `<Checkbox>` from `@/components/ui/checkbox` |

```jsx
// Wrong
<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
<Input type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} />

// Correct
<DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
<NumberInput value={count} onChange={setCount} min={1} />
```

### Tailwind Patterns

```jsx
// Container
<div className="container mx-auto p-6">

// Card
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">

// Flex layout
<div className="flex items-center justify-between gap-4">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Spacing
<div className="space-y-4">  {/* Vertical */}
<div className="space-x-2">  {/* Horizontal */}
```

## Testing Requirements

### Backend (Jest)

```bash
cd backend && npm test
```

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from './server.js';

describe('Asset API', () => {
  it('should allow admins to create assets', async () => {
    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ /* asset data */ });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

### Frontend (Vitest)

```bash
cd frontend && npm test
```

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(
      <BrowserRouter>
        <MyComponent />
      </BrowserRouter>
    );
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### When to Add Tests

1. New API endpoints → Integration tests
2. New components → Component tests
3. Business logic changes → Update relevant tests
4. Bug fixes → Regression tests

## Critical Rules

### Never Do This

- Skip authentication or authorization
- Forget audit logging on mutations
- Leak sensitive data in responses (passwords, MFA secrets)
- Use CommonJS (`require`/`module.exports`)
- Hardcode URLs or secrets
- Skip error handling
- Bypass validation
- Use native browser form controls (`type="date"`, `type="number"`, native `<select>`) — use `DatePicker`, `NumberInput`, `Select` instead

### Always Do This

- Use `npm ci` (not `npm install`)
- Test both SQLite and PostgreSQL for DB changes
- Follow existing code patterns
- Run tests before committing
- Use ES modules
- Return `{ success: true/false }` responses
- Log all data mutations with audit entries

## Quick Commands

```bash
# Backend
cd backend
npm ci && npm test          # Install & test
npm run dev                 # Dev server (port 3001)

# Frontend
cd frontend
npm ci && npm test          # Install & test
npm run dev                 # Dev server (port 3000)
npm run build               # Production build

# Full stack
cd backend && npm run dev   # Terminal 1
cd frontend && npm run dev  # Terminal 2
```

## Reference

For comprehensive documentation including:
- Detailed database patterns
- Complete API endpoint list
- Security best practices
- Deployment procedures
- Troubleshooting guide

See **`CLAUDE.md`** in the repository root.
