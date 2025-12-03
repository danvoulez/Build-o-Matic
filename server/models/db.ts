import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/buildomatic';

export const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
});

export async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        template_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        configuration JSONB NOT NULL,
        deployment_type VARCHAR(50),
        deployment_url VARCHAR(500),
        subscription_id VARCHAR(255),
        billing_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        deployed_at TIMESTAMP,
        last_active TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS deployments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
        status VARCHAR(50),
        logs TEXT,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
        stripe_payment_id VARCHAR(255),
        amount INTEGER NOT NULL,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } finally {
    client.release();
  }
}