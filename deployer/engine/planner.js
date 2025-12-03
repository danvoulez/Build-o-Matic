/**
 * DeploymentPlanner — Stage 1: Validation & Planning (~2s)
 */
export class DeploymentPlanner {
    async plan(tool, target) {
        const start = Date.now();
        const validation = await this.validateTool(tool);
        if (!validation.valid)
            throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
        const capacity = await this.checkCapacity(target, tool.requirements || target.requirements);
        if (!capacity.available)
            throw new Error(`Insufficient capacity: ${capacity.reason}`);
        const plan = await this.generatePlan(tool, target);
        // eslint-disable-next-line no-console
        console.log(`Planning completed in ${Date.now() - start}ms`);
        return plan;
    }
    async validateTool(tool) {
        const errors = [];
        if (!tool.monitoring?.health_check)
            errors.push('Missing health_check');
        if (!tool.config?.env)
            errors.push('Missing env');
        if (!tool.artifacts?.docker_image && !tool.artifacts?.dockerfile)
            errors.push('Missing container artifact');
        return { valid: errors.length === 0, errors };
    }
    async checkCapacity(target, req) {
        // MVP: assume capacity unless absurd memory/cpu
        const cpuOk = !!req.cpu;
        const memOk = !!req.memory;
        return { available: cpuOk && memOk, reason: cpuOk && memOk ? undefined : 'cpu/memory invalid' };
    }
    async generatePlan(tool, target) {
        const steps = [
            { name: 'Create Network', duration: 500, target: 'network' },
            { name: 'Provision Compute', duration: 1500, target: 'compute' },
            { name: 'Deploy Container', duration: 1000, target: 'container' },
            { name: 'Configure Routing', duration: 500, target: 'routing' },
            { name: 'Verify Deployment', duration: 500, target: 'verification' }
        ];
        const rollbackSteps = [{ name: 'Stop Service', duration: 500, target: 'compute' }, { name: 'Remove Routing', duration: 500, target: 'routing' }];
        return {
            id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            target: target.type,
            steps,
            estimatedDuration: steps.reduce((sum, s) => sum + s.duration, 0),
            rollbackSteps
        };
    }
}
