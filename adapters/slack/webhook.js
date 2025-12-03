import axios from 'axios';
export class SlackWebhookAdapter {
    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl;
        this.id = 'slack:webhook';
    }
    async init() { }
    async close() { }
    async post(message) {
        const payload = {};
        if (message.blocks)
            payload.blocks = message.blocks;
        else
            payload.text = message.text;
        if (message.channel)
            payload.channel = message.channel;
        const res = await axios.post(this.webhookUrl, payload, { headers: { 'Content-Type': 'application/json' } });
        return { ok: res.status >= 200 && res.status < 300 };
    }
}
