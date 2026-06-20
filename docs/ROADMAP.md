# Coach"G" — Development Roadmap

A phased plan from foundation to production. Each phase ends with a deployable, tested increment.

| Phase | Theme | Status |
| ----- | ----- | ------ |
| 1 | Foundations & scaffolding | ✅ Complete |
| 2 | Backend/Frontend foundation, Auth, DB | ✅ Complete (Keycloak OIDC pending) |
| 3 | Client mgmt, Assessment, Exercise library | 🟡 Core complete (docs/messaging + ETL pending) |
| 4 | Program / Nutrition / Recovery engines | ✅ Complete |
| 5 | PDF reports, dashboards, progress tracking | 🟡 Backend complete (frontend dashboards pending) |
| 6 | AI personalization (Claude) | 🟡 Explanation layer complete (report copy/messaging pending) |
| 7 | Monitoring, deployment, production infra | 🟡 Scaffolded (metrics/deploy/backups pending) |

Test coverage: **30 passing tests** across the deterministic engines. CI runs typecheck + lint + test + build.

---

## Phase 1 — Foundations ✅
**Goal:** establish the monorepo, architecture, and contracts everything else builds on.
- [x] Monorepo layout (`apps`, `packages`, `services`, `infrastructure`, `docs`, `.claude`)
- [x] Architecture, Database, API, Deployment docs
- [x] Prisma schema (full domain model)
- [x] Shared `types` package (enums + DTO contracts)
- [x] Shared `shared` package (constants, Zod validation, math utils)
- [x] Multi-agent system (`.claude/agents`)
- [x] Docker Compose dev stack + Dockerfiles + Nginx + K8s + CI

## Phase 2 — Backend & Frontend foundation ✅
- [x] NestJS app bootstrap: config, pino logging, Swagger, health, throttler
- [x] Prisma module + schema push + seed (demo coach/client + starter exercises)
- [x] Auth module (local JWT) + RBAC guard + ownership checks + audit interceptor
- [x] Next.js app bootstrap: layout, Inter/theming, auth context, route guarding
- [x] Coach portal: login, clients list/create, client detail, assessment+goal
      intake form, plan generation, report queuing
- [x] Shared UI design system (button/card/input/badge/stat/spinner + brand)
- [ ] **Keycloak OIDC** provider (production auth; local JWT is the dev fallback)

## Phase 3 — Client, Assessment, Exercise library 🟡
- [x] Clients CRUD (+ ownership-scoped access) — `clients` module
- [x] Assessment intake (versioned) + DTO validation — `assessments` module
- [x] Goals — `goals` module
- [x] Exercise library filtering API — `exercises` module
- [ ] **Documents + messaging + notes endpoints** (schema already exists)
- [ ] **Exercise library 1000+ ETL importer** (10 exercises seeded so far)

## Phase 4 — Generation engines ✅
- [x] Nutrition engine (BMR/TDEE/macros/meals) — `services/nutrition-engine`
- [x] Periodization engine (linear/block/undulating + deloads) — `services/program-generator`
- [x] Rule engine (injury/equipment/difficulty filtering) + program builder
- [x] Recovery engine — `services/recovery-engine`
- [x] Sport performance engine (football/basketball/volleyball/combat/running)
- [x] Bloodwork engine (educational insights, never diagnostic) — `services/bloodwork-engine`
- [x] Engines wired to backend modules with persistence

## Phase 5 — Reports, dashboards, progress 🟡
- [x] Progress tracking module (+ summary aggregation) — `progress` module
- [x] Bloodwork module (engine-computed flags/insights)
- [x] React PDF report templates (`services/report-engine`)
- [x] Async report generation via BullMQ → S3-compatible object storage
- [x] S3-compatible storage service (presigned upload/download, ArvanCloud)
- [ ] **Frontend dashboards + progress charts**
- [ ] **Program week-by-week viewer** (expandable training days)

## Phase 6 — AI personalization 🟡
- [x] Claude integration (`services/ai`) with bypassable, deterministic fallback
- [x] Program explanation layer + guardrails (no non-DB exercises, no logic changes)
- [x] Wired into program generation (`aiRationale`)
- [ ] **AI report copy** (premium narrative sections in PDFs)
- [ ] **AI coach↔client messaging** assistant
- [ ] AI notes wired into nutrition/recovery
- [ ] **Prompt caching + cost controls**

## Phase 7 — Production 🟡
- [x] Dockerfiles, Compose (dev/prod), Kubernetes manifests (+HPA), Nginx/TLS, CI
- [ ] **Prometheus `/metrics` endpoint** + Grafana dashboards + Loki logging
- [ ] **Kubernetes deploy to ArvanCloud**
- [ ] **Backup strategy** (pg_dump → object storage) + restore runbook automation
- [ ] **Load testing** to Phase-1 targets (100 coaches / 5k clients)

---

## Highest-impact remaining work
1. Phase 5 frontend — **program week-by-week viewer + progress charts** (makes plans usable).
2. Phase 6 — **AI report copy** + live `ANTHROPIC_API_KEY` (turns on the premium narrative).
3. Phase 7 — **observability + ArvanCloud deploy** (production readiness).

## Definition of Done (per feature)
1. Typed contract in `packages/types`
2. Validated DTOs (`class-validator` + Zod)
3. Service unit tests + e2e for endpoints
4. RBAC + audit applied
5. Swagger documented
6. UI wired with loading/error states
