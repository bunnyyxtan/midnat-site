import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ALL_PUBLIC_ROUTES } from '@/lib/site-map';

/**
 * The certification blocker this pins: vercel.json rewrites every path to
 * /index.html, so an HTTP-only sweep sees `200 OK` + identical HTML for a real
 * route and an invented one and reports both as PASS. The real verdict is the
 * client-rendered identity, and the routing that produces it lives in three
 * source files. These tests hold that routing in place so the browser harness
 * (scripts/live-audit/route-truth.mjs) keeps meaning something:
 *
 *   - App.tsx must still end its Switch with a catch-all NotFound route, or an
 *     invented path renders a real page and the whole distinction collapses.
 *   - not-found.tsx must still carry the exact marker strings the harness greps
 *     for, or the harness silently stops recognising the 404.
 *   - every route in site-map.ts must resolve to a real component import in
 *     App.tsx, or a listed page 404s in production.
 *   - the harness itself must keep both core assertions, so nobody can delete
 *     the invented-path check or the real-vs-invented difference check and
 *     still pass CI.
 *
 * Source-scanning only: there is no DOM stack in this package, so these assert
 * on source text, exactly like site-truth.test.ts.
 */

const here = dirname(fileURLToPath(import.meta.url));
const SRC = here;
const REPO_ROOT = join(SRC, '..', '..', '..');

const APP_TSX = readFileSync(join(SRC, 'App.tsx'), 'utf8');
const NOT_FOUND_TSX = readFileSync(join(SRC, 'pages', 'not-found.tsx'), 'utf8');
const HARNESS_PATH = join(REPO_ROOT, 'scripts', 'live-audit', 'route-truth.mjs');
const HARNESS = existsSync(HARNESS_PATH) ? readFileSync(HARNESS_PATH, 'utf8') : '';

/** The exact strings the harness treats as the NotFound fingerprint. */
const NOT_FOUND_MARKERS = ['Error 404', 'Nothing is listed at this address'];

describe('the router still falls through to NotFound', () => {
  it('ends its Switch with a catch-all NotFound route', () => {
    const switchStart = APP_TSX.indexOf('<Switch>');
    const switchEnd = APP_TSX.indexOf('</Switch>');
    expect(switchStart, 'App.tsx has a <Switch>').toBeGreaterThan(-1);
    expect(switchEnd, 'App.tsx closes its <Switch>').toBeGreaterThan(switchStart);

    const body = APP_TSX.slice(switchStart, switchEnd);
    const routes = [...body.matchAll(/<Route\b[^>]*\/?>/g)].map((m) => m[0]);
    expect(routes.length, 'the Switch registers routes').toBeGreaterThan(0);

    // A catch-all in wouter is a <Route> with no `path` attribute. It must be
    // the LAST route, or the routes after it are unreachable and, worse, the
    // catch-all could swallow a real path.
    const last = routes[routes.length - 1];
    expect(last, 'the final route is the catch-all').not.toMatch(/\bpath=/);
    expect(last, 'the catch-all renders NotFound').toMatch(/component=\{NotFound\}/);
  });

  it('imports the NotFound component it falls through to', () => {
    expect(APP_TSX).toMatch(/import\s+NotFound\s+from\s+'@\/pages\/not-found'/);
  });
});

describe('the 404 page keeps the markers the harness greps for', () => {
  for (const marker of NOT_FOUND_MARKERS) {
    it(`not-found.tsx still contains: "${marker}"`, () => {
      expect(
        NOT_FOUND_TSX.includes(marker),
        `not-found.tsx must contain "${marker}" or the harness stops recognising the 404`,
      ).toBe(true);
    });
  }
});

describe('every listed route resolves to a component in the router', () => {
  const ROUTE_PATHS = new Set(
    [...APP_TSX.matchAll(/<Route\s+path="([^"]+)"\s+component=\{([^}]+)\}/g)].map((m) => m[1]),
  );

  it('registers a <Route> for every route in site-map.ts', () => {
    const missing = ALL_PUBLIC_ROUTES.filter((r) => !ROUTE_PATHS.has(r));
    expect(missing, 'a site-map route has no <Route> in App.tsx').toEqual([]);
  });

  it('binds every registered route to a component that is imported', () => {
    const imported = new Set(
      [...APP_TSX.matchAll(/import\s+([A-Za-z0-9_]+)\s+from\s+'@\/pages\/[^']+'/g)].map((m) => m[1]),
    );
    const boundToRoute = [...APP_TSX.matchAll(/<Route[^>]*component=\{([A-Za-z0-9_]+)\}/g)].map((m) => m[1]);
    expect(boundToRoute.length, 'routes bind components').toBeGreaterThan(0);
    const unresolved = boundToRoute.filter((name) => !imported.has(name));
    expect(unresolved, 'a route binds a component that is never imported').toEqual([]);
  });
});

describe.skipIf(HARNESS.length === 0)('the workspace route harness cannot be gutted and still pass CI', () => {
  it('exists and is a runnable module', () => {
    expect(HARNESS.length, 'scripts/live-audit/route-truth.mjs is not empty').toBeGreaterThan(0);
    expect(HARNESS).toMatch(/from 'playwright-core'/);
  });

  it('keeps the invented-path assertion (invented paths must render NotFound)', () => {
    expect(HARNESS, 'the harness names the canonical invented path').toContain(
      '/completely-invented-random-page',
    );
    // The assertion that an invented path IS the NotFound page.
    expect(
      /need\(\s*`invented [^`]*`,\s*r\.notFound/.test(HARNESS),
      'the harness must assert invented paths render NotFound',
    ).toBe(true);
  });

  it('keeps the real-vs-invented difference assertion', () => {
    expect(
      /need\(\s*`differ /.test(HARNESS) && /identitiesDiffer|identitiesDiffer|identityKey\(real\) !== identityKey\(invented\)/.test(HARNESS),
      'the harness must assert a real route and an invented one render DIFFERENT identities',
    ).toBe(true);
  });

  it('records HTTP status but states it is not the verdict', () => {
    expect(HARNESS, 'the harness records the response status').toMatch(/resp\.status\(\)/);
    expect(HARNESS, 'the harness states status is not the verdict').toMatch(/statusIsNotTheVerdict/);
  });

  it('greps for the same 404 markers not-found.tsx defines', () => {
    for (const marker of NOT_FOUND_MARKERS) {
      expect(HARNESS, `the harness looks for "${marker}"`).toContain(marker);
    }
  });
});
