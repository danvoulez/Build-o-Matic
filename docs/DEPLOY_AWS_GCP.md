# Deploy on AWS and Google Cloud

AWS Options:
- Elastic Beanstalk (simple deploy with Dockerrun.aws.json)
- ECS Fargate (container orchestration; Terraform example provided)

Prerequisites:
- AWS account and IAM permissions
- S3 bucket for artifacts (Elastic Beanstalk)
- ECR repository if building/pushing images (ECS)
- VPC/Subnets/Security Groups for ECS
- Environment variables set: AWS_REGION, AWS_DEPLOY_BUCKET, AWS_EB_APP_NAME, etc.

Elastic Beanstalk:
1. Build Docker image or use Node app artifact
2. Prepare Dockerrun.aws.json (see infra/aws/elasticbeanstalk/Dockerrun.aws.json)
3. eb create or EB Console: create application and environment
4. Upload Dockerrun to S3 and set as application version
5. Update environment to new version

ECS Fargate:
1. Build image and push to ECR or GHCR
2. Apply Terraform (infra/aws/ecs/ecs_fargate.tf) with cluster/subnets/SGs
3. Configure load balancer if needed (ALB)
4. Set DATABASE_URL and other env vars in task definition

GCP Options:
- Cloud Run (recommended for simplicity)
- GKE (Kubernetes for advanced control)

Prerequisites:
- GCP project and IAM
- Enable APIs: Cloud Run, Artifact Registry, Cloud Build
- Configure gcloud auth on CI/runner

Cloud Run:
1. Build container image (Cloud Build or Docker)
2. Push to Artifact Registry: us-docker.pkg.dev/PROJECT/REPO/IMAGE
3. Deploy:
   gcloud run deploy bom-tool --image us-docker.pkg.dev/PROJECT/REPO/buildomatic:latest --region us-central1 --allow-unauthenticated
4. Set env vars:
   gcloud run services update bom-tool --update-env-vars DATABASE_URL=...,NODE_ENV=production

GKE:
1. Create cluster
2. Build/push image to Artifact Registry
3. kubectl apply -f infra/gcp/cloudrun/cloudrun.yaml (or your own k8s manifests)
4. Configure Ingress and DNS

Automation:
- Use deployer/orchestrator.ts with targets:
  - aws-eb, aws-ecs, gcp-cloudrun, gcp-gke
- Wire credentials in CI via secrets and cloud CLIs

Best Practices:
- Use managed Postgres (RDS, Cloud SQL)
- Store secrets in AWS Secrets Manager or GCP Secret Manager
- Configure autoscaling and health checks
- Add HTTPS via ALB or Cloud Run domain mappings