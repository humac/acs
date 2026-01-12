# Test Data for ACS Import

This directory contains CSV test data files that can be imported into the Asset Control System.

## Files

| File | Description | Records |
|------|-------------|---------|
| `companies.csv` | Company records | 10 companies |
| `assets.csv` | Asset records with employees & managers | 50 assets |

## Import Instructions

### Prerequisites
1. Start the backend server: `cd backend && npm start`
2. Login as an admin user

### Import Companies First

1. Navigate to **Admin → Companies**
2. Click **Import CSV**
3. Select `test-data/companies.csv`

### Import Assets

1. Navigate to **Assets → Import**  
2. Click **Import CSV**
3. Select `test-data/assets.csv`

> **Note**: Import companies before assets since assets reference company names.

## Data Summary

### Companies (10 total)
- Acme Corporation, Global Tech Industries, Sunrise Financial Group
- Pacific Healthcare Systems, Atlas Manufacturing Co., Nova Creative Agency
- Summit Energy Partners, Horizon Logistics Inc., Evergreen Environmental
- Quantum Research Labs

### Assets (50 total)
- **Asset Types**: Laptops (30), Mobile Phones (20)
- **Status**: All Active
- **Distribution**: 5 assets per company

### Organizational Hierarchy
Each company has a realistic manager-employee structure:
- **Managers are also employees** with their own assets (laptop + phone)
- **Managers report to directors** at higher levels
- **Employees report to their managers**

Example hierarchy (Acme Corporation):
```
Marcus Chen (Director - not in asset list)
└── Sarah Johnson (Manager) - has laptop + phone
    ├── John Smith - has laptop
    ├── Emily Davis - has laptop
    └── Michael Brown - has phone
```
