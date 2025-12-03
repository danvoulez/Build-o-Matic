/**
 * Docker Deployer — Static Site Deployment
 * 
 * UBL Integration: Deploys frontend as static site.
 * Backend is provided by Universal Business Ledger.
 */
import { GeneratedTool } from '../generator/core';

export class DockerDeployer {
  async deploy(tool: GeneratedTool) {
    // UBL Integration: Frontend only (static site)
    // Use nginx or similar to serve static files
    return {
      image: `buildomatic/${tool.id}`,
      instructions: [
        'Save package artifact to project directory',
        'Build frontend: npm install && npm run build',
        'Use nginx to serve static files from dist/',
        `Set UBL_ANTENNA_URL=${process.env.UBL_ANTENNA_URL || 'http://localhost:3000'}`,
        `Set REALM_ID=${tool.config.environment.REALM_ID || `realm-${tool.id}`}`,
        'docker build -t buildomatic-tool .',
        'docker run -p 80:80 -e UBL_ANTENNA_URL -e REALM_ID buildomatic-tool',
      ],
      status: 'ready' as const,
      ublConfig: {
        antennaUrl: process.env.UBL_ANTENNA_URL || 'http://localhost:3000',
        realmId: tool.config.environment.REALM_ID || `realm-${tool.id}`,
      },
    };
  }
}