import { Resend } from "resend";
import type { EmailProvider, SendEmailOptions, SendEmailResult } from "./types";

/**
 * Best for: Production environments with high deliverability requirements
 *
 * Features:
 * - Native React Email support (no HTML conversion needed)
 * - High deliverability rates
 * - Built-in analytics dashboard
 */
export class ResendProvider implements EmailProvider {
  readonly name = "resend" as const;
  private readonly client: Resend;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Resend API key is required");
    }
    this.client = new Resend(apiKey);
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: options.from!,
        to: options.to,
        subject: options.subject,
        react: options.react,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
      });

      if (error) {
        return {
          success: false,
          error: new Error(error.message),
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }
}
