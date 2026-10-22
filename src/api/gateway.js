import { BRAND } from "../config/brand";

/**
 * Client for the Plexa DB Gateway (see /gateway). All data shown in the app
 * comes from here — there is no client-side sample data.
 */

const STORAGE_KEY = "plexa.session";

// The web build served by the gateway talks to its own origin (and `npm run dev`
// proxies /api). The native app has no gateway of its own: it starts on the public demo.
const isNative = () => !!window.Capacitor?.isNativePlatform?.();
export const defaultBaseUrl = () => (isNative() ? BRAND.demoGatewayUrl : "");

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

let session = readSession();
if (session.baseUrl === undefined) session.baseUrl = defaultBaseUrl();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Private mode: the session simply won't survive a reload.
  }
}

export function getSession() {
  return session;
}

export function setGatewayUrl(url) {
  session = { ...session, baseUrl: (url || "").trim().replace(/\/+$/, "") };
  persist();
}

export function setAuth(token, user) {
  session = { ...session, token, user };
  persist();
}

export function logout() {
  session = { baseUrl: session.baseUrl };
  persist();
}

export class GatewayError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = "GET", body, auth = true, baseUrl } = {}) {
  const base = baseUrl ?? session.baseUrl ?? defaultBaseUrl();
  const headers = { "Content-Type": "application/json" };
  if (auth && session.token) headers.Authorization = `Bearer ${session.token}`;
  let res;
  try {
    res = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new GatewayError("NETWORK", 0);
  }
  const data = await res.json().catch(() => null);
  // A proxy in front of a stopped gateway (Vite dev server, nginx) answers 502-504 without JSON.
  if (!data && [502, 503, 504].includes(res.status)) throw new GatewayError("NETWORK", res.status);
  if (!res.ok) {
    if (res.status === 401 && auth) onUnauthorized();
    const detail = data?.detail;
    const message = Array.isArray(detail) ? detail.map((d) => d.msg).join("; ") : detail || `HTTP ${res.status}`;
    throw new GatewayError(message, res.status);
  }
  return data;
}

const q = (params) => new URLSearchParams(params).toString();

export const api = {
  health: (baseUrl) => request("/api/health", { auth: false, baseUrl }),
  setup: (username, password, setupCode) =>
    request("/api/auth/setup", { method: "POST", auth: false, body: { username, password, setupCode } }),
  login: (username, password) => request("/api/auth/login", { method: "POST", auth: false, body: { username, password } }),
  me: () => request("/api/auth/me"),

  drivers: () => request("/api/drivers"),
  connections: () => request("/api/connections"),
  createConnection: (c) => request("/api/connections", { method: "POST", body: c }),
  updateConnection: (id, c) => request(`/api/connections/${id}`, { method: "PUT", body: c }),
  deleteConnection: (id) => request(`/api/connections/${id}`, { method: "DELETE" }),
  testDraft: (c) => request("/api/connections/test", { method: "POST", body: c }),
  testConnection: (id) => request(`/api/connections/${id}/test`, { method: "POST" }),

  query: (id, sql, maxRows) => request(`/api/connections/${id}/query`, { method: "POST", body: { sql, maxRows } }),
  schemas: (id) => request(`/api/connections/${id}/schemas`),
  tables: (id, schema) => request(`/api/connections/${id}/tables?${q({ schema })}`),
  columns: (id, schema, table) => request(`/api/connections/${id}/columns?${q({ schema, table })}`),

  audit: (limit = 500) => request(`/api/audit?${q({ limit })}`),
  verifyAudit: () => request("/api/audit/verify"),
  users: () => request("/api/users"),
  createUser: (u) => request("/api/users", { method: "POST", body: u }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: "DELETE" }),
};

/** Turns {columns, rows} from the gateway into row objects for the grid and exports. */
export function toRecords(result) {
  if (!result) return [];
  return result.rows.map((r) => Object.fromEntries(result.columns.map((c, i) => [c, r[i]])));
}
