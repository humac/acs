# Features

Complete feature overview of the Asset Registration System.

## 🎯 Core Features

### Asset Management

**Asset Registration**
- Self-service registration by consultants
- Required fields: employee name/email, manager name/email, client company, serial number, asset tag
- Optional notes field for additional information
- Company selection via dropdown (populated from admin-managed companies)
- Automatic timestamp tracking (registration date, last updated)

**Asset Tracking**
- View all assets you have access to (based on role)
- Search and filter by:
  - Employee name or email
  - Manager name or email
  - Client company
  - Asset status
- Clear filter button to reset all filters
- Asset count display
- Sortable table view with pagination

**Asset Status Management**
- Update asset status: Active, Returned, Lost, Damaged, Retired
- Add notes when updating status
- Status change tracking in audit logs
- Visual status badges with color coding
- History of all status changes

### User Authentication

**Registration & Login**
- Secure user registration with email and password
- Password requirements: minimum 6 characters
- Password confirmation during registration
- First name and last name collection
- JWT token-based authentication
- Remember me functionality via localStorage
- Secure password hashing (bcrypt, 10 rounds)
- 7-day token expiration

**Profile Management**
- Update first name and last name
- View current role and email
- Color-coded role badge display
- Real-time profile updates (no page reload)
- Profile data validation

### Role-Based Access Control (RBAC)

**Three User Roles:**

**Employee**
- Register and manage own assets
- View only assets where they are listed as employee
- Update status of own assets
- View own audit logs
- Access profile management

**Manager**
- All employee capabilities
- View assets where they are listed as manager
- View assets of employees they manage
- Access team audit logs and reports
- View aggregated team statistics

**Admin**
- Full system access
- Manage all users (view, edit roles, delete)
- Manage all companies (add, edit, delete)
- View all assets and audit logs
- Access admin settings panel
- System configuration and monitoring

### Company Management

**Admin-Only Features:**
- Add new client companies
- Edit company details (name, description)
- Delete companies (with protection if assets exist)
- View company list with creation dates
- Inline editing interface
- Automatic dropdown population for asset registration

**All User Access:**
- View company names in dropdown during asset registration
- Select from existing companies when registering assets

### Audit & Reporting

**Comprehensive Audit Logging**
- Automatic logging of all system operations:
  - Asset creation
  - Asset updates
  - Status changes
  - Company management actions
  - User management actions
- Captured information:
  - Action type (CREATE, UPDATE, STATUS_CHANGE, DELETE)
  - Entity type (asset, company, user)
  - Entity details
  - User email (who performed the action)
  - Timestamp (when it occurred)

**Audit Log Viewing**
- Three-tabbed interface:
  - Audit Logs (detailed activity log)
  - Summary Report (aggregated statistics)
  - Statistics (action counts)
- Filtering options:
  - By action type
  - By entity type
  - By date range
  - By user email
  - Limit results (50, 100, 250, 500, or all)
- Role-based log visibility:
  - Employees see only their logs
  - Managers see team logs
  - Admins see all logs

**Reporting Features**
- Asset summary report with breakdowns:
  - Total asset count
  - By status (active, returned, etc.)
  - By company
  - By manager
- CSV export functionality
- Customizable export filters
- Downloadable compliance reports

### Admin Settings

**User Management**
- View all registered users
- See user details:
  - Name, email, role
  - Account creation date
  - Last login timestamp
- Change user roles via dropdown:
  - Promote to manager or admin
  - Demote to employee
- Delete user accounts
- Protection against self-modification
- Total user statistics

**System Overview**
- User count by role:
  - Total administrators
  - Total managers
  - Total employees
  - Total users
- System information display
- Feature highlights
- Version information

**Application Settings**
- Company management guidance
- Audit & compliance features overview
- Data management best practices
- Security recommendations:
  - Regular role reviews
  - Inactive account removal
  - Password policy enforcement
  - Audit log monitoring
  - System update reminders

## 🔐 Security Features

**Authentication Security**
- JWT token authentication
- Secure password hashing (bcrypt)
- Token expiration (7 days)
- Token verification on every request
- Automatic logout on invalid token
- Protected routes (backend middleware)

**Authorization**
- Role-based access control
- Middleware authorization checks
- Admin-only endpoints protection
- Manager-level permission checks
- Data filtering by user role

**Data Protection**
- Input validation on all forms
- SQL injection prevention
- XSS protection
- CSRF token consideration
- Secure cookie handling
- HTTPS enforcement (via Cloudflare)

**Audit & Compliance**
- Complete activity logging
- User attribution for all actions
- Timestamp tracking
- Immutable audit trail
- SOC2 compliance support
- Export capabilities for audits

## 🎨 User Interface Features

**Responsive Design**
- Mobile-friendly interface
- Tablet optimization
- Desktop layouts
- Adaptive navigation

**Visual Feedback**
- Color-coded status badges
- Role badges with distinct colors:
  - Admin: Purple
  - Manager: Green
  - Employee: Blue
- Success/error messages
- Loading states
- Form validation feedback

**Navigation**
- Tabbed interface for main sections
- Conditional tab visibility based on role
- Active tab highlighting
- User menu in header
- Logout functionality

**Forms**
- Inline validation
- Required field indicators
- Helpful placeholder text
- Error message display
- Success confirmations
- Modal overlays for focused tasks

**Tables**
- Sortable columns
- Search functionality
- Filter controls
- Clear filters option
- Pagination support
- Empty state messages
- Action buttons per row

## 🚀 Deployment Features

**Docker Support**
- Multi-stage frontend build
- Production-ready images
- Nginx reverse proxy
- Volume persistence
- Health checks
- Auto-restart policies

**CI/CD Integration**
- GitHub Actions workflow
- Automated builds on push
- Container registry integration
- Portainer webhook deployment
- Manual workflow dispatch
- Build caching for speed

**Cloudflare Integration**
- Tunnel configuration
- SSL/TLS termination
- DDoS protection
- CDN capabilities
- DNS management
- Secure external access

**Environment Configuration**
- Environment variable support
- Development vs production modes
- Configurable JWT secrets
- Admin email configuration
- Port configuration
- Database path configuration

## 📊 Data Management

**Database**
- SQLite for reliability
- Automatic schema creation
- Migration support
- Indexed tables for performance
- Foreign key constraints
- Transaction support

**Data Persistence**
- Docker volume mounting
- Backup capabilities
- Restore functionality
- Data export (CSV)
- Import considerations

**Data Validation**
- Email format validation
- Required field enforcement
- Unique constraint checking
- Serial number uniqueness
- Asset tag uniqueness
- Company name uniqueness

## 🔧 Developer Features

**API Design**
- RESTful endpoints
- JSON request/response
- Consistent error handling
- HTTP status codes
- CORS support
- API versioning ready

**Code Quality**
- Modular architecture
- Separation of concerns
- Database abstraction
- Authentication middleware
- Error handling
- Code comments

**Development Tools**
- Hot reload (Vite)
- Development mode
- Debug logging
- Error stack traces
- Health check endpoints

## 📈 Future Enhancement Possibilities

While not currently implemented, the architecture supports:
- Multi-factor authentication
- OAuth integration
- Advanced reporting dashboards
- Asset lifecycle management
- Automated notifications
- Bulk import/export
- Custom fields
- Asset photos/documents
- Mobile app
- API rate limiting
- WebSocket real-time updates

---

**Next:** Learn how to install and run the system locally → [Installation Guide](Installation)
