import type { ReactElement } from "react";

/**
 * Options for sending an email
 */
export interface SendEmailOptions {
  /** BCC recipients */
  bcc?: string[];
  /** CC recipients */
  cc?: string[];
  /** Sender email address */
  from?: string;
  /** React Email component to render */
  react: ReactElement;
  /** Reply-to email address */
  replyTo?: string;
  /** Email subject line */
  subject: string;
  /** Recipient email address(es) */
  to: string | string[];
}

/**
 * Result of sending an email
 */
export interface SendEmailResult {
  /** Error if sending failed */
  error?: Error;
  /** Message ID from the provider */
  messageId?: string;
  /** Whether the email was sent successfully */
  success: boolean;
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
  pass?: string;
  pool?: boolean;
  port: number;
  secure: boolean;
  user?: string;
}
