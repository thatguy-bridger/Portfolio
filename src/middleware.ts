import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE_NAME, verifySessionCookie, type AdminSession } from './lib/firebase-admin';

declare global {
  namespace App {
    interface Locals {
      /** Set when the request carries a valid admin session cookie; null otherwise. */
      admin: AdminSession | null;
    }
  }
}

/**
 * Runs on every request. Verifies the Firebase session cookie once, up front,
 * and stores the result on locals.admin — every /admin page and every
 * write-capable /api/* endpoint reads that instead of re-verifying itself, so
 * there's exactly one place that decides "is this really the owner."
 * /admin/login is exempt (it's how you get the cookie in the first place).
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const cookie = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  context.locals.admin = await verifySessionCookie(cookie);

  const isAdminRoute = context.url.pathname.startsWith('/admin') && context.url.pathname !== '/admin/login';
  const isProtectedApi = context.url.pathname.startsWith('/api/admin');
  if ((isAdminRoute || isProtectedApi) && !context.locals.admin) {
    if (isProtectedApi) return new Response(JSON.stringify({ error: 'Not signed in' }), { status: 401 });
    return context.redirect('/admin/login');
  }

  return next();
});
