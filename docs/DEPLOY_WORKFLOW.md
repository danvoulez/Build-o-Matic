# Deployment Workflows (GitHub Actions)

Workflows:
- .github/workflows/ci-cd.yml: unit/integration tests and Playwright E2E on push/PR
- .github/workflows/deploy-aws-gcp.yml: manual deploys to AWS EB/ECS and GCP Cloud Run via workflow_dispatch

Usage:
- Navigate to GitHub → Actions
- Select “Deploy AWS & GCP”
- Click “Run workflow”
- Choose a target: aws-eb | aws-ecs | gcp-cloudrun
- Ensure all required secrets are present (see docs/DEPLOY_SECRETS.md)

What happens:
- The workflow builds and pushes the Docker image to GHCR (or Artifact Registry on GCP target)
- AWS EB: creates an application version from Dockerrun.zip and updates environment
- AWS ECS: registers a new task definition and updates the service
- GCP Cloud Run: deploys the specified image and configures service in provided region

Advanced:
- Extend the workflow to include App Runner (AWS) or GKE (GCP)
- Add environment variable injection and secret managers (AWS Secrets Manager, GCP Secret Manager)
- Canary or blue/green deploys can be added with additional jobs and traffic splitting