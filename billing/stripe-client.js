/**
 * Stripe Billing Client
 */
import Stripe from 'stripe';
export class BillingClient {
    constructor(apiKey) {
        this.stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });
    }
    async createSubscription(params) {
        const customer = await this.stripe.customers.create({
            email: params.email,
            payment_method: params.paymentMethodId,
            invoice_settings: { default_payment_method: params.paymentMethodId },
            metadata: { userId: params.userId, toolId: params.toolId },
        });
        const subscription = await this.stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: params.priceId }],
            expand: ['latest_invoice.payment_intent'],
            metadata: { userId: params.userId, toolId: params.toolId },
        });
        return {
            subscriptionId: subscription.id,
            customerId: customer.id,
            status: subscription.status,
        };
    }
    async cancelSubscription(subscriptionId) {
        await this.stripe.subscriptions.cancel(subscriptionId);
    }
    async handleWebhook(payload, signature, webhookSecret) {
        const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        switch (event.type) {
            case 'payment_intent.succeeded':
                // TODO: Mark tool as active
                break;
            case 'payment_intent.payment_failed':
            case 'invoice.payment_failed':
                // TODO: Notify user and pause tool
                break;
            case 'customer.subscription.deleted':
                // TODO: Deactivate tool
                break;
            default:
                // ignore others for now
                break;
        }
        return { ok: true };
    }
}
