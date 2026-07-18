import { config } from "../config.mjs";
import { logInfo, logError } from "../logger.mjs";
import { composeMockAnswer } from "./mockComposer.mjs";

// AI2-01: cloud LLM provider abstraction.
// Supports a real OpenAI /chat/completions compatible endpoint (model name,
// API key, timeout, retry, streaming) and an offline deterministic mock that
// grounds its answers on retrieval context so the demo runs with no API key.

class LlmError extends Error {
  constructor(message, { statusCode = 502, code = "LLM_ERROR" } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status) {
  return status === 429 || (status >= 500 && status <= 599);
}

/**
 * Real provider for any OpenAI Chat Completions compatible API.
 * Works with OpenAI, DeepSeek, Qwen/DashScope compatible mode, Moonshot, etc.
 */
class OpenAiCompatibleProvider {
  constructor(options) {
    this.name = "openai";
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.timeoutMs = options.timeoutMs;
    this.maxRetries = options.maxRetries;
    this.defaultTemperature = options.temperature;

    if (!this.apiKey) {
      // Surface a clear, actionable error instead of a vague network failure.
      throw new LlmError(
        "LLM_API_KEY is missing. Set LLM_PROVIDER=mock for offline demo, or provide LLM_API_KEY.",
        { statusCode: 500, code: "LLM_API_KEY_MISSING" }
      );
    }
  }

  buildBody({ messages, temperature, maxTokens, stream }) {
    const body = {
      model: this.model,
      messages: messages.map((item) => ({ role: item.role, content: item.content })),
      stream: Boolean(stream)
    };

    // GPT-5-family Chat Completions models use max_completion_tokens. Omitting
    // temperature also supports reasoning variants with fixed sampling.
    if (/^gpt-5(?:[.-]|$)/i.test(this.model)) {
      body.max_completion_tokens = maxTokens ?? 700;
    } else {
      body.temperature = temperature ?? this.defaultTemperature;
      body.max_tokens = maxTokens ?? 700;
    }

    return body;
  }

  async request(body, { signal } = {}) {
    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      const onAbort = () => controller.abort();
      if (signal) {
        signal.addEventListener("abort", onAbort, { once: true });
      }

      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          if (isRetryable(response.status) && attempt < this.maxRetries) {
            lastError = new LlmError(`LLM upstream ${response.status}: ${detail.slice(0, 200)}`);
            await sleep(300 * (attempt + 1));
            continue;
          }
          throw new LlmError(`LLM upstream ${response.status}: ${detail.slice(0, 200)}`, {
            statusCode: 502,
            code: "LLM_UPSTREAM_ERROR"
          });
        }

        return response;
      } catch (error) {
        if (error instanceof LlmError && error.code === "LLM_UPSTREAM_ERROR") {
          throw error;
        }
        lastError = error;
        const aborted = error.name === "AbortError";
        if (attempt < this.maxRetries && !(signal && signal.aborted)) {
          await sleep(300 * (attempt + 1));
          continue;
        }
        throw new LlmError(
          aborted ? `LLM request timed out after ${this.timeoutMs}ms.` : `LLM request failed: ${error.message}`,
          { statusCode: 504, code: aborted ? "LLM_TIMEOUT" : "LLM_NETWORK_ERROR" }
        );
      } finally {
        clearTimeout(timer);
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
      }
    }

    throw lastError || new LlmError("LLM request failed after retries.");
  }

  async complete({ messages, temperature, maxTokens, signal }) {
    const body = this.buildBody({ messages, temperature, maxTokens, stream: false });
    const response = await this.request(body, { signal });
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content?.trim() || "";
    return {
      text,
      model: payload?.model || this.model,
      provider: this.name,
      usage: payload?.usage || null
    };
  }

  async *stream({ messages, temperature, maxTokens, signal }) {
    const body = this.buildBody({ messages, temperature, maxTokens, stream: true });
    const response = await this.request(body, { signal });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) {
          continue;
        }
        const data = trimmed.slice("data:".length).trim();
        if (data === "[DONE]") {
          return;
        }
        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content;
          if (delta) {
            yield delta;
          }
        } catch {
          // ignore malformed keep-alive lines
        }
      }
    }
  }
}

/**
 * Offline deterministic provider. Composes a grounded, guide-style answer from
 * the retrieval context carried in `meta`, so the whole RAG loop works without
 * any cloud dependency. Streaming yields the composed text sentence by sentence.
 */
class MockProvider {
  constructor() {
    this.name = "mock";
    this.model = "lingshan-mock-1";
  }

  async complete({ meta }) {
    const text = composeMockAnswer(meta || {});
    return {
      text,
      model: this.model,
      provider: this.name,
      usage: null
    };
  }

  async *stream(options) {
    const { text } = await this.complete(options);
    // Split into speakable segments so first-sentence latency stays low (V4-11).
    const segments = text.split(/(?<=[。！？\n])/).filter((part) => part.trim());
    for (const segment of segments) {
      yield segment;
      await sleep(12);
    }
  }
}

let cachedProvider = null;
let cachedKey = "";

export function getLlmProvider() {
  const key = `${config.llm.provider}:${config.llm.model}:${config.llm.baseUrl}`;
  if (cachedProvider && cachedKey === key) {
    return cachedProvider;
  }

  const useMockFallback = config.demoMode && (!config.llm.apiKey || config.llm.provider === "mock");
  const provider = config.llm.provider === "openai" && !useMockFallback
    ? new OpenAiCompatibleProvider(config.llm)
    : new MockProvider();

  logInfo("llm provider ready", { provider: provider.name, model: provider.model });
  cachedProvider = provider;
  cachedKey = key;
  return provider;
}

/**
 * Non-streaming completion with a hard failure surface.
 * `meta` carries structured grounding used by the mock provider and ignored by
 * real providers (which read `messages`).
 */
export async function llmComplete({ messages, meta, temperature, maxTokens, signal }) {
  const provider = getLlmProvider();
  try {
    return await provider.complete({ messages, meta, temperature, maxTokens, signal });
  } catch (error) {
    logError("llm complete failed", { provider: provider.name, error: error.message });
    throw error;
  }
}

export async function* llmStream({ messages, meta, temperature, maxTokens, signal }) {
  const provider = getLlmProvider();
  yield* provider.stream({ messages, meta, temperature, maxTokens, signal });
}

export { LlmError };
