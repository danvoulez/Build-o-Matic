import { Pool, PoolClient } from 'pg';
import type { DbAdapter } from '../index';

export type PostgresConfig = {
  connectionString: string;
  ssl?: boolean;
  max?: number;
};

export class PostgresAdapter implements DbAdapter {
  id = 'db:postgres';
  private pool: Pool | null = null;

  constructor(private cfg: PostgresConfig) {}

  async init(): Promise<void> {
    this.pool = new Pool({
      connectionString: this.cfg.connectionString,
      ssl: this.cfg.ssl ? { rejectUnauthorized: false } : undefined,
      max: this.cfg.max ?? 10,
    });
    const client = await this.pool.connect();
    client.release();
  }

  async close(): Promise<void> {
    await this.pool?.end();
    this.pool = null;
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> {
    if (!this.pool) throw new Error('Postgres adapter not initialized');
    const res = await this.pool.query<T>(sql, params);
    return { rows: res.rows };
  }

  async transaction<T>(fn: (db: DbAdapter) => Promise<T>): Promise<T> {
    if (!this.pool) throw new Error('Postgres adapter not initialized');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const txDb: DbAdapter = {
        id: this.id,
        init: async () => {},
        close: async () => {},
        query: async <R>(sql: string, params?: any[]) => {
          const res = await client.query<R>(sql, params);
          return { rows: res.rows };
        },
        transaction: async <R>(fn2: (db2: DbAdapter) => Promise<R>) => fn2(txDb),
      };
      const result = await fn(txDb);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}