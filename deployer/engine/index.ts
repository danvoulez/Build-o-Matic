/**
 * 10-Second Deployment Engine — Orchestrator
 * Parallelizes planner, provisioner, and artifacts preparation; then deploy and verify.
 */
import { DeploymentTarget, ToolPackage, VerifiedDeployment } from './types';
import { DeploymentPlanner } from './planner';
import { ResourceProvisioner } from './provisioner';
import { ArtifactDeployer } from './artifacts';
import { DeploymentVerifier } from './verifier';
import { RollbackManager } from './rollback';

export class TenSecondDeploymentEngine {
  private planner = new DeploymentPlanner();
  private provisioner = new ResourceProvisioner();
  private artifacts = new ArtifactDeployer();
  private verifier = new DeploymentVerifier();
  private rollback = new RollbackManager();

  async deploy(tool: ToolPackage, target: DeploymentTarget): Promise<VerifiedDeployment> {
    // Parallel stages: plan, provision, prepare artifacts
    const [plan, resources, prepared] = await Promise.all([
      this.planner.plan(tool, target), // ~2s
      this.provisioner.provision(
        {
          id: 'plan',
          target: target.type,
          steps: [],
          estimatedDuration: 0,
          rollbackSteps: []
        },
        target
      ), // ~3s
      this.artifacts.prepare(tool) // ~2s
    ]);

    // Push + deploy + wait (~3s)
    const pushed = await this.artifacts.pushArtifacts(tool, prepared);
    const deployment = await this.artifacts.deployToTarget(pushed.url, resources, {
      toolId: tool.id,
      companyName: tool.config.env.COMPANY_NAME || 'Company'
    });
    await this.artifacts.waitForReady(deployment);

    // Snapshot before verify, for instant rollback in case verify fails
    await this.rollback.takeSnapshot(deployment);

    // Verify and routing (~2s)
    const verified = await this.verifier.verify(deployment);
    return verified;
  }
}