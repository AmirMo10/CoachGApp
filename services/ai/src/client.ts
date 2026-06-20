import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';

export interface AiConfig {
  apiKey: string;
  /** Default to the latest capable Claude model. */
  model?: string;
  maxTokens?: number;
  /** Soft cap on total tokens per process lifetime; 0 disables the guard. */
  tokenBudget?: number;
  /** In-memory response cache TTL (ms). */
  cacheTtlMs?: number;
}

export class BudgetExceededError extends Error {}

interface CompleteOptions {
  /** Cache the system prompt server-side (Anthropic prompt caching). */
  cacheableSystem?: boolean;
  /** Skip the in-memory response cache. */
  noCache?: boolean;
}

/**
 * Wrapper around the Anthropic SDK. The AI layer is OPTIONAL: callers must
 * always have a deterministic fallback if `isEnabled()` is false or a call
 * fails/exceeds budget.
 *
 * Cost controls:
 *  - in-memory LRU-ish response cache (avoids paying for identical prompts)
 *  - a token budget guard that disables calls once exceeded
 *  - Anthropic prompt caching on reused system prompts
 */
export class AiClient {
  private readonly client?: Anthropic;
  readonly model: string;
  readonly maxTokens: number;
  private readonly tokenBudget: number;
  private readonly cacheTtlMs: number;
  private usedTokens = 0;
  private readonly cache = new Map<string, { value: string; exp: number }>();

  constructor(config: AiConfig) {
    this.model = config.model ?? 'claude-opus-4-8';
    this.maxTokens = config.maxTokens ?? 4096;
    this.tokenBudget = config.tokenBudget ?? 0;
    this.cacheTtlMs = config.cacheTtlMs ?? 60 * 60 * 1000;
    if (config.apiKey) this.client = new Anthropic({ apiKey: config.apiKey });
  }

  isEnabled(): boolean {
    return !!this.client && !this.budgetExceeded();
  }

  budgetExceeded(): boolean {
    return this.tokenBudget > 0 && this.usedTokens >= this.tokenBudget;
  }

  get tokensUsed(): number {
    return this.usedTokens;
  }

  private key(system: string, prompt: string): string {
    return createHash('sha256').update(`${this.model}\n${system}\n${prompt}`).digest('hex');
  }

  async complete(system: string, userPrompt: string, opts: CompleteOptions = {}): Promise<string> {
    if (!this.client) throw new Error('AI client not configured');
    if (this.budgetExceeded()) throw new BudgetExceededError('AI token budget exceeded');

    const cacheKey = this.key(system, userPrompt);
    if (!opts.noCache) {
      const hit = this.cache.get(cacheKey);
      if (hit && hit.exp > Date.now()) return hit.value;
    }

    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: opts.cacheableSystem
        ? [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
        : system,
      messages: [{ role: 'user', content: userPrompt }],
    });

    this.usedTokens += (res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0);

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!opts.noCache) this.cache.set(cacheKey, { value: text, exp: Date.now() + this.cacheTtlMs });
    return text;
  }
}
