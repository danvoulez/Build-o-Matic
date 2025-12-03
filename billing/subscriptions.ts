/**
 * Subscriptions service to track and query subscription status for tools.
 * In MVP, we store status in the tools table and provide helper functions.
 * Later this can be expanded to a dedicated subscriptions table.
 */
import { pool } from '../server/models/db';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled';

export async function setSubscriptionStatus(toolId: string, status: SubscriptionStatus): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('UPDATE tools SET billing_status = $1 WHERE id = $2', [status, toolId]);
  } finally {
    client.release();
  }
}

export async function attachSubscriptionId(toolId: string, subscriptionId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('UPDATE tools SET subscription_id = $1 WHERE id = $2', [subscriptionId, toolId]);
  } finally {
    client.release();
  }
}

export async function getSubscription(toolId: string): Promise<{ subscription_id: string | null; billing_status: SubscriptionStatus | null }> {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT subscription_id, billing_status FROM tools WHERE id = $1', [toolId]);
    if (!res.rows.length) return { subscription_id: null, billing_status: null };
    return { subscription_id: res.rows[0].subscription_id, billing_status: res.rows[0].billing_status };
  } finally {
    client.release();
  }
}