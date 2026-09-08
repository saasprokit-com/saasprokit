import { cn } from "@repo/design-system/lib/utils";
import type { UIMessage } from "ai";
import Image from "next/image";

const IMAGE_SIZE = 512;

interface MessageBubbleProps {
  message: UIMessage;
}

type ImagePart = Extract<UIMessage["parts"][number], { type: "file" }>;

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
  const images = message.parts.filter(
    (part): part is ImagePart =>
      part.type === "file" && part.mediaType.startsWith("image/")
  );

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] space-y-2 rounded-lg px-4 py-2 text-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {text ? <p className="whitespace-pre-wrap">{text}</p> : null}
        {images.map((part) => (
          <Image
            alt={part.filename ?? "Generated image"}
            className="rounded-md"
            height={IMAGE_SIZE}
            key={part.url}
            src={part.url}
            unoptimized
            width={IMAGE_SIZE}
          />
        ))}
      </div>
    </div>
  );
}
