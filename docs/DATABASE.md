# Coach"G" — Database Architecture

PostgreSQL via Prisma. This document describes the logical model; the authoritative schema is [`apps/backend/prisma/schema.prisma`](../apps/backend/prisma/schema.prisma).

## Design notes
- All tables use `cuid()` primary keys and `createdAt`/`updatedAt` timestamps.
- Soft-delete via `deletedAt` on user-facing entities.
- Multi-tenancy is **row-level by coach**: every client-owned row carries `coachId`; ownership is enforced in the service layer + (future) Postgres RLS policies.
- Enums are used for closed sets (roles, goals, periodization models, etc.).
- JSON columns (`Json`) are used for flexible, engine-produced structures (program day payloads, macro splits) while keeping relational integrity for queryable entities.

## Entity map

```
User ──< CoachProfile
User ──< ClientProfile >── Coach (User)
ClientProfile ──< Assessment
ClientProfile ──< Goal
ClientProfile ──< Program ──< ProgramWeek ──< ProgramDay ──< ProgramExercise >── Exercise
ClientProfile ──< NutritionPlan ──< Meal
ClientProfile ──< RecoveryPlan
ClientProfile ──< BloodworkPanel ──< BloodMarker
ClientProfile ──< ProgressEntry
ClientProfile ──< Measurement
ClientProfile ──< Document
ClientProfile ──< Report
ClientProfile ──< Message (thread with Coach)
Exercise (global library, not coach-scoped)
AuditLog (global)
```

## Core entities

### User & profiles
- **User** — identity record (mirrors Keycloak subject). `role: ADMIN|COACH|CLIENT`.
- **CoachProfile** — business info, branding (logo for reports), specialties.
- **ClientProfile** — links a client User to their Coach; holds demographic snapshot.

### Assessment & goals
- **Assessment** — full intake (Module 2): age, gender, height, weight, body-fat %, sport, experience, injuries[], mobility restrictions[], equipment[], training frequency, schedule, recovery/sleep/stress scores. Versioned (a client can be re-assessed over time).
- **Goal** — `type: FAT_LOSS|MUSCLE_GAIN|RECOMP|PERFORMANCE|...` + optional `sport` + target metrics + timeframe.

### Exercise library (global)
- **Exercise** — the canonical 1000+ exercise catalog. Fields: name, description, videoUrl, equipment[], primaryMuscles[], secondaryMuscles[], movementPattern, difficulty, contraindications[], coachingCues[], sportTransferTags[]. **Source of truth for all program selection.**

### Program
- **Program** — top-level plan: client, goal, periodization model, duration weeks, status.
- **ProgramWeek** — week index, phase (accumulation/intensification/deload), volume/intensity multipliers.
- **ProgramDay** — day index, focus (e.g. Lower/Push/Speed), `payload` Json for warmup/conditioning.
- **ProgramExercise** — links a ProgramDay to an Exercise with sets, reps, load (%1RM or RPE), tempo, rest, order, progression rule.

### Nutrition
- **NutritionPlan** — BMR, TDEE, goal calories, protein/carb/fat grams, strategy, meal timing.
- **Meal** — example meal, macros, timing slot, shopping items[].

### Recovery
- **RecoveryPlan** — sleep target, hydration target, mobility routine[], recovery score, deload recommendation.

### Bloodwork (sensitive)
- **BloodworkPanel** — date, lab, notes. Encrypted at field level.
- **BloodMarker** — marker (FASTING_GLUCOSE, HBA1C, HDL, LDL, TRIGLYCERIDES, VITAMIN_D, TESTOSTERONE, FERRITIN), value, unit, referenceRange, flag (LOW/NORMAL/HIGH). Educational insights only — **never diagnostic**.

### Progress
- **ProgressEntry** — date + metrics (weight, bodyFat, waist, strength PRs, sprint times, jump height, compliance %, recovery score).
- **Measurement** / **Document** / **Report** — files in object storage (keys, not blobs).
- **Message** — coach↔client thread.

### Cross-cutting
- **AuditLog** — actorId, action, entityType, entityId, metadata Json, ip, createdAt.

## Indexing strategy
- `Exercise`: GIN indexes on `equipment`, `primaryMuscles`, `sportTransferTags` for fast filtering.
- `ClientProfile(coachId)`, `Program(clientId, status)`, `ProgressEntry(clientId, date)` — common query paths.
- `AuditLog(entityType, entityId, createdAt)`.

## Migrations & seeding
- `prisma migrate dev` for schema changes.
- `prisma db seed` loads: roles, a demo coach/client, and a starter exercise library batch (see `prisma/seed.ts`). Full 1000+ library is loaded via a separate ETL importer in Phase 3.
