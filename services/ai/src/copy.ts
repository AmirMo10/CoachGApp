import { AiClient } from './client';

/**
 * AI copy helpers for the report/messaging surfaces. Every function returns
 * usable text even when AI is disabled or fails — the deterministic fallback
 * keeps the product fully functional and prevents hallucinations from blocking.
 *
 * None of these compute training/nutrition numbers; they only phrase rationale
 * and narrative around values produced by the deterministic engines.
 */

const REPORT_SYSTEM = `You are an elite strength & conditioning coach writing concise, professional copy
for a premium client report. You receive already-computed facts. Explain and motivate; never invent
numbers, exercises, or medical claims. Output plain prose, 2-4 sentences per section.`;

export interface ReportNarrativeInput {
  clientName: string;
  goal?: string;
  sport?: string;
  experience?: string;
  programName?: string;
}

export interface ReportNarrative {
  goalAnalysis: string;
  performanceAnalysis: string;
}

export async function writeReportNarrative(
  ai: AiClient,
  input: ReportNarrativeInput,
): Promise<ReportNarrative> {
  const fallback = fallbackNarrative(input);
  if (!ai.isEnabled()) return fallback;
  try {
    const prompt = `Write two short sections for ${input.clientName}.
Facts: goal=${input.goal ?? 'general fitness'}, sport=${input.sport ?? 'none'}, experience=${input.experience ?? 'intermediate'}, program=${input.programName ?? 'n/a'}.
Return JSON: {"goalAnalysis": "...", "performanceAnalysis": "..."}`;
    const raw = await ai.complete(REPORT_SYSTEM, prompt, { cacheableSystem: true });
    const json = extractJson(raw);
    if (json && typeof json.goalAnalysis === 'string' && typeof json.performanceAnalysis === 'string') {
      return { goalAnalysis: json.goalAnalysis, performanceAnalysis: json.performanceAnalysis };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function fallbackNarrative(input: ReportNarrativeInput): ReportNarrative {
  const sport = input.sport && input.sport !== 'NONE' ? ` for ${input.sport.toLowerCase()}` : '';
  return {
    goalAnalysis: `${input.clientName}'s primary goal is ${(input.goal ?? 'general fitness').toLowerCase().replace(/_/g, ' ')}${sport}. The plan is structured to progress toward this goal while respecting the athlete's experience level and any constraints captured at assessment.`,
    performanceAnalysis: `Programming prioritises the qualities that transfer most to this goal, with volume and intensity sequenced across the block and recovery managed via planned deloads. Consistent execution and logging will let the coach fine-tune the plan over time.`,
  };
}

export async function writeShortNote(
  ai: AiClient,
  system: string,
  prompt: string,
  fallback: string,
): Promise<string> {
  if (!ai.isEnabled()) return fallback;
  try {
    const text = await ai.complete(system, prompt, { cacheableSystem: true });
    return text || fallback;
  } catch {
    return fallback;
  }
}

const MESSAGE_SYSTEM = `You are helping a fitness coach draft a brief, warm, professional reply to a client
message. Keep it under 80 words. Do not give medical advice. Do not invent specific numbers.`;

/** Draft a suggested coach reply to the latest client message. Never persisted automatically. */
export async function draftMessageReply(
  ai: AiClient,
  clientName: string,
  lastMessage: string,
): Promise<{ draft: string; aiGenerated: boolean }> {
  const fallback = `Thanks for the update, ${clientName.split(' ')[0]}. I've noted this — keep logging your sessions and I'll review your progress and adjust the plan as needed. Reach out any time.`;
  if (!ai.isEnabled()) return { draft: fallback, aiGenerated: false };
  try {
    const draft = await ai.complete(
      MESSAGE_SYSTEM,
      `Client ${clientName} wrote: "${lastMessage}". Draft the coach's reply.`,
      { cacheableSystem: true },
    );
    return draft ? { draft, aiGenerated: true } : { draft: fallback, aiGenerated: false };
  } catch {
    return { draft: fallback, aiGenerated: false };
  }
}

function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}
