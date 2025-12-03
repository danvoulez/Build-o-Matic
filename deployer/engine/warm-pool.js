/**
 * WarmPool — Pre-warmed resource pool manager for instant allocation.
 */
export class WarmPool {
    constructor(maxSize, factory, preWarmPercent = 0.1) {
        this.pool = [];
        this.maxSize = maxSize;
        this.factory = factory;
        this.optimalSize = Math.floor(maxSize * 0.5);
        this.preWarm(Math.floor(maxSize * preWarmPercent)).catch(() => { });
    }
    async preWarm(count) {
        for (let i = 0; i < count; i++) {
            const res = await this.factory();
            this.pool.push(res);
        }
    }
    async take() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return await this.factory();
    }
    release(resource) {
        if (this.pool.length < this.maxSize) {
            this.pool.push(resource);
        }
        else {
            // drop
        }
    }
    async maintain() {
        while (this.pool.length < this.optimalSize) {
            const res = await this.factory();
            this.pool.push(res);
        }
        while (this.pool.length > this.optimalSize) {
            this.pool.pop();
        }
    }
    get available() {
        return this.pool.length;
    }
}
