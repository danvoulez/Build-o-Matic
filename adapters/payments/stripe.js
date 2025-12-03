import Stripe from 'stripe';
export class StripePaymentsAdapter {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.id = 'payments:stripe';
        this.stripe = null;
    }
    async init() {
        this.stripe = new Stripe(this.apiKey, { apiVersion: '2023-10-16' });
    }
    async close() { }
    async createCustomer(email) {
        if (!this.stripe)
            throw new Error('Stripe adapter not initialized');
        const customer = await this.stripe.customers.create({ email });
        return { id: customer.id };
    }
    async createSubscription(customerId, priceId, toolId) {
        if (!this.stripe)
            throw new Error('Stripe adapter not initialized');
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
