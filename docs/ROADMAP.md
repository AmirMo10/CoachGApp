# Coach"G" — Development Roadmap

A phased plan from foundation to production. Each phase ends with a deployable, tested increment.

| Phase | Theme | Status |
| ----- | ----- | ------ |
| 1 | Foundations & scaffolding | ✅ In progress (this build) |
| 2 | Backend/Frontend foundation, Auth, DB | 🔲 |
| 3 | Client mgmt, Assessment, Exercise library | 🔲 |
| 4 | Program / Nutrition / Recovery engines | 🟡 Engines scaffolded with real logic |
| 5 | PDF reports, dashboards, progress tracking | 🔲 |
| 6 | AI personalization (Claude) | 🟡 AI service scaffolded |
| 7 | Monitoring, deployment, production infra | 🟡 Infra scaffolded |

---

## Phase 1 — Foundations (current)
**Goal:** establish the monorepo, architecture, and contracts everything else builds on.
- [x] Monorepo layout (`apps`, `packages`, `services`, `infrastructure`, `docs`, `.claude`)
- [x] Architecture, Database, API, Deployment docs
- [x] Prisma schema (full domain model)
- [x] Shared `types` package (enums + DTO contracts)
- [x] Shared `shared` package (constants, Zod validation, math utils)
- [x] Multi-agent system (`.claude/agents`)
- [x] Docker Compose dev stack + Dockerfiles + Nginx + K8s + CI

## Phase 2 — Backend & Frontend foundation
- [ ] NestJS app bootstrap: config, logging, Swagger, health, throttler
- [ ] Prisma module + migrations + seed
- [ ] Auth module (Keycloak OIDC + local JWT fallback), RBAC guard, audit interceptor
- [ ] Next.js app bootstrap: layout, theming, auth, role-based routing
- [ ] Shared UI package (shadcn/ui)

## Phase 3 — Client, Assessment, Exercise library
- [ ] Clients CRUD + documents + messaging + notes
- [ ] Assessment intake forms + versioning
- [ ] Exercise library CRUD + filtering API + 1000+ ETL importer

## Phase 4 — Generation engines
- [x] Nutrition engine (BMR/TDEE/macros/meals) — implemented in `services/nutrition-engine`
- [x] Periodization engine (linear/block/undulating) — implemented in `services/program-generator`
- [x] Rule engine + program builder — implemented in `services/program-generator`
- [x] Recovery engine — implemented in `services/recovery-engine`
- [ ] Sport performance engine (football/basketball/combat/running) — partial in rule engine
- [ ] Wire engines to backend modules + persistence

## Phase 5 — Reports, dashboards, progress
- [ ] Progress tracking module + charts
- [ ] React PDF report templates (`services/report-engine`)
- [ ] Async report generation via BullMQ → object storage

## Phase 6 — AI personalization
- [ ] Claude integration (`services/ai`): explanation layer, report copy, messaging
- [ ] Output schema validation + non-DB-exercise stripping
- [ ] Prompt caching + cost controls

## Phase 7 — Production
- [ ] Prometheus/Grafana dashboards + Loki logging
- [ ] Kubernetes deploy to ArvanCloud
- [ ] Backup strategy (pg_dump → object storage), restore runbook
- [ ] Load testing to Phase 1 targets

---

## Definition of Done (per feature)
1. Typed contract in `packages/types`
2. Validated DTOs (`class-validator` + Zod)
3. Service unit tests + e2e for endpoints
4. RBAC + audit applied
5. Swagger documented
6. UI wired with loading/error states
