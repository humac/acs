# ACS (Asset Compliance System)

[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/humac/acs/actions)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Design System](https://img.shields.io/badge/Design-2026%20System-7c3aed?logo=tailwindcss&logoColor=white)](#-2026-design-system)

A web application that supports organizational SOC2 compliance by tracking client assets assigned to consultants, with modern UI, full authentication, role-based access control, and automated deployment.

📖 **Documentation:** [View Wiki](../../wiki)

🎨 **New in 2026:** [Modern UI Design System](UI-MODERNIZATION-SUMMARY.md) - Glass morphism, spatial depth, and bento layouts for a professional, modern interface.

🔄 **Schema Update:** [Migration Guide](SCHEMA-MIGRATION.md) - Important: Now supports multiple asset types (laptops, mobile phones). Breaking change - requires fresh database.

---

## 🎯 Purpose

ACS helps consulting organizations maintain accountability for client-owned assets (laptops, mobile devices) assigned to their consultants. This supports:

- **SOC2 Audit Requirements** - Demonstrable tracking of client assets under your custody
- **Regular Attestation** - Automated workflows for employees to certify assets they hold
- **Client Trust** - Transparent asset stewardship reporting
- **Risk Management** - Quick identification of lost, damaged, or unreturned equipment
- **Compliance Evidence** - Exportable audit trails and attestation records for auditor review

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT Authentication** - Secure token-based auth with 7-day expiration
- **Passkey/WebAuthn Support** - Passwordless authentication with biometrics
  - FIDO2/WebAuthn standard compliance
  - Platform authenticators (Touch ID, Face ID, Windows Hello)
  - Security key support (YubiKey, etc.)
  - Register and manage multiple passkeys from profile
  - Passwordless sign-in option on login page
- **Multi-Factor Authentication (MFA/2FA)** - TOTP-based authentication with backup codes
  - QR code enrollment with authenticator apps (Google, Microsoft, Authy)
  - 10 backup codes for account recovery
  - User-controlled enable/disable from profile
- **OIDC/SSO Authentication** - External identity provider integration
  - Support for Auth0, Google Workspace, Azure AD, Okta
  - Just-In-Time (JIT) user provisioning
  - Role mapping from OIDC claims
  - Database-backed configuration (admin UI)
- **Password Security** - bcrypt hashing (10 rounds)
- **Password Management** - Change password from profile settings
- **Password Reset** - Email-based password reset flow with secure tokens
  - Request reset link from login page
  - Time-limited tokens (1-hour expiration)
  - One-time use tokens with automatic cleanup
  - Audit logging for all password reset events

### ✅ Attestation Workflow
- **Campaign-Based Certification** - Admins create attestation campaigns with configurable schedules
- **Employee Self-Service** - Employees review and confirm assets in their possession
- **Automated Reminders** - Email notifications for pending attestations
- **Manager Escalation** - Automatic escalation to managers for overdue attestations
- **Compliance Reporting** - Export attestation records for auditor review
- **New Asset Discovery** - Employees can report unregistered assets during attestation

### 🔐 Additional Security Features
- **Role-Based Access Control** - Four roles with distinct permissions (see detailed matrix below):
  - **Employee**: View/edit own assets and audit logs only
  - **Manager**: View all assets and audit logs; bulk import assets; read-only access to users page; cannot edit other users' assets or access admin settings
  - **Coordinator**: Manage attestation campaigns; read-only access to assets, users, companies, and audit logs; cannot access admin settings
  - **Admin**: Full access to all resources including admin settings, user management, and company management

### 📋 Role/Permissions Matrix

| Feature | Employee | Manager | Coordinator | Admin |
|---------|:--------:|:-------:|:----------------------:|:-----:|
| **Assets** | | | | |
| View own assets | ✅ | ✅ | ✅ | ✅ |
| View team assets (direct reports) | ❌ | ✅ | ✅ | ✅ |
| View all assets | ❌ | ✅ | ✅ (read-only) | ✅ |
| Register own assets | ✅ | ✅ | ❌ | ✅ |
| Register assets for others | ❌ | ✅ | ❌ | ✅ |
| Edit own assets | ✅ | ✅ | ❌ | ✅ |
| Edit team assets | ❌ | ❌ | ❌ | ✅ |
| Edit all assets | ❌ | ❌ | ❌ | ✅ |
| Bulk import assets (CSV) | ❌ | ✅ | ❌ | ✅ |
| **Companies** | | | | |
| View company names (dropdown) | ✅ | ✅ | ✅ | ✅ |
| View companies page | ❌ | ✅ | ✅ (read-only) | ✅ |
| Create companies | ❌ | ❌ | ❌ | ✅ |
| Edit companies | ❌ | ❌ | ❌ | ✅ |
| Delete companies | ❌ | ❌ | ❌ | ✅ |
| Bulk import companies (CSV) | ❌ | ❌ | ❌ | ✅ |
| **Users** | | | | |
| View users page | ❌ | ✅ (read-only) | ✅ (read-only) | ✅ |
| Add new users | ❌ | ❌ | ❌ | ✅ |
| Edit user roles | ❌ | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ❌ | ✅ |
| **Audit & Reporting** | | | | |
| View own audit logs | ✅ | ✅ | ✅ | ✅ |
| View team audit logs | ❌ | ✅ | ✅ | ✅ |
| View all audit logs | ❌ | ✅ | ✅ | ✅ |
| Export audit logs (CSV) | ✅ (own) | ✅ (all) | ✅ (all) | ✅ (all) |
| View summary reports | ✅ (own) | ✅ (all) | ✅ (all) | ✅ (all) |
| **Attestations** | | | | |
| View own pending attestations | ✅ | ✅ | ✅ | ✅ |
| Submit attestations | ✅ | ✅ | ✅ | ✅ |
| View own attestation history | ✅ | ✅ | ✅ | ✅ |
| View team attestation status | ❌ | ✅ | ✅ | ✅ |
| View all attestation reports | ❌ | ❌ | ✅ | ✅ |
| Create/manage campaigns | ❌ | ❌ | ✅ | ✅ |
| Export attestation records | ❌ | ❌ | ✅ | ✅ |
| **Profile & Security** | | | | |
| Update own profile | ✅ | ✅ | ✅ | ✅ |
| Change own password | ✅ | ✅ | ✅ | ✅ |
| Enable/disable MFA | ✅ | ✅ | ✅ | ✅ |
| Register passkeys | ✅ | ✅ | ✅ | ✅ |
| **Admin Settings** | | | | |
| Access Admin Settings | ❌ | ❌ | ❌ | ✅ |
| Configure OIDC/SSO | ❌ | ❌ | ❌ | ✅ |
| Configure passkey settings | ❌ | ❌ | ❌ | ✅ |
| Manage branding | ❌ | ❌ | ❌ | ✅ |
| Configure database engine | ❌ | ❌ | ❌ | ✅ |
| Configure email/SMTP | ❌ | ❌ | ❌ | ✅ |

- **Automatic Manager Promotion** - Users listed as a manager are auto-promoted to manager with audit logging
- **First Admin Setup** - Automatic admin promotion for first user
- **Profile Management** - Update first/last name, password, MFA settings, passkeys, and manager details
- **Manager Change Propagation** - When a user's manager is updated (by admin or self), all assets owned by that user automatically update to reference the new manager
- **Branding Controls** - Admins can upload a custom logo and branding name from the UI

### 📦 Asset Management
- **Multi-Type Asset Support** - Track laptops, mobile phones, and other assets
  - Asset type selector (laptop, mobile phone)
  - Generic fields: make, model, serial number, asset tag
- **Date Tracking** - Track asset lifecycle with date fields
  - Issued Date: When the asset was assigned to the employee
  - Returned Date: Required when status is set to "Returned"
- **Self-Service Registration** - Consultants register client assets with separated name fields for better data quality
  - Employee first/last name, email (prepopulated and readonly for employees)
  - Manager first/last name, email (prepopulated from employee profile for employees)
  - Company dropdown (populated from system companies)
  - Asset details, serial number, asset tag, status, notes
- **Status Tracking** - Active, Returned, Lost, Damaged, Retired
- **Advanced Search** - Filter by employee, manager, client, status
- **Role-Based Visibility & Authorization**:
  - Employees: View only their own assets; can edit only their own assets
  - Managers: View all assets (same as admins); cannot edit employee assets
  - Admins: View and edit all assets
- **Automatic Manager Sync** - When an employee's manager changes, all their assets are automatically updated with the new manager reference
- **Bulk Import/Export** - CSV importers for assets (with separated name fields and date fields) and companies plus CSV audit export

### 🏢 Company Management (Admin Only)
- Create, edit, and delete client companies
- Company dropdown for asset registration
- Protection against deletion if assets exist
- Bulk company import via CSV

### 📊 Audit & Compliance
- **Complete Audit Trail** - All actions logged with user attribution
- **SOC2 Compliance Support** - Provides audit evidence for organizational compliance
- **Comprehensive Logging** - CREATE, UPDATE, STATUS_CHANGE, DELETE
- **CSV Export** - Role-filtered audit log downloads for compliance
- **Summary Reports** - Asset statistics by status, company, manager
- **Secure Exports** - Role-based access control on all exports

### ⚙️ Admin Features
- **User Management** - Dedicated Users page accessible to managers (read-only) and admins (full access)
  - Add new users with specified roles
  - Edit roles and user attributes
  - Bulk operations and user deletion
  - Manager read-only access for viewing team members
- **System Overview** - System information and admin navigation guide
- **Application Settings** - Configuration and best practices
- **OIDC/SSO Configuration** - Database-backed SSO settings with admin UI
- **Passkey Settings** - Configure relying party name/ID and origin from the UI
- **Branding** - Upload and reset custom logos and app names
- **Email Notifications** - SMTP configuration for system notifications
  - Secure password encryption at rest (AES-256-GCM)
  - Support for TLS/SSL and multiple auth methods
  - Test email functionality
  - Admin-only access to settings
- **Database Engine Selection** - Switch between SQLite and PostgreSQL (with SQLite-to-Postgres import helper)
- **Audit Access** - View all system activity

### 🚀 Deployment & DevOps
- **Multi-Platform Docker Support** - ARM64 and AMD64 containers
- **Docker Compose Examples** - SQLite and PostgreSQL configurations
- **Health Checks** - Automated container monitoring
- **Modern 2026 Design System** - Professional UI with glass morphism, spatial depth, and bento layouts

---

## 🎨 2026 Design System

ACS features a modern design system emphasizing spatial depth, semantic opacity, and data-rich bento layouts.

### Design Philosophy

**Spatial Depth** - UI elements exist on three distinct layers:
- **Floor** (z-index: 0): Ambient background with subtle gradients and `floor` class
- **Surface** (z-index: 1-10): Glass-panel containers with backdrop blur using `glass-panel` or `bento-card` classes
- **Overlay** (z-index: 50): Floating modals and popovers using `glass-overlay` class

**Semantic Opacity** - Colors communicate meaning through alpha transparency with glowing status indicators:
- `glow-success` - Active/positive states with green shadow
- `glow-warning` - Caution states with orange shadow
- `glow-destructive` - Error/lost states with red shadow
- `glow-info` - Informational states with blue shadow
- `glow-muted` - Inactive/returned states

**Bento Grids** - Non-linear, modular layouts for data-heavy dashboards with interactive hover effects.

**Micro-interactions** - Subtle animations provide feedback:
- Buttons scale on hover (`btn-interactive`)
- Cards lift with shadow elevation
- Smooth transitions (200-300ms)
- Entrance animations (`animate-fade-in`, `animate-slide-up`, `animate-scale-in`)

### Key Components

- **Glass Morphism**: Backdrop-blur cards and overlays for modern depth
- **Gradient Text**: Large headings use `text-gradient` for visual hierarchy
- **Icon Boxes**: Consistent icon containers (`icon-box-sm/md/lg`)
- **Status Badges**: Pill-shaped with glowing shadows
- **Loading States**: Shimmer effects for skeleton loading
- **Typography**: Bold, condensed headings with `caption-label` for metadata

See [UI-MODERNIZATION-SUMMARY.md](UI-MODERNIZATION-SUMMARY.md) and [UI-UX-DESIGN-SPEC.md](UI-UX-DESIGN-SPEC.md) for complete design documentation.

---

## 🖥️ Platform Support

This application supports multiple architectures:
- **x86_64/AMD64** - Intel/AMD processors (standard servers, desktop)
- **ARM64** - ARM processors (Raspberry Pi, AWS Graviton, Apple Silicon)

Docker images are automatically built for both platforms during CI/CD.

---

## 📋 Prerequisites

**For Development:**
- **Node.js 22.x LTS** (required for backend native modules like better-sqlite3)
- npm or yarn package manager
- Git

**For Production Deployment:**
- Docker and Docker Compose

---

## 🎯 Quick Start

### For Local Development

```bash
# 1. Clone the repository
git clone https://github.com/humac/acs.git
cd acs

# 2. Backend setup
cd backend
npm install
cp ../.env.example .env
# Edit .env and set JWT_SECRET (required)
# Generate with: openssl rand -base64 32
npm run dev  # starts API on http://localhost:3001

# 3. Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
# Edit .env if needed (default BACKEND_URL is http://localhost:3001)
npm run dev   # starts UI on http://localhost:5173
```

**Note:** Frontend requires a `.env` file with `BACKEND_URL`. See `frontend/.env.example` for the example configuration.

- First registered account becomes **Admin** automatically (or set `ADMIN_EMAIL` in backend `.env`).
- For full backend configuration options, see `backend/.env.example`.

---

## 🐳 Docker Deployment

### Building Docker Images

```bash
# Build backend image
cd backend
docker build -t acs-backend .

# Build frontend image
cd frontend
docker build -t acs-frontend .
```

### Running with Docker Compose (SQLite)

Use this for single-server deployments with SQLite database:

```bash
# Set required environment variables
export JWT_SECRET=$(openssl rand -base64 32)

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Access at http://localhost:80
```

The `docker-compose.yml` file:
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - BACKEND_URL=http://backend:3001
    depends_on:
      - backend
```

### Running with Docker Compose (PostgreSQL)

Use this for deployments requiring PostgreSQL:

```bash
# Set required environment variables
export JWT_SECRET=$(openssl rand -base64 32)
export POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Start the application
docker-compose -f docker-compose.postgres.yml up -d

# Access at http://localhost:80
```

The `docker-compose.postgres.yml` file:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=acs
      - POSTGRES_USER=acs_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - DB_CLIENT=postgres
      - POSTGRES_URL=postgresql://acs_user:${POSTGRES_PASSWORD}@postgres:5432/acs
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - BACKEND_URL=http://backend:3001
    depends_on:
      - backend

volumes:
  postgres-data:
```

### Running Individual Containers

If you prefer to run containers individually:

```bash
# Run backend with SQLite
docker run -d \
  --name acs-backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-here \
  -v $(pwd)/data:/app/data \
  acs-backend

# Run frontend
docker run -d \
  --name acs-frontend \
  -p 80:80 \
  -e BACKEND_URL=http://backend:3001 \
  --link acs-backend:backend \
  acs-frontend
```

### Environment Configuration

**Backend** - See `backend/.env.example` for all configuration options:
- `JWT_SECRET` - **Required** - Generate with `openssl rand -base64 32`
- `DB_CLIENT` - Database type: `sqlite` (default) or `postgres`
- `POSTGRES_URL` - PostgreSQL connection string (if using PostgreSQL)
- `ADMIN_EMAIL` - Optional admin user email
- `OIDC_ENABLED` - Enable SSO/OIDC authentication
- `PASSKEY_ENABLED` - Enable WebAuthn/Passkey support
- `RUN_ATTESTATION_SCHEDULER` - Enable automated attestation reminders

**Frontend** - See `frontend/.env.example`:
- `BACKEND_URL` - Backend API URL (e.g., `http://backend:3001`)

### Email Notifications Setup

Email notifications (password reset, attestation campaigns) require SMTP configuration via **Admin Settings → Notifications**.

1. **Generate Master Encryption Key** (required for password encryption at rest):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **Add to backend `.env`**:
   ```bash
   ACS_MASTER_KEY=your-generated-key-here
   ```

3. **Configure SMTP** from Admin Settings UI (host, port, TLS, credentials)

4. **Test** with "Send Test Email" button

### Database Backup and Restore

**Backup SQLite database:**
```bash
docker run --rm \
  -v $(pwd)/data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/acs-backup-$(date +%Y%m%d).tar.gz -C /data .
```

**Restore from backup:**
```bash
docker run --rm \
  -v $(pwd)/data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/acs-backup-YYYYMMDD.tar.gz -C /data
```

### Additional Configuration

For advanced features, see `backend/.env.example`:

- **Attestation Scheduler**: The Docker backend image starts the scheduler automatically alongside the API. If you run the backend outside Docker, start `node services/attestationScheduler.js` separately (or set `RUN_ATTESTATION_SCHEDULER=true` to run it inside another Node process).
- **Proxy Settings**: `TRUST_PROXY=true` and `PROXY_TYPE=cloudflare|standard|none` - For reverse proxy deployments
- **Rate Limiting**: `RATE_LIMIT_ENABLED=true` - Protect against abuse
- **SSO/OIDC**: `OIDC_ENABLED=true` plus issuer/client configuration
- **Passkeys**: `PASSKEY_ENABLED=true` plus RP ID/name/origin configuration

---

## 📧 Email Notification Workflows

ACS includes a comprehensive email notification system for password reset workflows and attestation campaigns. All email notifications require SMTP configuration (see "Email Notifications Setup" above). Email templates are fully customizable via **Admin Settings → Notifications → Email Templates**.

**Note:** When the scheduler process is running, it performs daily automated checks for reminders, escalations, and campaign closures.

### 1. Password Reset Flow

```mermaid
flowchart LR
    A[User Requests<br/>Password Reset] --> B[System Generates<br/>Reset Token]
    B --> C[Send Email:<br/>password_reset]
    C --> D[User Clicks Link]
    D --> E[User Resets Password]
    
    style C fill:#e3f2fd
    
    classDef emailNode fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    class C emailNode
```

**Email Template:** `password_reset`  
**Trigger:** User requests password reset from login page  
**Frequency:** On-demand (user-initiated)  
**Recipients:** User requesting reset

---

### 2. Attestation Campaign Lifecycle

This diagram shows the complete attestation workflow with all email touchpoints from campaign launch through completion.

```mermaid
flowchart TD
    Start([Admin Launches<br/>Attestation Campaign]) --> Launch[Send Launch Emails:<br/>attestation_launch]
    Launch --> CheckReg{User<br/>Registered?}
    
    CheckReg -->|Yes| Registered[Registered User<br/>Receives Launch Email]
    CheckReg -->|No| Unregistered[Unregistered User<br/>Receives Invite Email:<br/>attestation_registration_invite]
    
    Registered --> WaitReg[User Registers<br/>During Campaign]
    Unregistered --> WaitReg
    WaitReg --> Ready[Send Ready Email:<br/>attestation_ready]
    
    Ready --> ReminderCheck{Reminder Days<br/>Reached?}
    Registered --> ReminderCheck
    
    ReminderCheck -->|Yes, Still Pending| Reminder[Send Reminder:<br/>attestation_reminder]
    ReminderCheck -->|No| WaitMore[Continue Waiting]
    
    Unregistered --> UnregReminderCheck{Unregistered<br/>Reminder Days<br/>Reached?}
    UnregReminderCheck -->|Yes, Still Unregistered| UnregReminder[Send Unregistered<br/>Reminder:<br/>attestation_unregistered_reminder]
    UnregReminderCheck -->|No| WaitMore
    
    Reminder --> EscalationCheck{Escalation Days<br/>Reached?}
    WaitMore --> EscalationCheck
    
    EscalationCheck -->|Yes, Still Pending| Escalation[Send to Manager:<br/>attestation_escalation]
    EscalationCheck -->|No| KeepWaiting[Keep Waiting]
    
    UnregReminder --> UnregEscalationCheck{Escalation Days<br/>Reached?}
    UnregEscalationCheck -->|Yes, Still Unregistered| UnregEscalation[Send to Manager:<br/>attestation_unregistered_escalation]
    UnregEscalationCheck -->|No| KeepWaiting
    
    Escalation --> Complete{Attestation<br/>Completed?}
    UnregEscalation --> Complete
    KeepWaiting --> Complete
    
    Complete -->|Yes| CompleteEmail[Send Admin Notification:<br/>attestation_complete]
    CompleteEmail --> End([Campaign Ends])
    Complete -->|No| ReminderCheck
    
    style Launch fill:#e3f2fd
    style Reminder fill:#fff3e0
    style Escalation fill:#ffebee
    style UnregReminder fill:#fff3e0
    style UnregEscalation fill:#ffebee
    style CompleteEmail fill:#e8f5e9
    style Unregistered fill:#f3e5f5
    style Ready fill:#e8f5e9
    
    classDef emailNode fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    class Launch,Reminder,Escalation,CompleteEmail,Unregistered,UnregReminder,UnregEscalation,Ready emailNode
```

#### Campaign Launch
- **Template:** `attestation_launch`
- **Trigger:** Admin launches a new attestation campaign
- **Frequency:** Once per campaign launch
- **Recipients:** All employees with assets (registered users only)

#### Registration Invite (for unregistered asset owners)
- **Template:** `attestation_registration_invite`
- **Trigger:** Campaign launch finds assets assigned to unregistered emails
- **Frequency:** Once per campaign for each unregistered email
- **Recipients:** Unregistered users with assets

#### Attestation Ready (for newly registered users)
- **Template:** `attestation_ready`
- **Trigger:** User registers during an active campaign
- **Frequency:** Once per user registration during active campaign
- **Recipients:** Newly registered user

#### Attestation Reminder
- **Template:** `attestation_reminder`
- **Trigger:** Scheduler runs after `reminder_days` from campaign start
- **Frequency:** Daily scheduler check; sent once per pending attestation
- **Recipients:** Employees with pending attestations
- **Condition:** Only for pending attestations that haven't received a reminder

#### Unregistered User Reminder
- **Template:** `attestation_unregistered_reminder`
- **Trigger:** Scheduler runs after `unregistered_reminder_days` from campaign start
- **Frequency:** Daily scheduler check; sent once per unregistered user
- **Recipients:** Unregistered users with assets
- **Condition:** User still hasn't registered

#### Attestation Escalation (to manager)
- **Template:** `attestation_escalation`
- **Trigger:** Scheduler runs after `escalation_days` from campaign start
- **Frequency:** Daily scheduler check; sent once per overdue attestation
- **Recipients:** Employee's manager
- **Condition:** Employee hasn't completed attestation

#### Unregistered User Escalation (to manager)
- **Template:** `attestation_unregistered_escalation`
- **Trigger:** Scheduler runs after `escalation_days` from campaign start
- **Frequency:** Daily scheduler check; sent once per unregistered user
- **Recipients:** Manager listed on assets
- **Condition:** Asset owner still hasn't registered

#### Attestation Complete (confirmation to admin)
- **Template:** `attestation_complete`
- **Trigger:** Employee completes their attestation
- **Frequency:** Once per completed attestation
- **Recipients:** Admin users

---

### 3. SMTP Test Email

```mermaid
flowchart LR
    A[Admin Opens<br/>Notification Settings] --> B[Admin Clicks<br/>Send Test Email]
    B --> C[Send Test Email:<br/>test_email]
    C --> D[Admin Verifies<br/>Email Received]
    
    style C fill:#e3f2fd
    
    classDef emailNode fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    class C emailNode
```

**Email Template:** `test_email`  
**Trigger:** Admin clicks "Send Test Email" in notification settings  
**Frequency:** On-demand (admin-initiated)  
**Recipients:** Test recipient specified by admin

---

### Email Templates Reference Table

All email templates are customizable via **Admin Settings → Notifications → Email Templates**. Each template supports variable substitution using `{{variableName}}` syntax.

| Template Key | Template Name | Description | Trigger Event | Frequency | Recipient Type |
|--------------|---------------|-------------|---------------|-----------|----------------|
| `test_email` | Test Email | SMTP configuration verification | Admin sends test | On-demand | Admin-specified |
| `password_reset` | Password Reset | Secure password reset with time-limited token | User requests reset | On-demand | User |
| `attestation_launch` | Attestation Campaign Launch | Notifies employees of new attestation campaign | Campaign launched | Once per campaign | Registered employees with assets |
| `attestation_registration_invite` | Registration Invite | Invites unregistered asset owners to register | Campaign finds unregistered owners | Once per campaign per unregistered email | Unregistered users with assets |
| `attestation_ready` | Attestation Ready | Notifies newly registered users attestation is ready | User registers during campaign | Once per registration | Newly registered user |
| `attestation_reminder` | Attestation Reminder | Reminds employees of pending attestation | Scheduler after reminder_days | Once per pending attestation | Employees with pending attestations |
| `attestation_unregistered_reminder` | Unregistered User Reminder | Reminds unregistered users to register | Scheduler after unregistered_reminder_days | Once per unregistered user | Unregistered users |
| `attestation_escalation` | Attestation Escalation | Notifies managers of overdue employee attestations | Scheduler after escalation_days | Once per overdue attestation | Employee's manager |
| `attestation_unregistered_escalation` | Unregistered User Escalation | Notifies managers of unregistered team members | Scheduler after escalation_days | Once per unregistered user | Manager on assets |
| `attestation_complete` | Attestation Complete | Confirms attestation completion to admins | Employee completes attestation | Once per completion | Admin users |

**Note:** The attestation scheduler processes reminders and escalations through daily automated checks while the scheduler process is running.

---

## 🐛 Troubleshooting

### Containers Won't Start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check if ports are in use
netstat -tlnp | grep 3001
netstat -tlnp | grep 80

# Restart containers
docker-compose restart
```

### Can't Access Application
- Check containers are running: `docker-compose ps`
- Test backend health: `curl http://localhost:3001/api/health`
- Test frontend: `curl http://localhost:80`
- Check firewall settings

### Database Issues
```bash
# View database files
docker-compose exec backend ls -la /app/data

# Reset database (⚠️ deletes all data)
docker-compose down -v
docker-compose up -d
```

**More help:** See the [wiki](../../wiki) for detailed documentation, admin guides, and API reference.

---

## 📦 Dependency Upgrade Roadmap

This section tracks planned dependency upgrades. Since ACS is currently in beta, we're taking a phased approach to upgrades.

### ✅ Completed (Phase 1 - December 2025)

| Component | Previous | Current | Notes |
|-----------|----------|---------|-------|
| Node.js | 18 LTS | **22 LTS** | Supported until April 2027 |
| better-sqlite3 | ^9.2.2 | **^11.0.0** | Node 22 compatibility |
| Vite | ^5.0.8 | **^6.0.0** | Faster builds |

### 🟡 Planned (Phase 2 - Q1 2026)

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| Vitest | ^1.1.0 | ^2.x | Testing framework update |

### 🟠 Under Consideration (Phase 3 - Post-Beta)

| Component | Current | Target | Risk Level | Notes |
|-----------|---------|--------|------------|-------|
| Express | ^4.18.2 | 5.x | Medium | API changes - requires testing |
| React | ^18.2.0 | 19.x | Medium | New patterns (Server Components, Actions) |
| Tailwind CSS | ^3.4.18 | 4.x | Medium | New config format |

### Version Support Timeline

| Runtime | Version | Status | End of Life |
|---------|---------|--------|-------------|
| Node.js | 22 LTS | ✅ Current | April 2027 |
| Node.js | 20 LTS | Active | April 2026 |
| Node.js | 18 LTS | Maintenance | April 2025 |

**Last Updated:** December 2024

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

See [Contributing Guide](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built to support organizational SOC2 compliance requirements
- Designed for consulting firms managing client assets

---

## 🗺️ Roadmap

- [x] User Authentication (JWT)
- [x] Role-Based Access Control
- [x] Audit Logging
- [x] Company Management
- [x] Profile Management
- [x] Password Change Functionality
- [x] Multi-Platform Support (ARM64 + AMD64)
- [x] Modern 2026 Design System with Glass Morphism & Bento Layouts
- [x] Multi-Factor Authentication (MFA/2FA)
- [x] OIDC/SSO Integration
- [x] Database-Backed SSO Configuration
- [x] WebAuthn/Passkey Support
- [x] PostgreSQL Database Support
- [x] Email Notifications
- [x] Password Reset Flow
- [x] Attestation Workflow
- [x] Advanced Reporting Dashboard
- [ ] Mobile App
- [ ] API Rate Limiting (in progress)
- [ ] Database Encryption at Rest

---

## 🎨 UI/UX Documentation

Complete design system documentation and implementation guides.

### Design System References
- **[UI Modernization Summary](UI-MODERNIZATION-SUMMARY.md)** - Overview of all design changes
- **[UI/UX Design Specification](UI-UX-DESIGN-SPEC.md)** - Complete design system specification
- **[Wireframes](WIREFRAMES.md)** - Visual mockups and layout examples

### Key Design Resources
- **Component Library**: shadcn/ui built on Radix UI primitives
- **Styling Framework**: Tailwind CSS with custom design tokens
- **Design Philosophy**: Spatial depth (3 layers), semantic opacity, bento grids
- **Utility Classes**: Glass morphism (`glass-panel`, `glass-overlay`), glowing badges (`glow-*`), micro-interactions (`btn-interactive`)

### For Developers
See [CLAUDE.md](CLAUDE.md) and [.github/copilot-instructions.md](.github/copilot-instructions.md) for detailed component implementation patterns and CSS utility class usage.

---

**Ready to get started?** See the [Quick Start Guide](../../wiki/Quick-Start)!
