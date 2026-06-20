import { Gender } from '@coachg/types';
import { round } from '@coachg/shared';

/**
 * Mifflin-St Jeor BMR. When body-fat % is provided we prefer Katch-McArdle,
 * which is more accurate for lean/athletic populations.
 */
export function calcBmr(params: {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  age: number;
  bodyFatPct?: number;
}): number {
  const { gender, weightKg, heightCm, age, bodyFatPct } = params;

  if (bodyFatPct != null) {
    // Katch-McArdle: 370 + 21.6 * lean body mass (kg)
    const leanMass = weightKg * (1 - bodyFatPct / 100);
    return round(370 + 21.6 * leanMass, 0);
  }

  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const sexConstant = gender === Gender.MALE ? 5 : gender === Gender.FEMALE ? -161 : -78;
  return round(base + sexConstant, 0);
}

export function calcTdee(bmr: number, activityMultiplier: number): number {
  return round(bmr * activityMultiplier, 0);
}
