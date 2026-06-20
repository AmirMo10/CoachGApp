import {
  Difficulty,
  ExperienceLevel,
  Gender,
  GoalType,
  MovementPattern,
  PrismaClient,
  Role,
  Sport,
} from '@prisma/client';

import { hashPassword } from '../src/auth/password';

const prisma = new PrismaClient();
const hash = (p: string) => hashPassword(p);

/** Starter exercise library. The full 1000+ catalog is loaded via the Phase-3 ETL importer. */
const STARTER_EXERCISES = [
  {
    slug: 'goblet-squat',
    name: 'Goblet Squat',
    description: 'Squat holding a dumbbell at chest height.',
    equipment: ['dumbbell'],
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['core'],
    movementPattern: MovementPattern.SQUAT,
    difficulty: Difficulty.BEGINNER,
    contraindications: [],
    coachingCues: ['Elbows inside knees', 'Chest tall', 'Drive through midfoot'],
    sportTransferTags: ['general'],
  },
  {
    slug: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    description: 'Bilateral squat with barbell on the upper back.',
    equipment: ['barbell', 'rack'],
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['core', 'hamstrings'],
    movementPattern: MovementPattern.SQUAT,
    difficulty: Difficulty.INTERMEDIATE,
    contraindications: ['knee'],
    coachingCues: ['Brace before descent', 'Knees track toes'],
    sportTransferTags: ['football', 'basketball'],
  },
  {
    slug: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    description: 'Hip-hinge with slight knee bend, barbell or dumbbells.',
    equipment: ['barbell'],
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['erectors'],
    movementPattern: MovementPattern.HINGE,
    difficulty: Difficulty.INTERMEDIATE,
    contraindications: ['lower-back'],
    coachingCues: ['Push hips back', 'Soft knees', 'Bar close to legs'],
    sportTransferTags: ['football', 'hamstring-prevention'],
  },
  {
    slug: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    description: 'Horizontal press with dumbbells.',
    equipment: ['dumbbell', 'bench'],
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'front-delts'],
    movementPattern: MovementPattern.HORIZONTAL_PUSH,
    difficulty: Difficulty.BEGINNER,
    contraindications: ['shoulder'],
    coachingCues: ['Shoulder blades retracted', 'Control the eccentric'],
    sportTransferTags: ['general'],
  },
  {
    slug: 'overhead-press',
    name: 'Overhead Press',
    description: 'Standing vertical press with barbell.',
    equipment: ['barbell'],
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps', 'core'],
    movementPattern: MovementPattern.VERTICAL_PUSH,
    difficulty: Difficulty.INTERMEDIATE,
    contraindications: ['shoulder'],
    coachingCues: ['Squeeze glutes', 'Bar path over mid-foot'],
    sportTransferTags: ['volleyball'],
  },
  {
    slug: 'one-arm-db-row',
    name: 'One-Arm Dumbbell Row',
    description: 'Single-arm horizontal pull supported on a bench.',
    equipment: ['dumbbell', 'bench'],
    primaryMuscles: ['lats', 'mid-back'],
    secondaryMuscles: ['biceps'],
    movementPattern: MovementPattern.HORIZONTAL_PULL,
    difficulty: Difficulty.BEGINNER,
    contraindications: [],
    coachingCues: ['Drive elbow to hip', 'No torso rotation'],
    sportTransferTags: ['general'],
  },
  {
    slug: 'pull-up',
    name: 'Pull-Up',
    description: 'Vertical pull from a bar.',
    equipment: ['pullup-bar'],
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'core'],
    movementPattern: MovementPattern.VERTICAL_PULL,
    difficulty: Difficulty.INTERMEDIATE,
    contraindications: [],
    coachingCues: ['Full hang', 'Chest to bar'],
    sportTransferTags: ['combat'],
  },
  {
    slug: 'box-jump',
    name: 'Box Jump',
    description: 'Maximal vertical jump onto a box.',
    equipment: ['box'],
    primaryMuscles: ['quadriceps', 'glutes', 'calves'],
    secondaryMuscles: [],
    movementPattern: MovementPattern.PLYOMETRIC,
    difficulty: Difficulty.INTERMEDIATE,
    contraindications: ['knee', 'ankle'],
    coachingCues: ['Soft landing', 'Full hip extension'],
    sportTransferTags: ['basketball', 'volleyball', 'vertical-jump', 'plyometric'],
  },
  {
    slug: 'sprint-intervals',
    name: 'Sprint Intervals',
    description: 'Maximal-effort short sprints with full recovery.',
    equipment: ['none'],
    primaryMuscles: ['hamstrings', 'glutes', 'quadriceps'],
    secondaryMuscles: [],
    movementPattern: MovementPattern.GAIT,
    difficulty: Difficulty.INTERMEDIATE,
    contraindications: ['hamstring'],
    coachingCues: ['Drive arms', 'Full recovery between reps'],
    sportTransferTags: ['football', 'running', 'sprint', 'acceleration', 'max-velocity'],
  },
  {
    slug: 'farmer-carry',
    name: "Farmer's Carry",
    description: 'Loaded carry holding heavy dumbbells/kettlebells.',
    equipment: ['dumbbell'],
    primaryMuscles: ['traps', 'core', 'forearms'],
    secondaryMuscles: ['glutes'],
    movementPattern: MovementPattern.CARRY,
    difficulty: Difficulty.BEGINNER,
    contraindications: [],
    coachingCues: ['Tall posture', 'Controlled steps'],
    sportTransferTags: ['combat', 'strength-endurance'],
  },
];

async function main() {
  console.log('Seeding…');

  // Exercises (idempotent)
  for (const ex of STARTER_EXERCISES) {
    await prisma.exercise.upsert({
      where: { slug: ex.slug },
      update: ex,
      create: ex,
    });
  }

  // Demo coach
  const coachUser = await prisma.user.upsert({
    where: { email: 'coach@coachg.dev' },
    // Keep the password hash current (idempotent across hashing-scheme changes).
    update: { passwordHash: hash('password123') },
    create: {
      email: 'coach@coachg.dev',
      role: Role.COACH,
      firstName: 'Demo',
      lastName: 'Coach',
      passwordHash: hash('password123'),
      coachProfile: { create: { businessName: 'Coach"G" Demo', specialties: ['strength', 'sport'] } },
    },
    include: { coachProfile: true },
  });

  // Demo client with assessment + goal
  const client = await prisma.clientProfile.upsert({
    where: { id: 'seed-client-1' },
    update: {},
    create: {
      id: 'seed-client-1',
      coachId: coachUser.coachProfile!.id,
      firstName: 'Alex',
      lastName: 'Athlete',
      email: 'alex@example.com',
      gender: Gender.MALE,
      assessments: {
        create: {
          version: 1,
          age: 26,
          gender: Gender.MALE,
          heightCm: 182,
          weightKg: 84,
          bodyFatPct: 16,
          sport: Sport.FOOTBALL,
          experience: ExperienceLevel.INTERMEDIATE,
          injuries: [],
          mobilityRestrictions: [],
          equipment: ['barbell', 'dumbbell', 'rack', 'bench', 'pullup-bar', 'box'],
          trainingFrequency: 4,
          recoveryQuality: 7,
          sleepQuality: 7,
          stressLevel: 4,
        },
      },
      goals: { create: { type: GoalType.PERFORMANCE, sport: Sport.FOOTBALL, timeframeWeeks: 8 } },
    },
  });

  // Client login linked to the demo client profile
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@coachg.dev' },
    update: { passwordHash: hash('password123') },
    create: {
      email: 'client@coachg.dev',
      role: Role.CLIENT,
      firstName: 'Alex',
      lastName: 'Athlete',
      passwordHash: hash('password123'),
    },
  });
  await prisma.clientProfile.update({
    where: { id: client.id },
    data: { userId: clientUser.id },
  });

  // Admin login
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@coachg.dev' },
    update: { passwordHash: hash('password123') },
    create: {
      email: 'admin@coachg.dev',
      role: Role.ADMIN,
      firstName: 'Site',
      lastName: 'Admin',
      passwordHash: hash('password123'),
    },
  });
  console.log(`Seeded logins: ${clientUser.email} (CLIENT), ${adminUser.email} (ADMIN)`);

  console.log(`Seeded coach=${coachUser.email}, client=${client.firstName} ${client.lastName}`);
  console.log(`Exercises in library: ${await prisma.exercise.count()}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
