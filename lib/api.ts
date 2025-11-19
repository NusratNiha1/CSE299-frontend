// Frontend API client to interact with backend instead of direct Supabase usage
// Uses fetch; adjust BASE_URL via EXPO_PUBLIC_API_URL or fallback localhost.

// Avoid Node type dependency in Expo TypeScript by declaring a minimal process shape
declare const process: { env?: Record<string, string | undefined> };
const BASE_URL = (process?.env?.EXPO_PUBLIC_API_URL as string) || 'http://192.168.0.232:4000';

interface ApiOptions {
  method?: string;
  token?: string | null;
  body?: any;
}

async function api(path: string, opts: ApiOptions = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    const message = json?.error || res.statusText;
    throw new Error(message);
  }
  return json;
}

export async function register(email: string, password: string, name?: string) {
  return api('/auth/register', { method: 'POST', body: { email, password, name } });
}

export async function login(email: string, password: string) {
  return api('/auth/login', { method: 'POST', body: { email, password } });
}

export async function getMe(token: string) {
  return api('/auth/me', { token });
}

export async function updateMe(token: string, data: { name?: string }) {
  return api('/auth/me', { method: 'PATCH', token, body: data });
}

export async function listDevices(token: string) {
  return api('/devices', { token });
}

export async function createMonitoring(token: string, payload: { deviceId: string; metrics?: any; status?: string }) {
  return api('/monitoring', { method: 'POST', token, body: payload });
}

export { BASE_URL };