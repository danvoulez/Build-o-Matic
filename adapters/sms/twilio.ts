import type { Adapter } from '../index';
import twilio from 'twilio';

export interface SmsAdapter extends Adapter {
  send(to: string, body: string): Promise<{ sid: string }>;
}

export type TwilioConfig = {
  accountSid: string;
  authToken: string;
  from: string;
};

export class TwilioSmsAdapter implements SmsAdapter {
  id = 'sms:twilio';
  private client: ReturnType<typeof twilio> | null = null;

  constructor(private cfg: TwilioConfig) {}

  async init(): Promise<void> {
    this.client = twilio(this.cfg.accountSid, this.cfg.authToken);
  }

  async close(): Promise<void> {
    this.client = null;
  }

  async send(to: string, body: string): Promise<{ sid: string }> {
    if (!this.client) throw new Error('Twilio adapter not initialized');
    const msg = await this.client.messages.create({ to, from: this.cfg.from, body });
    return { sid: msg.sid };
  }
}