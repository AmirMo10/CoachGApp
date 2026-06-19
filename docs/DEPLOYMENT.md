# Coach"G" — Deployment Guide (ArvanCloud)

Coach"G" is designed for **self-hosting on ArvanCloud**. No AWS-managed services are used; object storage is S3-compatible (ArvanCloud Object Storage), with MinIO for local development.

## Environments
| Env | Orchestration | Notes |
| --- | ------------- | ----- |
| Local dev | Docker Compose (`docker-compose.dev.yml`) | Postgres, Redis, Keycloak, MinIO |
| Staging | Docker Compose (`docker-compose.prod.yml`) | Single node, Nginx + Let's Encrypt |
| Production | Kubernetes (`infrastructure/kubernetes`) | ArvanCloud managed K8s, horizontal scaling |

## 1. Local development
```bash
cp .env.example .env
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d
pnpm install
pnpm --filter @coachg/backend prisma migrate dev
pnpm --filter @coachg/backend prisma db seed
pnpm dev
```

## 2. Production prerequisites (ArvanCloud)
- ArvanCloud VM(s) or managed Kubernetes cluster
- ArvanCloud Object Storage bucket + access keys → set `S3_*` envs (`S3_ENDPOINT` to the ArvanCloud endpoint, `S3_FORCE_PATH_STYLE=true`)
- Managed PostgreSQL or self-hosted Postgres on a VM with encrypted volume
- DNS A records → Nginx ingress
- Keycloak realm `coachg` with `coachg-backend` (confidential) + `coachg-frontend` (public) clients

## 3. Build & push images
```bash
docker build -f infrastructure/docker/backend.Dockerfile -t registry.arvancloud.ir/coachg/backend:$TAG .
docker build -f infrastructure/docker/frontend.Dockerfile -t registry.arvancloud.ir/coachg/frontend:$TAG .
docker push registry.arvancloud.ir/coachg/backend:$TAG
docker push registry.arvancloud.ir/coachg/frontend:$TAG
```
CI/CD (GitHub Actions, `.github/workflows/ci.yml`) lints, tests, builds, and pushes on tag.

## 4. Kubernetes deploy
```bash
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/secrets.example.yaml   # fill real secrets first
kubectl apply -f infrastructure/kubernetes/postgres.yaml
kubectl apply -f infrastructure/kubernetes/redis.yaml
kubectl apply -f infrastructure/kubernetes/backend.yaml
kubectl apply -f infrastructure/kubernetes/frontend.yaml
kubectl apply -f infrastructure/kubernetes/ingress.yaml
```
- Backend & frontend run as Deployments with HPA (CPU/mem) → horizontal scaling.
- BullMQ workers run as a separate Deployment (`backend --worker`) scaled independently.

## 5. TLS
Nginx + Let's Encrypt via `certbot` (compose) or cert-manager (K8s). See `infrastructure/nginx/`.

## 6. Observability
- **Prometheus** scrapes `/metrics` from backend.
- **Grafana** dashboards for API latency, queue depth, generation throughput.
- **Loki** aggregates structured logs (pino → Loki).
Deploy via `infrastructure/kubernetes/monitoring/` (Phase 7).

## 7. Backups
- `pg_dump` cron → gzip → upload to ArvanCloud Object Storage (`backups/` prefix), 30-day retention.
- Object storage versioning enabled for client documents/reports.
- Restore runbook: pull dump → `pg_restore` into a fresh DB → point app via `DATABASE_URL`.

## 8. Scaling checklist (Phase 2 targets: 1k coaches / 50k clients)
- [ ] PgBouncer connection pooling
- [ ] Postgres read replica for analytics/reports
- [ ] Redis cluster
- [ ] CDN in front of object storage for report/photo delivery
- [ ] Worker autoscaling on queue depth
