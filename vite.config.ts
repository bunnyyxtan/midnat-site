import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

import { sitemapPlugin } from './vite-plugins/sitemap';

/* The trading terminal's origin can be overridden at build time with
   VITE_APP_URL (see src/lib/config.ts). A typo there ships dead "Start
   trading" links and a reference feed that can never answer, so the value is
   checked here, where a bad one still fails the build. Checking it in the
   browser instead would white-screen the site, which is worse than the typo.

   The value is read through loadEnv rather than process.env: this file is
   bundled before it runs and process.env is not reliably present in that
   bundle, so reading it directly gave a check that could never fire. */
function assertAppUrlOverride(raw: string | undefined): void {
  const value = raw?.trim();
  if (!value) return;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `VITE_APP_URL must be an absolute URL such as https://app.midnat.xyz, got ${JSON.stringify(value)}`,
    );
  }
  if (url.protocol !== 'https:') {
    throw new Error(`VITE_APP_URL must use https, got ${JSON.stringify(value)}`);
  }
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    throw new Error(
      `VITE_APP_URL must be a bare origin with no path, query or fragment, got ${JSON.stringify(value)}`,
    );
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_');
  assertAppUrlOverride(env.VITE_APP_URL);

  return {
    base: '/',
    plugins: [react(), tailwindcss(), sitemapPlugin()],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, 'src') },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: { host: '0.0.0.0', port: 5173 },
    preview: { host: '0.0.0.0', port: 4173 },
  };
});
