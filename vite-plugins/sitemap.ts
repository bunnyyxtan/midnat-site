import type { Plugin } from 'vite';

import { ALL_PUBLIC_ROUTES, SITE_URL } from '../src/lib/site-map';

/**
 * Generates sitemap.xml and robots.txt from the site map so the two can never
 * drift from the router. A route added to ALL_PUBLIC_ROUTES appears here on the
 * next build; a route removed disappears. Nothing is hand maintained.
 *
 * Priorities are deliberately coarse. Search engines treat them as a hint about
 * relative importance inside one site, so three bands are enough: the entry
 * page, the pages that explain the protocol, and everything else.
 */
function priorityFor(route: string): string {
  if (route === '/') return '1.0';
  if (route === '/protocol' || route === '/docs' || route === '/whitepaper') return '0.9';
  if (route.startsWith('/legal')) return '0.3';
  return '0.6';
}

function buildSitemap(lastmod: string): string {
  const urls = ALL_PUBLIC_ROUTES.map((route) => {
    const loc = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`;
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <priority>${priorityFor(route)}</priority>`,
      '  </url>',
    ].join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildRobots(): string {
  return [
    '# MIDNAT',
    '#',
    '# Everything public is indexable. The application itself lives on a separate',
    '# origin and is not covered by this file.',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');
}

export function sitemapPlugin(): Plugin {
  const lastmod = new Date().toISOString().slice(0, 10);

  return {
    name: 'midnat-sitemap',

    // Dev and preview serve the same bytes the build emits, so a broken sitemap
    // is visible before it ships rather than after.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        if (url.endsWith('/sitemap.xml')) {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.end(buildSitemap(lastmod));
          return;
        }
        if (url.endsWith('/robots.txt')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(buildRobots());
          return;
        }
        next();
      });
    },

    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(lastmod) });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobots() });
    },
  };
}
