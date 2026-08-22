/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_FIREBASE_API_KEY: string;
  readonly PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  readonly PUBLIC_FIREBASE_PROJECT_ID: string;
  readonly PUBLIC_FIREBASE_APP_ID: string;
  /** Server-only. The Firebase service account, as a single-line JSON string. */
  readonly FIREBASE_SERVICE_ACCOUNT_JSON: string;
  /** Server-only. */
  readonly SUPABASE_URL: string;
  /** Server-only — the service-role key, never exposed to the client. */
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
