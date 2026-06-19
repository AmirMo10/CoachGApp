import { MEDICAL_DISCLAIMER } from '@coachg/shared';

/**
 * Bloodwork analysis engine (Module 9).
 *
 * IMPORTANT: This engine provides EDUCATIONAL insights and coaching/nutrition
 * suggestions only. It NEVER diagnoses disease and always attaches a medical
 * disclaimer. All logic is deterministic — Claude may rephrase the insight text
 * but may not invent values, flags, or medical claims.
 */

export type BloodMarkerType =
  | 'FASTING_GLUCOSE'
  | 'HBA1C'
  | 'HDL'
  | 'LDL'
  | 'TRIGLYCERIDES'
  | 'VITAMIN_D'
  | 'TESTOSTERONE'
  | 'FERRITIN';

export type MarkerFlag = 'LOW' | 'NORMAL' | 'HIGH';

export interface MarkerInput {
  type: BloodMarkerType;
  value: number;
  /** Optional caller-supplied reference range; otherwise defaults are used. */
  referenceLow?: number;
  referenceHigh?: number;
}

export interface MarkerInsight {
  type: BloodMarkerType;
  value: number;
  unit: string;
  referenceLow: number;
  referenceHigh: number;
  flag: MarkerFlag;
  insight: string;
  disclaimer: string;
}

/**
 * Conventional adult reference ranges with units. These are general educational
 * defaults; a lab's own ranges (passed via MarkerInput) always take precedence.
 */
const REFERENCE: Record<
  BloodMarkerType,
  { unit: string; low: number; high: number; lowMsg: string; highMsg: string; normalMsg: string }
> = {
  FASTING_GLUCOSE: {
    unit: 'mg/dL',
    low: 70,
    high: 99,
    lowMsg:
      'Below the typical fasting range. Consider meal timing and carbohydrate distribution around training; discuss with a healthcare professional.',
    highMsg:
      'Above the typical fasting range. Emphasise whole-food carbohydrate sources, fibre, and post-meal activity. Professional follow-up is recommended.',
    normalMsg: 'Within the typical fasting range — supportive of stable training energy.',
  },
  HBA1C: {
    unit: '%',
    low: 4,
    high: 5.6,
    lowMsg: 'On the lower end. Generally favourable; ensure adequate fuelling for training load.',
    highMsg:
      'Elevated 3-month average glucose. Prioritise fibre, protein with meals, and consistent activity; seek professional guidance.',
    normalMsg: 'Average glucose control is within the typical range.',
  },
  HDL: {
    unit: 'mg/dL',
    low: 40,
    high: 200,
    lowMsg:
      'Lower "good" cholesterol. Aerobic conditioning, omega-3 intake, and unsaturated fats may support healthier levels.',
    highMsg: 'Higher HDL is generally considered favourable.',
    normalMsg: 'HDL is within a healthy educational range.',
  },
  LDL: {
    unit: 'mg/dL',
    low: 0,
    high: 100,
    lowMsg: 'LDL is low.',
    highMsg:
      'Above the optimal educational range. Soluble fibre, unsaturated fat swaps, and aerobic work may help; discuss with a professional.',
    normalMsg: 'LDL is within the optimal educational range.',
  },
  TRIGLYCERIDES: {
    unit: 'mg/dL',
    low: 0,
    high: 150,
    lowMsg: 'Triglycerides are low.',
    highMsg:
      'Elevated. Reducing refined sugar/alcohol and increasing activity and omega-3s may help; professional follow-up advised.',
    normalMsg: 'Triglycerides are within the typical range.',
  },
  VITAMIN_D: {
    unit: 'ng/mL',
    low: 30,
    high: 100,
    lowMsg:
      'Below sufficiency. Sensible sun exposure and dietary/supplemental vitamin D (with professional guidance) may support bone and immune health.',
    highMsg: 'Above the typical range — review any supplementation with a professional.',
    normalMsg: 'Vitamin D is within the sufficient educational range.',
  },
  TESTOSTERONE: {
    unit: 'ng/dL',
    low: 300,
    high: 1000,
    lowMsg:
      'Below the typical range. Sleep quality, recovery, body composition, and managing training stress are supportive levers; seek professional evaluation.',
    highMsg: 'Above the typical range — professional review is recommended.',
    normalMsg: 'Within the typical range.',
  },
  FERRITIN: {
    unit: 'ng/mL',
    low: 30,
    high: 300,
    lowMsg:
      'Low iron stores can impair endurance and recovery. Iron-rich foods (with vitamin C) may help; confirm approach with a professional.',
    highMsg: 'Elevated iron stores — professional follow-up is recommended.',
    normalMsg: 'Iron stores are within the typical range.',
  },
};

export function analyzeMarker(input: MarkerInput): MarkerInsight {
  const ref = REFERENCE[input.type];
  const low = input.referenceLow ?? ref.low;
  const high = input.referenceHigh ?? ref.high;

  let flag: MarkerFlag = 'NORMAL';
  let insight = ref.normalMsg;
  if (input.value < low) {
    flag = 'LOW';
    insight = ref.lowMsg;
  } else if (input.value > high) {
    flag = 'HIGH';
    insight = ref.highMsg;
  }

  return {
    type: input.type,
    value: input.value,
    unit: ref.unit,
    referenceLow: low,
    referenceHigh: high,
    flag,
    insight,
    disclaimer: MEDICAL_DISCLAIMER,
  };
}

export function analyzePanel(markers: MarkerInput[]): MarkerInsight[] {
  return markers.map(analyzeMarker);
}
