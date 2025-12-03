# Deploy on Google Cloud (Cloud Run)

This repository supports Cloud Run deploys via GitHub Actions and a GCP deployer.

Prerequisites:
- GCP project with Cloud Run and Artifact Registry enabled
- Service account with permissions to push to Artifact Registry and deploy Cloud Run
- GitHub Actions secrets configured

GitHub Actions secrets required:
- GCP_PROJECT_ID
- GCP_REGION (e.g., us-central1)
- GCP_SA_KEY (Service Account JSON; keep private)
- GCP_ARTIFACT_REPO_HOST (e.g., us-docker.pkg.dev)
- GCP_ARTIFACT_REPO (e.g., my-project/my-repo)

Deploy via Actions:
1. GitHub → Actions → “Deploy AWS & GCP” → Run workflow
2. Input target: gcp-cloudrun
3. The workflow will:
   - Build and push Docker image to Artifact Registry
   - Deploy a Cloud Run service with the built image and port 4000
   - Set basic environment variables (NODE_ENV=production)

Result:
- Cloud Run URL: https://<service>-<region>.run.app

Programmatic deployer:
- See deployer/gcp.ts for gcloud-driven deploys
- Orchestrator supports target 'gcp-cloudrun'

Notes:
- For custom domains, set up Cloud Run domain mappings
- Inject environment variables via gcloud run services update --update-env-vars or Terraform