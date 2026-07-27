import { env } from "@/lib/env";

const address = env.EMAIL_FROM.match(/<([^>]+)>/)?.[1] ?? env.EMAIL_FROM;

export const SUPPORT_EMAIL_HREF = `mailto:${address}`;
