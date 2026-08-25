import {
  DOCS,
  LEGAL,
  PROTOCOL_PAGES,
  TRUST_PAGES,
  docHref,
  legalHref,
  type SiteLink,
} from './site-map';

export type SocialType = 'website' | 'article';

export interface StaticRouteMeta {
  readonly title: string;
  readonly description: string;
  readonly type: SocialType;
}

const HOME: StaticRouteMeta = {
  title: 'MIDNAT | Stock Perpetuals, Always Open',
  description:
    'Trade US equity perpetuals 24/7 on X Layer. USDT0 collateral, zero gas, oracle-verified pricing. No closing bells.',
  type: 'website',
};

const page = (title: string, description: string, type: SocialType = 'website'): StaticRouteMeta => ({
  title,
  description,
  type,
});

const fromLinks = (links: readonly SiteLink[]): Record<string, StaticRouteMeta> =>
  Object.fromEntries(
    links.map((link) => [
      link.href,
      page(link.label === 'Markets' ? 'Market specifications' : link.label, link.summary ?? ''),
    ]),
  );

/**
 * Build-time identity for every public document. Docs and legal records are
 * deliberately projected from site-map.ts; their title/summary must have one
 * owner because those values also drive navigation and search.
 */
export const STATIC_ROUTE_META: Readonly<Record<string, StaticRouteMeta>> = {
  '/': HOME,
  ...fromLinks(PROTOCOL_PAGES),
  ...fromLinks(TRUST_PAGES),
  '/docs': page(
    'Documentation',
    'Reference documentation for MIDNAT: how the protocol works, how positions and margin behave, how the vault prices risk, and where reference prices come from.',
  ),
  ...Object.fromEntries(
    DOCS.map((doc) => [docHref(doc.slug), page(doc.title, doc.summary, 'article')]),
  ),
  '/legal': page(
    'Legal',
    'The MIDNAT legal documents: terms of use, privacy notice, risk disclosure, testnet disclosure, AI disclosure, market data, acceptable use, cookies and licences.',
  ),
  ...Object.fromEntries(
    LEGAL.map((legal) => [legalHref(legal.slug), page(legal.title, legal.summary, 'article')]),
  ),
  '/about': page(
    'About',
    'What MIDNAT is, why it exists, the principles it holds itself to, its current state, and how to reach the project.',
  ),
  '/brand': page(
    'Brand',
    'How to write the MIDNAT name, use the mark, read the palette from live tokens, set the type, and write in the brand voice.',
  ),
  '/whitepaper': page(
    'MIDNAT whitepaper',
    'The canonical design document for MIDNAT: reference pricing, execution, margin, funding, the vault counterparty, deferred payouts, trust model and current deployment scope.',
    'article',
  ),
  '/changelog': page(
    'Changelog',
    'The on-chain record of the MIDNAT testnet deployment, including recorded receipts, market listings and owner operations.',
    'article',
  ),
};

export function documentTitle(route: string, title: string): string {
  return route === '/' ? title : `${title} · MIDNAT`;
}
