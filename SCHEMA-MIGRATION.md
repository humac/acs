# Database Schema Migration Guide

## Overview

The KARS application has been updated to use separated first and last name fields for better data quality and improved user experience. This document outlines the changes and migration considerations.

## What Changed

### Assets Table Schema

**Old Schema:**
- `employee_name` (TEXT) - Combined first and last name
- `manager_name` (TEXT) - Combined first and last name

**New Schema:**
- `employee_first_name` (TEXT NOT NULL) - Employee's first name
- `employee_last_name` (TEXT NOT NULL) - Employee's last name
- `manager_first_name` (TEXT) - Manager's first name (optional)
- `manager_last_name` (TEXT) - Manager's last name (optional)

### API Changes

All asset-related API endpoints now use the new separated field names:

**POST /api/assets**
- Required: `employee_first_name`, `employee_last_name`
- Optional: `manager_first_name`, `manager_last_name`

**PUT /api/assets/:id**
- Same field requirements as POST

**POST /api/assets/import**
- CSV must include: `employee_first_name`, `employee_last_name`
- CSV may include: `manager_first_name`, `manager_last_name`

## Migration for New Deployments

If you're deploying KARS for the first time, no migration is needed. The new schema will be created automatically.

## Benefits of the New Schema

1. **Better Data Quality**: Separated fields prevent inconsistent name formatting
2. **Improved Sorting**: Can sort by last name independently
3. **Better Reporting**: Easier to generate formal reports with proper name formatting
4. **User Experience**: More intuitive forms with clear first/last name fields
5. **Role-Based Access**: Enhanced prepopulation for employees registering assets

## UI Changes

### Asset Registration Form

**Employee Registration (Employees):**
- First name and last name fields are prepopulated from user profile
- Employee fields are readonly - employees can only register assets for themselves
- Manager fields are prepopulated from employee's manager information and readonly

**Asset Registration (Admins & Managers):**
- All fields editable
- Can register assets for any employee
- Separated first/last name fields for both employee and manager

### Asset Edit Modal

- Manager name now split into first and last name fields
- Both fields editable by admins and managers
- Character counters for each field

### Asset Table Display

- Employee names displayed as "First Last" in the table
- Search functionality works across both first and last names

### Bulk Import

**New CSV Template Format:**
```csv
employee_first_name,employee_last_name,employee_email,manager_first_name,manager_last_name,manager_email,company_name,laptop_make,laptop_model,laptop_serial_number,laptop_asset_tag,status,notes
```

**Download Updated Template:**
Use the "Download Example CSV" button in the Bulk Import modal to get the correct template.

## For Developers

### Frontend Components Updated

- `AssetRegisterModal.jsx` - Separated name fields with role-based prepopulation
- `AssetEditModal.jsx` - Manager name split into first/last fields
- `AssetBulkImportModal.jsx` - Updated field requirements display
- `AssetTable.jsx` - Display logic for combined names from first/last

### Backend Changes

- `database.js` - Updated schema and indexes
- `server.js` - Updated validation and API endpoints
- Test files updated to use new schema

### Database Indexes

New indexes created for improved query performance:
- `idx_employee_first_name`
- `idx_employee_last_name`
- `idx_manager_first_name`
- `idx_manager_last_name`

## Support

For questions or issues related to this migration, please:
1. Check the [API Reference](wiki/API-Reference.md)
2. Review the [Features Guide](wiki/Features.md)
3. Open an issue on GitHub

## Version Information

- **Schema Version**: 2.0
- **Introduced In**: December 2025
- **Breaking Change**: Yes - API field names changed
