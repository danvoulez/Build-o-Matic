import Redis from 'ioredis';
export class RedisQueueAdapter {
    constructor(cfg) {
        this.cfg = cfg;
        this.id = 'queue:redis';
        this.redis = null;
        this.prefix = cfg.prefix ?? 'bom';
    }
    async init() {
        this.redis = new Redis(this.cfg.url);
        await this.redis.ping();
    }
    async close() {
        await this.redis?.quit();
        this.redis = null;
    }
    async enqueue(queue, message, options) {
        if (!this.redis)
            throw new Error('Redis adapter not initialized');
        const key = `${this.prefix}:queue:${queue}`;
        const payload = JSON.stringify({ message, at: Date.now(), delay: options?.delay ?? 0 });
        await this.redis.lpush(key, payload);
    }
    async process(queue, handler) {
        if (!this.redis)
            throw new Error('Redis adapter not initialized');
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
                    if (delay > 0)
                        await new Promise((r) => setTimeout(r, delay));
                    await handler(obj.message);
                }
                catch (e) {
                    // swallow errors for MVP; add DLQ in production
                }
            }
        })();
    }
}
