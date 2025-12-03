import type { Adapter } from '../index';
import Stripe from 'stripe';

export interface PaymentsAdapter extends Adapter {
  createCustomer(email: string): Promise<{ id: string }>;
  createSubscription(customerId: string, priceId: string, toolId: string): Promise<{ id: string; status: string }>;
}

export class StripePaymentsAdapter implements PaymentsAdapter {
  id = 'payments:stripe';
  private stripe: Stripe | null = null;

  constructor(private apiKey: string) {}

  async init(): Promise<void> {
    this.stripe = new Stripe(this.apiKey, { apiVersion: '2023-10-16' });
  }

  async close(): Promise<void> {}

  async createCustomer(email: string): Promise<{ id: string }> {
    if (!this.stripe) throw new Error('Stripe adapter not initialized');
    const customer = await this.stripe.customers.create({ email });
    return { id: customer.id };
  }

  async createSubscription(customerId: string, priceId: string, toolId: string): Promise<{ id: string; status: string }> {
    if (!this.stripe) throw new Error('Stripe adapter not initialized');
    const sub = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: { toolId },
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    return { id: sub.id, status: sub.status };
  }
}