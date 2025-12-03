/**
 * WarmPool — Pre-warmed resource pool manager for instant allocation.
 */
export class WarmPool<T> {
  private pool: T[] = [];
  private maxSize: number;
  private factory: () => Promise<T>;
  private optimalSize: number;

  constructor(maxSize: number, factory: () => Promise<T>, preWarmPercent = 0.1) {
    this.maxSize = maxSize;
    this.factory = factory;
    this.optimalSize = Math.floor(maxSize * 0.5);
    this.preWarm(Math.floor(maxSize * preWarmPercent)).catch(() => {});
  }

  private async preWarm(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      const res = await this.factory();
      this.pool.push(res);
    }
  }

  async take(): Promise<T> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return await this.factory();
  }

  release(resource: T): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(resource);
    } else {
      // drop
    }
  }

  async maintain(): Promise<void> {
    while (this.pool.length < this.optimalSize) {
      const res = await this.factory();
      this.pool.push(res);
    }
    while (this.pool.length > this.optimalSize) {
      this.pool.pop();
    }
  }

  get available(): number {
    return this.pool.length;
  }
}