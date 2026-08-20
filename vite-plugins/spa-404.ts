import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Emits `dist/404.html` as a byte-identical copy of the built `dist/index.html`.
 *
 * WHY THIS EXISTS. The site is a client-routed SPA. The obvious hosting
 * configuration -- rewrite every path to /index.html -- makes an invented URL
 * answer HTTP 200 with the NotFound screen, which tells a human the truth and
 * tells every crawler, uptime monitor and link checker the opposite. Route
 * truth flagged exactly that.
 *
 * The fix is not a redirect and not a server: the host is asked to rewrite only
 * the routes the router actually declares (see vercel.json), so a genuinely
 * unknown path misses every rewrite, falls through to the host's not-found
 * handling, and is served this file with a real 404 status.
 *
 * It must be a build artifact rather than a checked-in public/404.html: the
 * shell references hashed asset filenames that only exist after a build, so a
 * hand-written copy would go stale on the next build and serve a blank page.
 * Copying the emitted index.html means the 404 response boots the same bundle
 * and renders the same MIDNAT NotFound screen the router would have rendered.
 */
export function spa404(): Plugin {
  let indexPath = '';
  let notFoundPath = '';

  return {
    name: 'midnat-spa-404',
    apply: 'build',
    configResolved(config) {
      const outDir = resolve(config.root, config.build.outDir);
      indexPath = resolve(outDir, 'index.html');
      notFoundPath = resolve(outDir, '404.html');
    },
    closeBundle() {
      if (!existsSync(indexPath)) {
        // Loud, not silent: without this file the host serves its own generic
        // 404 and the site loses its own not-found screen.
        throw new Error(
          `midnat-spa-404: expected ${indexPath} to exist after the build, so 404.html cannot be emitted`,
        );
      }
      copyFileSync(indexPath, notFoundPath);
    },
  };
}
