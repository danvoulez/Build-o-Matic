import { Pool } from 'pg';
export class PostgresAdapter {
    constructor(cfg) {
        this.cfg = cfg;
        this.id = 'db:postgres';
        this.pool = null;
    }
    async init() {
        this.pool = new Pool({
            connectionString: this.cfg.connectionString,
            ssl: this.cfg.ssl ? { rejectUnauthorized: false } : undefined,
            max: this.cfg.max ?? 10,
        });
        const client = await this.pool.connect();
        client.release();
    }
    async close() {
        await this.pool?.end();
        this.pool = null;
    }
    async query(sql, params = []) {
        if (!this.pool)
            throw new Error('Postgres adapter not initialized');
        const res = await this.pool.query(sql, params);
        return { rows: res.rows };
    }
    async transaction(fn) {
        if (!this.pool)
            throw new Error('Postgres adapter not initialized');
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const txDb = {
                id: this.id,
                init: async () => { },
                close: async () => { },
                query: async (sql, params) => {
                    const res = await client.query(sql, params);
                    return { rows: res.rows };
                },
                transaction: async (fn2) => fn2(txDb),
            };
            const result = await fn(txDb);
            await client.query('COMMIT');
            return result;
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
}
