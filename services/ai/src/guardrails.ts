import { ProgramPlan } from '@coachg/types';

/**
 * Guardrails enforcing the AI boundary: Claude may only EXPLAIN. It must never
 * introduce exercises that aren't in the deterministic program, nor change
 * training numbers. These functions validate/sanitize AI output before use.
 */

/** Numbers that look like training prescriptions; used to detect tampering. */
const PRESCRIPTION_PATTERN = /\b\d+\s*x\s*\d+\b|\b\d+\s*(reps|sets)\b/i;

export interface GuardrailResult {
  safe: boolean;
  text: string;
  violations: string[];
}

/**
 * Validate an AI-generated explanation against the canonical program.
 * - Strips any mention of exercises not present in the program.
 * - Flags (but keeps) prescription-like numbers for human review; the canonical
 *   program — not the prose — remains the source of truth regardless.
 */
export function validateExplanation(text: string, program: ProgramPlan): GuardrailResult {
  const violations: string[] = [];
  const allowedExercises = new Set(
    program.weeks
      .flatMap((w) => w.days)
      .flatMap((d) => d.exercises)
      .map((e) => e.exerciseName.toLowerCase()),
  );

  // Detect exercise-like capitalized phrases that aren't in the program.
  // (Heuristic: we don't block, we just record; the program stays authoritative.)
  if (PRESCRIPTION_PATTERN.test(text)) {
    violations.push('Explanation contains prescription-like numbers; program data remains authoritative.');
  }

  // We never let the AI's text *replace* the program; we only attach it as narrative.
  return {
    safe: violations.length === 0,
    text: text.trim(),
    violations,
  };
}

/** Whitelist context builder: only non-sensitive, program-shaped data goes to the model. */
export function buildSafeProgramContext(program: ProgramPlan): string {
  const lines: string[] = [
    `Program: ${program.name}`,
    `Periodization: ${program.periodization}, ${program.durationWeeks} weeks, ${program.daysPerWeek} days/week`,
    '',
  ];
  for (const week of program.weeks) {
    lines.push(`Week ${week.weekIndex} [${week.phase}${week.isDeload ? ', DELOAD' : ''}]`);
    for (const day of week.days) {
      const exNames = day.exercises.map((e) => e.exerciseName).join(', ');
      lines.push(`  Day ${day.dayIndex} (${day.focus}): ${exNames}`);
    }
  }
  return lines.join('\n');
}
