/**
 * Simple Stripe gate for generation:
 * - Checks if `X-Subscription-Active` header is present or a mock flag in env
 * - In production, query your DB for subscription status keyed by userId/toolId
 */
import { Router } from 'express';

export function gateRouter() {
  const router = Router();

  router.post('/check', async (req, res) => {
    try {
      const activeHeader = req.headers['x-subscription-active'];
      const bypass = process.env.BILLING_BYPASS === 'true';
      const { userId, toolId } = req.body || {};

      if (bypass) {
        return res.json({ ok: true, active: true, reason: 'BILLING_BYPASS enabled' });
      }

      if (!userId || !toolId) {
        return res.status(400).json({ ok: false, error: 'userId and toolId required' });
      }

      if (activeHeader === 'true') {
        return res.json({ ok: true, active: true });
      }

      // TODO: lookup subscription by userId/toolId in your database
      // For now, deny
      return res.json({ ok: true, active: false });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message ?? 'Gate check failed' });
    }
  });

  return router;
}