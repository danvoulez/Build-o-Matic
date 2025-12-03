import { pool } from './db';

export type Tool = {
  id: string;
  user_id: string;
  template_id: string;
  name: string;
  status: 'generating' | 'deployed' | 'active' | 'suspended';
  configuration: Record<string, any>;
  deployment_type?: string;
  deployment_url?: string;
  subscription_id?: string;
  billing_status?: string;
  realm_id?: string; // UBL Realm ID
  created_at?: string;
  deployed_at?: string;
  last_active?: string;
};

export async function createTool(tool: Omit<Tool, 'id'>): Promise<Tool> {
  const client = await pool.connect();
  try {
    const res = await client.query<Tool>(
      `INSERT INTO tools (user_id, template_id, name, status, configuration, deployment_type, deployment_url, subscription_id, billing_status, realm_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        tool.user_id,
        tool.template_id,
        tool.name,
        tool.status,
        tool.configuration,
        tool.deployment_type || null,
        tool.deployment_url || null,
        tool.subscription_id || null,
        tool.billing_status || null,
        tool.realm_id || null,
      ]
    );
    return res.rows[0];
  } finally {
    client.release();
  }
}

export async function listToolsByUser(userId: string): Promise<Tool[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<Tool>('SELECT * FROM tools WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function getTool(id: string): Promise<Tool | null> {
  const client = await pool.connect();
  try {
    const res = await client.query<Tool>('SELECT * FROM tools WHERE id = $1', [id]);
    return res.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function updateToolStatus(id: string, status: Tool['status']): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('UPDATE tools SET status = $1, last_active = NOW() WHERE id = $2', [status, id]);
  } finally {
    client.release();
  }
}

export async function setToolDeployment(id: string, deploymentType: string, url?: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE tools SET deployment_type = $1, deployment_url = $2, deployed_at = NOW() WHERE id = $3',
      [deploymentType, url || null, id]
    );
  } finally {
    client.release();
  }
}

export async function setToolRealmId(id: string, realmId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('UPDATE tools SET realm_id = $1 WHERE id = $2', [realmId, id]);
  } finally {
    client.release();
  }
}