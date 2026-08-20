import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Host routing: what the CDN answers before React ever runs.
 *
 * THE BUG THIS PINS. The site shipped with one rewrite, `/(.*)` ->
 * /index.html. That is the standard SPA recipe and it is why an invented URL
 * answered `HTTP 200` with the NotFound screen: a human saw the truth, while
 * every crawler, uptime monitor, link checker and status-code audit was told
 * the page exists. route-truth.test.ts pins the client-rendered identity; this
 * file pins the status code that wraps it.
 *
 * THE FIX. Rewrite only the paths the router actually declares. A genuinely
 * unknown path then matches no rewrite, misses the filesystem, and is served
 * dist/404.html -- emitted by the spa-404 plugin as a copy of the built shell
 * -- with a real 404. Same MIDNAT NotFound screen, honest status.
 *
 * THE COST OF THAT FIX, and why this test exists. The route list now lives in
 * two places: App.tsx and vercel.json. A route added to one and not the other
 * is invisible in development (vite serves everything) and only fails in
 * production, as a 404 on a real page. These tests fail the build instead.
 *
 * Source-scanning only, exactly like route-truth.test.ts: this package has no
 * DOM stack, and vercel.json is data, not code.
 */

const here = dirname(fileURLToPath(import.meta.url));
const PKG = join(here, '..');

const APP_TSX = readFileSync(join(here, 'App.tsx'), 'utf8');
const VITE_CONFIG = readFileSync(join(PKG, 'vite.config.ts'), 'utf8');
const SPA_404 = readFileSync(join(PKG, 'vite-plugins', 'spa-404.ts'), 'utf8');
const VERCEL = JSON.parse(readFileSync(join(PKG, 'vercel.json'), 'utf8')) as {
  trailingSlash?: boolean;
  rewrites?: { source: string; destination: string }[];
  headers?: { source: string; headers: { key: string; value: string }[] }[];
};

/** Every path the wouter Switch declares, in source order. */
const ROUTER_PATHS = [...APP_TSX.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);

const REWRITES = VERCEL.rewrites ?? [];
const REWRITE_SOURCES = REWRITES.map((r) => r.source);

/**
 * Patterns that would restore the original defect: anything that matches paths
 * the router never declared. Written as literals because these are the exact
 * shapes a future edit reaches for when "the SPA 404s in production".
 */
const CATCH_ALL_SHAPES = ['/(.*)', '/:path*', '/(.+)', '/:path+', '/*'];

describe('the rewrite table and the router agree', () => {
  it('declares routes at all', () => {
    expect(ROUTER_PATHS.length, 'App.tsx declares <Route path=...> entries').toBeGreaterThan(10);
    expect(REWRITES.length, 'vercel.json declares rewrites').toBeGreaterThan(10);
  });

  it('rewrites every route the router declares', () => {
    const missing = ROUTER_PATHS.filter((p) => !REWRITE_SOURCES.includes(p));
    expect(
      missing,
      'these routes render in dev but would 404 on the deployed site: add them to vercel.json rewrites',
    ).toEqual([]);
  });

  it('does not rewrite paths the router cannot render', () => {
    const orphans = REWRITE_SOURCES.filter((s) => !ROUTER_PATHS.includes(s));
    expect(
      orphans,
      'these rewrites serve the SPA shell with HTTP 200 for a path that renders NotFound',
    ).toEqual([]);
  });

  it('sends every rewrite to the built shell', () => {
    const wrong = REWRITES.filter((r) => r.destination !== '/index.html');
    expect(wrong, 'a rewrite points somewhere other than /index.html').toEqual([]);
  });

  it('has no catch-all rewrite (the shape that made invented paths answer 200)', () => {
    const catchAlls = REWRITE_SOURCES.filter((s) => CATCH_ALL_SHAPES.includes(s));
    expect(
      catchAlls,
      'a catch-all rewrite makes every invented URL answer HTTP 200 with the NotFound screen',
    ).toEqual([]);
    // Belt and braces: no source may contain a wildcard segment at all. Every
    // MIDNAT route is a fixed literal path, so a wildcard can only be a
    // reintroduction of the defect.
    const wildcards = REWRITE_SOURCES.filter((s) => /[(*+:]/.test(s));
    expect(wildcards, 'rewrite sources must be literal paths').toEqual([]);
  });

  it('normalises trailing slashes so literal sources always match', () => {
    // Without this, /docs/ and /docs are different requests and only one of
    // them hits a rewrite -- the other would 404 despite being a real page.
    expect(VERCEL.trailingSlash, 'vercel.json must pin trailingSlash').toBe(false);
  });
});

describe('the 404 shell is actually produced', () => {
  it('wires the spa-404 plugin into the build', () => {
    expect(VITE_CONFIG).toMatch(/import\s*\{\s*spa404\s*\}\s*from\s*'\.\/vite-plugins\/spa-404'/);
    expect(VITE_CONFIG, 'spa404() must be in the plugins array').toMatch(/spa404\(\)/);
  });

  it('copies the built index.html rather than shipping a hand-written shell', () => {
    // A checked-in public/404.html would reference asset filenames that change
    // every build, so the 404 response would boot nothing.
    expect(SPA_404).toMatch(/copyFileSync/);
    expect(SPA_404).toMatch(/404\.html/);
    expect(SPA_404).toMatch(/index\.html/);
  });

  it('fails the build instead of silently skipping the copy', () => {
    expect(SPA_404, 'a missing index.html must throw, not warn').toMatch(/throw new Error/);
  });
});

describe('security headers stay attached to every response', () => {
  const blanket = (VERCEL.headers ?? []).find((h) => h.source === '/(.*)');

  it('applies one header block to all paths, including the 404 shell', () => {
    expect(blanket, 'vercel.json must keep a /(.*) headers block').toBeTruthy();
  });

  for (const key of [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'X-Frame-Options',
    'Permissions-Policy',
  ]) {
    it(`still sends ${key}`, () => {
      expect(blanket?.headers.some((h) => h.key === key), `${key} is missing`).toBe(true);
    });
  }

  it('keeps the CSP free of a wildcard default-src', () => {
    const csp = blanket?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp, "a wildcard default-src would make the policy decorative").not.toMatch(
      /default-src[^;]*\*/,
    );
    expect(csp, 'script-src must not be widened to a wildcard').not.toMatch(/script-src[^;]*\*/);
  });
});
