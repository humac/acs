# ACS (Asset Compliance System) Wiki

Welcome to the documentation for the **Asset Compliance System (ACS)** — a web application that supports organizational SOC2 compliance by tracking client assets with strong authentication, imports/exports, and admin controls.

## 🎯 Overview
- **Asset visibility by role** with employee, manager, coordinator, and admin scopes (see [Role/Permissions Matrix](Features#role-based-access-control-rbac))
- **Modern authentication**: passwords, TOTP MFA, passkeys/WebAuthn, and OIDC/SSO
- **2026 Design System**: Glass morphism, spatial depth, bento layouts, and micro-interactions for a modern, professional interface
- **Attestation workflow**: Campaign-based asset certification with automated reminders and escalations
- **Bulk operations**: CSV imports for assets/companies and CSV exports for audits
- **Configurable platform**: branding controls, passkey relying-party settings, email templates, and database engine selection (SQLite or PostgreSQL)
- **Email notifications**: SMTP-based notifications for password reset, attestation campaigns, and system alerts
- **Audit-ready reporting** with status summaries, manager/company rollups, and download-ready CSVs

## 📚 Documentation
- **[Features](Features)** – Detailed feature reference (auth, RBAC, audits, UI/UX, 2026 design system)
- **[Quick Start](Quick-Start)** – 5-minute setup for users, admins, and developers
- **[Admin Guide](Admin-Guide)** – User management, companies, audits, and security best practices
- **[API Reference](API-Reference)** – REST endpoints for auth, assets, companies, audits, OIDC, passkeys, and MFA
- **[Schema Migration Guide](../SCHEMA-MIGRATION.md)** – ⚠️ **Important**: Asset name fields now separated (first_name/last_name)
- **[UI Design Documentation](../UI-MODERNIZATION-SUMMARY.md)** – Complete 2026 design system implementation guide
- **[Wiki README](README)** – Tips for syncing these pages to the GitHub Wiki

## 🚀 Quick Links
- **Getting started:** [Quick Start → For Users](Quick-Start#for-users)
- **Admin essentials:** [Admin Guide → First Admin Setup](Admin-Guide#first-admin-setup)
- **Security:** [Features → Authentication](Features#user-authentication) and [Admin Guide → Security Best Practices](Admin-Guide#security-best-practices)
- **APIs:** [API Reference → Assets](API-Reference#assets)
- **Docker deployment:** See main [README.md](../README.md#-docker-deployment)

## 🏗️ Architecture
```
┌─────────────────┐
│   Frontend      │  React + Vite + Shadcn UI
└────────┬────────┘
         │
    HTTP/REST
         │
┌────────▼────────┐
│   Backend       │  Node.js + Express
└────────┬────────┘
         │
┌────────▼────────┐
│   Database      │  SQLite (default) or PostgreSQL
└─────────────────┘
```

## 🔐 Security Highlights
- JWT sessions with 7-day expiry and bcrypt-hashed credentials
- Passkey/WebAuthn with configurable RP ID/name and origin
- TOTP MFA with backup codes and login verification flow
- Password reset with time-limited tokens (1-hour expiration)
- Role-based authorization on every endpoint and export (4 roles: employee, manager, coordinator, admin)
- Configurable proxy trust and rate limiting for production deployments
- Full audit trail of create/update/status/delete actions

## 📞 Support
- Open an issue in GitHub for bugs or requests
- Check the main [README.md](../README.md) for Docker deployment instructions
- Review the [API Reference](API-Reference) for integration details

---

**Want to dive in?** Start with the [Quick Start](Quick-Start) to register your first admin and asset.
