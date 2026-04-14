import type { StreamFn } from "@mariozechner/pi-agent-core";
import type { Context, Model } from "@mariozechner/pi-ai";
import { createAssistantMessageEventStream } from "@mariozechner/pi-ai";
import { describe, expect, it } from "vitest";
import {
  createOpenRouterWrapper,
  createVolcengineThinkingOffWrapper,
  shouldApplyVolcengineThinkingOffCompat,
} from "./proxy-stream-wrappers.js";

describe("proxy stream wrappers", () => {
  it("adds OpenRouter attribution headers to stream options", () => {
    const calls: Array<{ headers?: Record<string, string> }> = [];
    const baseStreamFn: StreamFn = (_model, _context, options) => {
      calls.push({
        headers: options?.headers,
      });
      return createAssistantMessageEventStream();
    };

    const wrapped = createOpenRouterWrapper(baseStreamFn);
    const model = {
      api: "openai-completions",
      provider: "openrouter",
      id: "openrouter/auto",
    } as Model<"openai-completions">;
    const context: Context = { messages: [] };

    void wrapped(model, context, { headers: { "X-Custom": "1" } });

    expect(calls).toEqual([
      {
        headers: {
          "HTTP-Referer": "https://openclaw.ai",
          "X-OpenRouter-Title": "OpenClaw",
          "X-OpenRouter-Categories": "cli-agent",
          "X-Custom": "1",
        },
      },
    ]);
  });

  describe("shouldApplyVolcengineThinkingOffCompat", () => {
    it("returns true for volcengine with thinking=off", () => {
      expect(
        shouldApplyVolcengineThinkingOffCompat({ provider: "volcengine", thinkingLevel: "off" }),
      ).toBe(true);
    });

    it("returns false for volcengine without thinking=off", () => {
      expect(
        shouldApplyVolcengineThinkingOffCompat({ provider: "volcengine", thinkingLevel: "high" }),
      ).toBe(false);
      expect(shouldApplyVolcengineThinkingOffCompat({ provider: "volcengine" })).toBe(false);
    });

    it("returns false for non-volcengine providers", () => {
      expect(
        shouldApplyVolcengineThinkingOffCompat({ provider: "openai", thinkingLevel: "off" }),
      ).toBe(false);
      expect(
        shouldApplyVolcengineThinkingOffCompat({ provider: "openrouter", thinkingLevel: "off" }),
      ).toBe(false);
    });
  });

  it("removes reasoning_effort when thinking=off for Volcengine", () => {
    const captured: { payload: Record<string, unknown> } = {
      payload: { reasoning_effort: "high" },
    };
    const model = {
      api: "openai-completions",
      provider: "volcengine",
      id: "volcengine-plan/ark-code-latest",
    } as Model<"openai-completions">;
    const baseStreamFn: StreamFn = (_m, _ctx, options) => {
      options?.onPayload?.(captured.payload, model);
      return createAssistantMessageEventStream();
    };

    const wrapped = createVolcengineThinkingOffWrapper(baseStreamFn, "off");
    const context: Context = { messages: [] };

    void wrapped(model, context, {});

    expect(captured.payload).not.toHaveProperty("reasoning_effort");
  });
});
