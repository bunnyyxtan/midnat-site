/* The read API: where it lives, and the only way this site talks to it.

   This site is static. Vercel serves these files and nothing else, and
   vercel.json rewrites every unmatched path to index.html so client routing
   works. That rewrite is what makes a relative API path so dangerous here: a
   fetch of '/api/healthz' does not 404, it returns index.html with status 200,
   and the JSON parse that follows is what fails. The page then reports the API
   as unreachable, which is a lie about a service that is up and answering.

   That is exactly what shipped: the status page held its own '/api' constant
   while the hero read from the terminal's origin, so the same healthy engine
   read as live on one page and dead on the other. It worked in the monorepo,
   where a dev server sat in front of both, and broke the moment the site was
   deployed on its own host.

   So the base is absolute, it is written once, and every read goes through
   getJson below. A page that wants data imports from here or it does not get
   any; site-truth.test.ts fails the build on a fetch that goes anywhere else.

   The terminal's engine sends a permissive CORS header, so a cross-origin read
   from this site is expected and allowed. */
import { APP_URL } from './config';

/** Absolute base of the read API, with no trailing slash. */
export const API_BASE = `${APP_URL}/api`;

/** Absolute URL of a read-API route. */
export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Read JSON from the API, or throw.
 *
 * The content-type check is not ceremony. A static host answering a relative
 * path returns HTML with status 200, and `res.json()` then fails with a syntax
 * error about an unexpected token, which reads like a broken API rather than a
 * misdirected request. Naming the wrong content type keeps the cause visible
 * in the console of whoever is looking.
 */
export async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(apiUrl(path), {
    signal,
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${path}`);
  const type = res.headers.get('content-type') ?? '';
  if (!/\bjson\b/i.test(type)) {
    throw new Error(`Expected JSON from ${path}, got ${type || 'no content type'}`);
  }
  return (await res.json()) as T;
}
