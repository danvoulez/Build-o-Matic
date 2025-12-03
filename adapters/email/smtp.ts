import type { EmailAdapter } from '../index';
import nodemailer from 'nodemailer';

export type SMTPConfig = {
  host: string;
  port?: number;
  secure?: boolean;
  user: string;
  pass: string;
  from?: string;
};

export class SMTPEmailAdapter implements EmailAdapter {
  id = 'email:smtp';
  private transporter: nodemailer.Transporter | null = null;

  constructor(private cfg: SMTPConfig) {}

  async init(): Promise<void> {
    this.transporter = nodemailer.createTransport({
      host: this.cfg.host,
      port: this.cfg.port ?? 587,
      secure: this.cfg.secure ?? false,
      auth: { user: this.cfg.user, pass: this.cfg.pass },
    });
    await this.transporter.verify();
  }

  async close(): Promise<void> {
    // nodemailer has no explicit close for SMTP; noop
    this.transporter = null;
  }

  async send(to: string, subject: string, html: string, text?: string): Promise<{ id: string }> {
    if (!this.transporter) throw new Error('SMTP adapter not initialized');
    const info = await this.transporter.sendMail({
      from: this.cfg.from ?? this.cfg.user,
      to,
      subject,
      text,
      html,
    });
    return { id: info.messageId };
  }
}