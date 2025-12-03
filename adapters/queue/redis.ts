import type { QueueAdapter } from '../index';
import Redis from 'ioredis';

export type RedisQueueConfig = {
  url: string;
  prefix?: string;
};

export class RedisQueueAdapter implements QueueAdapter {
  id = 'queue:redis';
  private redis: Redis | null = null;
  private prefix: string;

  constructor(private cfg: RedisQueueConfig) {
    this.prefix = cfg.prefix ?? 'bom';
  }

  async init(): Promise<void> {
    this.redis = new Redis(this.cfg.url);
    await this.redis.ping();
  }

  async close(): Promise<void> {
    await this.redis?.quit();
    this.redis = null;
  }

  async enqueue(queue: string, message: Record<string, any>, options?: { delay?: number }): Promise<void> {
    if (!this.redis) throw new Error('Redis adapter not initialized');
    const key = `${this.prefix}:queue:${queue}`;
    const payload = JSON.stringify({ message, at: Date.now(), delay: options?.delay ?? 0 });
    await this.redis.lpush(key, payload);
  }

  async process(queue: string, handler: (msg: any) => Promise<void>): Promise<void> {
    if (!this.redis) throw new Error('Redis adapter not initialized');
    const key = `${this.prefix}:queue:${queue}`;
    // Basic loop (replace with BullMQ for production)
    const redis = this.redis;
    (async function loop() {
      while (true) {
        const item = await redis.rpop(key);
        if (!item) {
          await new Promise((r) => setTimeout(r, 250));
          continue;
        }
        try {
          const obj = JSON.parse(item);
          const delay = obj?.delay ?? 0;
          if (delay > 0) await new Promise((r) => setTimeout(r, delay));
          await handler(obj.message);
        } catch (e) {
          // swallow errors for MVP; add DLQ in production
        }
      }
    })();
  }
}