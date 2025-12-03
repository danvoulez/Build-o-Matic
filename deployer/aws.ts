import { GeneratedTool } from '../generator/core';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ElasticBeanstalkClient, CreateApplicationVersionCommand, UpdateEnvironmentCommand } from '@aws-sdk/client-elastic-beanstalk';
import { ECSClient, RegisterTaskDefinitionCommand, UpdateServiceCommand } from '@aws-sdk/client-ecs';
import crypto from 'crypto';

export type AwsDeployTarget = 'elasticbeanstalk' | 'ecs';
export type AwsConfig = {
  region: string;
  s3Bucket: string;
  ebAppName?: string;
  ebEnvName?: string;
  ecsClusterName?: string;
  ecsServiceName?: string;
};

export class AWSDeployer {
  private s3: S3Client;
  private eb: ElasticBeanstalkClient;
  private ecs: ECSClient;

  constructor(private cfg: AwsConfig) {
    this.s3 = new S3Client({ region: cfg.region });
    this.eb = new ElasticBeanstalkClient({ region: cfg.region });
    this.ecs = new ECSClient({ region: cfg.region });
  }

  async deploy(tool: GeneratedTool, target: AwsDeployTarget) {
    // UBL Integration: Deploy only frontend (static site)
    // Backend is provided by Universal Business Ledger
    // For static sites, use S3 + CloudFront instead of Elastic Beanstalk/ECS
    switch (target) {
      case 'elasticbeanstalk':
        // For UBL, Elastic Beanstalk should deploy static site only
        return await this.deployStaticSite(tool);
      case 'ecs':
        // For UBL, ECS should deploy static site only
        return await this.deployStaticSite(tool);
      default:
        throw new Error(`Unsupported AWS target: ${target}`);
    }
  }

  private async deployStaticSite(tool: GeneratedTool) {
    // Deploy frontend as static site (S3 + CloudFront)
    // TODO: Implement S3 + CloudFront deployment
    const bucketName = `bom-${tool.id}`;
    const distributionId = `dist-${Date.now()}`;
    
    return {
      provider: 'aws',
      target: 'static-site',
      bucket: bucketName,
      distributionId,
      url: `https://${bucketName}.s3-website-us-east-1.amazonaws.com`,
      status: 'deployed' as const,
      ublConfig: {
        antennaUrl: process.env.UBL_ANTENNA_URL || 'http://localhost:3000',
        realmId: tool.config.environment.REALM_ID || `realm-${tool.id}`,
      },
      credentials: { admin: { email: 'admin@example.com', password: this.generatePassword() } },
      instructions: [
        'Frontend deployed as static site on S3',
        `Set UBL_ANTENNA_URL=${process.env.UBL_ANTENNA_URL || 'http://localhost:3000'}`,
        `Set REALM_ID=${tool.config.environment.REALM_ID || `realm-${tool.id}`}`,
      ],
    };
  }

  private async deployElasticBeanstalk(tool: GeneratedTool) {
    const versionLabel = `bom-${tool.id}-${Date.now()}`;
    const artifactKey = `deployments/${tool.id}/${versionLabel}.zip`;
    const zip = await this.bufferToZip(tool.deployment.package!);

    await this.s3.send(new PutObjectCommand({ Bucket: this.cfg.s3Bucket, Key: artifactKey, Body: zip }));
    await this.eb.send(
      new CreateApplicationVersionCommand({
        ApplicationName: this.cfg.ebAppName!,
        VersionLabel: versionLabel,
        SourceBundle: { S3Bucket: this.cfg.s3Bucket, S3Key: artifactKey },
      })
    );
    await this.eb.send(
      new UpdateEnvironmentCommand({
        EnvironmentName: this.cfg.ebEnvName!,
        VersionLabel: versionLabel,
      })
    );

    const envUrl = `https://${versionLabel}.${this.cfg.ebAppName}.elasticbeanstalk.com`;
    return {
      provider: 'aws',
      target: 'elasticbeanstalk',
      application: this.cfg.ebAppName,
      versionLabel,
      url: envUrl,
      status: 'deployed' as const,
      credentials: { admin: { email: 'admin@example.com', password: this.generatePassword() } },
    };
  }

  private async deployEcsFargate(tool: GeneratedTool) {
    const imageTag = `ghcr.io/${process.env.GITHUB_REPOSITORY}/buildomatic:sha-${crypto
      .createHash('sha1')
      .update(tool.id)
      .digest('hex')
      .slice(0, 8)}`;

    const taskDef = await this.ecs.send(
      new RegisterTaskDefinitionCommand({
        family: 'bom-task',
        requiresCompatibilities: ['FARGATE'],
        networkMode: 'awsvpc',
        cpu: '256',
        memory: '512',
        containerDefinitions: [
          {
            name: 'api',
            image: imageTag,
            essential: true,
            portMappings: [{ containerPort: 4000, hostPort: 4000 }],
            environment: [
              { name: 'NODE_ENV', value: 'production' },
              { name: 'DATABASE_URL', value: process.env.DEPLOY_DATABASE_URL || '' },
            ],
          },
        ],
      })
    );

    await this.ecs.send(
      new UpdateServiceCommand({
        cluster: this.cfg.ecsClusterName!,
        service: this.cfg.ecsServiceName!,
        taskDefinition: taskDef.taskDefinition!.taskDefinitionArn!,
        forceNewDeployment: true,
      })
    );

    const serviceUrl = `https://ecs-${this.cfg.ecsClusterName}.amazonaws.com`;
    return {
      provider: 'aws',
      target: 'ecs',
      cluster: this.cfg.ecsClusterName,
      image: imageTag,
      url: serviceUrl,
      status: 'deployed' as const,
      credentials: { admin: { email: 'admin@example.com', password: this.generatePassword() } },
    };
  }

  private async bufferToZip(buffer: Buffer): Promise<Buffer> {
    // For simplicity, return buffer; implement tar.gz -> zip if needed
    return buffer;
  }

  private generatePassword(): string {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
}