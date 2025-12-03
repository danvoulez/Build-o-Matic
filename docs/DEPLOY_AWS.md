# Deploy on AWS

This repository supports two primary AWS deployment options:

- Elastic Beanstalk (managed platform; simplest path for Dockerized apps)
- ECS Fargate (container orchestration; recommended if you already have a cluster/service)

Both are integrated via the GitHub Actions workflow: .github/workflows/deploy-aws-gcp.yml

Prerequisites:
- AWS account with appropriate IAM permissions for EB/ECS/S3/ECR
- GitHub Actions secrets configured
- Your application builds an image from the repository’s Dockerfile or starts via Node using provided scripts

Ports:
- The API listens on port 4000 internally. Ensure Load Balancers and security groups route external ports 80/443 to the container appropriately when using ECS or EB.

Health and Monitoring:
- Health endpoint: GET /health
- Metrics endpoint: GET /metrics (Prometheus format)

Sentry (optional):
- Set SENTRY_DSN as environment variable to enable error tracking

## Elastic Beanstalk

Best for: quickest managed deployment with minimal configuration.

GitHub Actions secrets required:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (e.g., us-east-1)
- AWS_EB_APP_NAME (e.g., buildomatic)
- AWS_EB_ENV_NAME (e.g., buildomatic-env)
- AWS_EB_S3_BUCKET (S3 bucket for EB application versions)

Steps:
1. Ensure secrets are set in your repository settings.
2. Trigger the workflow manually:
   - GitHub → Actions → “Deploy AWS & GCP” → Run workflow
   - Input target: aws-eb
3. The workflow will:
   - Build and push the Docker image to GHCR
   - Zip the Dockerrun.aws.json and upload to S3
   - Create a new EB application version
   - Update your EB environment to the new version

Result:
- The EB environment URL (e.g., http(s)://<env>.<app>.elasticbeanstalk.com) will serve the app.

Notes:
- If using a custom domain, configure Route 53/your DNS to point to the EB environment.
- Inject environment variables via EB console or extended Dockerrun configuration.

## ECS Fargate

Best for: organizations already using ECS with existing clusters/services.

GitHub Actions secrets required:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- AWS_ECS_CLUSTER (existing cluster name)
- AWS_ECS_SERVICE (existing service name)
- Optional: AWS_ECS_TASK_DEF (existing task definition family to update)
- Optional: DEPLOY_DATABASE_URL (if you need to inject DB URL via task env)

Steps:
1. Ensure secrets are set in your repository settings.
2. Trigger the workflow manually:
   - GitHub → Actions → “Deploy AWS & GCP” → Run workflow
   - Input target: aws-ecs
3. The workflow will:
   - Build and push the Docker image to GHCR
   - Register a new task definition with the updated image and basic env overrides
   - Update your ECS service to use the new task definition

Result:
- Your ECS service will redeploy with the new image. Access via your configured Load Balancer or Service endpoint.

Notes:
- Ensure your ECS service has an ALB configured and security groups allow inbound traffic.
- Adjust task memory/cpu, env vars, and container port mappings according to your production requirements (the provided defaults use 256 CPU units, 512MB memory, and map container port 4000).

## Using the AWS Deployer Programmatically

If you prefer code-based deploys, use deployer/aws.ts:

Example (ECS):
```ts
import { AWSDeployer } from '../deployer/aws';

const deployer = new AWSDeployer({
  region: process.env.AWS_REGION!,
  s3Bucket: process.env.AWS_DEPLOY_BUCKET || 'bom-deploy-artifacts',
  ecsClusterName: process.env.AWS_ECS_CLUSTER!,
  ecsServiceName: process.env.AWS_ECS_SERVICE!,
});

const result = await deployer.deploy(generatedTool, 'ecs');
console.log(result.url);
```

Example (Elastic Beanstalk):
```ts
import { AWSDeployer } from '../deployer/aws';

const deployer = new AWSDeployer({
  region: process.env.AWS_REGION!,
  s3Bucket: process.env.AWS_EB_S3_BUCKET!,
  ebAppName: process.env.AWS_EB_APP_NAME!,
  ebEnvName: process.env.AWS_EB_ENV_NAME!,
});

const result = await deployer.deploy(generatedTool, 'elasticbeanstalk');
console.log(result.url);
```

## Troubleshooting

- 403 or credential errors: verify IAM permissions and the correct secrets in GitHub.
- EB version update fails: make sure the application and environment exist, and the S3 bucket is accessible.
- ECS service doesn’t update: ensure the cluster/service names are correct; verify ALB health checks and security groups.
- Database connectivity: ensure DATABASE_URL points to RDS and security groups allow access from your ECS tasks/EB environment.