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

  overview: () =>
    api<{
      totals: {
        clients: number;
        programs: number;
        nutritionPlans: number;
        recoveryPlans: number;
        assessments: number;
      };
      clientsByWeek: { label: string; count: number }[];
    }>('/coach/overview'),

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

  // Exercise library
  exercises: (filter: Record<string, string> = {}) => {
    const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v)).toString();
    return api<Exercise[]>(`/exercises${qs ? `?${qs}` : ''}`);
  },

  // Bloodwork
  bloodwork: (clientId: string) => api<BloodworkPanel[]>(`/clients/${clientId}/bloodwork`),
  addBloodwork: (clientId: string, body: AddBloodworkBody) =>
    api<BloodworkPanel>(`/clients/${clientId}/bloodwork`, { method: 'POST', body: JSON.stringify(body) }),

  // Messaging
  messages: (clientId: string) => api<Message[]>(`/clients/${clientId}/messages`),
  sendMessage: (clientId: string, body: string) =>
    api<Message>(`/clients/${clientId}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),
  draftReply: (clientId: string) =>
    api<{ draft: string; aiGenerated: boolean }>(`/clients/${clientId}/messages/draft`, { method: 'POST' }),

  // Notes (coach)
  notes: (clientId: string) => api<Note[]>(`/clients/${clientId}/notes`),
  addNote: (clientId: string, body: string) =>
    api<Note>(`/clients/${clientId}/notes`, { method: 'POST', body: JSON.stringify({ body }) }),

  // Documents
  documents: (clientId: string) => api<DocumentMeta[]>(`/clients/${clientId}/documents`),
  presignDocument: (clientId: string, fileName: string, mimeType: string) =>
    api<{ key: string; url: string }>(`/clients/${clientId}/documents/presign`, {
      method: 'POST',
      body: JSON.stringify({ fileName, mimeType }),
    }),
  recordDocument: (
    clientId: string,
    body: { name: string; objectKey: string; mimeType: string; sizeBytes: number },
  ) => api<DocumentMeta>(`/clients/${clientId}/documents`, { method: 'POST', body: JSON.stringify(body) }),

  // Workout logging
  workouts: (clientId: string) => api<WorkoutLog[]>(`/clients/${clientId}/workouts`),
  logWorkout: (
    clientId: string,
    body: {
      programId?: string;
      weekIndex?: number;
      dayIndex?: number;
      focus?: string;
      notes?: string;
      entries?: LoggedExercise[];
    },
  ) => api<WorkoutLog>(`/clients/${clientId}/workouts`, { method: 'POST', body: JSON.stringify(body) }),

  // Coach profile / settings
  coachProfile: () => api<CoachProfile>('/coach/profile'),
  updateCoachProfile: (body: Partial<Pick<CoachProfile, 'businessName' | 'bio' | 'specialties' | 'logoKey'>>) =>
    api<CoachProfile>('/coach/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  presignLogo: (fileName: string, mimeType: string) =>
    api<{ key: string; url: string }>('/coach/profile/logo-url', {
      method: 'POST',
      body: JSON.stringify({ fileName, mimeType }),
    }),

  // Admin
  adminAnalytics: () =>
    api<{
      totals: { coaches: number; clients: number; programs: number; users: number };
      clientsByWeek: { label: string; count: number }[];
    }>('/admin/analytics'),
  adminCoaches: () =>
    api<
      { id: string; businessName?: string; email: string; name: string; isActive: boolean; clientCount: number }[]
    >('/admin/coaches'),
};

export interface LoggedSet {
  reps?: number;
  weightKg?: number;
  rpe?: number;
}
export interface LoggedExercise {
  name: string;
  sets: LoggedSet[];
}

export interface WorkoutLog {
  id: string;
  programId?: string | null;
  weekIndex?: number | null;
  dayIndex?: number | null;
  focus?: string | null;
  performedAt: string;
  notes?: string | null;
  entries?: LoggedExercise[] | null;
}

export interface CoachProfile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  bio?: string | null;
  specialties: string[];
  logoKey?: string | null;
  logoUrl?: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  equipment: string[];
  primaryMuscles: string[];
  movementPattern: string;
  difficulty: string;
  sportTransferTags: string[];
}

export interface BloodMarker {
  id: string;
  type: string;
  value: number;
  unit: string;
  referenceLow?: number | null;
  referenceHigh?: number | null;
  flag: 'LOW' | 'NORMAL' | 'HIGH';
  insight?: string | null;
}
export interface BloodworkPanel {
  id: string;
  panelDate: string;
  lab?: string | null;
  notes?: string | null;
  markers: BloodMarker[];
}
export interface AddBloodworkBody {
  lab?: string;
  notes?: string;
  markers: { type: string; value: number }[];
}

export interface Message {
  id: string;
  senderRole: 'ADMIN' | 'COACH' | 'CLIENT';
  body: string;
  createdAt: string;
}

export interface Note {
  id: string;
  body: string;
  createdAt: string;
}

export interface DocumentMeta {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}
