# Coach"G" — Deployment Guide (ArvanCloud)

Coach"G" is designed for **self-hosting on ArvanCloud**. No AWS-managed services are used; object storage is S3-compatible (ArvanCloud Object Storage), with MinIO for local development.

## Environments
| Env | Orchestration | Notes |
| --- | ------------- | ----- |
| Local dev | Docker Compose (`docker-compose.dev.yml`) | Postgres, Redis, Keycloak, MinIO |
| Staging | Docker Compose (`docker-compose.data.yml` + `docker-compose.prod.yml`) | Data tier and app tier are **separate stacks** so app rebuilds never touch the DB; Nginx + Let's Encrypt |
| Production | Kubernetes (`infrastructure/kubernetes`) | ArvanCloud managed K8s, horizontal scaling |

> **Data safety:** On the single-node/staging setup, PostgreSQL and Redis live in a
> dedicated stack (`docker-compose.data.yml`) with **external** volumes and an external
> shared network. Because Compose refuses to remove external volumes, `docker compose
> down -v` on the app stack — or any rebuild — cannot delete the database. The two
> stacks communicate over the shared `coachg` network using the service names
> `postgres` and `redis`.

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
- ArvanCloud Object Storage bucket + access keys → set `S3_*` envs (`S3_ENDPOINT` to the ArvanCloud endpoint, `S3_FORCE_PATH_STYLE=true`). Configure bucket **CORS** to allow `PUT`/`GET` from the frontend origin so browser presigned uploads/downloads work (dev MinIO allows this out of the box via the `minio-init` service).
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

## 3a. Single-node / staging via Docker Compose
The data tier and the application tier are **separate stacks** so that redeploying or
rebuilding the app can never destroy the database.

```bash
# One-time host bootstrap: create the shared network and the persistent (external) volumes.
docker network create coachg
docker volume create coachg_pgdata
docker volume create coachg_redisdata

# 1) Bring up the long-lived data tier (Postgres + Redis). Rarely restarted.
docker compose -f infrastructure/docker/docker-compose.data.yml --env-file ../../.env up -d

# 2) Build & deploy the app tier. Safe to repeat on every release — DB is untouched.
docker compose -f infrastructure/docker/docker-compose.prod.yml --env-file ../../.env up -d --build
```

Redeploying the app is just step 2 again (optionally `down` first):
```bash
docker compose -f infrastructure/docker/docker-compose.prod.yml down        # app only; data tier keeps running
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d --build
```
Even `docker compose -f docker-compose.prod.yml down -v` is safe: the database volumes
are external and live in the data stack. To intentionally wipe data you must remove the
volumes explicitly: `docker volume rm coachg_pgdata coachg_redisdata`.

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
- **Prometheus** scrapes `GET /api/v1/metrics` (Node defaults + the
  `http_request_duration_seconds` histogram). Config: `infrastructure/monitoring/prometheus.yml`.
- **Grafana** for dashboards (API latency, queue depth, throughput).
- **Loki + Promtail** aggregate container logs (pino → stdout → Promtail → Loki).
- Local/staging: `docker compose -f infrastructure/docker/docker-compose.monitoring.yml up -d`
  (Grafana on `:3001`, Prometheus on `:9090`, Loki on `:3100`).
- Production: `kubectl apply -f infrastructure/kubernetes/monitoring.yaml`.

## 7. Backups
- Scheduled `pg_dump` → gzip → ArvanCloud Object Storage (`backups/` prefix),
  30-day retention: `infrastructure/scripts/backup.sh` (run via cron `0 2 * * *`).
- Restore: `infrastructure/scripts/restore.sh <backup-file.sql.gz>` (downloads,
  confirms, pipes into `psql`).
- Enable object-storage versioning for client documents/reports.

## 9. Load testing
- `k6 run -e BASE=https://coachg.example.com infrastructure/loadtest/k6-smoke.js`
- Ramps to 200 VUs over the hot read paths with SLO thresholds
  (error rate <1%, p95 < 400ms). Scale stages toward Phase-1 targets as needed.

## 8. Scaling checklist (Phase 2 targets: 1k coaches / 50k clients)
- [ ] PgBouncer connection pooling
- [ ] Postgres read replica for analytics/reports
- [ ] Redis cluster
- [ ] CDN in front of object storage for report/photo delivery
- [ ] Worker autoscaling on queue depth
