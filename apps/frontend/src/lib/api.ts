/** Minimal typed API client for the Coach"G" backend. */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface ApiOptions extends RequestInit {
  token?: string;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = opts;
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message);
  }
  return res.json() as Promise<T>;
}

export interface ClientSummary {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  createdAt: string;
}

export const getClients = (token: string) => api<ClientSummary[]>('/clients', { token });
