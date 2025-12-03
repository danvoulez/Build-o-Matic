import sgMail from '@sendgrid/mail';
export class SendGridEmailAdapter {
    constructor(cfg) {
        this.cfg = cfg;
        this.id = 'email:sendgrid';
    }
    async init() {
        sgMail.setApiKey(this.cfg.apiKey);
    }
    async close() { }
    async send(to, subject, html, text) {
        const [res] = await sgMail.send({
            to,
            from: this.cfg.from || 'no-reply@example.com',
            subject,
            html,
            text,
        });
        const msgId = res.headers['x-message-id'] || res.headers['x-sendgrid-message-id'] || '';
        return { id: Array.isArray(msgId) ? msgId[0] : msgId };
    }
}
