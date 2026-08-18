/* Cross-site URLs.

   This site is midnat.xyz. The trading terminal is a separate deployment on
   its own host, so every link into it is absolute and leaves this origin. The
   host is written down once, here, and nowhere else. */
export const APP_URL = 'https://app.midnat.xyz';

/** Absolute URL of a terminal route. Every cross-site link to the terminal
    goes through here rather than interpolating APP_URL at the call site. */
export function appHref(route = '/'): string {
  const path = route.startsWith('/') ? route : `/${route}`;
  return `${APP_URL}${path}`;
}
