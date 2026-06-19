import Anthropic from '@anthropic-ai/sdk';

export interface AiConfig {
  apiKey: string;
  /** Default to the latest capable Claude model. */
  model?: string;
  maxTokens?: number;
}

/**
 * Thin wrapper around the Anthropic SDK. The AI layer is OPTIONAL: callers must
 * always have a deterministic fallback if `isEnabled()` is false or a call fails.
 */
export class AiClient {
  private readonly client?: Anthropic;
  readonly model: string;
  readonly maxTokens: number;

  constructor(config: AiConfig) {
    this.model = config.model ?? 'claude-opus-4-8';
    this.maxTokens = config.maxTokens ?? 4096;
    if (config.apiKey) {
      this.client = new Anthropic({ apiKey: config.apiKey });
    }
  }

  isEnabled(): boolean {
    return !!this.client;
  }

  async complete(system: string, userPrompt: string): Promise<string> {
    if (!this.client) throw new Error('AI client not configured');
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
  }
}
