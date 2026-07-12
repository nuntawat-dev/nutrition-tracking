import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-5";

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic();
  }
  return _client;
}

/**
 * Call Claude with a JSON-schema-constrained response and return the parsed
 * object. Uses the raw `output_config.format` path (structured outputs), which
 * guarantees the first content block is text containing schema-valid JSON.
 */
export async function generateJSON<T = unknown>(params: {
  system?: string;
  content: string | Anthropic.ContentBlockParam[];
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const message = await anthropic().messages.create({
    model: MODEL,
    max_tokens: params.maxTokens ?? 2048,
    ...(params.system ? { system: params.system } : {}),
    output_config: { format: { type: "json_schema", schema: params.schema } },
    messages: [{ role: "user", content: params.content }],
  });

  if (message.stop_reason === "refusal") {
    throw new Error("The model declined to respond to this request.");
  }

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("The model did not return text output.");
  }
  return JSON.parse(textBlock.text) as T;
}
