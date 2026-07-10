/**
 * Maildev REST API helper for E2E tests.
 *
 * Maildev runs at http://localhost:1080 (web UI) and captures
 * all SMTP emails sent to localhost:1025.
 *
 * @see https://github.com/maildev/maildev
 */

const MAILDEV_URL = process.env.MAILDEV_URL || "http://localhost:1080";
const MAILDEV_USER = process.env.MAILDEV_USER || "admin";
const MAILDEV_PASS = process.env.MAILDEV_PASS || "admin";
const AVAILABILITY_TIMEOUT_MS = 2000;
const HREF_RE = /href="([^"]+)"/g;
const AMP_RE = /&amp;/g;

/** Build fetch headers with basic auth if credentials are set */
function authHeaders(): HeadersInit {
  const credentials = btoa(`${MAILDEV_USER}:${MAILDEV_PASS}`);
  return { Authorization: `Basic ${credentials}` };
}

export interface MaildevEmail {
  from: { address: string; name: string }[];
  headers: Record<string, string>;
  html: string;
  id: string;
  subject: string;
  text: string;
  time: string;
  to: { address: string; name: string }[];
}

/** Clear all emails from Maildev inbox */
export async function clearInbox(): Promise<void> {
  await fetch(`${MAILDEV_URL}/api/email/all`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

/** Get all emails from Maildev inbox */
export async function getAllEmails(): Promise<MaildevEmail[]> {
  const res = await fetch(`${MAILDEV_URL}/api/email`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Maildev GET /api/email failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Wait for an email to arrive for a specific recipient.
 * Polls Maildev every 500ms until timeout.
 */
export async function waitForEmail(
  recipientEmail: string,
  options: {
    /** Subject substring to match (case-insensitive) */
    subjectContains?: string;
    /** Max time to wait in ms (default: 15s) */
    timeout?: number;
    /** Poll interval in ms (default: 500ms) */
    interval?: number;
  } = {}
): Promise<MaildevEmail> {
  const { subjectContains, timeout = 15_000, interval = 500 } = options;
  const deadline = Date.now() + timeout;
  const normalizedRecipient = recipientEmail.toLowerCase();

  while (Date.now() < deadline) {
    const emails = await getAllEmails();
    const found = emails.find((email) => {
      const toMatch = email.to.some(
        (t) => t.address.toLowerCase() === normalizedRecipient
      );
      if (!toMatch) {
        return false;
      }
      if (subjectContains) {
        return email.subject
          .toLowerCase()
          .includes(subjectContains.toLowerCase());
      }
      return true;
    });

    if (found) {
      return found;
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(
    `No email found for "${recipientEmail}"${subjectContains ? ` with subject containing "${subjectContains}"` : ""} within ${timeout}ms`
  );
}

/**
 * Extract all URLs from email HTML body.
 * Returns URLs that match the given pattern (substring match).
 */
export function extractUrls(email: MaildevEmail, pattern?: string): string[] {
  const urls: string[] = [];
  const source = email.html || email.text;

  for (const m of source.matchAll(HREF_RE)) {
    // Decode HTML entities (e.g. &amp; → &)
    const url = m[1].replace(AMP_RE, "&");
    if (!pattern || url.includes(pattern)) {
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Wait for an email and extract the first URL matching a pattern.
 * Common patterns: "reset-password", "magic-link", "verify-email"
 */
export async function waitForEmailLink(
  recipientEmail: string,
  urlPattern: string,
  options?: {
    subjectContains?: string;
    timeout?: number;
  }
): Promise<{ email: MaildevEmail; url: string }> {
  const email = await waitForEmail(recipientEmail, options);
  const urls = extractUrls(email, urlPattern);

  if (urls.length === 0) {
    throw new Error(
      `No URL matching "${urlPattern}" found in email to "${recipientEmail}". ` +
        `Subject: "${email.subject}". URLs found: ${extractUrls(email).join(", ") || "none"}`
    );
  }

  return { email, url: urls[0] };
}

/** Check if Maildev is running and accessible */
export async function isMaildevAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${MAILDEV_URL}/api/email`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(AVAILABILITY_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}
