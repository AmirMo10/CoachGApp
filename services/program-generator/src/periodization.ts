import { PeriodizationModel, ProgramPhase } from '@coachg/types';
import { clamp, round } from '@coachg/shared';

/**
 * Periodization engine: builds the week skeleton (phase, volume & intensity
 * multipliers, deload flags) for a given model and duration. Pure rule logic.
 */
export interface WeekSkeleton {
  weekIndex: number;
  phase: ProgramPhase;
  volumeMultiplier: number;
  intensityMultiplier: number;
  isDeload: boolean;
}

/** Every 4th week is a deload (lower volume, slightly lower intensity). */
function isDeloadWeek(weekIndex: number, durationWeeks: number): boolean {
  // 1-indexed weeks; deload at weeks 4, 8, 12 ... but never the very first week
  if (durationWeeks < 4) return false;
  return weekIndex % 4 === 0;
}

export function buildPeriodization(
  model: PeriodizationModel,
  durationWeeks: number,
): WeekSkeleton[] {
  const weeks: WeekSkeleton[] = [];

  for (let i = 1; i <= durationWeeks; i++) {
    const deload = isDeloadWeek(i, durationWeeks);
    let volume = 1;
    let intensity = 1;
    let phase: ProgramPhase = ProgramPhase.ACCUMULATION;

    const progress = durationWeeks > 1 ? (i - 1) / (durationWeeks - 1) : 0;

    switch (model) {
      case PeriodizationModel.LINEAR:
        // volume decreases, intensity increases over the block
        volume = round(1.15 - 0.35 * progress, 2);
        intensity = round(0.85 + 0.25 * progress, 2);
        phase = progress < 0.5 ? ProgramPhase.ACCUMULATION : ProgramPhase.INTENSIFICATION;
        break;

      case PeriodizationModel.BLOCK: {
        // 3 blocks: accumulation -> intensification -> realization
        const third = i / durationWeeks;
        if (third <= 1 / 3) {
          phase = ProgramPhase.ACCUMULATION;
          volume = 1.15;
          intensity = 0.85;
        } else if (third <= 2 / 3) {
          phase = ProgramPhase.INTENSIFICATION;
          volume = 1.0;
          intensity = 1.0;
        } else {
          phase = ProgramPhase.REALIZATION;
          volume = 0.8;
          intensity = 1.1;
        }
        break;
      }

      case PeriodizationModel.UNDULATING:
        // weekly wave: alternate higher-volume / higher-intensity weeks
        if (i % 2 === 1) {
          volume = 1.1;
          intensity = 0.9;
          phase = ProgramPhase.ACCUMULATION;
        } else {
          volume = 0.9;
          intensity = 1.1;
          phase = ProgramPhase.INTENSIFICATION;
        }
        break;
    }

    if (deload) {
      phase = ProgramPhase.DELOAD;
      volume = round(volume * 0.6, 2);
      intensity = round(intensity * 0.9, 2);
    }

    weeks.push({
      weekIndex: i,
      phase,
      volumeMultiplier: clamp(volume, 0.4, 1.3),
      intensityMultiplier: clamp(intensity, 0.7, 1.2),
      isDeload: deload,
    });
  }

  return weeks;
}
