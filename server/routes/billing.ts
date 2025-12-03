import { Router } from 'express';
import { BillingClient } from '../../billing/stripe-client';
import { attachSubscriptionId, setSubscriptionStatus } from '../../billing/subscriptions';

export function billingRouter() {
  const router = Router();
  const client = new BillingClient(process.env.STRIPE_API_KEY || '');

  // Create a subscription for a tool (MVP assumes priceId known in frontend or server config)
  router.post('/subscribe', async (req, res) => {
    try {
      const { userId, toolId, email, paymentMethodId, priceId } = req.body || {};
      if (!userId || !toolId || !email || !paymentMethodId || !priceId) {
        return res.status(400).json({ ok: false, error: 'Missing required fields' });
      }
      const sub = await client.createSubscription({ userId, toolId, email, paymentMethodId, priceId });
      await attachSubscriptionId(toolId, sub.subscriptionId);
      await setSubscriptionStatus(toolId, sub.status === 'active' ? 'active' : 'trial');
      res.json({ ok: true, subscription: sub });
    } catch (e: any) {
      res.status(400).json({ ok: false, error: e?.message ?? 'Subscription error' });
    }
  });

  // Stripe webhook endpoint — expects raw body; ensure express.json raw body handling if needed
  router.post('/webhook', async (req, res) => {
    try {
      // In production, use raw body and proper middleware; here we use text if configured
      const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const sig = req.headers['stripe-signature'] as string;
      const result = await client.handleWebhook(payload, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
      // Map some statuses to subscription state updates if metadata present
      // Implement inside stripe-client when event includes toolId metadata
      res.json({ ok: true, result });
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  return router;
}