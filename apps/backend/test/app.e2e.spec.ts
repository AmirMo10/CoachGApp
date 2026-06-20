import 'reflect-metadata';
import { execSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { hashPassword } from '../src/auth/password';

/**
 * End-to-end tests for authentication, RBAC, and ownership.
 *
 * Requires a Postgres reachable via DATABASE_URL (CI provides a service; locally
 * run with DATABASE_URL set). The suite resets + seeds the DB in beforeAll, so
 * point it at a disposable database. It is skipped when DATABASE_URL is absent
 * so the default `pnpm test` (no DB) stays green.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('Coach"G" API (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let otherCoachClientId: string;

  const login = async (email: string, password = 'password123'): Promise<string> => {
    const res = await request(server).post('/api/v1/auth/login').send({ email, password });
    expect(res.status).toBe(201);
    return res.body.accessToken as string;
  };

  beforeAll(async () => {
    process.env.AUTH_PROVIDER = 'local';
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-secret';
    process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? 'e2e-encryption-key';

    // Reset + seed a disposable database.
    execSync('npx prisma db push --force-reset --skip-generate', { cwd: process.cwd(), stdio: 'ignore' });
    execSync('npx prisma db seed', { cwd: process.cwd(), stdio: 'ignore' });

    // A second coach with their own client, to prove cross-coach isolation.
    const prisma = new PrismaClient();
    const coach2 = await prisma.user.create({
      data: {
        email: 'coach2@coachg.dev',
        role: 'COACH',
        passwordHash: hashPassword('password123'),
        coachProfile: { create: { businessName: 'Rival Coaching' } },
      },
      include: { coachProfile: true },
    });
    const client2 = await prisma.clientProfile.create({
      data: { coachId: coach2.coachProfile!.id, firstName: 'Bob', lastName: 'Rival' },
    });
    otherCoachClientId = client2.id;
    await prisma.$disconnect();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('authentication', () => {
    it('health is public', async () => {
      await request(server).get('/api/v1/health').expect(200);
    });

    it('rejects protected routes without a token (401)', async () => {
      await request(server).get('/api/v1/clients').expect(401);
    });

    it('rejects invalid credentials (401)', async () => {
      await request(server)
        .post('/api/v1/auth/login')
        .send({ email: 'coach@coachg.dev', password: 'wrongpassword' })
        .expect(401);
    });

    it('logs in a coach and returns a token', async () => {
      const token = await login('coach@coachg.dev');
      expect(token).toBeTruthy();
      const me = await request(server).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
      expect(me.status).toBe(200);
      expect(me.body.role).toBe('COACH');
    });
  });

  describe('RBAC', () => {
    it('allows admin to read platform analytics', async () => {
      const token = await login('admin@coachg.dev');
      await request(server).get('/api/v1/admin/analytics').set('Authorization', `Bearer ${token}`).expect(200);
    });

    it('forbids a coach from admin endpoints (403)', async () => {
      const token = await login('coach@coachg.dev');
      await request(server).get('/api/v1/admin/analytics').set('Authorization', `Bearer ${token}`).expect(403);
    });

    it('forbids a client from admin endpoints (403)', async () => {
      const token = await login('client@coachg.dev');
      await request(server).get('/api/v1/admin/analytics').set('Authorization', `Bearer ${token}`).expect(403);
    });

    it('forbids a client from creating other clients (403)', async () => {
      const token = await login('client@coachg.dev');
      await request(server)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'X', lastName: 'Y' })
        .expect(403);
    });
  });

  describe('ownership', () => {
    it('lets a coach read their own client', async () => {
      const token = await login('coach@coachg.dev');
      await request(server)
        .get('/api/v1/clients/seed-client-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it("forbids a coach from another coach's client (403)", async () => {
      const token = await login('coach@coachg.dev');
      await request(server)
        .get(`/api/v1/clients/${otherCoachClientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns 404 for a non-existent client', async () => {
      const token = await login('coach@coachg.dev');
      await request(server)
        .get('/api/v1/clients/does-not-exist')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('lets a client read their own profile but not others', async () => {
      const token = await login('client@coachg.dev');
      await request(server)
        .get('/api/v1/clients/seed-client-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      await request(server)
        .get(`/api/v1/clients/${otherCoachClientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
