# Multi-stage build for the Coach"G" NestJS backend.
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# ── deps ──
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/types/package.json packages/types/
COPY packages/shared/package.json packages/shared/
COPY services/ai/package.json services/ai/
COPY services/program-generator/package.json services/program-generator/
COPY services/nutrition-engine/package.json services/nutrition-engine/
COPY services/recovery-engine/package.json services/recovery-engine/
COPY services/report-engine/package.json services/report-engine/
RUN pnpm install --frozen-lockfile || pnpm install

# ── build ──
FROM deps AS build
COPY . .
RUN pnpm --filter @coachg/backend prisma generate
RUN pnpm --filter @coachg/backend build

# ── runtime ──
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/prisma ./prisma
COPY --from=build /app/apps/backend/package.json ./
EXPOSE 4000
CMD ["node", "dist/main.js"]
