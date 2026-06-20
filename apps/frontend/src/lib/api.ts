/** Typed API client for the Coach"G" backend. Token is read from local storage. */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const TOKEN_KEY = 'coachg.token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message);
  }
  // Some endpoints (logout) may return no content.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ── Domain types (frontend view models) ──
export interface AuthUser {
  sub: string;
  email: string;
  role: 'ADMIN' | 'COACH' | 'CLIENT';
  coachProfileId?: string;
  clientProfileId?: string;
}

export interface ClientSummary {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  type: string;
  sport: string;
  timeframeWeeks?: number;
}

export interface Assessment {
  id: string;
  version: number;
  age: number;
  heightCm: number;
  weightKg: number;
  experience: string;
  sport: string;
  trainingFrequency: number;
}

export interface CreateAssessmentBody {
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;
  sport: string;
  experience: string;
  injuries: string[];
  mobilityRestrictions: string[];
  equipment: string[];
  trainingFrequency: number;
  recoveryQuality: number;
  sleepQuality: number;
  stressLevel: number;
}

export interface CreateGoalBody {
  type: string;
  sport: string;
  timeframeWeeks?: number;
}

export interface ProgramSummary {
  id: string;
  name: string;
  periodization: string;
  durationWeeks: number;
  daysPerWeek: number;
  status: string;
  createdAt: string;
}

export interface NutritionPlan {
  id: string;
  strategy: string;
  goalCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface RecoveryPlan {
  id: string;
  sleepTargetHours: number;
  hydrationLiters: number;
  recoveryScore: number;
  deloadRecommended: boolean;
  recommendations: string[];
}

export interface ProgressEntry {
  id: string;
  entryDate: string;
  weightKg?: number | null;
  bodyFatPct?: number | null;
  waistCm?: number | null;
}

export interface ProgramExerciseFull {
  id: string;
  order: number;
  sets: number;
  reps: string;
  loadPctOf1RM?: number | null;
  rpe?: number | null;
  tempo?: string | null;
  restSeconds: number;
  progressionRule?: string | null;
  exercise: { name: string; primaryMuscles: string[]; movementPattern: string };
}

export interface ProgramDayFull {
  id: string;
  dayIndex: number;
  focus: string;
  payload?: { warmup?: string[]; conditioning?: string[] | null } | null;
  exercises: ProgramExerciseFull[];
}

export interface ProgramWeekFull {
  id: string;
  weekIndex: number;
  phase: string;
  volumeMultiplier: number;
  intensityMultiplier: number;
  isDeload: boolean;
  days: ProgramDayFull[];
}

export interface ProgramFull extends ProgramSummary {
  aiRationale?: string | null;
  weeks: ProgramWeekFull[];
}

// ── Endpoint helpers ──
export const Api = {
  login: (email: string, password: string) =>
    api<{ accessToken: string; refreshToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<AuthUser>('/auth/me'),

  clients: () => api<ClientSummary[]>('/clients'),
  createClient: (data: { firstName: string; lastName: string; email?: string }) =>
    api<ClientSummary>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  client: (id: string) => api<ClientSummary & { assessments: Assessment[]; goals: Goal[] }>(`/clients/${id}`),

  assessments: (clientId: string) => api<Assessment[]>(`/clients/${clientId}/assessments`),
  createAssessment: (clientId: string, body: CreateAssessmentBody) =>
    api<Assessment>(`/clients/${clientId}/assessments`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  goals: (clientId: string) => api<Goal[]>(`/clients/${clientId}/goals`),
  createGoal: (clientId: string, body: CreateGoalBody) =>
    api<Goal>(`/clients/${clientId}/goals`, { method: 'POST', body: JSON.stringify(body) }),

  programs: (clientId: string) => api<ProgramSummary[]>(`/clients/${clientId}/programs`),
  program: (programId: string) => api<ProgramFull>(`/programs/${programId}`),
  generateProgram: (
    clientId: string,
    body: { goalId: string; periodization: string; durationWeeks: number; daysPerWeek: number },
  ) =>
    api<ProgramSummary>(`/clients/${clientId}/programs/generate`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  nutrition: (clientId: string) => api<NutritionPlan[]>(`/clients/${clientId}/nutrition`),
  generateNutrition: (clientId: string, goalId: string) =>
    api<NutritionPlan>(`/clients/${clientId}/nutrition/generate`, {
      method: 'POST',
      body: JSON.stringify({ goalId }),
    }),

  recovery: (clientId: string) => api<RecoveryPlan[]>(`/clients/${clientId}/recovery`),
  generateRecovery: (clientId: string) =>
    api<RecoveryPlan>(`/clients/${clientId}/recovery/generate`, { method: 'POST' }),

  progress: (clientId: string) => api<ProgressEntry[]>(`/clients/${clientId}/progress`),
  addProgress: (
    clientId: string,
    body: { entryDate?: string; weightKg?: number; bodyFatPct?: number; waistCm?: number },
  ) => api<ProgressEntry>(`/clients/${clientId}/progress`, { method: 'POST', body: JSON.stringify(body) }),

  generateReport: (clientId: string) =>
    api<{ reportId: string; status: string }>(`/clients/${clientId}/reports/generate`, {
      method: 'POST',
    }),
  report: (reportId: string) =>
    api<{ id: string; status: string; downloadUrl: string | null }>(`/reports/${reportId}`),
};
