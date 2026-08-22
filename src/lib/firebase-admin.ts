import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Server-only — verifies the ID token a signed-in visitor's browser sends up,
// so /admin routes and write endpoints can trust "this really is the owner"
// without ever handing the browser anything more privileged than a normal
// Firebase Auth session. The service account JSON lives only in Vercel's
// server env, never shipped to the client (contrast with firebase-client.ts's
// PUBLIC_ config, which is not secret).
let app: App | null = null;

function getAdminApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }
  const json = import.meta.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured — see .env.example');
  app = initializeApp({ credential: cert(JSON.parse(json)) });
  return app;
}

export interface AdminSession {
  uid: string;
  email: string | null;
}

export const SESSION_COOKIE_NAME = '__session';
/** 5 days — Firebase's own cap for session cookies is 14 days; picking well under that means a stale browser tab re-prompts sign-in on a predictable cadence rather than right at the ceiling. */
export const SESSION_COOKIE_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * Exchanges a freshly-signed-in client's short-lived (~1hr) ID token for a
 * long-lived session cookie value. The client only ever sees this once, right
 * after sign-in (see /api/session) — every later request is gated by
 * verifySessionCookie below, not by the browser holding onto the ID token.
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  return getAuth(getAdminApp()).createSessionCookie(idToken, { expiresIn: SESSION_COOKIE_MAX_AGE_MS });
}

/** Verifies the `__session` cookie value on an incoming request. Returns null if missing, expired, or revoked. */
export async function verifySessionCookie(cookieValue: string | undefined): Promise<AdminSession | null> {
  if (!cookieValue) return null;
  try {
    const decoded = await getAuth(getAdminApp()).verifySessionCookie(cookieValue, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
}
