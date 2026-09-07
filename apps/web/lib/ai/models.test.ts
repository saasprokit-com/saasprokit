import { describe, expect, it } from "vitest";
import { chatRequestSchema, MAX_PROMPT_LENGTH } from "./models";

const valid = {
  id: "conv_1",
  modelId: "anthropic:claude-opus-5",
  message: {
    id: "msg_1",
    role: "user",
    parts: [{ type: "text", text: "hello", state: "done" }],
  },
};

describe("chatRequestSchema", () => {
  it("accepts a user text message and strips unknown part fields", () => {
    const result = chatRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.message.parts[0]).toEqual({ type: "text", text: "hello" });
  });

  it("rejects unknown models, assistant messages, empty text and oversized prompts", () => {
    expect(chatRequestSchema.safeParse({ ...valid, modelId: "openai:gpt-3" }).success).toBe(false);
    expect(
      chatRequestSchema.safeParse({ ...valid, message: { ...valid.message, role: "assistant" } }).success
    ).toBe(false);
    expect(
      chatRequestSchema.safeParse({ ...valid, message: { ...valid.message, parts: [{ type: "text", text: "" }] } }).success
    ).toBe(false);
    expect(
      chatRequestSchema.safeParse({
        ...valid,
        message: { ...valid.message, parts: [{ type: "text", text: "x".repeat(MAX_PROMPT_LENGTH + 1) }] },
      }).success
    ).toBe(false);
  });
});
