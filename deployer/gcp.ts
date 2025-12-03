import { GeneratedTool } from '../generator/core';
import { execSync } from 'node:child_process';

export type GcpDeployTarget = 'cloudrun';
export type GcpConfig = {
  projectId: string;
  region: string;
  artifactHost: string; // e.g., us-docker.pkg.dev
  artifactRepo: string; // e.g., PROJECT/REPO
  serviceNamePrefix?: string;
};

export class GCPDeployer {
  constructor(private cfg: GcpConfig) {}

  async deploy(tool: GeneratedTool, target: GcpDeployTarget) {
    switch (target) {
      case 'cloudrun':
        return await this.deployCloudRun(tool);
      default:
        throw new Error(`Unsupported GCP target: ${target}`);
    }
  }

  private async deployCloudRun(tool: GeneratedTool) {
    const svcName = `${this.cfg.serviceNamePrefix || 'bom'}-${tool.id}`.slice(0, 60);
    const imageUrl = `${this.cfg.artifactHost}/${this.cfg.artifactRepo}/buildomatic:sha-${process.env.GITHUB_SHA || Date.now()}`;

    // Assume image already pushed by CI; deploy via gcloud
    execSync(
      `gcloud run deploy ${svcName} ` +
        `--image ${imageUrl} ` +
        `--region ${this.cfg.region} ` +
        `--allow-unauthenticated ` +
        `--platform managed ` +
        `--port 4000 ` +
        `--set-env-vars NODE_ENV=production`,
      { stdio: 'inherit' }
    );

    const url = `https://${svcName}-${this.cfg.region}.run.app`;
    return {
      provider: 'gcp',
      target: 'cloudrun',
      service: svcName,
      region: this.cfg.region,
      url,
      status: 'deployed' as const,
      credentials: { admin: { email: 'admin@example.com', password: this.generatePassword() } },
    };
  }

  private generatePassword(): string {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
}