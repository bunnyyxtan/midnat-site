import { appHref } from './config';
/**
 * The public site map: every route, the navigation that exposes it, and the
 * docs registry that drives the sidebar, the search index and the breadcrumbs.
 *
 * LAW: a link may only exist here if the page exists. There are no "coming
 * soon" entries, no dead anchors and no pages built to fill a column.
 * Research, audits, incidents and press are deliberately absent because we
 * have no real content for them.
 */

/** Canonical public origin, used for canonical links and social metadata. */
export const SITE_URL = 'https://midnat.xyz';

export interface SiteLink {
  readonly label: string;
  readonly href: string;
  /** Absolute link that leaves the public site (the app, a block explorer). */
  readonly external?: boolean;
  readonly summary?: string;
}

/* -------------------------------------------------------------------------
   Docs
   ------------------------------------------------------------------------- */

export type DocGroupId = 'start' | 'trading' | 'vault' | 'reference' | 'intelligence' | 'developers';

export interface DocMeta {
  /** URL segment under /docs. The index page uses ''. */
  readonly slug: string;
  readonly title: string;
  readonly group: DocGroupId;
  /** One sentence, used on the docs index, in search results and as the meta description. */
  readonly summary: string;
  /** Words a reader might search for that do not appear in the title. */
  readonly keywords: readonly string[];
}

export const DOC_GROUPS: readonly { readonly id: DocGroupId; readonly title: string }[] = [
  { id: 'start', title: 'Start here' },
  { id: 'trading', title: 'Trading' },
  { id: 'vault', title: 'Liquidity vault' },
  { id: 'reference', title: 'Reference prices' },
  { id: 'intelligence', title: 'Intelligence' },
  { id: 'developers', title: 'Developers' },
];

export const DOCS: readonly DocMeta[] = [
  {
    slug: 'how-it-works',
    title: 'How MIDNAT works',
    group: 'start',
    summary: 'The whole protocol in one page: reference price, clearing house, vault, and what happens when you open a position.',
    keywords: ['overview', 'architecture', 'perpetual', 'synthetic', 'counterparty'],
  },
  {
    slug: 'getting-started',
    title: 'Getting started',
    group: 'start',
    summary: 'What you need before your first testnet position, and the order in which the protocol expects it.',
    keywords: ['wallet', 'connect', 'faucet', 'gas', 'deposit', 'first trade'],
  },
  {
    slug: 'glossary',
    title: 'Glossary',
    group: 'start',
    summary: 'One canonical definition for every term MIDNAT uses. If a page defines a term differently, this page wins.',
    keywords: ['definitions', 'terminology', 'meaning', 'jargon'],
  },
  {
    slug: 'markets-and-tiers',
    title: 'Markets and risk tiers',
    group: 'trading',
    summary: 'The listed markets, the three risk tiers, and the parameter set each tier applies.',
    keywords: ['leverage', 'tier', 'standard', 'elevated', 'high', 'listing', 'AAPL', 'NVDA', 'TSLA', 'GOOGL', 'HOOD'],
  },
  {
    slug: 'positions-and-margin',
    title: 'Positions and margin',
    group: 'trading',
    summary: 'Isolated margin, equity, maintenance margin and the exact conditions under which a position may be opened.',
    keywords: ['isolated', 'equity', 'maintenance', 'collateral', 'size', 'close'],
  },
  {
    slug: 'execution-and-pricing',
    title: 'Execution and pricing',
    group: 'trading',
    summary: 'How a fill price is built from the reference price, the base spread and the impact term.',
    keywords: ['spread', 'impact', 'slippage', 'fill', 'mark price', 'preview'],
  },
  {
    slug: 'funding',
    title: 'Funding',
    group: 'trading',
    summary: 'Who pays whom, how the rate is set, the on-chain clamp, and how funding is accrued.',
    keywords: ['rate', 'clamp', 'skew', 'long', 'short', 'hourly'],
  },
  {
    slug: 'liquidation',
    title: 'Liquidation',
    group: 'trading',
    summary: 'The maintenance margin test, who may call it, what the liquidator is paid, and what is left for the trader.',
    keywords: ['margin call', 'liquidation price', 'keeper', 'bad debt', 'insolvency'],
  },
  {
    slug: 'vault',
    title: 'The liquidity vault',
    group: 'vault',
    summary: 'An ERC-4626 vault that is the counterparty to every position the clearing house opens, how shares are priced, and what LPs are exposed to.',
    keywords: ['ERC-4626', 'LP', 'shares', 'NAV', 'deposit', 'withdraw', 'utilisation'],
  },
  {
    slug: 'deferred-payouts',
    title: 'Deferred payouts',
    group: 'vault',
    summary: 'What happens when the vault cannot pay a winning position in full, and why that is a claim rather than a haircut.',
    keywords: ['illiquidity', 'queue', 'claim', 'senior', 'FIFO', 'unpaid'],
  },
  {
    slug: 'reference-engine',
    title: 'The reference engine',
    group: 'reference',
    summary: 'How MIDNAT chooses a price for a stock at three in the morning, and how it degrades when no feed is fresh.',
    keywords: ['Pyth', 'Hermes', 'feed', 'freshness', 'stale', 'aging', 'quality', 'sentinel', 'transition'],
  },
  {
    slug: 'oracle-anchor',
    title: 'The oracle anchor',
    group: 'reference',
    summary: 'The on-chain contract that decides which price the protocol will accept, and what its signature does and does not prove.',
    keywords: ['EIP-712', 'signer', 'signature', 'anchor', 'poster', 'on-chain price'],
  },
  {
    slug: 'market-hours',
    title: 'Market hours and 24/7 trading',
    group: 'reference',
    summary: 'What changes when the underlying exchange is closed, and what stays exactly the same.',
    keywords: ['weekend', 'after hours', 'session', 'holiday', 'closed', 'overnight'],
  },
  {
    slug: 'intelligence',
    title: 'MIDNAT Intelligence',
    group: 'intelligence',
    summary: 'The language model layer: what it reads, what it may say, what it may never say, and how each answer is hashed.',
    keywords: ['AI', 'model', 'desk', 'ask', 'guardrail', 'provenance', 'hash', 'prompt'],
  },
  {
    slug: 'api',
    title: 'HTTP API',
    group: 'developers',
    summary: 'The read endpoints the interface itself uses, their shapes, and the rate limits that apply.',
    keywords: ['REST', 'endpoint', 'json', 'openapi', 'rate limit', 'integration'],
  },
];

export const docsByGroup = (group: DocGroupId): readonly DocMeta[] => DOCS.filter((d) => d.group === group);
export const docBySlug = (slug: string): DocMeta | undefined => DOCS.find((d) => d.slug === slug);
export const docHref = (slug: string): string => (slug === '' ? '/docs' : `/docs/${slug}`);

/** Reading order across every group, for the previous / next rail. */
export const DOC_ORDER: readonly DocMeta[] = DOC_GROUPS.flatMap((g) => docsByGroup(g.id));

export function docNeighbours(slug: string): { prev: DocMeta | null; next: DocMeta | null } {
  const i = DOC_ORDER.findIndex((d) => d.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return { prev: DOC_ORDER[i - 1] ?? null, next: DOC_ORDER[i + 1] ?? null };
}

/* -------------------------------------------------------------------------
   Legal documents
   ------------------------------------------------------------------------- */

export interface LegalMeta {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  /** The date this document was last substantively changed. */
  readonly updated: string;
}

export const LEGAL: readonly LegalMeta[] = [
  {
    slug: 'terms',
    title: 'Terms of use',
    summary: 'The terms under which you may use the MIDNAT interface and interact with the contracts.',
    updated: '2026-08-18',
  },
  {
    slug: 'privacy',
    title: 'Privacy notice',
    summary: 'Every piece of data MIDNAT touches, where it goes, and how long it stays. Written from an audit of the code, not from a template.',
    updated: '2026-08-18',
  },
  {
    slug: 'risk-disclosure',
    title: 'Risk disclosure',
    summary: 'The ways you can lose everything you deposit, stated plainly and without softening.',
    updated: '2026-08-17',
  },
  {
    slug: 'testnet',
    title: 'Testnet disclosure',
    summary: 'What a testnet deployment means for your balances, your positions and this deployment\u2019s lifetime.',
    updated: '2026-08-17',
  },
  {
    slug: 'ai-disclosure',
    title: 'AI disclosure',
    summary: 'What the language model layer does, which model answers you, and the limits placed on it.',
    updated: '2026-08-17',
  },
  {
    slug: 'market-data',
    title: 'Market data disclosure',
    summary: 'Where reference prices come from, what they are not, and who owns the underlying data.',
    updated: '2026-08-17',
  },
  {
    slug: 'acceptable-use',
    title: 'Acceptable use',
    summary: 'What you may not do with the interface, the API and the contracts.',
    updated: '2026-08-17',
  },
  {
    slug: 'cookies',
    title: 'Cookies and local storage',
    summary: 'The four keys MIDNAT stores in your browser, and the one cookie. There is no analytics and no tracking.',
    updated: '2026-08-17',
  },
  {
    slug: 'licenses',
    title: 'Licences and attributions',
    summary:
      "MIDNAT's own source is MIT licensed. This page records that, and the software, data and typefaces MIDNAT is built on.",
    updated: '2026-08-18',
  },
];

export const legalBySlug = (slug: string): LegalMeta | undefined => LEGAL.find((l) => l.slug === slug);
export const legalHref = (slug: string): string => `/legal/${slug}`;

/* -------------------------------------------------------------------------
   Protocol and trust pages
   ------------------------------------------------------------------------- */

export const PROTOCOL_PAGES: readonly SiteLink[] = [
  { label: 'Protocol', href: '/protocol', summary: 'What MIDNAT is, in one page.' },
  { label: 'Markets', href: '/markets', summary: 'Every listed market and its live parameter set.' },
  { label: 'Fees', href: '/fees', summary: 'Every cost of a round trip, and the ones we do not charge.' },
  { label: 'Risk', href: '/risk', summary: 'The risk framework, tier by tier.' },
  { label: 'Whitepaper', href: '/whitepaper', summary: 'The canonical design document.' },
  { label: 'Documentation', href: '/docs', summary: 'Reference documentation for traders, LPs and developers.' },
];

export const TRUST_PAGES: readonly SiteLink[] = [
  { label: 'Contracts', href: '/contracts', summary: 'Deployed addresses, roles and verification state.' },
  { label: 'Deployments', href: '/deployments', summary: 'Every deployment and owner operation on this chain.' },
  { label: 'Verify', href: '/verify', summary: 'Check MIDNAT yourself, and see what each proof does not prove.' },
  { label: 'Security', href: '/security', summary: 'Security posture, key concentration and disclosure.' },
  { label: 'Status', href: '/status', summary: 'Live reads from the systems that must be up.' },
  { label: 'Changelog', href: '/changelog', summary: 'Recorded protocol changes, newest first.' },
];

/**
 * Every indexable route on the public site, in one list.
 *
 * The router registers these, the sitemap is generated from these, and the
 * route-coverage check compares the two. A page that is not here is not part
 * of the public site, and 404 is deliberately absent.
 */
export const ALL_PUBLIC_ROUTES: readonly string[] = [
  '/',
  ...PROTOCOL_PAGES.map((p) => p.href),
  ...DOCS.map((d) => docHref(d.slug)),
  '/about',
  '/brand',
  ...TRUST_PAGES.map((p) => p.href),
  '/legal',
  ...LEGAL.map((l) => legalHref(l.slug)),
].filter((href, i, all) => all.indexOf(href) === i);

/* -------------------------------------------------------------------------
   Header and footer
   ------------------------------------------------------------------------- */

/** Compact navigation shown on every public document page. */
export const HEADER_LINKS: readonly SiteLink[] = [
  { label: 'Protocol', href: '/protocol' },
  { label: 'Docs', href: '/docs' },
  { label: 'Whitepaper', href: '/whitepaper' },
  { label: 'Contracts', href: '/contracts' },
  { label: 'Security', href: '/security' },
];

export interface FooterGroup {
  readonly title: string;
  readonly links: readonly SiteLink[];
}

/**
 * The footer is the deep navigation layer of this site (directive section 9):
 * everything reachable, grouped by intent, no dead ends.
 */
export function footerGroups(): readonly FooterGroup[] {
  return [
    {
      title: 'Product',
      links: [
        { label: 'Trade', href: appHref('/trade'), external: true },
        { label: 'Markets', href: appHref('/markets'), external: true },
        { label: 'Vault', href: appHref('/vault'), external: true },
        { label: 'Portfolio', href: appHref('/portfolio'), external: true },
      ],
    },
    {
      title: 'Protocol',
      links: [
        { label: 'Overview', href: '/protocol' },
        { label: 'Documentation', href: '/docs' },
        { label: 'Whitepaper', href: '/whitepaper' },
        { label: 'Market specifications', href: '/markets' },
        { label: 'Fees', href: '/fees' },
        { label: 'Risk framework', href: '/risk' },
      ],
    },
    {
      title: 'Trust',
      links: [
        { label: 'Contracts', href: '/contracts' },
        { label: 'Deployments', href: '/deployments' },
        { label: 'Verify', href: '/verify' },
        { label: 'Security', href: '/security' },
        { label: 'Status', href: '/status' },
        { label: 'Changelog', href: '/changelog' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Legal hub', href: '/legal' },
        { label: 'Terms of use', href: '/legal/terms' },
        { label: 'Privacy notice', href: '/legal/privacy' },
        { label: 'Risk disclosure', href: '/legal/risk-disclosure' },
        { label: 'Testnet disclosure', href: '/legal/testnet' },
        { label: 'AI disclosure', href: '/legal/ai-disclosure' },
      ],
    },
  ];
}

/** Small print row under the footer groups. */
export const FOOTER_META_LINKS: readonly SiteLink[] = [
  { label: 'About', href: '/about' },
  { label: 'Brand', href: '/brand' },
  { label: 'Acceptable use', href: '/legal/acceptable-use' },
  { label: 'Market data', href: '/legal/market-data' },
  { label: 'Cookies', href: '/legal/cookies' },
  { label: 'Licences', href: '/legal/licenses' },
];

/* -------------------------------------------------------------------------
   Search index across every public document
   ------------------------------------------------------------------------- */

export interface SearchEntry {
  readonly title: string;
  readonly href: string;
  readonly section: string;
  readonly summary: string;
  readonly keywords: readonly string[];
}

export const SEARCH_INDEX: readonly SearchEntry[] = [
  ...DOCS.map((d) => ({
    title: d.title,
    href: docHref(d.slug),
    section: DOC_GROUPS.find((g) => g.id === d.group)?.title ?? 'Docs',
    summary: d.summary,
    keywords: d.keywords,
  })),
  ...PROTOCOL_PAGES.filter((p) => p.href !== '/docs').map((p) => ({
    title: p.label,
    href: p.href,
    section: 'Protocol',
    summary: p.summary ?? '',
    keywords: [] as readonly string[],
  })),
  ...TRUST_PAGES.map((p) => ({
    title: p.label,
    href: p.href,
    section: 'Trust',
    summary: p.summary ?? '',
    keywords: [] as readonly string[],
  })),
  ...LEGAL.map((l) => ({
    title: l.title,
    href: legalHref(l.slug),
    section: 'Legal',
    summary: l.summary,
    keywords: [] as readonly string[],
  })),
];

export function searchSite(query: string, limit = 8): readonly SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const terms = q.split(/\s+/);
  const scored = SEARCH_INDEX.map((entry) => {
    const haystack = `${entry.title} ${entry.summary} ${entry.keywords.join(' ')} ${entry.section}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (!haystack.includes(term)) return { entry, score: -1 };
      if (entry.title.toLowerCase().includes(term)) score += 4;
      if (entry.keywords.some((k) => k.toLowerCase().includes(term))) score += 2;
      score += 1;
    }
    return { entry, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.entry);
}
