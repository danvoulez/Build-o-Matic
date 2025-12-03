/**
 * Secure Stripe webhook route using raw body parsing.
 */
import { Router } from 'express';
import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../logger';
import { setSubscriptionStatus } from '../../billing/subscriptions';

export function stripeWebhookRouter() {
  if (!config.stripeApiKey || !config.stripeWebhookSecret) {
    logger.warn('Stripe not configured; webhook route disabled');
  }
  const stripe = new Stripe(config.stripeApiKey || '', { apiVersion: '2023-10-16' });
  const router = Router();

  // IMPORTANT: use raw body for signature verification
  router.post(
    '/webhook',
    require('body-parser').raw({ type: 'application/json' }),
    async (req, res) => {
      if (!config.stripeWebhookSecret) {
        return res.status(200).json({ ok: true, skipped: true });
      }
      const sig = req.headers['stripe-signature'] as string;
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
      } catch (err: any) {
        logger.error('stripe:webhook:invalid-signature', { error: err.message });
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        switch (event.type) {
          case 'payment_intent.succeeded': {
            const pi = event.data.object as Stripe.PaymentIntent;
            const toolId = (pi.metadata && pi.metadata.toolId) || '';
            if (toolId) await setSubscriptionStatus(toolId, 'active');
            logger.info('stripe:payment_succeeded', { toolId });
            break;
          }
          case 'invoice.payment_failed': {
            const inv = event.data.object as Stripe.Invoice;
            const toolId = (inv.metadata && inv.metadata.toolId) || '';
            if (toolId) await setSubscriptionStatus(toolId, 'past_due');
            logger.warn('stripe:payment_failed', { toolId });
            break;
          }
          case 'customer.subscription.deleted': {
            const sub = event.data.object as Stripe.Subscription;
            const toolId = (sub.metadata && (sub.metadata as any).toolId) || '';
            if (toolId) await setSubscriptionStatus(toolId, 'canceled');
            logger.warn('stripe:subscription_deleted', { toolId });
            break;
          }
          default:
            // ignore
            break;
        }
        res.json({ received: true });
      } catch (e: any) {
        logger.error('stripe:webhook:handler_error', { error: e.message });
        res.status(500).json({ ok: false, error: e.message });
      }
    }
  );

  return router;
}