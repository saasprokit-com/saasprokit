import "server-only";

import { getPlanLimits } from "@repo/auth/plans";
import { database, type Prisma } from "@repo/database";
import { type PlanLimits, UNLIMITED } from "@repo/utils/payment";
import type { UIMessage } from "ai";
import { getCurrentPlanForOrg } from "@/lib/billing/subscription-queries";

const MAX_LISTED_CONVERSATIONS = 50;

const storedMessageSelect = {
  id: true,
  role: true,
  parts: true,
} satisfies Prisma.AiMessageSelect;

export function toUIMessage(
  row: Prisma.AiMessageGetPayload<{ select: typeof storedMessageSelect }>
): UIMessage {
  return {
    id: row.id,
    role: row.role as UIMessage["role"],
    parts: JSON.parse(row.parts) as UIMessage["parts"],
  };
}

export function titleOf(messages: Pick<UIMessage, "parts">[]): string | null {
  const part = messages[0]?.parts.find(
    (candidate) => candidate.type === "text"
  );
  return part ? part.text : null;
}

export interface ConversationListItem {
  id: string;
  title: string | null;
  updatedAt: Date;
}

export async function listConversations(
  organizationId: string,
  userId: string
): Promise<ConversationListItem[]> {
  const rows = await database.aiConversation.findMany({
    where: { organizationId, userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      updatedAt: true,
      messages: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: storedMessageSelect,
      },
    },
    take: MAX_LISTED_CONVERSATIONS,
  });
  return rows.map(({ messages, ...row }) => ({
    ...row,
    title: titleOf(messages.map(toUIMessage)),
  }));
}

export interface OwnedConversation {
  id: string;
  messages: UIMessage[];
  organizationId: string;
}

export async function getOwnedConversation(
  conversationId: string,
  userId: string
): Promise<OwnedConversation | null> {
  const conversation = await database.aiConversation.findFirst({
    where: { id: conversationId, userId },
    select: {
      id: true,
      organizationId: true,
      messages: { orderBy: { createdAt: "asc" }, select: storedMessageSelect },
    },
  });
  return (
    conversation && {
      ...conversation,
      messages: conversation.messages.map(toUIMessage),
    }
  );
}

export interface MonthlyAiUsage {
  imageCount: number;
  totalTokens: number;
}

export async function getMonthlyAiUsage(
  organizationId: string,
  now: Date = new Date()
): Promise<MonthlyAiUsage> {
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const { _sum } = await database.aiUsage.aggregate({
    where: { organizationId, createdAt: { gte: monthStart } },
    _sum: { totalTokens: true, imageCount: true },
  });
  return {
    totalTokens: _sum.totalTokens ?? 0,
    imageCount: _sum.imageCount ?? 0,
  };
}

export type AiUsageKind = "chat" | "image";

export interface AiQuotaStatus {
  limits: Pick<PlanLimits, "maxAiTokensPerMonth" | "maxAiImagesPerMonth">;
  usage: MonthlyAiUsage;
}

export async function getAiQuotaStatus(
  organizationId: string
): Promise<AiQuotaStatus> {
  const [usage, planName] = await Promise.all([
    getMonthlyAiUsage(organizationId),
    getCurrentPlanForOrg(organizationId),
  ]);
  const { maxAiTokensPerMonth, maxAiImagesPerMonth } = getPlanLimits(planName);
  return { usage, limits: { maxAiTokensPerMonth, maxAiImagesPerMonth } };
}

export function isWithinAiQuota(
  status: AiQuotaStatus,
  kind: AiUsageKind
): boolean {
  const used =
    kind === "image" ? status.usage.imageCount : status.usage.totalTokens;
  const max =
    kind === "image"
      ? status.limits.maxAiImagesPerMonth
      : status.limits.maxAiTokensPerMonth;
  return max === UNLIMITED || used < max;
}
