# ACS Azure Deployment Guide

This document outlines the End-to-End automation strategy for the ACS project, covering infrastructure provisioning, CI/CD pipelines, and configuration.

## 1. Prerequisites

### Local Tools
If you wish to run Terraform or build images locally:
- **Azure CLI** (`az`)
- **Terraform** (v1.0+)
- **Docker Desktop**
- **Node.js** (v18+)

### Azure Requirements
Before running the pipelines, ensure you have an **Azure Storage Account** to store the Terraform state.
- **Resource Group**: `tfstate-rg`
- **Storage Account**: `tfstatestorage`
- **Container**: `tfstate`
*(Update these values in `azure-infra.yml` and `azure-pipelines-destroy.yml` if yours differ)*

**Setup Script:**
A PowerShell script is provided to automate this setup.
1. Open PowerShell.
2. Run:
   ```powershell
   cd infra/scripts
   .\setup-tfbackend.ps1
   ```
3. Copy the **Storage Account Name** output by the script.
4. Update `azure-infra.yml` and `azure-pipelines-destroy.yml`.

## 2. Infrastructure Architecture

The specific infrastructure is defined in the `/infra` directory using Terraform modules:
- **Registry**: Azure Container Registry (ACR). **Pre-provisioned**: Must exist before deployment (Default: `kdlabscr`). Used by all environments ("Build Once, Deploy Many").
- **Database**: Azure Database for PostgreSQL (Burstable B1ms).
- **Compute**: Azure Container Apps (ACA) Environment hosting:
    - `backend`: Node.js/Express API.
    - `frontend`: Vite/React UI.
- **Observability**: Log Analytics Workspace.

## 3. Azure DevOps Configuration

To successfully run the pipelines, configure the following in your Azure DevOps Project:

### Service Connection
Create **two** Service Connections:

1.  **Azure Resource Manager** (for Terraform/Deployment):
    - **Name**: `ARM-Connection`
    - **Scope**: Subscription Level.

2.  **Docker Registry** (for building/pushing images):
    - **Service Connection Type**: Select **Docker Registry**.
    - **Registry Type**: Select **Azure Container Registry**.
    - **Authentication Type**: Service Principal
    - **Name**: `ACR-Docker-Connection`
    - **Azure Subscription**: Select your subscription.
    - **Registry**: Select `kdlabscr` (or your shared registry).

### Variable Groups
Create **two** Library Variable Groups:
1.  `acs-secrets-dev`
2.  `acs-secrets-prod`

Add the following variables to **both** groups (with environment-specific values):
- `postgres_password`: (Secret) **Required**. DB Admin Password.
- `jwt_secret`: (Secret) **Required**. JWT Signing Key.
- `acs_master_key`: (Secret) **Required**. Encryption Key.

**Link**: Ensure both groups are authorized for use in your pipelines.

### Terraform Variables Configuration
The pipeline handles most variables automatically, but here is the comprehensive list:

| Variable | Description | Source / Default |
| :--- | :--- | :--- |
| `environment` | `dev` or `prod` | **Pipeline Logic**. Passed automatically by the pipeline stages. |
| `location` | Azure Region | **Default**: `canadacentral`. Can be overridden by adding a `location` variable to the pipeline. |
| `postgres_username` | DB Admin User | **Default**: `acsadmin`. Can be overridden via pipeline variables if needed. |
| `postgres_password` | DB Admin Pwd | **Variable Group**. Must be set in `acs-secrets-dev` and `acs-secrets-prod`. |
| `jwt_secret` | JWT Signing Key | **Variable Group**. Must be set in `acs-secrets-dev` and `acs-secrets-prod`. |
| `shared_acr_name` | ACR Name | **Default**: `kdlabscr`. Must explicitly exist. |
| `shared_acr_resource_group_name` | ACR Resource Group | **Default**: `kdlabs`. RG containing the shared registry. |
| `acs_master_key` | Encryption Key | **Variable Group**. Must be set in `acs-secrets-dev` and `acs-secrets-prod`. |
| `additional_allowed_origins` | CORS Domains | **Default**: `[]`. List of custom domains (e.g. `["https://app.custom.com"]`) to allow. |
| `backend_additional_env` | Flexible Config | **Default**: `{}`. Map of optional backend flags. See [Flexible Backend Configuration](#flexible-backend-configuration) below. |

### Application Environment Variables (Backend)
The following variables are configured by default in the Terraform module (`infra/modules/container_apps`), but can be modified if necessary:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `JWT_EXPIRES_IN` | `7d` | Token expiration duration. |
| `DATA_DIR` | `/app/data` | Directory for data storage. |
| `RUN_ATTESTATION_SCHEDULER` | `true` | Enables the internal scheduler. |
| `POSTGRES_SSL` | `true` | Enforces SSL for DB connections. |

### Flexible Backend Configuration
You can override the defaults above or add **any** other environment variable (e.g., from `.env.example`) using the `backend_additional_env` variable.

**Option 1: Permanent Configuration (Committed Code)**
To set these values permanently, update the `default` block in `infra/variables.tf`:

```hcl
variable "backend_additional_env" {
  type = map(string)
  default = {
    RATE_LIMIT_ENABLED = "true"
    PROXY_TYPE         = "cloudflare"
    DATA_DIR           = "/tmp/data" # Overrides default /app/data
  }
}
```

**Option 2: Runtime Override (No Code Change)**
You can pass these variables dynamically during pipeline run or CLI usage without editing files:
*   **CLI**: `-var='backend_additional_env={"RATE_LIMIT_ENABLED"="false"}'`
*   **Pipeline**: Add a variable to the library or pipeline YAML.


### Environments
Create two Environments in **Pipelines -> Environments**:
1. `dev` (No approvals required)
2. `prod` (Add "Approvals and checks" -> "Approvals" to gate deployment)

## 4. Pipelines

Infrastructure and application deployments are **separate pipelines**. This means pushing a bug fix only runs tests, builds, and deploys — Terraform never runs. Infrastructure changes only trigger when `infra/` files change.

### App Deploy (`azure-pipelines.yml`)
Triggers automatically on commits to `main` that change `backend/`, `frontend/`, or `.pipelines/`.
1. **Testing**: Runs lint, security audit, and `npm run test:ci` for Frontend and Backend (parallel matrix).
2. **Build**: Builds Docker images and pushes to the **Shared ACR** (`kdlabscr`).
3. **Deploy Dev**: Deploys new container revisions to ACA in `dev`.
4. **Deploy Prod**: Waits for approval (ADO environment gate), then deploys to `prod`.

### Infrastructure (`azure-infra.yml`)
Triggers automatically on commits to `main` that change `infra/`.
1. **Dev Infrastructure**: Terraform init/plan/apply for `dev` (auto, no gate).
2. **Prod Infrastructure**: Terraform init/plan/apply for `prod` (gated by ADO `prod` environment approval).

> **Note**: Container app images are managed by the app deploy pipeline, not Terraform. Terraform uses `lifecycle { ignore_changes }` on the container image so it never resets the running application version. The database also has `prevent_destroy = true` to guard against accidental deletion.

### Infrastructure Teardown (`azure-pipelines-destroy.yml`)
**Manual Trigger Only.**
Use this pipeline to destroy infrastructure for cost savings or cleanup.
1. Run pipeline manually.
2. Select Environment: `dev` or `prod`.
3. **Validation**: The pipeline will pause after the "Plan" stage. Check the logs to verify what will be deleted, then click "Resume/Approve" to proceed with destruction.
4. **Note**: The database has `prevent_destroy = true`. To destroy it, you must first remove that lifecycle flag from `infra/modules/database/main.tf`.

## 5. Local Development Commands

**Run Terraform Locally:**

*Bash (Linux/Mac/WSL):*
```bash
cd infra
export TF_VAR_postgres_password="your-password"
export TF_VAR_jwt_secret="your-jwt-secret"
export TF_VAR_acs_master_key="your-master-key"

# You must provide backend config because providers.tf is empty (Partial Configuration)
terraform init \
  -backend-config="resource_group_name=tfstate-rg" \
  -backend-config="storage_account_name=<YOUR_STORAGE_ACCOUNT>" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=dev.terraform.tfstate"

terraform plan -var="environment=dev"
terraform apply -var="environment=dev"
```

*PowerShell (Windows):*
```powershell
cd infra
$env:TF_VAR_postgres_password="your-password"
$env:TF_VAR_jwt_secret="your-jwt-secret"
$env:TF_VAR_acs_master_key="your-master-key"

# You must provide backend config because providers.tf is empty (Partial Configuration)
terraform init `
  -backend-config="resource_group_name=tfstate-rg" `
  -backend-config="storage_account_name=<YOUR_STORAGE_ACCOUNT>" `
  -backend-config="container_name=tfstate" `
  -backend-config="key=dev.terraform.tfstate"

terraform plan -var="environment=dev"
terraform apply -var="environment=dev"
```


### Switching Environments (Dev <-> Prod)
To switch between environments locally, you must **reconfigure** the backend to point to the correct state file (`key`):

*Bash:*
```bash
# Switch to Prod
terraform init -reconfigure \
  -backend-config="resource_group_name=tfstate-rg" \
  -backend-config="storage_account_name=<YOUR_STORAGE_ACCOUNT>" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=prod.terraform.tfstate"

terraform plan -var="environment=prod"
```

*PowerShell:*
```powershell
# Switch to Prod
terraform init -reconfigure `
  -backend-config="resource_group_name=tfstate-rg" `
  -backend-config="storage_account_name=<YOUR_STORAGE_ACCOUNT>" `
  -backend-config="container_name=tfstate" `
  -backend-config="key=prod.terraform.tfstate"

terraform plan -var="environment=prod"
```


**Run Tests Locally:**
```bash
cd backend && npm install && npm test
cd frontend && npm install && npm test
```

## 6. Custom Domains & CDN (Cloudflare)

To configure a custom domain (e.g., `app.example.com`) with Cloudflare Proxy:

1.  **Retrieve Public URL**:
    Run `terraform apply` or check the Azure Portal to get the default Frontend FQDN (e.g., `acs-dev-frontend.kindmeadow-1234.canadacentral.azurecontainerapps.io`).

2.  **Azure Custom Domain**:
    *   Navigate to the Container App in Azure Portal -> **Custom domains**.
    *   Add your custom domain (e.g., `app.example.com`).
    *   **Validation**: Azure will require a `TXT` record (e.g., `asuid.app`) to prove ownership. Add this to Cloudflare DNS.
    *   **Certificate**: Select "Managed certificate" (Free) or upload your own.

3.  **Cloudflare DNS Configuration**:
    *   Create a **CNAME** record.
    *   **Name**: `app` (or `@` for root).
    *   **Target**: The Azure default domain from Step 1.
    *   **Proxy Status**:
        *   **Proxied (Orange Cloud)**: Recommended for DDoS protection and caching. Ensure SSL/TLS mode is set to **Full** or **Full (Strict)**.
        *   **DNS Only (Grey Cloud)**: Direct pass-through to Azure.

**Note**: You must complete the Azure Custom Domain validation step (TXT record) *before* you can successfully route traffic through Cloudflare.

## 7. Troubleshooting

### Common Pipeline Errors

**1. "Invalid registry config... must supply both username and password_secret_name"**
*   **Cause**: The Azure Container Registry (ACR) "Admin User" feature is disabled. Terraform requires this to retrieve credentials.
*   **Fix**: Enable valid Admin User credentials on your registry.
    ```bash
    az acr update -n <your_acr_name> --admin-enabled true
    ```
    *Or go to Azure Portal -> Container registries -> Access keys -> Admin user: Enabled.*

**2. "Service connection expects a service connection of type dockerregistry but..."**
*   **Cause**: You are trying to use an **ARM** (Azure Resource Manager) Service Connection for a **Docker** task.
*   **Fix**: Ensure you have created and selected the correct connection types in `azure-pipelines.yml`:
    *   `dockerRegistryServiceConnection` (in `azure-pipelines.yml`) -> Must be **Docker Registry** type.
    *   `azureResourceManagerConnection` (in both pipelines) -> Must be **Azure Resource Manager** type.

**3. "ServerNameAlreadyExists" (PostgreSQL)**
*   **Cause**: Azure PostgreSQL server names must be globally unique.
*   **Fix**: The `infra/main.tf` logic uses a random suffix (`random_string.db_suffix`) to handle this. If it still fails, check if the calculated name collides or if a deleted server is in a "soft delete" state (purge it if necessary).

**4. "504 Gateway Time-out" (Frontend to Backend)**
*   **Cause**: The Backend is unable to connect to the Database. PostgreSQL Flexible Server blocks all connections by default.
*   **Fix**: Ensure the Firewall Rule `allow-azure-services` (IP 0.0.0.0) is present in `infra/modules/database/firewall.tf`. This allows internal Azure traffic.

