# Quick Start Guide

Get the KeyData Asset Registration System (KARS) running in 5 minutes!

## For Users

### First Time Setup

1. **Access the Application**
   - Navigate to: `https://kars.jvhlabs.com`
   - Or your deployed URL

2. **Register Your Account**
   - Click "Register" (or "Sign up here")
   - Fill in the form:
     - First Name
     - Last Name
     - Email Address
     - Manager Name (required)
     - Manager Email (required)
     - Password (minimum 6 characters)
     - Confirm Password
   - Click "Create Account"
   - Managers you list are automatically promoted to the **Manager** role (unless already Manager/Admin)

3. **Login**
   - You're automatically logged in after registration
   - Future logins: Enter email and password

4. **Your Role**
   - First user becomes **Admin** automatically
   - Others default to **Employee**
   - Admins can promote users to Manager or Admin

### Register Your First Asset

1. **Go to Asset Management Tab** (default view)

2. **Click "+ New Asset"** button (top right)

3. **Fill in the Asset Form:**
   - Employee Name: Your name
   - Employee Email: Your email
   - Manager Name: Your manager's name
   - Manager Email: Manager's email
   - Client Company: Select from dropdown
   - Laptop Serial Number: Found on laptop
   - Laptop Asset Tag: Company asset tag
   - Notes: Optional details

4. **Click "Register Asset"**

5. **View Your Asset** in the table below

✅ **Done!** Your asset is now tracked.

---

## For Administrators

### Initial Admin Setup

**Method 1: Be the First User** (Easiest)
1. Deploy the application
2. Register first - you're automatically admin!

**Method 2: Use Environment Variable**
1. Set `ADMIN_EMAIL=your@email.com` in `.env`
2. Register with that email
3. You're assigned admin role

**Method 3: Promoted by Another Admin**
1. Register normally (employee role)
2. Ask admin to promote you
3. Admin Settings → User Management → Change your role

### First Admin Tasks

1. **Add Companies** (before users can register assets)
   - Go to **Company Management** tab
   - Click "+ Add Company"
   - Enter company name and description
   - Save
   - Repeat for all client companies

2. **Verify System**
   - Go to **Admin Settings**
   - Check **System Overview**
   - Confirm user count is correct
   - Review system information

3. **Set Up Additional Admins** (optional)
   - Go to **Admin Settings** → **User Management**
   - Find user to promote
   - Change role dropdown to "Admin"

4. **Configure Backup** (recommended)
   - See [Backup Guide](Backup-And-Restore)
   - Schedule automated backups
   - Test restore procedure

---

## For Developers

### Local Development Setup

**Prerequisites:**
- Node.js 18+ installed
- Git installed

**Quick Start:**

```bash
# 1. Clone repository
git clone https://github.com/your-username/claude_app_poc.git
cd claude_app_poc

# 2. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env and set JWT_SECRET
npm run dev

# 3. In new terminal, setup frontend
cd frontend
npm install
npm run dev

# 4. Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

**First User is Admin:**
- Register at http://localhost:5173
- First user automatically gets admin role
- Start testing!

---

## For DevOps

### Production Deployment (Portainer)

**5-Minute Deploy:**

1. **Create Portainer Stack**
   ```yaml
   # Copy docker-compose.portainer.yml content
   # Name: asset-registration
   ```

2. **Set Environment Variables**
   ```env
   GITHUB_REPOSITORY=your-username/claude_app_poc
   APP_PORT=8080
   JWT_SECRET=your-super-secret-jwt-key-here
   ADMIN_EMAIL=admin@yourdomain.com
   ```

3. **Deploy Stack**
   - Click "Deploy the stack"
   - Wait for containers to start

4. **Setup Auto-Deploy**
   - Create webhook in Portainer stack
   - Add `PORTAINER_WEBHOOK_URL` secret to GitHub
   - Push to main → automatic deployment!

5. **Setup Cloudflare Tunnel**
   ```bash
   # In Cloudflare Dashboard:
   # Zero Trust → Tunnels → Create tunnel
   # Add to stack as cloudflared service
   # Configure public hostname: assets.jvhlabs.com
   ```

6. **Access App**
   - Visit: https://assets.jvhlabs.com
   - Register first admin
   - Start using!

**Full Instructions:** See [Deployment Guide](Deployment-Guide)

---

## Common First Tasks

### As an Employee

✅ **Register your laptop**
1. Asset Management → + New Asset
2. Fill in details
3. Register

✅ **Update status when returning**
1. Find your asset in table
2. Click "Update Status"
3. Select "Returned"
4. Add notes
5. Save

✅ **View your assets**
- Asset Management tab shows only your assets
- Use search to filter

### As a Manager

✅ **View team assets**
- Asset Management shows your assets + team assets
- Search by employee name to find specific person

✅ **Check team reports**
- Audit & Reporting → Summary Report
- See team asset breakdown
- Export for reporting

### As an Admin

✅ **Add companies**
- Company Management → + Add Company
- Enter all client companies
- Users can now register assets

✅ **Manage users**
- Admin Settings → User Management
- Change roles as needed
- Remove inactive users

✅ **Review audit logs**
- Audit & Reporting → Audit Logs
- Filter by date, user, action
- Export for compliance

---

## Next Steps

### Learn More
- **[Features](Features)** - See all capabilities
- **[User Guide](User-Guide-Employees)** - Detailed instructions
- **[Admin Guide](Admin-Guide)** - Complete admin docs

### Deploy to Production
- **[Deployment Guide](Deployment-Guide)** - Full deployment instructions
- **[Security](Security)** - Best practices
- **[Backup](Backup-And-Restore)** - Protect your data

### Get Help
- **[Troubleshooting](Troubleshooting)** - Common issues
- **[FAQ](FAQ)** - Frequently asked questions
- **GitHub Issues** - Report bugs

---

## Tips & Tricks

💡 **For Everyone:**
- Use search/filters to find assets quickly
- Export reports regularly for compliance
- Update asset status promptly

💡 **For Admins:**
- Set up automated backups immediately
- Review audit logs monthly
- Limit admin access to 2-3 users
- Add all companies before inviting users

💡 **For Developers:**
- Check `.env.example` for all config options
- Use Docker for consistent development
- Run linters before committing
- Test with different roles

---

**Ready to dive deeper?** Explore the [Features](Features) page or jump to the [Admin Guide](Admin-Guide)!
