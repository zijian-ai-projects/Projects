import type { OpenAICompatibleProviderConfig } from "@/lib/types";
import type { ChatMessage, StructuredCompletion } from "@/server/llm/provider";

type OpenAICompatibleProviderRuntimeConfig = OpenAICompatibleProviderConfig & {
  fetch?: typeof fetch;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function parseStructuredContent<T>(content: string, schemaName: string): T {
  const trimmed = content.trim();
  const normalized = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim()
    : trimmed;

  try {
    return JSON.parse(normalized) as T;
  } catch (error) {
    throw new Error(`Model response for ${schemaName} was not valid JSON`, { cause: error });
  }
}

function extractStructuredContent(payload: unknown, schemaName: string) {
  if (typeof payload !== "object" || payload === null) {
    throw new Error(`OpenAI-compatible response for ${schemaName} was not a valid object`);
  }

  const choices = (payload as ChatCompletionResponse).choices;
  const content = choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error(`OpenAI-compatible response for ${schemaName} was missing message content`);
  }

  return content;
}

export function createOpenAICompatibleProvider<T>({
  baseUrl,
  apiKey,
  model,
  fetch: fetchImpl = fetch
}: OpenAICompatibleProviderRuntimeConfig): StructuredCompletion<T> {
  const chatCompletionsUrl = baseUrl.endsWith("/")
    ? `${baseUrl}chat/completions`
    : `${baseUrl}/chat/completions`;

  return {
    async complete(messages: ChatMessage[], schemaName: string) {
      const response = await fetchImpl(chatCompletionsUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: "json_object" },
          metadata: { schemaName }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI-compatible request failed with status ${response.status}`, {
          cause: {
            status: response.status,
            statusText: response.statusText,
            url: chatCompletionsUrl,
            schemaName
          }
        });
      }

      const payload = (await response.json()) as unknown;
      const content = extractStructuredContent(payload, schemaName);

      return parseStructuredContent<T>(content, schemaName);
    }
  };
}
