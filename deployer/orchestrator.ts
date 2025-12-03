// NOTE: This deployer now deploys frontend-only tools
// Backend is provided by Universal Business Ledger (UBL)
// UBL should be deployed separately and shared across all tools
//
// All deployers have been adapted to:
// - Deploy only frontend (static site)
// - Configure UBL_ANTENNA_URL environment variable
// - Use REALM_ID from generator
// - No backend or database provisioning

import { GeneratedTool } from '../generator/core';
import { RailwayDeployer } from './railway';
import { RenderDeployer } from './render';
import { DockerDeployer } from './docker';
import { AWSDeployer, AwsConfig } from './aws';
import { GCPDeployer, GcpConfig } from './gcp';
import { config } from '../server/config';

export async function deployTool(
  generated: GeneratedTool,
  target:
    | 'railway'
    | 'render'
    | 'docker'
    | 'aws-eb'
    | 'aws-ecs'
    | 'gcp-cloudrun'
) {
  switch (target) {
    case 'railway': {
      const token = config.railwayToken || '';
      const dep = new RailwayDeployer(token);
      return await dep.deploy(generated, { projectName: `bom-${generated.id}` });
    }
    case 'render': {
      const dep = new RenderDeployer(process.env.RENDER_API_TOKEN || '');
      return await dep.deploy(generated, { serviceName: `bom-${generated.id}` });
    }
    case 'docker': {
      const dep = new DockerDeployer();
      return await dep.deploy(generated);
    }
    case 'aws-eb': {
      const dep = new AWSDeployer({
        region: process.env.AWS_REGION || 'us-east-1',
        s3Bucket: process.env.AWS_EB_S3_BUCKET || '',
        ebAppName: process.env.AWS_EB_APP_NAME || '',
        ebEnvName: process.env.AWS_EB_ENV_NAME || '',
      } as AwsConfig);
      return await dep.deploy(generated, 'elasticbeanstalk');
    }
    case 'aws-ecs': {
      const dep = new AWSDeployer({
        region: process.env.AWS_REGION || 'us-east-1',
        s3Bucket: process.env.AWS_DEPLOY_BUCKET || '',
        ecsClusterName: process.env.AWS_ECS_CLUSTER || '',
        ecsServiceName: process.env.AWS_ECS_SERVICE || '',
      } as AwsConfig);
      return await dep.deploy(generated, 'ecs');
    }
    case 'gcp-cloudrun': {
      const dep = new GCPDeployer({
        projectId: process.env.GCP_PROJECT_ID || '',
        region: process.env.GCP_REGION || 'us-central1',
        artifactHost: process.env.GCP_ARTIFACT_REPO_HOST || 'us-docker.pkg.dev',
        artifactRepo: process.env.GCP_ARTIFACT_REPO || '',
        serviceNamePrefix: process.env.GCP_SERVICE_PREFIX || 'bom',
      } as GcpConfig);
      return await dep.deploy(generated, 'cloudrun');
    }
    default:
      throw new Error(`Unknown deploy target: ${target}`);
  }
}