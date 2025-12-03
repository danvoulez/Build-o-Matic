/**
 * Docker Deployer — builds local image instructions response.
 * Real build would shell out to docker CLI; we just return instructions here.
 */
import { GeneratedTool } from '../generator/core';

export class DockerDeployer {
  async deploy(tool: GeneratedTool) {
    return {
      image: `buildomatic/${tool.id}`,
      instructions: [
        'Save package artifact to project directory',
        'docker build -t buildomatic-tool .',
        'docker run -p 3000:3000 buildomatic-tool',
      ],
      status: 'ready' as const,
    };
  }
}