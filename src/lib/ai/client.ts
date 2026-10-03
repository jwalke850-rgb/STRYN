import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type * as z from "zod/v4";
import { doctrine } from "./doctrine";

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export class AIError extends Error {}

let client: Anthropic | undefined;
function anthropic() {
  client ??= new Anthropic();
  return client;
}

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/**
 * One structured call to Claude. The STRYN doctrine is the stable, cached
 * system prefix; the task instructions and data go in the user turn.
 */
export async function structured<S extends z.ZodType>(opts: {
  schema: S;
  task: string;
  input: string;
  effort?: Effort;
  maxTokens?: number;
}): Promise<z.infer<S>> {
  if (!aiConfigured()) {
    throw new AIError("ANTHROPIC_API_KEY is not set. Add it to .env.local to enable the Session Engine.");
  }

  let response;
  try {
    response = await anthropic().beta.messages.parse({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: opts.effort ?? "high", format: betaZodOutputFormat(opts.schema) },
      system: [{ type: "text", text: await doctrine(), cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: opts.input },
            { type: "text", text: opts.task },
          ],
        },
      ],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new AIError("Claude rejected the API key.");
    if (err instanceof Anthropic.RateLimitError) throw new AIError("Claude rate limit hit. Try again in a minute.");
    if (err instanceof Anthropic.APIError) throw new AIError(`Claude API error (${err.status ?? "network"}): ${err.message}`);
    throw err;
  }

  if (response.stop_reason === "refusal") throw new AIError("Claude declined this request.");
  if (response.stop_reason === "max_tokens") throw new AIError("Claude ran out of output room. Try shorter input.");
  if (!response.parsed_output) throw new AIError("Claude returned output that did not match the expected structure.");
  return response.parsed_output as z.infer<S>;
}
