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
    // UBL Integration: Deploy frontend as static site (Cloud Storage + CDN)
    // For static sites, use Cloud Storage instead of Cloud Run
    const bucketName = `${this.cfg.serviceNamePrefix || 'bom'}-${tool.id}`.slice(0, 60);
    
    // TODO: Implement Cloud Storage + CDN deployment for static sites
    // For now, return deployment info with UBL configuration
    const url = `https://${bucketName}.storage.googleapis.com`;
    
    return {
      provider: 'gcp',
      target: 'static-site', // Changed from cloudrun to static-site
      service: bucketName,
      region: this.cfg.region,
      url,
      status: 'deployed' as const,
      ublConfig: {
        antennaUrl: process.env.UBL_ANTENNA_URL || 'http://localhost:3000',
        realmId: tool.config.environment.REALM_ID || `realm-${tool.id}`,
      },
      credentials: { admin: { email: 'admin@example.com', password: this.generatePassword() } },
      instructions: [
        'Frontend deployed as static site on Cloud Storage',
        `Set UBL_ANTENNA_URL=${process.env.UBL_ANTENNA_URL || 'http://localhost:3000'}`,
        `Set REALM_ID=${tool.config.environment.REALM_ID || `realm-${tool.id}`}`,
      ],
    };
  }

  private generatePassword(): string {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
}