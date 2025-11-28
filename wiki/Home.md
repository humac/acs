# Asset Registration System Wiki

Welcome to the comprehensive documentation for the **Client Asset Registration System** - a SOC2-compliant application for tracking and managing client laptops assigned to consultants.

## 🎯 Overview

This system enables consulting firms to maintain compliance with SOC2 requirements by providing:
- **Self-service asset registration** by consultants
- **Role-based access control** (Admin, Manager, Employee)
- **Comprehensive audit logging** for all operations
- **Company management** and asset tracking
- **Detailed reporting and exports** for compliance

## 📚 Documentation

### Getting Started
- **[Features](Features)** - Complete feature list and capabilities
- **[Installation](Installation)** - Local development setup
- **[Quick Start](Quick-Start)** - Get up and running in 5 minutes
- **[Deployment](Deployment)** - Production deployment with Portainer

### User Guides
- **[User Guide - Employees](User-Guide-Employees)** - For consultants registering assets
- **[User Guide - Managers](User-Guide-Managers)** - For team managers
- **[Admin Guide](Admin-Guide)** - Complete admin documentation
- **[Profile Management](Profile-Management)** - Managing your user profile

### Technical Documentation
- **[API Reference](API-Reference)** - Complete API documentation
- **[Authentication](Authentication)** - JWT authentication and security
- **[Role-Based Access Control](RBAC)** - Understanding roles and permissions
- **[Database Schema](Database-Schema)** - Database structure and relationships
- **[Audit Logging](Audit-Logging)** - How audit trails work

### Deployment & Operations
- **[Deployment Guide](Deployment-Guide)** - Portainer, Docker, Cloudflare
- **[Environment Variables](Environment-Variables)** - Configuration options
- **[Backup and Restore](Backup-And-Restore)** - Data protection
- **[Troubleshooting](Troubleshooting)** - Common issues and solutions

### Security & Compliance
- **[Security Best Practices](Security)** - Security guidelines
- **[SOC2 Compliance](SOC2-Compliance)** - Meeting compliance requirements
- **[First Admin Setup](First-Admin-Setup)** - Setting up the first administrator

## 🚀 Quick Links

### For Users
- [Registering an Asset](User-Guide-Employees#registering-an-asset)
- [Updating Asset Status](User-Guide-Employees#updating-asset-status)
- [Viewing Your Assets](User-Guide-Employees#viewing-your-assets)

### For Managers
- [Viewing Team Assets](User-Guide-Managers#viewing-team-assets)
- [Accessing Team Reports](User-Guide-Managers#accessing-reports)

### For Admins
- [Managing Users](Admin-Guide#user-management)
- [Managing Companies](Admin-Guide#company-management)
- [Viewing Audit Logs](Admin-Guide#audit-logs)
- [System Settings](Admin-Guide#system-settings)

### For Developers
- [Local Development](Installation#local-development)
- [API Endpoints](API-Reference)
- [Contributing](Contributing)

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│   React + Vite  │
└────────┬────────┘
         │
    HTTP/REST
         │
┌────────▼────────┐
│   Backend       │
│   Node.js       │
│   Express       │
└────────┬────────┘
         │
┌────────▼────────┐
│   Database      │
│   SQLite        │
└─────────────────┘
```

## 🔐 Security

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with 10 rounds
- **Role-Based Access** - Granular permission control
- **Audit Trails** - Complete activity logging
- **HTTPS** - Secure connections via Cloudflare

## 📊 Key Features

✅ **Asset Management** - Track laptops assigned to consultants
✅ **User Authentication** - Secure login with JWT tokens
✅ **Role-Based Access** - Three roles with different permissions
✅ **Company Management** - Organize assets by client companies
✅ **Audit Logging** - Complete compliance trail
✅ **Reporting & Export** - CSV exports and summary reports
✅ **Profile Management** - User profile with first/last name
✅ **Admin Settings** - Complete system management interface

## 🎭 User Roles

| Role | Access Level | Key Capabilities |
|------|--------------|------------------|
| **Employee** | Own assets only | Register and manage own assets |
| **Manager** | Own + team assets | View team assets and reports |
| **Admin** | Full system access | All features + user/company management |

## 📱 Technology Stack

**Frontend:**
- React 18
- Vite
- Context API
- Fetch API

**Backend:**
- Node.js
- Express.js
- SQLite (better-sqlite3)
- JWT (jsonwebtoken)
- bcrypt

**Deployment:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Portainer (Container Management)
- Cloudflare Tunnel (Secure Access)

## 🌐 Live Demo

Once deployed, access your instance at: `https://assets.jvhlabs.com`

## 📞 Support

Need help? Check these resources:

1. **[Troubleshooting Guide](Troubleshooting)** - Common issues
2. **[FAQ](FAQ)** - Frequently asked questions
3. **GitHub Issues** - Report bugs or request features

## 🤝 Contributing

See our [Contributing Guide](Contributing) for information on:
- Code standards
- Pull request process
- Development setup
- Testing guidelines

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Version History

- **v1.0.0** - Initial release with full RBAC, audit logging, and deployment automation

---

**Need to get started quickly?** See the [Quick Start Guide](Quick-Start)!

**Setting up for production?** Check the [Deployment Guide](Deployment-Guide)!

**First time user?** Start with [Features](Features) to understand what the system can do!
