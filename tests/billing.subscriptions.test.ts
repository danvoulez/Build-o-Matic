import { describe, it, expect } from 'vitest';
import { setSubscriptionStatus, getSubscription, attachSubscriptionId } from '../billing/subscriptions';
import { migrate } from '../server/models/db';
import { createTool } from '../server/models/tools';
import { getOrCreateUserByEmail } from '../server/models/users';

describe('Billing Subscriptions', () => {
  it('sets and retrieves subscription status and id', async () => {
    await migrate();
    const user = await getOrCreateUserByEmail('bill@example.com');
    const tool = await createTool({
      user_id: user.id,
      template_id: 'gdpr-compliance',
      name: 'Billing Tool',
      status: 'generating',
      configuration: { features: ['consent-tracking'] },
      deployment_type: null,
      deployment_url: null,
      subscription_id: null,
      billing_status: 'trial',
    });

    await setSubscriptionStatus(tool.id, 'active');
    await attachSubscriptionId(tool.id, 'sub_123');

    const sub = await getSubscription(tool.id);
    expect(sub.subscription_id).toBe('sub_123');
    expect(sub.billing_status).toBe('active');
  });
});