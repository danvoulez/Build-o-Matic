import type { EmailAdapter } from '../index';
import sgMail from '@sendgrid/mail';

export type SendGridConfig = {
  apiKey: string;
  from?: string;
};

export class SendGridEmailAdapter implements EmailAdapter {
  id = 'email:sendgrid';
  constructor(private cfg: SendGridConfig) {}

  async init(): Promise<void> {
    sgMail.setApiKey(this.cfg.apiKey);
  }

  async close(): Promise<void> {}

  async send(to: string, subject: string, html: string, text?: string): Promise<{ id: string }> {
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