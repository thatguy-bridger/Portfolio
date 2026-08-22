import type { APIRoute } from 'astro';
import { createSessionCookie, SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_MS } from '../../lib/firebase-admin';

/** Called by the client right after Firebase sign-in succeeds — trades the short-lived ID token for a long-lived HttpOnly session cookie. */
export const POST: APIRoute = async ({ request, cookies }) => {
  const { idToken } = await request.json().catch(() => ({ idToken: undefined }));
  if (typeof idToken !== 'string' || !idToken) {
    return new Response(JSON.stringify({ error: 'Missing idToken' }), { status: 400 });
  }

  let sessionCookie: string;
  try {
    sessionCookie = await createSessionCookie(idToken);
  } catch {
    return new Response(JSON.stringify({ error: 'Could not create a session from that token' }), { status: 401 });
  }

  cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE_MS / 1000,
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

/** Signs the visitor out of the admin session (Firebase's own client-side signOut() is called separately). */
export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
