// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// SSR on Vercel: content edits go live on the next page load, no rebuild
// wait. Also lets us keep the Supabase service-role key fully server-side —
// every read of unpublished data and every write happens in an Astro server
// endpoint, never in the browser.
export default defineConfig({
  site: 'https://portfolio.bridgerjones.com',
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
});
