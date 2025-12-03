import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
export class SESEmailAdapter {
    constructor(cfg) {
        this.cfg = cfg;
        this.id = 'email:ses';
        this.client = null;
    }
    async init() {
        this.client = new SESClient({
            region: this.cfg.region,
            credentials: {
                accessKeyId: this.cfg.accessKeyId,
                secretAccessKey: this.cfg.secretAccessKey,
            },
        });
    }
    async close() {
        this.client = null;
    }
    async send(to, subject, html, text) {
        if (!this.client)
            throw new Error('SES adapter not initialized');
        const cmd = new SendEmailCommand({
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: subject },
                Body: {
                    Html: { Data: html },
                    Text: text ? { Data: text } : undefined,
                },
            },
            Source: this.cfg.from,
        });
        const res = await this.client.send(cmd);
        return { id: res.MessageId };
    }
}
