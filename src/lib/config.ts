/* Cross-site URLs.

   This site is midnat.xyz. The trading terminal is a separate deployment on
   its own host, so every link into it is absolute and leaves this origin. The
   host is written down once, here, and nowhere else.

   The default below is the terminal's permanent home. VITE_APP_URL overrides
   it at build time, because which host answers for the terminal is a DNS fact
   rather than a code fact: while app.midnat.xyz is still being pointed at the
   terminal, a build can be aimed at the origin actually serving it without
   editing this file and without that temporary origin entering the project source.
   vite.config.ts validates the override, so a malformed one fails the build
   instead of shipping dead links and a reference feed that can never answer.

   The guard around import.meta.env is load-bearing. This module is reached
   from vite.config.ts through the sitemap plugin, so it is executed by Node
   while the config loads, and import.meta.env exists only in the browser
   bundle. Reading it unguarded crashes config loading, which takes down the
   dev server and the build before a single file is written. */
const DEFAULT_APP_URL = 'https://app.midnat.xyz';

const override = typeof import.meta.env === 'undefined' ? undefined : import.meta.env.VITE_APP_URL;

/** Origin of the trading terminal, with no trailing slash. */
export const APP_URL: string =
  typeof override === 'string' && override.trim() !== ''
    ? override.trim().replace(/\/+$/, '')
    : DEFAULT_APP_URL;

/** Absolute URL of a terminal route. Every cross-site link to the terminal
    goes through here rather than interpolating APP_URL at the call site. */
export function appHref(route = '/'): string {
  const path = route.startsWith('/') ? route : `/${route}`;
  return `${APP_URL}${path}`;
}
