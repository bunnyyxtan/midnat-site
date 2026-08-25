import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { ALL_PUBLIC_ROUTES, SITE_URL } from '@/lib/site-map';
import { STATIC_ROUTE_META } from '@/lib/route-meta';
import { renderStaticRoute, routeOutputPath } from '../vite-plugins/static-routes';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const shell = readFileSync(join(root, 'index.html'), 'utf8');
const llms = readFileSync(join(root, 'public', 'llms.txt'), 'utf8');
const png = readFileSync(join(root, 'public', 'og-preview.png'));
const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')) as {
  rewrites: { source: string; destination: string }[];
};

describe('static route documents', () => {
  it('has metadata for exactly the declared routes', () => {
    expect(Object.keys(STATIC_ROUTE_META).sort()).toEqual([...ALL_PUBLIC_ROUTES].sort());
  });

  it('does not reuse the home identity on inner routes', () => {
    const home = STATIC_ROUTE_META['/'];
    for (const route of ALL_PUBLIC_ROUTES.filter((value) => value !== '/')) {
      expect(STATIC_ROUTE_META[route]?.title, route).not.toBe(home.title);
      expect(STATIC_ROUTE_META[route]?.description, route).not.toBe(home.description);
    }
  });

  for (const route of ALL_PUBLIC_ROUTES) {
    it(`renders crawler-visible identity for ${route}`, () => {
      const html = renderStaticRoute(shell, route);
      const canonical = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`;
      expect(html).toContain(`<link rel="canonical" href="${canonical}"`);
      expect(html).toContain(`<meta property="og:url" content="${canonical}"`);
      expect(html).toContain(`<meta property="og:type" content="${STATIC_ROUTE_META[route]?.type}"`);
      expect(html.match(/<main\b/g)).toHaveLength(1);
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html.indexOf('<h1')).toBeLessThan(html.indexOf('<script type="module"'));
      expect(html).not.toContain('<div id="root"></div>');
    });
  }
});

describe('AI and social assets', () => {
  it('indexes every public route in llms.txt', () => {
    for (const route of ALL_PUBLIC_ROUTES.filter((value) => value !== '/')) {
      expect(llms, route).toContain(`${SITE_URL}${route}`);
    }
  });

  it('ships a non-empty 1200x630 PNG', () => {
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    expect(png.byteLength).toBeGreaterThan(10_000);
  });

  it('has complete static social metadata and JSON-LD', () => {
    for (const marker of [
      'property="og:locale"',
      'property="og:image"',
      'property="og:image:width" content="1200"',
      'property="og:image:height" content="630"',
      'name="twitter:card" content="summary_large_image"',
      'name="twitter:image"',
      'type="application/ld+json"',
    ]) {
      expect(shell).toContain(marker);
    }
  });
});

describe('host destinations', () => {
  it('rewrites every route to its own emitted file', () => {
    const actual = Object.fromEntries(vercel.rewrites.map((rewrite) => [rewrite.source, rewrite.destination]));
    const expected = Object.fromEntries(
      ALL_PUBLIC_ROUTES.map((source) => [source, `/${routeOutputPath(source)}`]),
    );
    expect(actual).toEqual(expected);
  });
});