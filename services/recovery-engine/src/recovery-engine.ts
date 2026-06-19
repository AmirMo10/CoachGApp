import { AssessmentInput, RecoveryResult } from '@coachg/types';
import { clamp, round } from '@coachg/shared';

/**
 * Recovery engine: computes a recovery score and recommendations from the
 * athlete's sleep/recovery/stress self-report and training frequency.
 * Pure rule logic — the deload recommendation feeds back into periodization.
 */

/** Hydration baseline: 35 ml per kg bodyweight, +0.5 L per training session/week. */
function hydrationTarget(weightKg: number, trainingFrequency: number): number {
  const base = (weightKg * 35) / 1000;
  return round(base + trainingFrequency * 0.25, 1);
}

/** Sleep target scales up with training load and down with good recovery. */
function sleepTarget(trainingFrequency: number, recoveryQuality: number): number {
  let hours = 7.5;
  if (trainingFrequency >= 5) hours += 0.5;
  if (recoveryQuality <= 4) hours += 0.5;
  return clamp(round(hours, 1), 7, 9);
}

/**
 * Recovery score 0-100 from sleep quality, recovery quality and (inverse) stress.
 * Each self-report is 1-10.
 */
export function calcRecoveryScore(assessment: AssessmentInput): number {
  const sleep = assessment.sleepQuality * 10; // 0-100
  const recovery = assessment.recoveryQuality * 10;
  const stress = (10 - assessment.stressLevel) * 10; // inverted
  const score = sleep * 0.4 + recovery * 0.4 + stress * 0.2;
  return clamp(Math.round(score), 0, 100);
}

const MOBILITY_LIBRARY: Record<string, string[]> = {
  default: [
    "World's greatest stretch x5/side",
    'Cat-cow x10',
    '90/90 hip switches x10/side',
    'Thoracic rotations x10/side',
  ],
  knee: ['Couch stretch 60s/side', 'Ankle dorsiflexion drill x10/side', 'Terminal knee extensions'],
  shoulder: ['Band pull-aparts x15', 'Wall slides x10', 'Sleeper stretch 30s/side'],
  back: ['Cat-cow x10', 'Bird-dog x8/side', 'Dead bug x8/side'],
};

function mobilityRoutine(restrictions: string[]): string[] {
  const routine = new Set(MOBILITY_LIBRARY.default);
  for (const r of restrictions.map((s) => s.toLowerCase())) {
    const extra = MOBILITY_LIBRARY[r];
    if (extra) extra.forEach((m) => routine.add(m));
  }
  return [...routine];
}

export function generateRecoveryPlan(assessment: AssessmentInput): RecoveryResult {
  const recoveryScore = calcRecoveryScore(assessment);
  const deloadRecommended = recoveryScore < 50 || assessment.stressLevel >= 8;

  const recommendations: string[] = [];
  if (assessment.sleepQuality <= 5)
    recommendations.push('Prioritise sleep hygiene: consistent bedtime, dark/cool room, no screens 1h pre-bed.');
  if (assessment.stressLevel >= 7)
    recommendations.push('Add daily 10-min breathing/down-regulation work to manage stress load.');
  if (deloadRecommended)
    recommendations.push('Recovery is low — schedule a deload or reduce volume ~40% this week.');
  if (recommendations.length === 0)
    recommendations.push('Recovery markers are solid — maintain current sleep, hydration and stress management.');

  return {
    sleepTargetHours: sleepTarget(assessment.trainingFrequency, assessment.recoveryQuality),
    hydrationLiters: hydrationTarget(assessment.weightKg, assessment.trainingFrequency),
    mobilityRoutine: mobilityRoutine([...assessment.injuries, ...assessment.mobilityRestrictions]),
    recoveryScore,
    deloadRecommended,
    recommendations,
  };
}
