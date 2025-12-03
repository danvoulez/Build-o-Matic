/**
 * Slightly improved Railway deployer:
 * - Creates services named backend/frontend
 * - Returns URLs and injects DATABASE_URL into env
 */
import { RailwayAPI } from './railway-api';
import { GeneratedTool } from '../generator/core';

export interface DeployOptions {
  projectName?: string;
}

export class RailwayDeployer {
  private api: RailwayAPI;

  constructor(apiToken: string) {
    this.api = new RailwayAPI(apiToken);
  }

  async deploy(tool: GeneratedTool, options: DeployOptions = {}) {
    // UBL Integration: Deploy only frontend (static site)
    // Backend is provided by Universal Business Ledger
    const project = await this.api.createProject({
      name: options.projectName || `tool-${tool.id}`,
    });

    // Deploy only frontend (no backend, no database)
    const frontend = await this.api.createServiceFromPackage(project.id, `frontend-${tool.id}`, tool.deployment.package!);

    // Environment variables for frontend (UBL connection)
    const envVars = {
      NODE_ENV: 'production',
      UBL_ANTENNA_URL: process.env.UBL_ANTENNA_URL || 'http://localhost:3000',
      REALM_ID: tool.config.environment.REALM_ID || `realm-${tool.id}`,
      ...tool.config.environment,
    };
    await this.api.setEnvironmentVariables(project.id, envVars);

    await this.waitForDeployment(project.id);

    return {
      projectId: project.id,
      url: frontend.url,
      // No backend URL (using UBL)
      // No database (using UBL event store)
      credentials: {
        admin: {
          email: 'admin@example.com',
          password: this.generatePassword(),
        },
      },
      status: 'deployed' as const,
    };
  }

  private async waitForDeployment(projectId: string): Promise<void> {
    const maxAttempts = 60;
    let attempts = 0;
    while (attempts < maxAttempts) {
      const status = await this.api.getDeploymentStatus(projectId);
      if (status === 'success') return;
      if (status === 'failed') throw new Error('Deployment failed');
      await new Promise(r => setTimeout(r, 5000));
      attempts++;
    }
    throw new Error('Deployment timeout');
  }

  private generatePassword(): string {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
}