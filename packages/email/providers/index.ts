import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { keys } from "../keys";

const env = keys();

export interface SendEmailOptions {
  from?: string;
  react: ReactElement;
  subject: string;
  to: string | string[];
}

export interface SendEmailResult {
  error?: Error;
  messageId?: string;
  success: boolean;
}

let resendClient: Resend | undefined;

async function sendViaResend(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY environment variable is required for Resend provider"
    );
  }
  resendClient ??= new Resend(apiKey);

  try {
    const { data, error } = await resendClient.emails.send({
      from: options.from!,
      to: options.to,
      subject: options.subject,
      react: options.react,
    });

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

let transporter: Mail | undefined;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const transportOptions = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    pool: env.SMTP_POOL,
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
    tls:
      env.SMTP_HOST === "localhost" ? { rejectUnauthorized: false } : undefined,
  };
  transporter = nodemailer.createTransport(transportOptions);

  return transporter;
}

async function sendViaNodemailer(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    const html = await render(options.react);
    const text = await render(options.react, { plainText: true });

    const info = await getTransporter().sendMail({
      from: options.from,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html,
      text,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const provider =
    env.EMAIL_PROVIDER ??
    (process.env.NODE_ENV === "production" && env.RESEND_API_KEY
      ? "resend"
      : "nodemailer");

  return provider === "resend"
    ? sendViaResend(options)
    : sendViaNodemailer(options);
}
