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
    const project = await this.api.createProject({
      name: options.projectName || `tool-${tool.id}`,
    });

    const database = await this.api.addPostgres(project.id);

    const backend = await this.api.createServiceFromPackage(project.id, `backend-${tool.id}`, tool.deployment.package!);
    const frontend = await this.api.createServiceFromPackage(project.id, `frontend-${tool.id}`, tool.deployment.package!);

    const envVars = {
      DATABASE_URL: database.url,
      NODE_ENV: 'production',
      ...tool.config.environment,
    };
    await this.api.setEnvironmentVariables(project.id, envVars);

    await this.waitForDeployment(project.id);

    return {
      projectId: project.id,
      url: frontend.url,
      apiUrl: backend.url,
      database,
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