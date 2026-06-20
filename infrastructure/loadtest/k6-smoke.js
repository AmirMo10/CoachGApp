/**
 * k6 load test for Coach"G" — smoke + ramp to a slice of Phase-1 targets.
 * Run: k6 run -e BASE=http://localhost:4000 infrastructure/loadtest/k6-smoke.js
 *
 * Phase-1 target: 100 coaches / 5,000 clients. This exercises the hot read
 * paths (health, login, clients) under a ramping virtual-user load and asserts
 * latency/error SLOs via thresholds.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE || 'http://localhost:4000';

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<400'], // 95% under 400ms
  },
};

function login() {
  const res = http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify({ email: 'coach@coachg.dev', password: 'password123' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  return res.json('accessToken');
}

export function setup() {
  return { token: login() };
}

export default function (data) {
  const health = http.get(`${BASE}/api/v1/health`);
  check(health, { 'health ok': (r) => r.status === 200 });

  if (data.token) {
    const clients = http.get(`${BASE}/api/v1/clients`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    check(clients, { 'clients ok': (r) => r.status === 200 });
  }
  sleep(1);
}
