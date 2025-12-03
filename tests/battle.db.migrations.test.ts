import { describe, it, expect } from 'vitest';
import { migrate, pool } from '../server/models/db';

describe('Battle: DB Migrations', () => {
  it('runs migrations and creates tables', async () => {
    await migrate();
    const client = await pool.connect();
    try {
      const tables = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' AND table_type='BASE TABLE'
      `);
      const names = tables.rows.map((r) => r.table_name);
      expect(names).toEqual(expect.arrayContaining(['users', 'tools', 'deployments', 'transactions']));
    } finally {
      client.release();
    }
  });
});