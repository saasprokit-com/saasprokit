import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
  SMTPConfig,
} from "./types";

/**
 * Best for: Local development, self-hosted SMTP, or custom mail servers
 *
 * Features:
 * - Works with any SMTP server
 * - No external API dependencies
 * - Perfect for local development with Maildev
 * - Connection pooling support
 */
export class NodemailerProvider implements EmailProvider {
  readonly name = "nodemailer" as const;
  private readonly transporter: Mail;

  constructor(config: SMTPConfig) {
    const transportOptions = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      pool: config.pool,
      auth: config.user
        ? {
            user: config.user,
            pass: config.pass,
          }
        : undefined,
      // Disable TLS verification for local development
      tls:
        config.host === "localhost" ? { rejectUnauthorized: false } : undefined,
    };
    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      // Convert React Email component to HTML string
      const html = await render(options.react);
      const text = await render(options.react, { plainText: true });

      const info = await this.transporter.sendMail({
        from: options.from,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html,
        text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }

  /**
   * Useful for health checks
   */
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  close(): void {
    this.transporter.close();
  }
}
