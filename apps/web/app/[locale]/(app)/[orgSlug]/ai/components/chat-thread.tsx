"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@repo/design-system/components/ui/toggle-group";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ImageIcon, MessageSquare, SendHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import type { AiModelOption } from "@/lib/ai/models";
import type { AiQuotaStatus } from "@/lib/ai/queries";
import { API_ROUTES } from "@/lib/routes";
import { generateImageAction } from "../actions";
import { MessageBubble } from "./message-bubble";
import { UsageMeter } from "./usage-meter";

type ComposerMode = "chat" | "image";

interface ChatThreadProps {
  canGenerateImages: boolean;
  chatModels: AiModelOption[];
  conversationId: string;
  initialMessages: UIMessage[];
  organizationId: string;
  orgSlug: string;
  quota: AiQuotaStatus;
}

export function ChatThread({
  canGenerateImages,
  chatModels,
  conversationId,
  initialMessages,
  organizationId,
  orgSlug,
  quota,
}: ChatThreadProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ComposerMode>("chat");
  const [chatModelId, setChatModelId] = useState(chatModels[0]?.id ?? "");
  const [input, setInput] = useState("");
  const [isGenerating, startTransition] = useTransition();

  const { messages, sendMessage, setMessages, status, error } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: API_ROUTES.AI_CHAT,
      prepareSendMessagesRequest: ({ id, messages: outgoing, body }) => ({
        body: { id, message: outgoing.at(-1), ...body },
      }),
    }),
    onFinish: () => router.refresh(),
  });

  const isStreaming = status === "submitted" || status === "streaming";
  const busy = isStreaming || isGenerating;
  const canChat = chatModels.length > 0;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) {
      return;
    }
    setInput("");

    if (mode === "image") {
      startTransition(async () => {
        const result = await generateImageAction({
          organizationId,
          orgSlug,
          conversationId,
          prompt: text,
        });
        startTransition(() => {
          if (result.success && result.data) {
            const generated = result.data.messages;
            setMessages((previous) => [...previous, ...generated]);
            router.refresh();
          }
        });
        if (!result.success) {
          toast.error(result.error ?? "Something went wrong");
        }
      });
      return;
    }

    sendMessage({ text }, { body: { modelId: chatModelId } });
  }

  if (!(canChat || canGenerateImages)) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-muted-foreground text-sm">
        No AI provider is configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY
        and restart the app.
      </p>
    );
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col gap-4">
      <UsageMeter quota={quota} />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-lg border p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isStreaming ? (
          <p className="text-muted-foreground text-xs">Thinking…</p>
        ) : null}
        {error ? (
          <p className="text-destructive text-sm">{error.message}</p>
        ) : null}
      </div>

      <form className="space-y-2" onSubmit={onSubmit}>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            onValueChange={(value) => value && setMode(value as ComposerMode)}
            type="single"
            value={mode}
            variant="outline"
          >
            <ToggleGroupItem aria-label="Chat" disabled={!canChat} value="chat">
              <MessageSquare className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              aria-label="Generate image"
              disabled={!canGenerateImages}
              value="image"
            >
              <ImageIcon className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          {mode === "chat" ? (
            <Select
              disabled={busy}
              onValueChange={setChatModelId}
              value={chatModelId}
            >
              <SelectTrigger aria-label="Chat model" className="w-48">
                <SelectValue placeholder="Chat model" />
              </SelectTrigger>
              <SelectContent>
                {chatModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Textarea
            disabled={busy}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={
              mode === "image"
                ? "Describe the image to generate…"
                : "Send a message…"
            }
            rows={2}
            value={input}
          />
          <Button
            aria-label="Send"
            disabled={busy || !input.trim()}
            size="icon"
            type="submit"
          >
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
