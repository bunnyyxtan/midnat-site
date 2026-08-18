# MIDNAT

The public site for **MIDNAT**, a stock perpetuals venue on X Layer that stays
open when the exchange session is closed.

This is the marketing, documentation and legal surface served at
[midnat.xyz](https://midnat.xyz). The trading terminal is a separate
application on its own host, [app.midnat.xyz](https://app.midnat.xyz).

MIDNAT runs on X Layer Testnet. Positions, collateral and vault shares are
testnet values with no monetary worth.

---

## What is in here

| Area | What it covers |
| --- | --- |
| Landing | The venue in one screen: the always-open claim, a live signed reference price, the vault and the FAQ. |
| `/docs` | Fifteen pages: getting started, execution and pricing, funding, liquidation, deferred payouts, the reference engine, the oracle anchor, the vault, market hours, the API. |
| `/whitepaper` | The full protocol document, including the limitations and what would have to change before mainnet. |
| `/protocol`, `/contracts`, `/deployments`, `/verify` | The deployed addresses, their provenance, and how to reproduce the bytecode from source. |
| `/legal` | Nine documents: terms, privacy, risk, testnet, AI, market data, acceptable use, cookies, licences. |

Every figure on the site is read from one module,
`src/lib/protocol-registry.ts`, and the deployed addresses in it come from the
chain manifest at `src/deployments/1952.json` rather than being restated from
memory, so a page cannot quietly disagree with the deployment.

## Running it

```bash
npm install
npm run dev
```

The dev server starts on port 5173.

## Checks

```bash
npm run typecheck   # tsc, no emit
npm test            # the truth suite
npm run build       # production bundle into dist/
```

## The truth suite

`src/site-truth.test.ts` is not a UI test. It reads the source of every page and
holds the sentences on them to the deployed product: no rendering, because a
false sentence renders perfectly well.

It fails the build when a page describes an architecture the protocol retired,
publishes a market count the deployment does not list, prints a contact channel
that does not exist, hard-codes an origin that belongs in one file, links
somewhere the router cannot serve, or documents a browser storage key nothing
writes. Adding a page adds it to these tests automatically.

`src/lib/reference-feed.test.ts` covers the live price feed on the landing page,
including how it degrades when the feed is stale or unreachable.

## Deploying

The site is a static single-page application. `vercel.json` sets the build
command, the output directory and the single-page rewrite, so a Vercel import
needs no further configuration. Any static host works given an equivalent
rewrite of unknown paths to `/index.html`; `sitemap.xml` and `robots.txt` are
generated at build time from the site map.

## Licence

MIT. See [LICENSE](LICENSE).
