import twilio from 'twilio';
export class TwilioSmsAdapter {
    constructor(cfg) {
        this.cfg = cfg;
        this.id = 'sms:twilio';
        this.client = null;
    }
    async init() {
        this.client = twilio(this.cfg.accountSid, this.cfg.authToken);
    }
    async close() {
        this.client = null;
    }
    async send(to, body) {
        if (!this.client)
            throw new Error('Twilio adapter not initialized');
        const msg = await this.client.messages.create({ to, from: this.cfg.from, body });
        return { sid: msg.sid };
    }
}
