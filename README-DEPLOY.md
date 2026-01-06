# Deployment Pipeline Documentation

This repository uses a "Build Once, Deploy Many" CI/CD pipeline integrated with GitHub Actions and Railway. Images are built once, pushed to GitHub Container Registry (GHCR), and then promoted through Development and Production environments in Railway.

## Prerequisites

Before running the pipeline, you must configure the following in Railway and GitHub.

### 1. Railway Configuration

#### Retrieve Service IDs
1. Go to your Railway Project Dashboard.
2. Click on the **Frontend** service.
3. Go to **Settings** > **General**.
4. Copy the **Service ID**.
5. Repeat for the **Backend** service.

#### Switch Source to Docker Image
> [!WARNING]
> You **MUST** change the service source to prevent Railway from trying to build from source code, which conflicts with this pipeline.

1. In the Service **Settings** > **General** section for both Frontend and Backend.
2. Locate the **Source** section.
3. Change "GitHub" to **"Docker Image"**.
4. Enter the image path:
   - Frontend: `ghcr.io/<github-username>/<repo-name>/frontend`
   - Backend: `ghcr.io/<github-username>/<repo-name>/backend`
   *Note: Just put the base image name for now; the pipeline will handle tags.*

#### Generate Environment Scoped Tokens
1. Go to **Project Settings** (gear icon) > **Tokens**.
2. Click **New Token**.
3. Name it `Dev Token` and select your **Development** environment scope.
4. Copy the token (this will be `RAILWAY_TOKEN_DEV`).
5. Create another token named `Prod Token` for your **Production** environment.
6. Copy the token (this will be `RAILWAY_TOKEN_PROD`).

### 2. GitHub Secrets Configuration

Go to your GitHub Repository > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.

Add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `RAILWAY_TOKEN_DEV` | The Development environment token you generated. |
| `RAILWAY_TOKEN_PROD` | The Production environment token you generated. |
| `RAILWAY_FRONTEND_ID_DEV` | The Service ID for Frontend (Dev environment - if you use different services for envs). *If you use a single service with environment variables handling logic, use the Service ID from step 1.* |
| `RAILWAY_BACKEND_ID_DEV` | The Service ID for Backend (Dev). |
| `RAILWAY_FRONTEND_ID_PROD` | The Service ID for Frontend (Prod). |
| `RAILWAY_BACKEND_ID_PROD` | The Service ID for Backend (Prod). |

> [!NOTE]
> If your Railway structure uses the *same* Service UUID across environments (single project, multiple environments), the ID is the same. The *Token* determines which environment is targeted.

### 3. GitHub Environment (Approval Gate)

To enable the manual approval step for Production:
1. Go to GitHub Repo **Settings** > **Environments**.
2. Click **New environment**.
3. Name it `production`.
4. Check **Required reviewers** and add yourself or the team lead.

## Workflow Overview

The pipeline is defined in `.github/workflows/deploy.yml`.

1. **Build Job**:
   - Triggers on push to `main` (changes in `frontend/`, `backend/`, workflow files).
   - Builds Docker images for Frontend and Backend.
   - Pushes to GHCR with tag `sha-<commit_hash>`.

2. **Deploy Dev**:
   - Installs Railway CLI.
   - Triggers a redeploy in the Development environment using the image built in step 1.

3. **Deploy Prod**:
   - **Waits for Manual Approval**.
   - Triggers a redeploy in the Production environment using the **exact same image hash** from Dev.
