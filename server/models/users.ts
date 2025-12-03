import { pool } from './db';

export type User = {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
};

export async function getOrCreateUserByEmail(email: string, name?: string): Promise<User> {
  const client = await pool.connect();
  try {
    const existing = await client.query<User>('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return existing.rows[0];

    const inserted = await client.query<User>(
      'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
      [email, name || null]
    );
    return inserted.rows[0];
  } finally {
    client.release();
  }
}