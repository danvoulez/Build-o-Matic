import type { EmailAdapter } from '../index';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export type SESConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  from: string;
};

export class SESEmailAdapter implements EmailAdapter {
  id = 'email:ses';
  private client: SESClient | null = null;

  constructor(private cfg: SESConfig) {}

  async init(): Promise<void> {
    this.client = new SESClient({
      region: this.cfg.region,
      credentials: {
        accessKeyId: this.cfg.accessKeyId,
        secretAccessKey: this.cfg.secretAccessKey,
      },
    });
  }

  async close(): Promise<void> {
    this.client = null;
  }

  async send(to: string, subject: string, html: string, text?: string): Promise<{ id: string }> {
    if (!this.client) throw new Error('SES adapter not initialized');
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
    return { id: res.MessageId! };
  }
}