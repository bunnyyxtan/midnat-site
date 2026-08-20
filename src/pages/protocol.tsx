import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import {
  Callout,
  KeyValue,
  Prose,
  RelatedLinks,
  Section,
  StatusBadge,
} from '@/components/public/primitives';
import { docHref } from '@/lib/site-map';
import {
  CANONICAL,
  COLLATERAL,
  FUNDING,
  GLOBALS,
  LEVERAGE_RANGE,
  MARKETS,
  NETWORK,
  bpsToPercent,
} from '@/lib/protocol-registry';

interface Movement {
  readonly id: string;
  readonly title: string;
  readonly status: Parameters<typeof StatusBadge>[0]['status'];
  readonly body: string;
  readonly link: { readonly label: string; readonly href: string };
}

const MOVEMENTS: readonly Movement[] = [
  {
    id: 'price-authority',
    title: 'Price authority',
    status: 'LIVE_ON_TESTNET',
    body:
      'A reference price is built off chain from upstream feeds, signed, and written to an on-chain anchor. The clearing house reads only the anchor. If the anchored price is too old or its confidence band is too wide, the trade reverts. The signature proves who produced the number, not that the number was right.',
    link: { label: 'The oracle anchor', href: docHref('oracle-anchor') },
  },
  {
    id: 'clearing-house',
    title: 'Clearing house',
    status: 'LIVE_ON_TESTNET',
    body:
      'One contract custodies trader collateral, owns every position opened by a call to it, builds the fill price from the reference price plus a spread and an impact term, accrues funding, and settles at close. Margin is isolated per position and positions close in full.',
    link: { label: 'Positions and margin', href: docHref('positions-and-margin') },
  },
  {
    id: 'vault-counterparty',
    title: 'Vault counterparty',
    status: 'LIVE_ON_TESTNET',
    body:
      'The vault is the counterparty to every position the clearing house opens. When a trader wins, the vault pays. When a trader loses, the collateral flows to the vault. If the vault cannot pay a winning close in full, the remainder becomes a claim on later vault cash rather than a write-down.',
    link: { label: 'The liquidity vault', href: docHref('vault') },
  },
  {
    id: 'risk-limits',
    title: 'Risk limits',
    status: 'LIVE_ON_TESTNET',
    body:
      'Open interest is capped globally, per market and per side of each market. Leverage is bounded by tier, funding is clamped on chain, and the price age and confidence tests refuse exposure the protocol cannot price. Liquidation is a permissionless function against a maintenance margin test.',
    link: { label: 'Markets and risk tiers', href: docHref('markets-and-tiers') },
  },
];

export default function Protocol() {
  return (
    <DocumentLayout
      meta={{
        title: 'Protocol',
        description:
          'What MIDNAT is: a synthetic equity perpetuals protocol on X Layer Testnet, with an on-chain price authority, a clearing house and a vault that takes the other side of every position.',
        path: '/protocol',
        type: 'article',
      }}
      eyebrow="Protocol"
      title="MIDNAT in one page"
      standfirst="A synthetic equity perpetuals protocol on a test network: leveraged long and short exposure to listed equities, around the clock, on a venue that does not keep the exchange's hours. Three contracts, one collateral asset, one price authority, and a vault that is the counterparty to every position the clearing house opens. This page is the map. The documentation is the territory."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Protocol' }]}
      status="LIVE_ON_TESTNET"
      width="doc"
      size="large"
      after={
        <RelatedLinks
          title="Read next"
          links={[
            {
              label: 'How MIDNAT works',
              href: docHref('how-it-works'),
              summary: 'The full mechanism on one page, with the position lifecycle step by step.',
            },
            {
              label: 'Security',
              href: '/security',
              summary: 'Key concentration, verification state, and what has never been exercised.',
            },
            {
              label: 'Documentation',
              href: '/docs',
              summary: 'Reference documentation for traders, LPs and developers.',
            },
            {
              label: 'Whitepaper',
              href: '/whitepaper',
              summary: 'The canonical design document.',
            },
          ]}
        />
      }
    >
      <Section id="what" title="What it is">
        <Prose>
          <p>
            MIDNAT lets you take a leveraged long or short position on the price of a listed equity without holding the
            equity and without an order book, at three in the morning as readily as at midday. The exchange keeps
            hours; this venue does not. There is no matching engine and no market maker. A trade is a call to one
            contract, priced from a number a second contract holds, backed by capital a third contract custodies. That
            is true of a trade placed in the app as much as one you assemble yourself, and{' '}
            <Link href={docHref('getting-started')} className="pub-link">
              getting started
            </Link>{' '}
            sets the app's version of it out step by step.
          </p>
          <p>
            A position on MIDNAT tracks a reference price, is denominated in {COLLATERAL.symbol}, and never touches a
            share, a broker or a stock exchange. It exists in one place: the clearing house, holding your collateral,
            on a chain anyone can read.
          </p>
        </Prose>
        <Callout tone="caution" title="Two facts to hold first">
          <p>{CANONICAL.testnet}</p>
          <p>{CANONICAL.noAudit}</p>
        </Callout>
      </Section>

      <Section id="facts" title="The venue at a glance">
        <KeyValue
          items={[
            { key: 'Network', value: `${NETWORK.label}` },
            { key: 'Chain ID', value: `${NETWORK.chainId} (${NETWORK.chainIdHex})` },
            { key: 'Collateral', value: `${COLLATERAL.name} (${COLLATERAL.symbol}), ${COLLATERAL.decimals} decimals` },
            { key: 'Listed markets', value: `${MARKETS.length}` },
            { key: 'Leverage', value: `${LEVERAGE_RANGE.min}x to ${LEVERAGE_RANGE.max}x by tier` },
            { key: 'Margin model', value: 'Isolated, per position' },
            { key: 'Open interest cap', value: `${bpsToPercent(GLOBALS.globalOiFactorBps, 0)} of vault net asset value` },
          ]}
        />
        <Prose>
          <p>
            Every number on this page comes from the deployment manifest through the protocol registry. When the
            deployment changes, this page changes with it. The deployed addresses, compiler settings and verification
            state are on the{' '}
            <Link href="/contracts" className="pub-link">
              contracts page
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="mechanism" title="The mechanism">
        <Prose>
          <p>
            The protocol has four moving parts. Each is live on the testnet deployment, and each has a documentation
            page that goes through it in detail.
          </p>
        </Prose>
        <div className="flex flex-col gap-4">
          {MOVEMENTS.map((m) => (
            <div key={m.id} className="pub-card flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="pub-h4">{m.title}</span>
                <StatusBadge status={m.status} />
              </div>
              <p className="pub-body !text-[0.9375rem]">{m.body}</p>
              <Link href={m.link.href} className="pub-link pub-small">
                {m.link.label}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section id="ownership" title="What a position is not">
        <Prose>
          <p>{CANONICAL.noOwnership}</p>
          <p>
            The market specifications, including the issuer named by each ticker, the tier and the full parameter set,
            are on the{' '}
            <Link href="/markets" className="pub-link">
              markets page
            </Link>
            . The cost of a round trip is on the{' '}
            <Link href="/fees" className="pub-link">
              fees page
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="exposure" title="Where you are still exposed">
        <Prose>
          <p>This page describes what the protocol does. It does not establish that the protocol is safe.</p>
          <ul>
            <li>{CANONICAL.noAudit}</li>
            <li>{CANONICAL.testnet}</li>
            <li>
              One key holds owner, risk keeper and funding keeper on this deployment. The oracle signer is a separate
              key. There is no multisig and no timelock. The concentrated role address can change risk parameters, halt
              markets and post funding.
            </li>
            <li>
              A single process posts signed prices. If it stops, prices go stale and the protocol blocks new exposure
              until they recover.
            </li>
            <li>
              Liquidation is implemented and tested, but no position has been liquidated on this deployment, by us or by
              anyone else. Treat the keeper economics as untested in the wild.
            </li>
          </ul>
          <p>
            The{' '}
            <Link href="/risk" className="pub-link">
              risk framework
            </Link>{' '}
            states each of these plainly and{' '}
            <Link href="/security" className="pub-link">
              security
            </Link>{' '}
            covers what is verified and what is concentrated in one key.
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
