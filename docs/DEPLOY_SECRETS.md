# CI Secrets for AWS & GCP Deploy

GitHub Actions Secrets required:

AWS (Elastic Beanstalk):
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- AWS_EB_APP_NAME
- AWS_EB_ENV_NAME
- AWS_EB_S3_BUCKET

AWS (ECS Fargate):
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- AWS_ECS_CLUSTER
- AWS_ECS_SERVICE
- AWS_ECS_TASK_DEF (optional, if preexisting)
- DEPLOY_DATABASE_URL (if env injection is needed)

GCP (Cloud Run + Artifact Registry):
- GCP_PROJECT_ID
- GCP_REGION
- GCP_SA_KEY (Service Account JSON)
- GCP_ARTIFACT_REPO_HOST (e.g., us-docker.pkg.dev)
- GCP_ARTIFACT_REPO (e.g., my-project/my-repo)

General:
- SENTRY_DSN (optional)
- DATABASE_URL (optional injection)

Usage:
- Trigger workflow dispatch with input target: aws-eb | aws-ecs | gcp-cloudrun
- Ensure images are built/pushed in the same job before deploy steps