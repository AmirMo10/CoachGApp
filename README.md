# Coach"G" 🏋️

> AI-powered coaching platform for generating personalized training programs, nutrition plans, recovery protocols, and premium athlete reports.

Coach"G" helps coaches scale their business by automatically generating **professional, client-ready** programs using a hybrid engine: a deterministic **Rule Engine + Exercise Database + Periodization Engine**, with an **AI Personalization Layer** (Anthropic Claude) on top for explanations and report writing.

> **Core principle:** AI never determines training logic. All critical business logic lives in rules, services, and the database. Claude is used only for personalization, explanations, report writing, and coach communication.

---

## Tech Stack

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| Frontend       | Next.js, TypeScript, TailwindCSS, shadcn/ui  |
| Backend        | NestJS, TypeScript                           |
| Database       | PostgreSQL + Prisma                          |
| Cache          | Redis                                        |
| Queue          | BullMQ                                        |
| Storage        | ArvanCloud Object Storage (S3-compatible)    |
| Auth           | Keycloak (self-hosted)                        |
| AI             | Anthropic Claude API                         |
| Reports        | React PDF                                     |
| Monitoring     | Prometheus + Grafana                         |
| Logging        | Loki                                         |
| Proxy / SSL    | Nginx + Let's Encrypt                        |
| Deployment     | Docker, Docker Compose, Kubernetes-ready     |
| CI/CD          | GitHub Actions                               |

> **Infrastructure note:** This platform is built for **self-hosting on ArvanCloud**. It deliberately avoids AWS-managed services (Lambda, Cognito, S3, ECS, RDS, DynamoDB, SQS, SNS, Rekognition) in favor of open-source, S3-compatible alternatives.

---

## Monorepo Structure

```
/apps
  /frontend            Next.js web app (coach + client + admin portals)
  /backend             NestJS API (REST + auth + orchestration)
/packages
  /ui                  Shared shadcn/ui component library
  /shared              Shared utilities, constants, validation schemas
  /types               Shared TypeScript types & DTOs
/services
  /ai                  Anthropic Claude integration & prompt orchestration
  /program-generator   Rule engine + program builder
  /nutrition-engine    BMR/TDEE/macros calculators
  /recovery-engine     Sleep/hydration/mobility/deload logic
  /report-engine       React PDF report generation
/infrastructure
  /docker              Dockerfiles & compose files
  /kubernetes          K8s manifests
  /nginx               Reverse proxy & SSL config
/docs                  Architecture, DB, API, roadmap, deployment guides
/.claude
  /agents              Multi-agent system definitions
```

---

## Quick Start (Development)

```bash
# 1. Install dependencies (uses pnpm workspaces)
pnpm install

# 2. Copy environment template
cp .env.example .env

# 3. Start infrastructure (Postgres, Redis, Keycloak, MinIO)
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d

# 4. Run database migrations & seed
pnpm --filter @coachg/backend prisma migrate dev
pnpm --filter @coachg/backend prisma db seed

# 5. Start backend + frontend
pnpm dev
```

- Backend: http://localhost:4000 (Swagger at `/api/docs`)
- Frontend: http://localhost:3000

---

## Documentation

| Document                                       | Description                          |
| ---------------------------------------------- | ------------------------------------ |
| [Architecture](docs/ARCHITECTURE.md)           | System design & data flow            |
| [Database](docs/DATABASE.md)                   | Schema, entities, relationships      |
| [API Specification](docs/API_SPEC.md)          | REST endpoints                       |
| [Roadmap](docs/ROADMAP.md)                     | Phased development plan              |
| [Deployment](docs/DEPLOYMENT.md)               | ArvanCloud production deployment     |
| [Agent System](.claude/agents/README.md)       | Multi-agent collaboration model      |

---

## License

Proprietary — © Coach"G". All rights reserved.
