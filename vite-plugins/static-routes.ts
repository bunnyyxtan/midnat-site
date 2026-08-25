import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Plugin } from 'vite';

import { ALL_PUBLIC_ROUTES, SITE_URL } from '../src/lib/site-map';
import { STATIC_ROUTE_META, documentTitle } from '../src/lib/route-meta';

const SOCIAL_IMAGE = `${SITE_URL}/og-preview.png`;

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

function setMeta(html: string, selector: string, value: string): string {
  const escaped = escapeHtml(value);
  const pattern = new RegExp(`<meta (${selector}) content="[^"]*"\\s*/?>`);
  if (!pattern.test(html)) throw new Error(`midnat-static-routes: shell is missing meta ${selector}`);
  return html.replace(pattern, `<meta $1 content="${escaped}" />`);
}

function setLink(html: string, rel: string, href: string): string {
  const pattern = new RegExp(`<link rel="${rel}" href="[^"]*"\\s*/?>`);
  if (!pattern.test(html)) throw new Error(`midnat-static-routes: shell is missing link rel=${rel}`);
  return html.replace(pattern, `<link rel="${rel}" href="${escapeHtml(href)}" />`);
}

export function routeOutputPath(route: string): string {
  return route === '/' ? 'index.html' : `${route.slice(1)}.html`;
}

export function renderStaticRoute(shell: string, route: string): string {
  const meta = STATIC_ROUTE_META[route];
  if (!meta) throw new Error(`midnat-static-routes: no metadata for ${route}`);

  const title = documentTitle(route, meta.title);
  const canonical = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`;
  let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, 'name="description"', meta.description);
  html = setMeta(html, 'property="og:title"', title);
  html = setMeta(html, 'property="og:description"', meta.description);
  html = setMeta(html, 'property="og:type"', meta.type);
  html = setMeta(html, 'property="og:url"', canonical);
  html = setMeta(html, 'name="twitter:title"', title);
  html = setMeta(html, 'name="twitter:description"', meta.description);
  html = setLink(html, 'canonical', canonical);

  const fallback = [
    '<main data-static-route-fallback>',
    `  <h1>${escapeHtml(meta.title)}</h1>`,
    `  <p>${escapeHtml(meta.description)}</p>`,
    '</main>',
  ].join('\n');
  if (!html.includes('<div id="root"></div>')) {
    throw new Error('midnat-static-routes: shell root is not empty');
  }
  return html.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
}

/** Emits one crawler-readable HTML document per declared route. */
export function staticRoutes(): Plugin {
  let outDir = '';
  return {
    name: 'midnat-static-routes',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const indexPath = resolve(outDir, 'index.html');
      const shell = readFileSync(indexPath, 'utf8');
      const missingMeta = ALL_PUBLIC_ROUTES.filter((route) => !STATIC_ROUTE_META[route]);
      if (missingMeta.length) {
        throw new Error(`midnat-static-routes: routes without metadata: ${missingMeta.join(', ')}`);
      }
      for (const route of ALL_PUBLIC_ROUTES) {
        const output = resolve(outDir, routeOutputPath(route));
        mkdirSync(dirname(output), { recursive: true });
        writeFileSync(output, renderStaticRoute(shell, route));
      }
    },
  };
}
