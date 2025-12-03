import { WarmPool } from './warm-pool';
/**
 * ResourceProvisioner — Stage 2: Resource Provisioning (~3s)
 * Uses pre-warmed resource pools when available.
 */
export class ResourceProvisioner {
    constructor() {
        this.pools = new Map();
        // Example pre-warmed pools (stubs)
        this.pools.set('ledger-cloud', new WarmPool(1000, async () => ({
            id: `lc-${Date.now()}`,
            target: 'ledger-cloud',
            controlPlaneUrl: 'https://api.ledger.cloud/control',
            config: {},
            endpoints: { external: '' }
        })));
        this.pools.set('docker', new WarmPool(50, async () => ({
            id: `dk-${Date.now()}`,
            target: 'docker',
            controlPlaneUrl: 'http://localhost:2375',
            config: {},
            endpoints: { external: 'http://localhost:3000' }
        })));
    }
    async provision(plan, target) {
        const start = Date.now();
        const fromPool = await this.allocateFromPool(plan.target);
        const resources = fromPool ?? (await this.provisionNew(plan, target));
        // eslint-disable-next-line no-console
        console.log(`Provisioning completed in ${Date.now() - start}ms`);
        return resources;
    }
    async allocateFromPool(target) {
        const pool = this.pools.get(target);
        if (!pool || pool.available === 0)
            return null;
        return await pool.take();
    }
    async provisionNew(plan, target) {
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
    async provisionLedgerCloud(_plan, _target) {
        return {
            id: `lc-${Date.now()}`,
            target: 'ledger-cloud',
            controlPlaneUrl: 'https://api.ledger.cloud/control',
            config: {},
            endpoints: { external: '' }
        };
    }
    async provisionCloud(_plan, target) {
        return {
            id: `${target.type}-${Date.now()}`,
            target: target.type,
            controlPlaneUrl: 'https://control.example.com',
            config: { region: target.config.region, project: target.config.project },
            endpoints: { external: '' }
        };
    }
    async provisionDocker(_plan, _target) {
        return {
            id: `dk-${Date.now()}`,
            target: 'docker',
            controlPlaneUrl: 'http://localhost:2375',
            config: {},
            endpoints: { external: 'http://localhost:3000' }
        };
    }
    async provisionKubernetes(_plan, target) {
        return {
            id: `k8s-${Date.now()}`,
            target: 'kubernetes',
            controlPlaneUrl: 'https://k8s.api',
            config: { namespace: target.config.namespace },
            endpoints: { external: '' }
        };
    }
}
