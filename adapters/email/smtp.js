import nodemailer from 'nodemailer';
export class SMTPEmailAdapter {
    constructor(cfg) {
        this.cfg = cfg;
        this.id = 'email:smtp';
        this.transporter = null;
    }
    async init() {
        this.transporter = nodemailer.createTransport({
            host: this.cfg.host,
            port: this.cfg.port ?? 587,
            secure: this.cfg.secure ?? false,
            auth: { user: this.cfg.user, pass: this.cfg.pass },
        });
        await this.transporter.verify();
    }
    async close() {
        // nodemailer has no explicit close for SMTP; noop
        this.transporter = null;
    }
    async send(to, subject, html, text) {
        if (!this.transporter)
            throw new Error('SMTP adapter not initialized');
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
