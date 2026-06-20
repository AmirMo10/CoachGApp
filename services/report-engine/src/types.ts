import { NutritionResult, ProgramPlan, RecoveryResult } from '@coachg/types';

/** Everything required to render a premium client report. */
export interface ReportData {
  brand: {
    businessName: string;
    logoDataUrl?: string;
    coachName: string;
  };
  client: {
    fullName: string;
    age?: number;
    sport?: string;
    goal?: string;
  };
  assessmentSummary: { label: string; value: string }[];
  goalAnalysis: string;
  performanceAnalysis?: string;
  program?: ProgramPlan;
  programRationale?: string;
  nutrition?: NutritionResult;
  supplements?: { name: string; dose: string; timing: string; rationale: string }[];
  recovery?: RecoveryResult;
  progress?: { metric: string; start: string; current: string; change: string }[];
  coachNotes?: string;
  /** Educational bloodwork insights (never diagnostic). */
  bloodwork?: { marker: string; value: string; flag: string; insight: string }[];
  generatedAt: string;
}
