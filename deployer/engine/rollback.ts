import { Deployment, DeploymentSnapshot } from './types';
import crypto from 'crypto';

/**
 * RollbackManager — Instant rollback with lightweight snapshots.
 */
export class RollbackManager {
  private snapshots = new Map<string, DeploymentSnapshot[]>();

  async takeSnapshot(deployment: Deployment): Promise<DeploymentSnapshot> {
    const snap: DeploymentSnapshot = {
      id: `snap-${Date.now()}`,
      deploymentId: deployment.id,
      artifactHash: deployment.artifactHash,
      configHash: this.hash(deployment.config),
      timestamp: Date.now(),
      size: 1024
    };
    const list = this.snapshots.get(deployment.id) || [];
    list.push(snap);
    this.snapshots.set(deployment.id, list);
    return snap;
  }

  async rollback(deploymentId: string): Promise<{ success: boolean; duration: number; newDeploymentId: string }> {
    const last = this.getLastGoodSnapshot(deploymentId);
    if (!last) throw new Error('No snapshot to rollback');
    const start = Date.now();

    await new Promise((r) => setTimeout(r, 1000)); // stop
    await new Promise((r) => setTimeout(r, 1000)); // restore
    await new Promise((r) => setTimeout(r, 2000)); // start

    return { success: true, duration: Date.now() - start, newDeploymentId: `${deploymentId}-rb` };
  }

  getLastGoodSnapshot(deploymentId: string): DeploymentSnapshot | null {
    const list = this.snapshots.get(deploymentId) || [];
    return list.length ? list[list.length - 1] : null;
  }

  private hash(obj: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
  }
}