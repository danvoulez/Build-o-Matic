import { ProvisionedResources, DeploymentPlan, DeploymentTarget } from './types';
import { WarmPool } from './warm-pool';

/**
 * ResourceProvisioner — Stage 2: Resource Provisioning (~3s)
 * Uses pre-warmed resource pools when available.
 */
export class ResourceProvisioner {
  private pools = new Map<string, WarmPool<ProvisionedResources>>();

  constructor() {
    // Example pre-warmed pools (stubs)
    this.pools.set(
      'ledger-cloud',
      new WarmPool<ProvisionedResources>(1000, async () => ({
        id: `lc-${Date.now()}`,
        target: 'ledger-cloud',
        controlPlaneUrl: 'https://api.ledger.cloud/control',
        config: {},
        endpoints: { external: '' }
      }))
    );
    this.pools.set(
      'docker',
      new WarmPool<ProvisionedResources>(50, async () => ({
        id: `dk-${Date.now()}`,
        target: 'docker',
        controlPlaneUrl: 'http://localhost:2375',
        config: {},
        endpoints: { external: 'http://localhost:3000' }
      }))
    );
  }

  async provision(plan: DeploymentPlan, target: DeploymentTarget): Promise<ProvisionedResources> {
    const start = Date.now();
    const fromPool = await this.allocateFromPool(plan.target);
    const resources = fromPool ?? (await this.provisionNew(plan, target));

    // eslint-disable-next-line no-console
    console.log(`Provisioning completed in ${Date.now() - start}ms`);
    return resources;
  }

  private async allocateFromPool(target: string): Promise<ProvisionedResources | null> {
    const pool = this.pools.get(target);
    if (!pool || pool.available === 0) return null;
    return await pool.take();
  }

  private async provisionNew(plan: DeploymentPlan, target: DeploymentTarget): Promise<ProvisionedResources> {
    switch (target.type) {
      case 'ledger-cloud':
        return await this.provisionLedgerCloud(plan, target);
      case 'aws':
      case 'azure':
      case 'gcp':
        return await this.provisionCloud(plan, target);
      case 'docker':
        return await this.provisionDocker(plan, target);
      case 'kubernetes':
        return await this.provisionKubernetes(plan, target);
      default:
        throw new Error(`Unsupported target: ${target.type}`);
    }
  }

  private async provisionLedgerCloud(_plan: DeploymentPlan, _target: DeploymentTarget): Promise<ProvisionedResources> {
    return {
      id: `lc-${Date.now()}`,
      target: 'ledger-cloud',
      controlPlaneUrl: 'https://api.ledger.cloud/control',
      config: {},
      endpoints: { external: '' }
    };
  }

  private async provisionCloud(_plan: DeploymentPlan, target: DeploymentTarget): Promise<ProvisionedResources> {
    return {
      id: `${target.type}-${Date.now()}`,
      target: target.type,
      controlPlaneUrl: 'https://control.example.com',
      config: { region: target.config.region, project: target.config.project },
      endpoints: { external: '' }
    };
  }

  private async provisionDocker(_plan: DeploymentPlan, _target: DeploymentTarget): Promise<ProvisionedResources> {
    return {
      id: `dk-${Date.now()}`,
      target: 'docker',
      controlPlaneUrl: 'http://localhost:2375',
      config: {},
      endpoints: { external: 'http://localhost:3000' }
    };
  }

  private async provisionKubernetes(_plan: DeploymentPlan, target: DeploymentTarget): Promise<ProvisionedResources> {
    return {
      id: `k8s-${Date.now()}`,
      target: 'kubernetes',
      controlPlaneUrl: 'https://k8s.api',
      config: { namespace: target.config.namespace },
      endpoints: { external: '' }
    };
  }
}