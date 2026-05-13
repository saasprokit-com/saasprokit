import type { ReactElement } from "react";

/**
 * Options for sending an email
 */
export interface SendEmailOptions {
  /** Recipient email address(es) */
  to: string | string[];
  /** Email subject line */
  subject: string;
  /** React Email component to render */
  react: ReactElement;
  /** Sender email address */
  from?: string;
  /** Reply-to email address */
  replyTo?: string;
  /** CC recipients */
  cc?: string[];
  /** BCC recipients */
  bcc?: string[];
}

/**
 * Result of sending an email
 */
export interface SendEmailResult {
  /** Whether the email was sent successfully */
  success: boolean;
  /** Message ID from the provider */
  messageId?: string;
  /** Error if sending failed */
  error?: Error;
}

/**
 * Email provider interface
 * Implementations: ResendProvider, NodemailerProvider
 */
export interface EmailProvider {
  /** Provider name for logging */
  readonly name: string;
  /** Send an email */
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}

/**
 * SMTP configuration for Nodemailer
 */
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  pool?: boolean;
}
