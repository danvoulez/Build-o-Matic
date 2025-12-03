import type { SlackAdapter } from '../index';
import axios from 'axios';

export class SlackWebhookAdapter implements SlackAdapter {
  id = 'slack:webhook';
  constructor(private webhookUrl: string) {}
  async init(): Promise<void> {}
  async close(): Promise<void> {}

  async post(message: { text: string; channel?: string; blocks?: any[] }): Promise<{ ok: boolean }> {
    const payload: any = {};
    if (message.blocks) payload.blocks = message.blocks;
    else payload.text = message.text;
    if (message.channel) payload.channel = message.channel;

    const res = await axios.post(this.webhookUrl, payload, { headers: { 'Content-Type': 'application/json' } });
    return { ok: res.status >= 200 && res.status < 300 };
  }
}