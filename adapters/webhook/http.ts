import type { WebhookAdapter } from '../index';
import axios, { AxiosInstance } from 'axios';

export type HttpWebhookConfig = {
  baseUrl: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

export class HttpWebhookAdapter implements WebhookAdapter {
  id = 'webhook:http';
  private client: AxiosInstance | null = null;
  constructor(private cfg: HttpWebhookConfig) {}

  async init(): Promise<void> {
    this.client = axios.create({
      baseURL: this.cfg.baseUrl,
      headers: this.cfg.headers,
      timeout: this.cfg.timeoutMs ?? 10000,
    });
  }

  async close(): Promise<void> {
    this.client = null;
  }

  async send(event: string, payload: Record<string, any>): Promise<{ ok: boolean; status: number }> {
    if (!this.client) throw new Error('HTTP webhook adapter not initialized');
    const res = await this.client.post(`/events/${encodeURIComponent(event)}`, payload);
    return { ok: res.status >= 200 && res.status < 300, status: res.status };
  }
}