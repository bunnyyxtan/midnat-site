/* lib/api.ts is the only place this site talks to a server, so two things
   decide whether a live page tells the truth: where the request goes, and
   what the reader does when a static host answers it with a page instead of
   data. Both are covered here, because the bug that produced this module
   looked exactly like a dead API from the outside. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE, apiUrl, getJson } from './api';
import { APP_URL } from './config';

/** A response with the parts getJson reads, and nothing it does not. */
function reply(body: unknown, contentType: string | null, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null) },
    json: async () => body,
  } as unknown as Response;
}

function stubFetch(res: Response): { calls: { url: string; init: RequestInit }[] } {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return res;
  });
  return { calls };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the read API base', () => {
  it('is absolute and points at the terminal, not at this host', () => {
    expect(API_BASE).toBe(`${APP_URL}/api`);
    expect(API_BASE.startsWith('https://')).toBe(true);
  });

  it('joins a route with or without its leading slash, and never doubles it', () => {
    expect(apiUrl('/markets')).toBe(`${API_BASE}/markets`);
    expect(apiUrl('markets')).toBe(`${API_BASE}/markets`);
    expect(apiUrl('/reference-health')).not.toContain('//reference-health');
  });
});

describe('reading JSON from the API', () => {
  it('sends the request to the absolute URL, not to a path on this host', async () => {
    const { calls } = stubFetch(reply({ ok: true }, 'application/json'));
    await getJson('/healthz', new AbortController().signal);
    expect(calls[0]?.url).toBe(`${API_BASE}/healthz`);
    expect(calls[0]?.url.startsWith('https://')).toBe(true);
  });

  it('asks for JSON, refuses a cache, and carries the caller signal', async () => {
    const controller = new AbortController();
    const { calls } = stubFetch(reply({ ok: true }, 'application/json'));
    await getJson('/healthz', controller.signal);
    expect(calls[0]?.init.headers).toEqual({ accept: 'application/json' });
    expect(calls[0]?.init.cache).toBe('no-store');
    expect(calls[0]?.init.signal).toBe(controller.signal);
  });

  it('returns the body when the API answers with JSON', async () => {
    stubFetch(reply({ status: 'live', markets: 3 }, 'application/json; charset=utf-8'));
    await expect(getJson('/healthz', new AbortController().signal)).resolves.toEqual({
      status: 'live',
      markets: 3,
    });
  });

  it('accepts a JSON media type with a suffix', async () => {
    stubFetch(reply({ ok: true }, 'application/vnd.api+json'));
    await expect(getJson('/healthz', new AbortController().signal)).resolves.toEqual({ ok: true });
  });

  it('names the content type when a static host answers with a page', async () => {
    /* The whole reason this module exists: a rewrite returns index.html with
       status 200, so the failure has to say what came back, not die inside a
       JSON parser complaining about an unexpected token. */
    stubFetch(reply('<!doctype html>', 'text/html; charset=utf-8'));
    await expect(getJson('/reference-health', new AbortController().signal)).rejects.toThrow(
      /Expected JSON from \/reference-health, got text\/html/,
    );
  });

  it('refuses a response that declares no content type at all', async () => {
    stubFetch(reply({ ok: true }, null));
    await expect(getJson('/healthz', new AbortController().signal)).rejects.toThrow(/no content type/);
  });

  it('reports the status when the API answers with an error', async () => {
    stubFetch(reply({ error: 'nope' }, 'application/json', 503));
    await expect(getJson('/healthz', new AbortController().signal)).rejects.toThrow(/HTTP 503/);
  });
});
