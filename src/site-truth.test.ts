import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ALL_PUBLIC_ROUTES,
  DOCS,
  FOOTER_META_LINKS,
  HEADER_LINKS,
  LEGAL,
  PROTOCOL_PAGES,
  SEARCH_INDEX,
  SITE_URL,
  TRUST_PAGES,
  docHref,
  footerGroups,
  legalHref,
} from '@/lib/site-map';
import { CANONICAL, LIMITATIONS, MARKETS } from '@/lib/protocol-registry';
import { CONTACT_CHANNELS, HAS_EMAIL_CHANNEL, PRIMARY_CONTACT, X_HANDLE } from '@/lib/contact';
import { APP_URL, appHref } from '@/lib/config';
import { API_BASE } from '@/lib/api';

/**
 * The public site is a claim surface.
 *
 * It described a retired architecture -- an off-chain book the API priced,
 * recorded, swept for funding and liquidated -- for as long as it took someone
 * to read it, because nothing tested what the pages say. These tests read the
 * page sources and hold them to the deployed product: no rendering, because a
 * false sentence renders perfectly well.
 *
 * Adding a page adds it to these tests automatically. Adding a claim the
 * product cannot keep should fail one of them.
 */

const here = dirname(fileURLToPath(import.meta.url));
const SRC = here;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(tsx|ts)$/.test(entry) && !full.endsWith('.test.ts') ? [full] : [];
  });
}

/** Every file, whatever its extension: `walk` sees only TypeScript, so it is
    blind to exactly the static files Vite copies verbatim. */
function walkEveryFile(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walkEveryFile(full) : [full];
  });
}

interface SourceFile {
  readonly path: string;
  readonly rel: string;
  readonly text: string;
}

const SOURCES: readonly SourceFile[] = walk(SRC).map((path) => ({
  path,
  rel: relative(SRC, path),
  text: readFileSync(path, 'utf8'),
}));

/** Prose only: JSX attributes and class names are not claims. */
function proseOf(text: string): string {
  return text
    .replace(/className=(?:"[^"]*"|\{[^}]*\})/g, ' ')
    .replace(/data-testid="[^"]*"/g, ' ')
    .replace(/style=\{\{[\s\S]*?\}\}/g, ' ');
}

const APP_TSX = readFileSync(join(SRC, 'App.tsx'), 'utf8');
const ROUTES = new Set(
  [...APP_TSX.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1] as string),
);

describe('every link the site offers resolves to a page', () => {
  const declared: Array<{ where: string; href: string }> = [
    ...ALL_PUBLIC_ROUTES.map((href) => ({ where: 'ALL_PUBLIC_ROUTES', href })),
    ...DOCS.map((d) => ({ where: `DOCS:${d.slug}`, href: docHref(d.slug) })),
    ...LEGAL.map((l) => ({ where: `LEGAL:${l.slug}`, href: legalHref(l.slug) })),
    ...PROTOCOL_PAGES.map((p) => ({ where: `PROTOCOL_PAGES:${p.label}`, href: p.href })),
    ...TRUST_PAGES.map((p) => ({ where: `TRUST_PAGES:${p.label}`, href: p.href })),
    ...HEADER_LINKS.map((p) => ({ where: `HEADER_LINKS:${p.label}`, href: p.href })),
    ...FOOTER_META_LINKS.filter((l) => !l.external).map((p) => ({ where: `FOOTER:${p.label}`, href: p.href })),
    ...footerGroups()
      .flatMap((g) => g.links)
      .filter((l) => !l.external)
      .map((p) => ({ where: `FOOTER_GROUPS:${p.label}`, href: p.href })),
    ...SEARCH_INDEX.map((e) => ({ where: `SEARCH_INDEX:${e.title}`, href: e.href })),
  ];

  it('registers a route for every navigable href', () => {
    const missing = declared.filter(({ href }) => !href.startsWith('http') && !ROUTES.has(href));
    expect(missing, 'navigation points at a route the router does not register').toEqual([]);
  });

  it('serves every registered route from the site map', () => {
    const orphans = [...ROUTES].filter((r) => r !== '/' && !ALL_PUBLIC_ROUTES.includes(r));
    expect(orphans, 'a route exists that the site map does not list').toEqual([]);
  });

  it('leaves no literal internal href pointing nowhere', () => {
    const offenders: string[] = [];
    for (const file of SOURCES) {
      for (const m of file.text.matchAll(/href="(\/[^"?#]*)"/g)) {
        const href = (m[1] as string).replace(/\/$/, '') || '/';
        if (!ROUTES.has(href)) offenders.push(`${file.rel}: ${m[1]}`);
      }
    }
    expect(offenders, 'a hard-coded link points at no route').toEqual([]);
  });
});

describe('navigation never parks a link', () => {
  it('has no placeholder anchor anywhere', () => {
    const offenders = SOURCES.filter((f) => /href=(?:"#"|'#'|\{['"`]#['"`]\})/.test(f.text)).map((f) => f.rel);
    expect(offenders, 'href="#" is a link that goes nowhere').toEqual([]);
  });

  it('exposes docs from the landing navigation', () => {
    const nav = SOURCES.find((f) => f.rel.endsWith('landing/LandingNav.tsx'));
    expect(nav, 'landing navigation exists').toBeDefined();
    expect(nav!.text).toMatch(/href="\/docs"/);
  });
});

describe('published URLs are real', () => {
  it('has a production origin, not a placeholder', () => {
    expect(SITE_URL).toMatch(/^https:\/\//);
    expect(SITE_URL).not.toMatch(/example|localhost|127\.0\.0\.1|todo|changeme|your-?domain|\.test\b|\.invalid\b/i);
  });

  it('hard-codes no placeholder or loopback host in a page', () => {
    const BAD = /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|[^\s"'`]*(?:example\.(?:com|org|net)|your-?domain|todo\.)[^\s"'`]*)/i;
    const offenders = SOURCES.filter((f) => !f.rel.endsWith('site-truth.test.ts') && BAD.test(f.text)).map((f) => f.rel);
    expect(offenders, 'a placeholder or loopback URL is published').toEqual([]);
  });
});

describe('the site never points a reader at the code host', () => {
  /**
   * Owner law: the repository is not part of the public surface. It may be
   * public, but nothing here links it, names it or offers it as a channel --
   * a link that survives in one legal page is the whole leak. The scan is on
   * raw source, comments included, so a stray URL in a code comment fails
   * too; the phrase list is what the pages used to say.
   */
  const BANNED: ReadonlyArray<readonly [RegExp, string]> = [
    [/github/i, 'the site names no code host'],
    [/\bgitlab|bitbucket\b/i, 'the site names no code host'],
    [/\brepositor(?:y|ies)\b/i, 'public prose says "the project source", never "the repository"'],
    [/\bopen an issue\b/i, 'there is no issue tracker to send a reader to'],
    [/\bpull request\b/i, 'the site offers no contribution channel'],
  ];

  for (const [pattern, why] of BANNED) {
    it(`never says: ${pattern.source} (${why})`, () => {
      const offenders = SOURCES.filter((f) => f.rel !== 'site-truth.test.ts' && pattern.test(f.text)).map((f) => f.rel);
      expect(offenders, why).toEqual([]);
    });
  }

  it('publishes no code host in a static file either', () => {
    /* The src scan above cannot see what Vite copies verbatim. A
       .well-known/security.txt naming a code host as the disclosure route
       outlived the pages that used to name one, and contradicted them. */
    const staticRoot = join(SRC, '..', 'public');
    const statics = [...walkEveryFile(staticRoot), join(SRC, '..', 'index.html')];
    expect(statics.length, 'the static scan found no files to read').toBeGreaterThan(0);
    const offenders = statics
      /* latin1 never throws on a binary file and leaves ASCII byte-for-byte,
         so a code host embedded in a font or an image is still caught. */
      .filter((full) => /github|gitlab|bitbucket|repositor(?:y|ies)/i.test(readFileSync(full).toString('latin1')))
      .map((full) => relative(join(SRC, '..'), full));
    expect(offenders, 'a static file names a code host').toEqual([]);
  });
});

describe('the site publishes exactly the channels it has', () => {
  /**
   * Owner decision, 2026-08-18: one X account is the public channel. No email
   * exists yet. The risk these tests cover is a surface that renders a channel
   * the project does not have -- an empty email slot, a second handle, a stale
   * "no channel exists" sentence -- so every one of them is checked against
   * `lib/contact.ts`, which is the only place a handle is written down.
   */
  const CONTACT_SURFACES = [
    'components/public/PublicFooter.tsx',
    'pages/about.tsx',
    'pages/security.tsx',
    'pages/verify.tsx',
    'pages/legal/index.tsx',
    'pages/legal/terms.tsx',
    'pages/legal/privacy.tsx',
    'pages/docs/getting-started.tsx',
  ];

  /** Where a handle, address or channel URL may be written down. Nowhere else. */
  const AUTHORITY = 'lib/contact.ts';

  it('renders the handle verbatim: lower case, no spaces, one @', () => {
    expect(X_HANDLE).toMatch(/^@[a-z0-9_]{1,15}$/);
    expect(PRIMARY_CONTACT.display).toBe(X_HANDLE);
    expect(PRIMARY_CONTACT.href).toBe(`https://x.com/${X_HANDLE.slice(1)}`);
  });

  it('holds no channel that is not real', () => {
    expect(CONTACT_CHANNELS.length, 'at least one channel exists').toBeGreaterThan(0);
    expect(CONTACT_CHANNELS, 'the primary channel is one of the published ones').toContain(PRIMARY_CONTACT);
    const ids = CONTACT_CHANNELS.map((c) => c.id);
    expect(new Set(ids).size, 'a channel kind appears twice').toBe(ids.length);

    for (const channel of CONTACT_CHANNELS) {
      expect(channel.display.trim(), `${channel.id} has something to display`).not.toBe('');
      expect(channel.network.trim(), `${channel.id} names its network`).not.toBe('');
      /* The destination has to match the kind, or a surface renders a handle
         that opens an inbox -- or an address that opens a profile. */
      if (channel.id === 'email') {
        expect(channel.href, 'an email channel opens an inbox').toMatch(/^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
        expect(channel.href, 'the address shown is the address linked').toBe(`mailto:${channel.display}`);
      } else {
        expect(channel.href, 'a social channel opens its profile').toBe(`https://x.com/${channel.display.slice(1)}`);
      }
    }

    /* Derived, not declared: the flag and the list cannot disagree. */
    expect(HAS_EMAIL_CHANNEL).toBe(CONTACT_CHANNELS.some((c) => c.id === 'email'));
  });

  it('writes an address or a handle in one file and nowhere else', () => {
    /* An address that merely happens to equal the published one is still a
       hard-coded address: it survives the day the published one changes. The
       rule is location, not equality. */
    const elsewhere = SOURCES.filter((f) => f.rel !== 'site-truth.test.ts' && f.rel !== AUTHORITY);
    const mailtos = elsewhere.flatMap((f) =>
      [...f.text.matchAll(/mailto:[^"'`\s>)]+/g)].map((m) => `${f.rel}: ${m[0]}`),
    );
    const socials = elsewhere.flatMap((f) =>
      [...f.text.matchAll(/https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[^\s"'`<>)]+/g)].map((m) => `${f.rel}: ${m[0]}`),
    );
    const handles = elsewhere.flatMap((f) =>
      [...f.text.matchAll(/(?<![\w@/])@[a-z][a-z0-9_]{2,14}\b/gi)]
        .filter((m) => m[0].toLowerCase() === X_HANDLE.toLowerCase())
        .map((m) => `${f.rel}: ${m[0]}`),
    );
    expect([...mailtos, ...socials, ...handles], `only ${AUTHORITY} may name a channel`).toEqual([]);
  });

  it('prints no email address at all while no email channel exists', () => {
    const anywhere = SOURCES.filter((f) => f.rel !== 'site-truth.test.ts').flatMap((f) =>
      [...f.text.matchAll(/mailto:([^"'`\s>)]+)/g)].map((m) => m[1]),
    );
    const published = CONTACT_CHANNELS.filter((c) => c.href.startsWith('mailto:')).map((c) =>
      c.href.slice('mailto:'.length),
    );
    /* With no email channel this is "no mailto anywhere". The day one is added
       it becomes "that address and no other", with no edit here. */
    expect(anywhere.filter((a) => !published.includes(a)), 'an address the channel list does not hold').toEqual([]);
  });

  it('renders every contact surface from the authority rather than from prose', () => {
    for (const rel of CONTACT_SURFACES) {
      const file = SOURCES.find((f) => f.rel === rel);
      expect(file, `${rel} exists`).toBeDefined();
      expect(file!.text, `${rel} imports the channel authority`).toMatch(/from '@\/lib\/contact'/);
      /* An import alone proves nothing -- an unused one type-checks. The
         surface has to read a field off a channel or iterate the list. */
      expect(file!.text, `${rel} reads a channel, it does not just import one`).toMatch(
        /PRIMARY_CONTACT\.(?:display|href|network|purpose)|CONTACT_CHANNELS\.map/,
      );
    }
  });

  it('lets the channel list turn off every claim that no email exists', () => {
    /* The report claims adding an email is one entry in the authority. That is
       only true if no page states the absence unconditionally. */
    const EMAIL_ABSENCE = /no (?:email inbox|security email|privacy inbox|legal inbox)/i;
    const offenders = SOURCES.filter((f) => f.rel !== 'site-truth.test.ts' && f.rel !== AUTHORITY)
      .filter((f) => EMAIL_ABSENCE.test(f.text) && !/HAS_EMAIL_CHANNEL/.test(f.text))
      .map((f) => f.rel);
    expect(offenders, 'a page says there is no email without asking the channel list').toEqual([]);
  });

  it('no longer tells a reader that no channel exists', () => {
    /* These sentences were true until the owner published a handle. A page
       that keeps one is telling a reader not to bother writing. */
    const STALE = /no (?:contact|disclosure) channel|publishes no channel|reaches nobody|unable to receive a vulnerability report/i;
    const offenders = SOURCES.filter((f) => f.rel !== 'site-truth.test.ts' && STALE.test(proseOf(f.text))).map(
      (f) => f.rel,
    );
    expect(offenders, 'a page still claims the project cannot be reached').toEqual([]);
  });
});

describe('the site does not describe the retired architecture', () => {
  /**
   * Each phrase belonged to the off-chain book: the API priced orders, kept
   * positions in its own database, swept funding over them and liquidated
   * them. None of that exists. The regexes are deliberately narrow -- they
   * match the claim, not the vocabulary -- so that describing the retired
   * book in the past tense, as the API docs do, stays legal.
   */
  const BANNED: ReadonlyArray<readonly [RegExp, string]> = [
    // Negations ("the API holds no position") and non-trading objects ("keeps
    // thin operational logs") are true statements, so the object matters.
    [
      /\bthe (?:MIDNAT )?API (?:prices|records|holds|keeps|writes|watches|liquidates|settles)\s+(?:the|your|its own|every|all|a|an)\s+(?:position|order|trade|book|margin|collateral|fill|funding)/i,
      'the API owns no trading state',
    ],
    [/\bapi'?s own (?:keeper|book|ledger|records)\b/i, 'the API runs no book'],
    [/\brecorded by the (?:MIDNAT )?API\b/i, 'positions are recorded by the clearing house'],
    [/\bwritten by the (?:MIDNAT )?API\b/i, 'positions are written by the clearing house'],
    [/\bin its own database\b/i, 'no trading state lives in a database'],
    [/\bdoes not appear on chain\b/i, 'every trade appears on chain'],
    [/\bdoes not (?:yet )?route trades through\b/i, 'trades route through the contracts'],
    [/\bsweep every minute\b/i, 'funding accrues on chain, nothing sweeps off chain'],
    [/\bopening in the app sends no transaction\b/i, 'opening in the app is a transaction'],
    // A landing card claimed the venue "does not submit a transaction today".
    // Trading is a call to the deployed clearing house -- the chain already
    // holds open positions from it -- so any claim that a trade is booked
    // without a transaction is the retired book wearing new copy.
    [/\b(?:does not|doesn't|never) (?:submits?|sends?) a transaction\b/i, 'a trade is a transaction to the clearing house'],
    [/\bbooks (?:opens?|closes?)[^.]{0,40}\byour (?:connected )?address\b/i, 'opens and closes are on-chain calls, not local bookings'],
    [/\bthe app takes no deposit\b/i, 'the app deposits collateral'],
    [/\bon the contract path\b/i, 'there is one path, not two'],
    [/\bin the app it is a record\b/i, 'a position is a contract record'],
    [/\bdoes not put your address on chain\b/i, 'trading publishes the address'],
    // The liquidation fee settles to the vault. No caller is paid, at any
    // size, so any sentence that weighs a caller's reward against gas is
    // describing a mechanism this deployment does not have.
    [/\b(?:the )?(?:reward|bounty) (?:covers|pays for|outweighs)\b/i, 'liquidation pays the caller nothing'],
    [/\bpays a (?:fee|reward|bounty) for (?:it|calling|the call)\b/i, 'liquidation pays the caller nothing'],
    [/\bliquidation reward\b/i, 'there is no liquidation reward'],
    [/\bpaid to (?:call|liquidate)\b(?! liquidation)/i, 'nobody is paid to call liquidation'],
    // Funding accrues in the clearing house's own index. Nothing sweeps it,
    // and an unprivileged keeper posting a rate is not a settlement job.
    [/\bfunding (?:sweep|sweeps|is swept)\b/i, 'funding accrues on chain; nothing sweeps it'],
    [/\bsweeps? (?:funding|positions|the book)\b/i, 'nothing sweeps positions or the book'],
    // Liquidation settles inside the contract. An off-chain settlement claim
    // would describe the retired book.
    [
      /\bliquidat\w+ (?:is |are )?settled off[- ]chain\b/i,
      'liquidation settles in the clearing house',
    ],
    [/\bsettles? (?:the )?liquidation off[- ]chain\b/i, 'liquidation settles in the clearing house'],
    // The API observes; it has no economic authority over a position.
    [
      /\b(?:the )?API(?:'s)? (?:positions|records|numbers)\b[^.]{0,40}\bauthorit\w+/i,
      'the contract is the economic authority, not the API',
    ],
    [
      /\bauthoritative\b[^.]{0,30}\b(?:API|off[- ]chain) (?:position|record|book)\b/i,
      'the contract is the economic authority, not the API',
    ],
  ];

  for (const [pattern, why] of BANNED) {
    it(`never says: ${pattern.source} (${why})`, () => {
      const offenders = SOURCES.filter((f) => f.rel !== 'site-truth.test.ts' && pattern.test(proseOf(f.text))).map(
        (f) => f.rel,
      );
      expect(offenders, why).toEqual([]);
    });
  }

  it('keeps the retired book named only as retired', () => {
    const api = SOURCES.find((f) => f.rel.endsWith('docs/api.tsx'))!;
    expect(api.text).toMatch(/410/);
    expect(api.text).toMatch(/retired/i);
    // A retired endpoint must not sit in the live endpoint table.
    const table = api.text.slice(api.text.indexOf('READ_ENDPOINTS'), api.text.indexOf('const HEALTH_RESPONSE'));
    expect(table).not.toMatch(/path: '\/positions'/);
    expect(table).not.toMatch(/path: '\/orders'/);
  });
});

describe('the canonical trading-path wording is the one the pages use', () => {
  const canonical = CANONICAL.tradingPath;

  it('describes the browser, the wallet, the contract and the chain', () => {
    expect(canonical).toMatch(/wallet signs/i);
    expect(canonical).toMatch(/clearing house/i);
    expect(canonical).toMatch(/X Layer|chain/i);
    expect(canonical).toMatch(/public/i);
    expect(canonical).not.toMatch(/database|does not appear/i);
  });

  it('is what the trust pages actually render', () => {
    for (const rel of ['pages/legal/testnet.tsx', 'pages/legal/risk-disclosure.tsx', 'pages/docs/getting-started.tsx']) {
      const file = SOURCES.find((f) => f.rel === rel);
      expect(file, `${rel} exists`).toBeDefined();
      expect(file!.text, `${rel} states the trading path`).toMatch(/CANONICAL\.tradingPath/);
    }
  });

  it('has no wording left from the retired path', () => {
    const registry = SOURCES.find((f) => f.rel === 'lib/protocol-registry.ts')!;
    expect(registry.text).not.toMatch(/interfacePath/);
  });
});

describe('one canonical origin, declared in one place', () => {
  /**
   * Every absolute URL the site publishes -- canonical tags, OG images, the
   * sitemap -- has to agree on one origin, or a share card points at a host
   * that serves something else. Two constants are allowed to hold a domain:
   * the site's own origin and the app's, because they are different services.
   */
  it('derives its own absolute URLs from SITE_URL', () => {
    const meta = SOURCES.find((f) => f.rel === 'lib/use-page-meta.ts');
    expect(meta, 'the meta helper exists').toBeDefined();
    expect(meta!.text).toMatch(/SITE_URL/);
    expect(SITE_URL).toMatch(/^https:\/\/[a-z0-9.-]+$/);
    expect(SITE_URL.endsWith('/'), 'SITE_URL must not carry a trailing slash').toBe(false);
  });

  it('hardcodes the domain nowhere else', () => {
    const allowed = new Set(['lib/site-map.ts', 'lib/config.ts', 'site-truth.test.ts']);
    const offenders = SOURCES.filter(
      (f) => !allowed.has(f.rel) && /https:\/\/(?:[a-z]+\.)?midnat\.xyz/.test(f.text),
    ).map((f) => f.rel);
    expect(offenders, 'absolute site URLs must come from SITE_URL or APP_URL').toEqual([]);
  });
});

describe('every live read leaves this origin', () => {
  /**
   * The status page carried its own `const API_BASE = '/api'`. On a static
   * host that path is not even a 404: vercel.json rewrites everything it does
   * not recognise to index.html, so the request came back as HTML with status
   * 200, the JSON parse threw, and the page reported the read API and the
   * reference engine as unreachable while both were answering normally. It had
   * worked in the monorepo, where one dev server stood in front of the site
   * and the API, and it broke the moment the site was deployed on its own.
   *
   * This site has no backend. A relative request can only ever reach the host
   * serving these files, so there is one absolute base and one caller, and
   * these rules are what keep the next page from writing its own.
   */
  const API_MODULE = 'lib/api.ts';

  /** Comments discuss the bug by name; the rules are about code. */
  const code = (text: string): string =>
    text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  /* Every way a page could reach a server, not only the one that broke. An
     alias, an optional call or an older transport lands on this same static
     host and fails in the same silent way, so the rule is about reaching a
     server at all: lib/api.ts is the one file allowed to. A code sample in a
     docs page trips this too, which is intended -- writing a request outside
     that module is the moment worth stopping at. Test files are not in
     SOURCES and never ship, so a stubbed transport in one is not a bypass. */
  const TRANSPORTS: readonly (readonly [RegExp, string])[] = [
    [/\bfetch\s*\??\.?\s*\(/, 'fetch'],
    [/\bfetch\s*\.\s*(?:call|apply|bind)\s*\(/, 'fetch, indirectly'],
    [/\b(?:window|globalThis|self)\s*\.\s*fetch\b/, 'fetch off the global'],
    [/[=,([]\s*fetch\s*(?:[,)\];]|$)/m, 'fetch passed around as a value'],
    [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
    [/\bEventSource\b/, 'EventSource'],
    [/\bWebSocket\b/, 'WebSocket'],
    [/\bsendBeacon\s*\(/, 'sendBeacon'],
    [/\baxios\b/, 'axios'],
    /* Bracket access reaches every name above while spelling none of them,
       and an alias taken that way carries the brackets on its own line. */
    [/\[\s*['"`](?:fetch|XMLHttpRequest|EventSource|WebSocket|sendBeacon)['"`]\s*\]/, 'a transport named in brackets'],
  ];

  it('builds the base from the terminal origin', () => {
    expect(API_BASE.startsWith(`${APP_URL}/`), 'API_BASE must be derived from APP_URL').toBe(true);
    expect(API_BASE).toMatch(/^https:\/\/[a-z0-9.-]+\/api$/);
  });

  for (const [pattern, what] of TRANSPORTS) {
    it(`reaches a server with ${what} from lib/api.ts only`, () => {
      const offenders = SOURCES.filter(
        (f) => f.rel !== API_MODULE && pattern.test(code(f.text)),
      ).map((f) => f.rel);
      expect(offenders, 'every read goes through lib/api.ts').toEqual([]);
    });
  }

  it('never names a request path against this host', () => {
    const offenders = SOURCES.filter(
      (f) =>
        f.rel !== API_MODULE &&
        /(?:API_BASE|API_URL|BASE_URL|apiBase|baseUrl|endpoint)\s*[:=]\s*['"`]\//i.test(code(f.text)),
    ).map((f) => f.rel);
    expect(offenders, 'a relative base resolves to this static host, which answers index.html').toEqual([]);
  });

  it('ships no static file that talks to a server', () => {
    /* Vite copies these verbatim, so nothing in them can go through the
       module above. latin1 never throws and leaves ASCII byte for byte. */
    const statics = [...walkEveryFile(join(SRC, '..', 'public')), join(SRC, '..', 'index.html')];
    expect(statics.length, 'the static scan found no files to read').toBeGreaterThan(0);
    const offenders = statics
      .filter((full) => {
        const text = readFileSync(full).toString('latin1');
        return TRANSPORTS.some(([pattern]) => pattern.test(text));
      })
      .map((full) => relative(join(SRC, '..'), full));
    expect(offenders, 'a copied static file makes its own request').toEqual([]);
  });

  it('is what the pages reporting live state actually call', () => {
    // Without this the rules above pass perfectly on a site that reads nothing.
    for (const rel of ['lib/reference-feed.ts', 'pages/status.tsx']) {
      const file = SOURCES.find((f) => f.rel === rel);
      expect(file, `${rel} is missing`).toBeDefined();
      expect(/from '(?:\.|@\/lib)\/api'/.test(file?.text ?? ''), `${rel} must import the API module`).toBe(true);
      expect(/\bgetJson\s*[<(]/.test(code(file?.text ?? '')), `${rel} must read through getJson`).toBe(true);
    }
  });
});

describe('the keeper economics the site publishes are the deployed ones', () => {
  const incentive = LIMITATIONS.find((l) => l.id === 'no-liquidation-incentive');

  it('publishes the missing external incentive as a limitation', () => {
    expect(incentive, 'the limitation exists').toBeDefined();
    expect(incentive!.detail).toMatch(/settled to the vault/i);
    expect(incentive!.detail).toMatch(/receives nothing/i);
    expect(incentive!.area).toBe('Liquidation');
  });

  it('no longer carries the limitation that assumed a reward', () => {
    expect(LIMITATIONS.some((l) => l.id === 'liquidation-reward')).toBe(false);
    for (const f of SOURCES) {
      expect(f.text, `${f.rel} refers to a retired limitation id`).not.toMatch(/'liquidation-reward'/);
    }
  });

  it('is stated where a trader and a reader of the risk pages will meet it', () => {
    for (const rel of ['pages/docs/liquidation.tsx', 'pages/legal/risk-disclosure.tsx', 'pages/security.tsx']) {
      const file = SOURCES.find((f) => f.rel === rel);
      expect(file, `${rel} exists`).toBeDefined();
      expect(file!.text, `${rel} states who pays for a liquidation call`).toMatch(/no-liquidation-incentive/);
    }
  });
});

describe('market claims match the deployment', () => {
  const WORDS: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };

  it('counts the same markets the deployment lists', () => {
    const manifest = JSON.parse(
      readFileSync(join(SRC, 'deployments', '1952.json'), 'utf8'),
    ) as { markets: Array<{ symbol: string }> };
    expect(MARKETS.map((m) => m.symbol).sort()).toEqual(manifest.markets.map((m) => m.symbol).sort());
  });

  it('never prints a market count that disagrees with the deployment', () => {
    const offenders: string[] = [];
    for (const file of SOURCES) {
      if (file.rel === 'site-truth.test.ts') continue;
      const prose = proseOf(file.text);
      for (const m of prose.matchAll(
        /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d{1,2})\s+(?:listed\s+)?markets\b([^.]{0,48})/gi,
      )) {
        const raw = (m[1] as string).toLowerCase();
        const n = WORDS[raw] ?? Number(raw);
        // "two markets in the same tier share the same fees" counts nothing.
        // A count claim names the listing: "nine markets are listed here".
        const claimsListing =
          /\blisted\b/i.test(m[0]) || /\b(listed|lists|deployment|tradable|tradeable|trade|available|live)\b/i.test(m[2] as string);
        if (claimsListing && Number.isFinite(n) && n !== MARKETS.length) offenders.push(`${file.rel}: "${m[0].trim()}"`);
      }
    }
    expect(offenders, `the deployment lists ${MARKETS.length} markets`).toEqual([]);
  });

  it('renders the markets page from the registry rather than a literal list', () => {
    const page = SOURCES.find((f) => f.rel === 'pages/markets.tsx')!;
    expect(page.text).toMatch(/MARKETS/);
    const tickers = [...proseOf(page.text).matchAll(/'([A-Z]{2,5})'/g)].map((m) => m[1] as string);
    const invented = tickers.filter((t) => !MARKETS.some((m) => m.symbol === t));
    expect(invented, 'a ticker is named that the deployment does not list').toEqual([]);
  });
});

describe('vault copy matches what the interface can do', () => {
  const CLOSED = /deposits?\s+(?:are\s+)?(?:not\s+open|closed)|does not accept deposits|no deposit path|deposits are not accepted/i;

  it('does not claim deposits are closed', () => {
    const offenders = SOURCES.filter((f) => f.rel !== 'site-truth.test.ts' && CLOSED.test(proseOf(f.text))).map(
      (f) => f.rel,
    );
    expect(offenders, 'the LP panel deposits and withdraws today').toEqual([]);
  });

  it('says on the landing page that the vault is open', () => {
    const teaser = SOURCES.find((f) => f.rel.endsWith('landing/VaultsTeaser.tsx'))!;
    expect(teaser.text).toMatch(/deposits open/i);
    expect(teaser.text).toMatch(/withdraw/i);
  });
});

describe('privacy matches what a trade writes to the chain', () => {
  const privacy = SOURCES.find((f) => f.rel === 'pages/legal/privacy.tsx')!;

  it('warns that opening a position publishes the address', () => {
    expect(privacy.text).toMatch(/Opening a position in the MIDNAT app is one of those transactions/i);
    expect(privacy.text).toMatch(/permanent/i);
  });

  it('makes no promise the chain cannot keep', () => {
    expect(privacy.text).not.toMatch(/does not put your\s+address on chain/i);
    expect(privacy.text).not.toMatch(/recorded by the API instead/i);
  });

  it('describes the wallet address the way the server treats it', () => {
    // The address reaches the API only as an Intelligence header, where it is
    // salted-hashed. Claiming it is "stored in the database" was wrong in the
    // other direction: it overstated what is kept.
    expect(privacy.text).toMatch(/salted-hashed|salted hash/i);
    expect(privacy.text).not.toMatch(/Sent to the API and stored in the database/i);
  });
});

describe('the site says what the venue is for', () => {
  /**
   * The one claim that distinguishes this product: the underlying exchange
   * keeps hours and the venue does not. It was in the meta description, the
   * landing hero and the brand voice, and absent from the pages a reader opens
   * to find out what MIDNAT is -- `/protocol` opened on "a synthetic equity
   * perpetuals protocol", which describes a nine-to-four product equally well.
   * Nothing tested for it, so it could go missing one page at a time.
   *
   * The wording is deliberately not pinned. Any of the honest formulations
   * passes; marketing phrasing is the brand page's problem, not this test's.
   */
  const CLOCK =
    /around the clock|always open|never closes|no closing bell|three in the morning|24\/7|exchange keeps hours|does not keep the exchange|(?:underlying )?exchange is (?:closed|shut)|(?:keeps|does not stop) working when|does not stop when an exchange closes|while the exchange is closed|when the exchange closes/i;

  const SURFACES = [
    'components/landing/HeroSection.tsx',
    'pages/protocol.tsx',
    'pages/about.tsx',
    'pages/whitepaper.tsx',
    'pages/docs/index.tsx',
    'pages/docs/how-it-works.tsx',
    'pages/docs/market-hours.tsx',
    'pages/docs/reference-engine.tsx',
  ] as const;

  it.each(SURFACES)('states it on %s', (rel) => {
    const page = SOURCES.find((f) => f.rel === rel);
    expect(page, `${rel} is listed as a positioning surface but does not exist`).toBeDefined();
    expect(CLOCK.test(page!.text), `${rel} never says the venue outlasts the exchange session`).toBe(true);
  });

  it('carries the claim in the meta description a search result shows', () => {
    const html = readFileSync(join(SRC, '..', 'index.html'), 'utf8');
    const description = /<meta name="description" content="([^"]+)"/.exec(html)?.[1] ?? '';
    expect(description, 'index.html has no meta description').not.toBe('');
    expect(CLOCK.test(description), 'the meta description does not say the venue never closes').toBe(true);
  });
});

describe('the landing page draws only what it read', () => {
  const heroPath = join(SRC, 'components/landing/HeroSection.tsx');
  const narrativePath = join(SRC, 'components/landing/NarrativeSection.tsx');
  const hero = readFileSync(heroPath, 'utf8');
  const narrative = readFileSync(narrativePath, 'utf8');

  /**
   * The hero card carried a chart labelled "Oracle feed" with a pulsing LIVE
   * badge. The curve was three sine terms; the only real input was the clock.
   * It is the first thing a judge sees, and it was the most confident thing on
   * the site.
   */
  it('builds the hero curve from prices the API returned', () => {
    expect(hero).toContain('useReferenceFeed()');
    expect(hero).toContain('feedGeometry(feed.points)');
  });

  it('never labels the hero feed live from a hardcoded string', () => {
    // Freshness is rendered from the reference age the API reports, so the
    // word cannot be sitting in the markup as a decoration.
    expect(hero).not.toMatch(/>\s*LIVE\s*</);
    expect(hero).not.toMatch(/'LIVE'|"LIVE"/);
  });

  it('reads the session regime from the engine, not from the browser clock', () => {
    expect(narrative).toContain('useMarketRegime()');
    // The old rule was "weekday, 09:30 to 16:00 local", applied to Tokyo and
    // London as well, and blind to holidays.
    expect(narrative).not.toContain('getStatus');
    expect(narrative).not.toMatch(/\b9\.5\b/);
  });

  it('claims a session only for the exchange the engine tracks', () => {
    // Tokyo and London are clocks. Only New York carries a session badge,
    // because the US cash session is the one the reference engine reports.
    const badges = narrative.match(/CASH OPEN|CASH CLOSED/g) ?? [];
    expect(badges.length).toBeGreaterThan(0);
    expect(narrative).not.toMatch(/tokyoStatus|londonStatus/);
  });

  it('never fills the status slot with a word that is not a market state', () => {
    // Tokyo and London used to sit under "LOCAL" in the same slot where New
    // York says CASH OPEN. Read side by side, that is not a second kind of
    // market state, it is an unfinished placeholder. Each clock carries its
    // UTC offset instead, which is the reason the four times disagree.
    // The rule is about what the page renders, so it reads the code with the
    // comments removed. A gate that also scans prose fires on the paragraph
    // explaining the gate, and the cure for that is never to widen the rule.
    const code = narrative
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    expect(code).not.toMatch(/\bLOCAL\b/);
    expect(code).toContain("timeZoneName: 'shortOffset'");
  });

  it('shows no session badge at all while the engine regime is unknown', () => {
    // A badge rendered before the engine has answered would be the page
    // inventing a market state, which is the failure this section exists to
    // avoid. Absence is the honest render.
    expect(narrative).toContain("regime === 'UNKNOWN'");
    expect(narrative).toContain('usSession !== null &&');
  });
});

describe('the name is written the way the brand page says it is written', () => {
  /**
   * /brand publishes the rule: the mark is MIDNAT, uppercase, always, "never
   * written Midnat". The site then wrote Midnat in the browser tab title, the
   * share card, the footer, the vault teaser and two doc pages. A product that
   * breaks its own naming rule on the first tab a reader opens has not earned
   * the paragraph explaining the rule.
   *
   * A contract name is not the mark: MidnatVault is a symbol deployed on chain
   * and is spelled the way the chain spells it. Storage keys and the domain are
   * identifiers too, so lowercase is correct there. Only the mark is pinned.
   */
  const RULE_PAGE = 'pages/brand.tsx';
  /** `Midnat` not followed by a capital: MidnatVault is a contract, "Midnat
      Vaults" is the mark spelled wrong. */
  const WRONG = /\bMid(?:nat(?![A-Z])|Nat\b)/;

  it('still publishes the rule it is being held to', () => {
    const brand = SOURCES.find((f) => f.rel === RULE_PAGE);
    expect(brand, 'the brand page exists').toBeDefined();
    expect(brand!.text, 'the brand page no longer states the casing rule').toMatch(
      /always in uppercase/i,
    );
  });

  it('spells the mark MIDNAT in every page it renders', () => {
    const offenders = SOURCES.filter(
      (f) => f.rel !== RULE_PAGE && WRONG.test(proseOf(f.text)),
    ).map((f) => f.rel);
    expect(offenders, 'the mark is MIDNAT, never Midnat or MidNat').toEqual([]);
  });

  it('spells the mark MIDNAT in the document head', () => {
    const html = readFileSync(join(SRC, '..', 'index.html'), 'utf8');
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
    expect(title, 'index.html has no title').not.toBe('');
    expect(WRONG.test(html), 'the tab title or a share card spells the mark wrong').toBe(false);
  });
});

describe('a link into the app opens the app, not over the page you were reading', () => {
  /**
   * The landing is what the reader came for; replacing it with the terminal
   * loses their place and their scroll position. Every route into the app
   * opens in a new tab, and each one severs window.opener so the opened tab
   * cannot reach back into the page that launched it.
   */
  const appAnchors = (text: string) =>
    (text.match(/<a\b[\s\S]*?>/g) ?? ([] as string[])).filter((tag) => tag.includes('appHref('));

  const opensSafely = (tag: string) => {
    expect(tag).toContain('target="_blank"');
    expect(tag).toMatch(/rel="(?=[^"]*noopener)(?=[^"]*noreferrer)[^"]*"/);
  };

  it('opens every appHref anchor in a new tab, with the opener severed', () => {
    // Found by scanning, not by a list kept by hand: a new call site is
    // covered the moment it is written.
    const found = SOURCES.flatMap((s) => appAnchors(s.text).map((tag) => ({ where: s.rel, tag })));
    expect(found.length).toBeGreaterThanOrEqual(5);
    for (const { where, tag } of found) {
      expect(tag, where).toContain('target="_blank"');
      expect(tag, where).toMatch(/rel="(?=[^"]*noopener)(?=[^"]*noreferrer)[^"]*"/);
    }
  });

  it('holds the footer app links to the same rule, which reach appHref indirectly', () => {
    // The footer never names appHref. It renders whatever site-map marked
    // external, and site-map marks exactly the app routes that way. The first
    // assertion is what keeps the second one meaningful.
    const siteMap = SOURCES.find((s) => s.rel.endsWith(join('lib', 'site-map.ts')))!.text;
    const externals = siteMap.match(/^.*external: true.*$/gm) ?? ([] as string[]);
    expect(externals.length).toBeGreaterThan(0);
    for (const line of externals) expect(line).toContain('appHref(');

    const footer = SOURCES.find((s) => s.rel.endsWith('PublicFooter.tsx'))!.text;
    const branch = footer.slice(footer.indexOf('{link.external ? ('));
    opensSafely((branch.match(/<a\b[\s\S]*?>/) ?? [''])[0]);
  });
});

describe('the verify page prices a share the way the vault mints them', () => {
  /**
   * MidnatVault carries a 6-decimal virtual share offset over 6-decimal
   * collateral, so a full share is 1e12 base units, not 1e18. The verify page
   * hands a reader a `cast convertToAssets(...)` command; passing 1e18 asks the
   * vault to price a million full shares and reports a nonsense "share price".
   * The magnitude has to match the mint, or the self-check the page teaches
   * fails silently in the reader's own terminal.
   */
  const verify = SOURCES.find((f) => f.rel === 'pages/verify.tsx')!;

  it('prices one full share as 1e12, the 12-decimal share unit', () => {
    expect(verify.text).toMatch(/convertToAssets\(uint256\)\(uint256\)"\s*1000000000000\b/);
    expect(verify.text, 'a full share is 1e12, not 1e18').not.toMatch(/convertToAssets\(uint256\)\(uint256\)"\s*1000000000000000000\b/);
  });

  it('says why the share magnitude differs from the asset', () => {
    expect(verify.text).toMatch(/6 more decimals|1e12/i);
  });
});

describe('the cookies notice matches what the code actually stores', () => {
  /**
   * The page audits browser storage from the code and states, in prose and in
   * a callout, that MIDNAT sets no cookie. The site-map summary once promised
   * "the four keys ... and the one cookie" -- a count the page contradicts on
   * both halves. A search result rendering that summary next to a page that
   * says the opposite is an internal contradiction a reader meets before the
   * page even loads.
   */
  const cookies = SOURCES.find((f) => f.rel === 'pages/legal/cookies.tsx')!;
  const summary = LEGAL.find((l) => l.slug === 'cookies')!.summary;

  it('states, on the page, that no cookie is set', () => {
    expect(cookies.text).toMatch(/sets no browser cookie|no cookie/i);
    expect(cookies.text).toMatch(/no consent banner|none is shown/i);
  });

  it('does not promise a cookie the page then denies', () => {
    // The honest negation ("there is no cookie") is fine; an affirmative claim
    // that a cookie exists is what the page contradicts.
    expect(summary, 'the summary must not claim a cookie the page says does not exist').not.toMatch(
      /\b(?:the |a |one )cookie\b/i,
    );
    expect(summary).toMatch(/no cookie/i);
  });

  it('does not fix a storage-key count the page derives from code', () => {
    // The page maps a KEYS array read from the code; a hard count in the
    // summary drifts the moment a key is added or removed.
    expect(summary).not.toMatch(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+keys?\b/i);
  });
});

describe('the site never says trading is free', () => {
  /**
   * The canonical claim is narrow: MIDNAT charges no protocol GAS fee
   * (`CANONICAL.gas`). Every tier does charge an open, close and liquidation
   * fee on notional, and the schedule page prints them from the registry.
   *
   * A landing card summarised that claim and dropped one word ("no protocol
   * fee on top of the gas X Layer charges"), which tells a visitor on the
   * first screen that the protocol takes nothing while the fee page charges
   * 8bps to open and 8bps to close.
   *
   * A list of banned phrasings loses this game: "trade without fees", "there
   * are no trading fees" and "the protocol charges you nothing" are the same
   * claim in words no list predicted. So this reads the construct instead. A
   * denial of cost is legal only when something narrows it, and there are
   * exactly two ways to narrow one: name the cost that really is zero (gas, a
   * deposit, a management fee), or condition it on a case (a liquidation with
   * no positive residual). An unnarrowed denial is a claim that trading is
   * free, however it is phrased.
   */

  /** Narrowings that name a cost the protocol genuinely does not take. Read
      as a qualifier standing before the noun: "no protocol GAS fee". */
  const NARROWED_BEFORE =
    /\b(gas|deposits?|withdrawals?|management|performance|subscription|listing|switch|treasury|network|vault)\b/i;

  /** The same job done by a modifier after the noun. It must attach to the
      noun: "no fee ON DEPOSIT" narrows, "no protocol fee ON TOP OF the gas"
      does not, and that difference is the whole bug this block exists for. */
  const NARROWED_AFTER =
    /^[\s,.]*(?:switch\b|on\s+(?:deposit|withdrawal|deposits|withdrawals)\b|for\s+(?:reading|reads|viewing|browsing)\b|to\s+(?:read|view|browse)\b)/i;

  /** Narrowings that condition the denial on a case rather than a cost. */
  const CONDITIONED = /\b(bad debt|positive residual|erc-?4626|reading the market|read the market)\b/i;

  /** Constructs that deny a cost. The qualifier, when the shape has one, is
      captured so it can be tested for a narrowing. */
  const DENIALS: ReadonlyArray<RegExp> = [
    /\b(?:no|zero)\s+((?:[\w-]+\s+){0,3}?)(?:fees?|charges?|costs?)\b/gi,
    /\bwithout\s+((?:[\w-]+\s+){0,3}?)(?:fees?|charges?|costs?)\b/gi,
    /\b(?:charges?|costs?|pays?)\s+(?:you\s+)?()nothing\b/gi,
    /\b(?:fee|commission|cost)[- ]free\b()/gi,
    /\b(?:free|no cost) to\s+()(?:trade|open|close|use)\b/gi,
    /\btrad(?:e|es|ing)[^.]{0,24}\b(?:is|are)\s+()free\b/gi,
    /\b(?:does not|do not|doesn't|don't) charge\s+(?:you\s+)?(?:for\s+)?()(?:trad\w+|anything|a fee|fees)\b/gi,
  ];

  /** What a reader actually sees. Comments do not ship, and the brand page's
      `bad:` samples exist precisely to print the dishonest sentence beside the
      honest one, so neither is a claim the site makes. The pairing is asserted
      below so the exemption cannot be used to smuggle a bare claim in. */
  function readerProse(text: string): string {
    return proseOf(
      text
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
        .replace(/\bbad:\s*'(?:[^'\\]|\\.)*'/g, ' ')
        .replace(/\bbad:\s*"(?:[^"\\]|\\.)*"/g, ' '),
    );
  }

  /** Every denial in a piece of prose that nothing narrows. */
  function unnarrowedDenials(prose: string): string[] {
    const found: string[] = [];
    for (const sentence of prose.split(/(?<=[.!?])\s+/)) {
      for (const pattern of DENIALS) {
        pattern.lastIndex = 0;
        for (const m of sentence.matchAll(pattern)) {
          const qualifier = m[1] ?? '';
          const after = sentence.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 40);
          // Order-independent: a narrowing may sit before the noun ("no
          // protocol gas fee") or after it ("no fee on deposit").
          if (NARROWED_BEFORE.test(qualifier) || NARROWED_AFTER.test(after)) continue;
          if (CONDITIONED.test(sentence)) continue;
          found.push(m[0].trim());
        }
      }
    }
    return found;
  }

  it('never denies the cost of trading without narrowing the denial', () => {
    const offenders: string[] = [];
    for (const file of SOURCES) {
      if (file.rel === 'site-truth.test.ts') continue;
      for (const hit of unnarrowedDenials(readerProse(file.text))) offenders.push(`${file.rel}: "${hit}"`);
    }
    expect(offenders, 'the protocol charges a fee on notional at open, close and liquidation').toEqual([]);
  });

  it('catches the claim however it is phrased', () => {
    // The rule is only worth having if it survives a writer who did not read
    // it. Each of these is the same false claim in different words, including
    // the exact sentence that shipped.
    const FALSE_CLAIMS = [
      'No order book to queue behind, and no protocol fee on top of the gas X Layer charges the sender in OKB.',
      'The protocol charges you nothing to trade.',
      'Trade without fees.',
      'Pay no fees when you trade.',
      'There are no trading fees.',
      'Zero fees on trades.',
      'Trading costs nothing.',
      'MIDNAT is fee-free.',
      'It is free to trade here.',
      'We do not charge for trades.',
    ];
    const missed = FALSE_CLAIMS.filter((s) => unnarrowedDenials(s).length === 0);
    expect(missed, 'these say trading is free and must be caught').toEqual([]);
  });

  it('leaves every true denial sayable', () => {
    // A ban that also forbids the true sentences pushes the pages into saying
    // nothing about cost, which is how the vague version arrived. The corpus
    // needs both answers, so these must pass.
    const TRUE_CLAIMS = [
      CANONICAL.gas,
      'MIDNAT charges no protocol gas fee.',
      'A liquidation that would create bad debt charges no fee.',
      'The vault is a standard ERC-4626 vault with no fee on deposit, no management fee and no performance fee.',
      'No vault management fee.',
      'There is no treasury, no fee switch and no recipient address that can be changed.',
      'Reading the market costs nothing.',
      'Every cost of a round trip, the costs MIDNAT does not charge, and the difference between them.',
    ];
    const wrongly = TRUE_CLAIMS.filter((s) => unnarrowedDenials(s).length > 0).map(
      (s) => `${s} -> ${unnarrowedDenials(s).join(', ')}`,
    );
    expect(wrongly, 'these are true and must stay sayable').toEqual([]);
  });

  it('keeps the brand page honest about the sample it exempts', () => {
    // The scan skips `bad:` samples. That is only safe while each one is
    // shown as the wrong way to say something, next to the right way.
    const brand = SOURCES.find((f) => f.rel === 'pages/brand.tsx')!;
    const pair = /bad:\s*'Zero fees[^']*',\s*good:\s*'([^']+)'/.exec(brand.text.replace(/\s+/g, ' '));
    expect(pair, 'the "Zero fees" sample must stay paired with an honest line').toBeTruthy();
    expect(pair![1], 'the honest line must keep the qualifier').toMatch(/no protocol gas fee/i);
  });

  it('states the fee on the card that once denied it', () => {
    // Presence, not just absence, and read from the card's own string rather
    // than the file: a comment mentioning the fee must not satisfy this, and
    // neither must copy that merely links somewhere else.
    const rail = SOURCES.find((f) => f.rel === 'components/landing/MeridianRail.tsx')!;
    const desc = /label:\s*"01"[\s\S]{0,600}?desc:\s*"([^"]+)"/.exec(rail.text)?.[1];
    expect(desc, 'the on-chain execution card must still have a description').toBeTruthy();
    expect(desc!, 'the card must say a protocol fee exists and where it goes').toMatch(
      /\bprotocol fee\b[^.]*\bvault\b/i,
    );
    expect(unnarrowedDenials(desc!), 'the card must not deny the fee it states').toEqual([]);
  });
});
