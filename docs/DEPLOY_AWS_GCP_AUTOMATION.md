# Automated Deploys: AWS & GCP

This repo includes:
- GitHub Actions workflow: .github/workflows/deploy-aws-gcp.yml
- AWS deployer using AWS SDK for EB/ECS: deployer/aws.ts
- GCP deployer using gcloud CLI: deployer/gcp.ts
- Orchestrator supports targets: aws-eb, aws-ecs, gcp-cloudrun

Flow:
1. Build & push image to GHCR (always)
2. For AWS EB:
   - Generate Dockerrun.aws.json zip
   - Upload to S3
   - Create EB application version
   - Update environment
3. For AWS ECS:
   - Register new task definition with updated image
   - Update ECS service to new task definition
4. For GCP Cloud Run:
   - Build/push image to Artifact Registry
   - Deploy to Cloud Run with env vars

Prereqs:
- Secrets configured (see docs/DEPLOY_SECRETS.md)
- EB app/env pre-created, or adapt workflow to create them
- ECS cluster/service pre-created, or apply Terraform in infra/aws/ecs
- Cloud Run APIs enabled and SA permissions granted

Rollback:
- EB: update environment to previous version label
- ECS: update service to previous task definition ARN
- Cloud Run: deploy previous image tag