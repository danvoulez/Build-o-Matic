/**
 * Deployment orchestrator:
 * Chooses deployer by target and executes deployment from packaged artifact.
 */
import { GeneratedTool } from '../generator/core';
import { RailwayDeployer } from './railway';
import { RenderDeployer } from './render';
import { DockerDeployer } from './docker';
import { config } from '../server/config';

export async function deployTool(generated: GeneratedTool, target: 'railway' | 'render' | 'docker') {
  switch (target) {
    case 'railway': {
      const token = config.railwayToken || '';
      const dep = new RailwayDeployer(token);
      return await dep.deploy(generated, { projectName: `bom-${generated.id}` });
    }
    case 'render': {
      const dep = new RenderDeployer(''); // TODO: inject token if needed
      return await dep.deploy(generated, { serviceName: `bom-${generated.id}` });
    }
    case 'docker': {
      const dep = new DockerDeployer();
      return await dep.deploy(generated);
    }
    default:
      throw new Error(`Unknown deploy target: ${target}`);
  }
}