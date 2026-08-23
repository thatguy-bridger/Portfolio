import type { APIRoute } from 'astro';
import { getSupabase } from '../../lib/supabase-server';

// The ONE place in this app where an unauthenticated request legitimately
// writes to Supabase (see PROJECT_SPEC-style note in the task brief) — every
// other write goes through /api/admin/* behind the Firebase session gate in
// middleware.ts. Because there's no auth checkpoint in front of this
// endpoint, this file itself is the only thing standing between a visitor
// and the database, so validation here is not optional/best-effort the way
// client-side form validation is — it's the real gate.
const MAX_NAME = 200;
const MAX_EMAIL = 320; // RFC 5321 upper bound
const MAX_MESSAGE = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(error: string) {
  return new Response(JSON.stringify({ error }), { status: 400, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Malformed request body.');
  }
  if (!body || typeof body !== 'object') return badRequest('Malformed request body.');

  const { name, email, message } = body as Record<string, unknown>;
  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
    return badRequest('name, email, and message are all required.');
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  if (!trimmedName || !trimmedEmail || !trimmedMessage) return badRequest('name, email, and message are all required.');
  if (trimmedName.length > MAX_NAME) return badRequest(`name must be ${MAX_NAME} characters or fewer.`);
  if (trimmedEmail.length > MAX_EMAIL) return badRequest(`email must be ${MAX_EMAIL} characters or fewer.`);
  if (trimmedMessage.length > MAX_MESSAGE) return badRequest(`message must be ${MAX_MESSAGE} characters or fewer.`);
  if (!EMAIL_RE.test(trimmedEmail)) return badRequest('email is not a valid email address.');

  try {
    const { error } = await getSupabase()
      .from('contact_submissions')
      .insert({ name: trimmedName, email: trimmedEmail, message: trimmedMessage });
    if (error) {
      return new Response(JSON.stringify({ error: 'Could not save your message — please try again.' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }
  } catch {
    // getSupabase() itself throws if env vars aren't configured — surface as
    // a clean 500 rather than letting the request crash.
    return new Response(JSON.stringify({ error: 'Server is not configured correctly.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
