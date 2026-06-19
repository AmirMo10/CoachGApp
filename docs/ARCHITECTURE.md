# Coach"G" — System Architecture

## 1. Overview

Coach"G" is a multi-tenant SaaS platform that lets coaches generate professional training programs, nutrition plans, recovery protocols, and PDF reports for their clients. It uses a **hybrid generation model**: deterministic rule/periodization engines produce the actual training logic, and an AI layer (Anthropic Claude) adds personalization, explanation, and natural-language report copy.

### Guiding principles

1. **Deterministic core, AI on top.** Programs are built by code; Claude never decides sets, reps, loads, or exercise selection. Claude only explains, personalizes phrasing, and writes report narrative.
2. **Exercises come only from the database.** The AI may *select among* exercises returned by the engine but may never invent exercises.
3. **Self-hosted, ArvanCloud-first.** No AWS-managed services. Everything is open-source and S3-compatible.
4. **Horizontally scalable.** Stateless API instances; state in Postgres/Redis/Object Storage; heavy work offloaded to BullMQ workers.

---

## 2. High-Level Diagram

```
                         ┌────────────────────────┐
                         │        Nginx           │  TLS (Let's Encrypt)
                         │   reverse proxy / LB    │
                         └───────────┬────────────┘
                  ┌──────────────────┼───────────────────┐
                  ▼                                       ▼
        ┌──────────────────┐                   ┌────────────────────┐
        │  Next.js (SSR)   │  REST/JSON +JWT   │   NestJS API       │
        │  Coach / Client  │ ◄───────────────► │  (stateless)       │
        │  / Admin portals │                   └─────────┬──────────┘
        └──────────────────┘                             │
                                       ┌─────────────────┼──────────────────┐
                                       ▼                 ▼                  ▼
                              ┌────────────────┐ ┌──────────────┐  ┌────────────────┐
                              │  PostgreSQL    │ │    Redis     │  │  Object Storage │
                              │  (Prisma)      │ │ cache+queue  │  │  (ArvanCloud)   │
                              └────────────────┘ └──────┬───────┘  └────────────────┘
                                                        │
                                            ┌───────────▼────────────┐
                                            │   BullMQ Workers       │
                                            │  - program generation  │
                                            │  - PDF report build    │
                                            │  - AI personalization  │
                                            └───────────┬────────────┘
                                                        ▼
                                            ┌────────────────────────┐
                                            │  Anthropic Claude API  │
                                            └────────────────────────┘

  Observability: Prometheus (metrics) · Grafana (dashboards) · Loki (logs)
  Auth:          Keycloak (self-hosted, OIDC) with local JWT fallback for dev
```

---

## 3. Components

### 3.1 Frontend (`apps/frontend`)
Next.js (App Router) + TypeScript + TailwindCSS + shadcn/ui. Three role-based portals:
- **Coach portal** — clients, assessments, program/nutrition/recovery generation, reports.
- **Client portal** — view program, log workouts, upload measurements/photos.
- **Admin portal** — manage coaches, system analytics.

Server Components for data fetching; React Query for client-side mutations; auth via Keycloak OIDC (NextAuth adapter) / JWT.

### 3.2 Backend (`apps/backend`)
NestJS modular monolith. Domain modules map 1:1 to product modules (clients, assessments, exercises, programs, nutrition, recovery, bloodwork, progress, reports, ai). Cross-cutting: auth, rbac, audit, storage, queue. Exposes REST + OpenAPI (Swagger). Stateless → scales horizontally behind Nginx.

### 3.3 Engines (`services/*`)
Pure-TypeScript libraries with **no I/O** (testable, deterministic), consumed by the backend:
- `program-generator` — rule engine + program builder.
- `nutrition-engine` — BMR/TDEE/macro/meal logic.
- `recovery-engine` — sleep/hydration/mobility/deload logic.
- `report-engine` — React PDF document templates.
- `ai` — Claude prompt orchestration (the only stateful service; calls external API).

### 3.4 Data stores
- **PostgreSQL** — system of record (Prisma ORM).
- **Redis** — response cache + BullMQ broker.
- **Object Storage** — documents, photos, generated PDFs (S3-compatible → ArvanCloud / MinIO in dev).

---

## 4. Program Generation Data Flow

This is the heart of the product. AI is the **last, optional** step.

```
Assessment (DB)
   │
   ▼
Goal Analysis ─────────────► resolves goal → training priorities, split, intensity bands
   │                         (deterministic; services/program-generator/goal-analysis)
   ▼
Rule Engine ───────────────► applies constraints: injuries, equipment, frequency,
   │                         experience, contraindications → exercise filter set
   ▼
Periodization Engine ──────► builds week/day skeleton (linear|block|undulating),
   │                         volume/intensity/frequency/deloads/progressions
   ▼
Exercise Selection ────────► picks ONLY from filtered DB exercises, balanced by
   │                         movement pattern & muscle coverage & sport-transfer tags
   ▼
Program Builder ───────────► concrete sets×reps×load%×rest per exercise per day
   │                         → fully valid program persisted to DB
   ▼
AI Explanation Layer ──────► Claude writes WHY (rationale, cues, coach voice).
   │                         Cannot alter sets/reps/exercises — explanation only.
   ▼
Final Program (DB + PDF)
```

If the AI layer fails or is disabled, the program is still **complete and valid** — explanations simply fall back to templated text. This guarantees no hallucination can corrupt training logic.

---

## 5. AI Boundaries

| Allowed for Claude                          | Forbidden for Claude                         |
| ------------------------------------------- | -------------------------------------------- |
| Personalize tone & coaching cues            | Decide sets / reps / load / rest             |
| Explain *why* a block is structured a way   | Select/invent exercises outside the DB set   |
| Write report narrative & summaries          | Compute macros / calories                    |
| Draft coach↔client messages                 | Make medical diagnoses                       |
| Summarize progress trends                   | Override rule-engine safety constraints      |

All Claude calls go through `services/ai` which: (a) injects only whitelisted context, (b) validates output against a schema, (c) strips any attempt to introduce non-DB exercises, (d) is fully bypassable.

---

## 6. Security Architecture

- **AuthN:** Keycloak OIDC (prod) / signed JWT (dev). Access + refresh tokens.
- **AuthZ:** RBAC guard (`Admin`/`Coach`/`Client`) + ownership checks (a coach only sees own clients; a client only sees own data) enforced at the service layer.
- **Rate limiting:** Nginx + Nest `@nestjs/throttler`.
- **Validation:** `class-validator` DTOs + Zod schemas in `packages/shared`.
- **Audit logging:** every mutating action → `AuditLog` table (actor, action, entity, before/after hash).
- **Encryption at rest:** Postgres volume encryption + app-level field encryption for sensitive PII (bloodwork) via `ENCRYPTION_KEY`.
- **Secure uploads:** presigned PUT URLs, content-type allowlist, size caps, server-side virus/type validation, randomized object keys.
- Follows OWASP Top 10 mitigations (see [Security Engineer agent](../.claude/agents/security-engineer.md)).

---

## 7. Scalability

| Concern              | Strategy                                                            |
| -------------------- | ------------------------------------------------------------------ |
| API throughput       | Stateless Nest instances behind Nginx; scale replicas              |
| Heavy generation     | Offloaded to BullMQ workers; scale worker pool independently       |
| Read load            | Redis cache for exercise library & computed lookups                |
| DB                   | Connection pooling (PgBouncer), read replicas in Phase 2           |
| Reports/files        | Object storage (infinitely scalable), CDN in front                 |
| Targets              | Phase 1: 100 coaches / 5k clients · Phase 2: 1k coaches / 50k clients |

---

## 8. Deployment Topology (ArvanCloud)

Docker Compose for single-node / staging; Kubernetes manifests for production. See [DEPLOYMENT.md](./DEPLOYMENT.md).
