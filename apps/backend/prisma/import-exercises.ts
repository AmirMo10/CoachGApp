/**
 * Exercise library ETL importer (Phase 3).
 *
 * Generates a deterministic 1000+ exercise catalog by combining base movements
 * (per movement pattern) with equipment and tempo/grip variants, then upserts
 * in batches. In production this would instead read a curated JSON/CSV export;
 * the generator keeps the demo self-contained while exercising the same import
 * path (validation → upsert by slug → batched writes).
 *
 * Usage: ts-node prisma/import-exercises.ts
 */
import { Difficulty, MovementPattern, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Base {
  name: string;
  pattern: MovementPattern;
  primary: string[];
  secondary: string[];
  contraindications: string[];
  cues: string[];
  sportTags: string[];
}

// Base movements grouped by pattern. Variants multiply these into the full library.
const BASES: Base[] = [
  { name: 'Squat', pattern: MovementPattern.SQUAT, primary: ['quadriceps', 'glutes'], secondary: ['core', 'hamstrings'], contraindications: ['knee'], cues: ['Brace', 'Knees track toes'], sportTags: ['football', 'basketball'] },
  { name: 'Split Squat', pattern: MovementPattern.LUNGE, primary: ['quadriceps', 'glutes'], secondary: ['adductors'], contraindications: ['knee'], cues: ['Tall torso', 'Drive through front heel'], sportTags: ['football', 'running'] },
  { name: 'Lunge', pattern: MovementPattern.LUNGE, primary: ['quadriceps', 'glutes'], secondary: ['core'], contraindications: ['knee'], cues: ['Controlled descent'], sportTags: ['football'] },
  { name: 'Deadlift', pattern: MovementPattern.HINGE, primary: ['hamstrings', 'glutes'], secondary: ['erectors', 'lats'], contraindications: ['lower-back'], cues: ['Neutral spine', 'Push the floor away'], sportTags: ['combat'] },
  { name: 'Romanian Deadlift', pattern: MovementPattern.HINGE, primary: ['hamstrings', 'glutes'], secondary: ['erectors'], contraindications: ['lower-back'], cues: ['Push hips back', 'Soft knees'], sportTags: ['football', 'hamstring-prevention'] },
  { name: 'Hip Thrust', pattern: MovementPattern.HINGE, primary: ['glutes'], secondary: ['hamstrings'], contraindications: [], cues: ['Posterior pelvic tilt', 'Full lockout'], sportTags: ['running'] },
  { name: 'Bench Press', pattern: MovementPattern.HORIZONTAL_PUSH, primary: ['chest'], secondary: ['triceps', 'front-delts'], contraindications: ['shoulder'], cues: ['Retract scapula', 'Control eccentric'], sportTags: [] },
  { name: 'Push-Up', pattern: MovementPattern.HORIZONTAL_PUSH, primary: ['chest'], secondary: ['triceps', 'core'], contraindications: ['shoulder', 'wrist'], cues: ['Rigid plank', 'Full ROM'], sportTags: [] },
  { name: 'Overhead Press', pattern: MovementPattern.VERTICAL_PUSH, primary: ['shoulders'], secondary: ['triceps', 'core'], contraindications: ['shoulder'], cues: ['Squeeze glutes', 'Bar over mid-foot'], sportTags: ['volleyball'] },
  { name: 'Row', pattern: MovementPattern.HORIZONTAL_PULL, primary: ['lats', 'mid-back'], secondary: ['biceps'], contraindications: [], cues: ['Drive elbow to hip'], sportTags: ['combat'] },
  { name: 'Pull-Up', pattern: MovementPattern.VERTICAL_PULL, primary: ['lats'], secondary: ['biceps', 'core'], contraindications: [], cues: ['Full hang', 'Chest to bar'], sportTags: ['combat'] },
  { name: 'Pulldown', pattern: MovementPattern.VERTICAL_PULL, primary: ['lats'], secondary: ['biceps'], contraindications: [], cues: ['Lead with elbows'], sportTags: [] },
  { name: 'Carry', pattern: MovementPattern.CARRY, primary: ['traps', 'core', 'forearms'], secondary: ['glutes'], contraindications: [], cues: ['Tall posture'], sportTags: ['combat', 'strength-endurance'] },
  { name: 'Rotation', pattern: MovementPattern.ROTATION, primary: ['obliques', 'core'], secondary: [], contraindications: ['lower-back'], cues: ['Rotate through hips'], sportTags: ['combat', 'rotational-power'] },
  { name: 'Jump', pattern: MovementPattern.PLYOMETRIC, primary: ['quadriceps', 'glutes', 'calves'], secondary: [], contraindications: ['knee', 'ankle'], cues: ['Soft landing', 'Full hip extension'], sportTags: ['basketball', 'volleyball', 'vertical-jump', 'plyometric'] },
  { name: 'Bound', pattern: MovementPattern.PLYOMETRIC, primary: ['glutes', 'hamstrings'], secondary: ['calves'], contraindications: ['ankle', 'hamstring'], cues: ['Cover distance', 'Stick the landing'], sportTags: ['football', 'sprint', 'plyometric'] },
  { name: 'Sprint', pattern: MovementPattern.GAIT, primary: ['hamstrings', 'glutes', 'quadriceps'], secondary: [], contraindications: ['hamstring'], cues: ['Drive arms', 'Full recovery'], sportTags: ['football', 'running', 'sprint', 'acceleration', 'max-velocity'] },
  { name: 'Carioca Drill', pattern: MovementPattern.CONDITIONING, primary: ['hips', 'core'], secondary: [], contraindications: [], cues: ['Quick feet', 'Stay low'], sportTags: ['football', 'agility', 'change-of-direction'] },
];

const EQUIPMENT_VARIANTS: { label: string; equipment: string[]; difficulty: Difficulty }[] = [
  { label: 'Barbell', equipment: ['barbell'], difficulty: Difficulty.INTERMEDIATE },
  { label: 'Dumbbell', equipment: ['dumbbell'], difficulty: Difficulty.BEGINNER },
  { label: 'Kettlebell', equipment: ['kettlebell'], difficulty: Difficulty.INTERMEDIATE },
  { label: 'Cable', equipment: ['cable'], difficulty: Difficulty.BEGINNER },
  { label: 'Machine', equipment: ['machine'], difficulty: Difficulty.BEGINNER },
  { label: 'Bodyweight', equipment: ['bodyweight'], difficulty: Difficulty.BEGINNER },
  { label: 'Band', equipment: ['band'], difficulty: Difficulty.BEGINNER },
  { label: 'Trap-Bar', equipment: ['trap-bar'], difficulty: Difficulty.INTERMEDIATE },
];

const MODIFIERS = [
  { label: '', tempo: false, difficulty: 0 },
  { label: 'Tempo', tempo: true, difficulty: 1 },
  { label: 'Paused', tempo: true, difficulty: 1 },
  { label: 'Single-Arm', tempo: false, difficulty: 1 },
  { label: 'Single-Leg', tempo: false, difficulty: 1 },
  { label: 'Deficit', tempo: false, difficulty: 1 },
  { label: 'Incline', tempo: false, difficulty: 0 },
  { label: 'Eccentric', tempo: true, difficulty: 1 },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const bumpDifficulty = (d: Difficulty, by: number): Difficulty => {
  const order = [Difficulty.BEGINNER, Difficulty.INTERMEDIATE, Difficulty.ADVANCED];
  const idx = Math.min(order.indexOf(d) + by, order.length - 1);
  return order[idx]!;
};

function buildCatalog() {
  const out: { slug: string; name: string; description: string; videoUrl: string | null; equipment: string[]; primaryMuscles: string[]; secondaryMuscles: string[]; movementPattern: MovementPattern; difficulty: Difficulty; contraindications: string[]; coachingCues: string[]; sportTransferTags: string[] }[] = [];
  const seen = new Set<string>();

  for (const base of BASES) {
    for (const eq of EQUIPMENT_VARIANTS) {
      for (const mod of MODIFIERS) {
        const name = [mod.label, eq.label, base.name].filter(Boolean).join(' ');
        const slug = slugify(name);
        if (seen.has(slug)) continue;
        seen.add(slug);
        out.push({
          slug,
          name,
          description: `${name} — ${base.pattern.toLowerCase().replace(/_/g, ' ')} movement.`,
          videoUrl: null,
          equipment: eq.equipment,
          primaryMuscles: base.primary,
          secondaryMuscles: base.secondary,
          movementPattern: base.pattern,
          difficulty: bumpDifficulty(eq.difficulty, mod.difficulty),
          contraindications: base.contraindications,
          coachingCues: base.cues,
          sportTransferTags: base.sportTags,
        });
      }
    }
  }
  return out;
}

async function main() {
  const catalog = buildCatalog();
  console.log(`Generated ${catalog.length} exercises. Importing…`);

  const BATCH = 100;
  let imported = 0;
  for (let i = 0; i < catalog.length; i += BATCH) {
    const batch = catalog.slice(i, i + BATCH);
    await prisma.$transaction(
      batch.map((ex) => prisma.exercise.upsert({ where: { slug: ex.slug }, update: ex, create: ex })),
    );
    imported += batch.length;
    process.stdout.write(`\r  imported ${imported}/${catalog.length}`);
  }
  console.log(`\nDone. Total exercises in library: ${await prisma.exercise.count()}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
