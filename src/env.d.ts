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

/** Set by the pre-paint theme script inlined in BaseLayout.astro's <head>. */
interface PortfolioThemeGlobal {
  get(): 'light' | 'dark' | 'auto';
  set(mode: 'light' | 'dark' | 'auto'): void;
  cycle(): 'light' | 'dark' | 'auto';
}

// This file has no top-level import/export, which makes it an ambient script
// (not a module) as far as TypeScript is concerned — so these augment the
// global `Window`/`WindowEventMap` directly, same as ImportMeta above, rather
// than through a `declare global {}` block (which requires a module scope).
interface Window {
  PortfolioTheme?: PortfolioThemeGlobal;
}

interface WindowEventMap {
  'portfolio-theme-change': CustomEvent<'light' | 'dark' | 'auto'>;
}
