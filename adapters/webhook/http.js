import axios from 'axios';
export class HttpWebhookAdapter {
    constructor(cfg) {
        this.cfg = cfg;
        this.id = 'webhook:http';
        this.client = null;
    }
    async init() {
        this.client = axios.create({
            baseURL: this.cfg.baseUrl,
            headers: this.cfg.headers,
            timeout: this.cfg.timeoutMs ?? 10000,
        });
    }
    async close() {
        this.client = null;
    }
    async send(event, payload) {
        if (!this.client)
            throw new Error('HTTP webhook adapter not initialized');
        const res = await this.client.post(`/events/${encodeURIComponent(event)}`, payload);
        return { ok: res.status >= 200 && res.status < 300, status: res.status };
    }
}
