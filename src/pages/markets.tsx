import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import {
  AddressDisplay,
  Callout,
  KeyValue,
  Prose,
  RelatedLinks,
  Section,
  StatusBadge,
  TableScroll,
} from '@/components/public/primitives';
import { docHref } from '@/lib/site-map';
import {
  CANONICAL,
  COLLATERAL,
  GLOBALS,
  LEVERAGE_RANGE,
  MARKETS,
  NETWORK,
  bpsToPercent,
  blockNumber,
  collateralAmount,
} from '@/lib/protocol-registry';

interface ParamRow {
  readonly id: string;
  readonly label: string;
  readonly meaning: string;
}

const PARAM_GLOSSARY: readonly ParamRow[] = [
  { id: 'lev', label: 'Max leverage', meaning: 'The largest ratio of position size to assigned collateral the market will accept at open.' },
  { id: 'mm', label: 'Maintenance margin', meaning: 'The equity floor, as a share of size. Below it a position may be liquidated by anyone.' },
  { id: 'open', label: 'Open fee', meaning: 'Charged on notional size at open. It goes to the vault as LP revenue.' },
  { id: 'close', label: 'Close fee', meaning: 'Charged on notional size at close. It goes to the vault as LP revenue.' },
  { id: 'liq', label: 'Liquidation fee', meaning: 'Charged on notional size at liquidation, out of any positive residual, and paid to the vault.' },
  { id: 'spread', label: 'Base spread', meaning: 'A fixed adjustment against you, applied to the reference price on every fill.' },
  { id: 'impact', label: 'Impact scale and cap', meaning: 'A size-dependent adjustment that widens as your order consumes market capacity, bounded by the cap.' },
  { id: 'oi', label: 'Market and side caps', meaning: 'The share of vault capacity the whole market, and each side of it, may hold in open interest.' },
  { id: 'conf', label: 'Max confidence', meaning: 'The widest confidence band the market accepts. A wider band is treated as no valid price.' },
  { id: 'age', label: 'Max price age', meaning: 'The oldest an anchored price may be before the market refuses to trade on it.' },
];

export default function Markets() {
  return (
    <DocumentLayout
      meta={{
        title: 'Market specifications',
        description:
          'Every market listed on MIDNAT, its issuer, risk tier and full parameter set, plus the venue-wide caps and each listing transaction.',
        path: '/markets',
        type: 'article',
      }}
      eyebrow="Protocol"
      title="Market specifications"
      standfirst="Every listed market, its issuer, its risk tier and the full parameter set the contract enforces, with the transaction that listed it on chain."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Markets' }]}
      status="LIVE_ON_TESTNET"
      width="wide"
      after={
        <RelatedLinks
          title="Related"
          links={[
            {
              label: 'Markets and risk tiers',
              href: docHref('markets-and-tiers'),
              summary: 'What the three tiers mean and why a parameter is set where it is.',
            },
            { label: 'Fees', href: '/fees', summary: 'Every cost of a round trip, tier by tier.' },
            { label: 'Risk framework', href: '/risk', summary: 'How each limit bounds the risk it is there for.' },
          ]}
        />
      }
    >
      <Section id="ownership" title="What these contracts are">
        <Callout tone="caution" title="These are not shares">
          {CANONICAL.noOwnership}
        </Callout>
        <Prose>
          <p>
            Each market below is a perpetual contract that tracks the reference price of the named issuer. The issuer
            name is identity, not a relationship: the company does not know MIDNAT exists, and holding a position
            confers nothing from it.
          </p>
          <p>
            All markets settle in {COLLATERAL.name} ({COLLATERAL.symbol}) on {NETWORK.label}, chain {NETWORK.chainId}.
          </p>
        </Prose>
      </Section>

      <Section id="venue" title="Venue-wide parameters">
        <Prose>
          <p>These apply across every market and are set by owner operation, not per listing.</p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Collateral', value: `${COLLATERAL.name} (${COLLATERAL.symbol})` },
            { key: 'Leverage range', value: `${LEVERAGE_RANGE.min}x to ${LEVERAGE_RANGE.max}x by tier` },
            { key: 'Global open interest cap', value: `${bpsToPercent(GLOBALS.globalOiFactorBps, 0)} of vault net asset value` },
            { key: 'Minimum collateral', value: collateralAmount(GLOBALS.minCollateral, 2) },
            { key: 'Minimum position size', value: collateralAmount(GLOBALS.minSize, 2) },
          ]}
        />
      </Section>

      <Section id="how-to-read" title="How to read a market">
        <Prose>
          <p>
            Every market carries the same parameter set. The values differ by tier: a heavier tier trades tighter
            leverage, a wider execution band and a smaller share of vault capacity. Read each column once here, then
            read the values in the specification table below.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Parameter</th>
                <th scope="col">What it controls</th>
              </tr>
            </thead>
            <tbody>
              {PARAM_GLOSSARY.map((p) => (
                <tr key={p.id}>
                  <td className="pub-td-key">{p.label}</td>
                  <td>{p.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="specifications" title="Listed markets">
        <Prose>
          <p>
            {MARKETS.length} markets are listed. Fees, spread and impact are in basis points, where 100 bps is one per
            cent. The open interest caps are a share of vault capacity.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Symbol</th>
                <th scope="col">Issuer</th>
                <th scope="col">Tier</th>
                <th scope="col" className="pub-td-num">Max leverage</th>
                <th scope="col" className="pub-td-num">Maintenance margin</th>
                <th scope="col" className="pub-td-num">Open fee</th>
                <th scope="col" className="pub-td-num">Close fee</th>
                <th scope="col" className="pub-td-num">Liquidation fee</th>
                <th scope="col" className="pub-td-num">Base spread</th>
                <th scope="col" className="pub-td-num">Impact cap</th>
                <th scope="col" className="pub-td-num">Market cap</th>
                <th scope="col" className="pub-td-num">Side cap</th>
                <th scope="col" className="pub-td-num">Max confidence</th>
                <th scope="col" className="pub-td-num">Max price age</th>
              </tr>
            </thead>
            <tbody>
              {MARKETS.map((m) => (
                <tr key={m.symbol}>
                  <td className="pub-td-key">{m.symbol}</td>
                  <td>{m.name}</td>
                  <td>{m.tier.charAt(0) + m.tier.slice(1).toLowerCase()}</td>
                  <td className="pub-td-num">{m.params.maxLeverageX}x</td>
                  <td className="pub-td-num">{bpsToPercent(m.params.maintenanceMarginBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(m.params.openFeeBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(m.params.closeFeeBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(m.params.liqFeeBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(m.params.baseSpreadBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(m.params.impactMaxBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(m.params.marketOiFactorBps, 0)}</td>
                  <td className="pub-td-num">{bpsToPercent(m.params.sideOiFactorBps, 0)}</td>
                  <td className="pub-td-num">{bpsToPercent(m.params.maxConfidenceBps, 0)}</td>
                  <td className="pub-td-num">{m.params.maxPriceAgeSec}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <Prose>
          <p>
            The impact scale term is not in the table because it only takes effect through the order size: a market with
            a {bpsToPercent(MARKETS[0]!.params.impactScaleBps, 0)} impact scale still cannot move the fill past its
            impact cap. The tier definitions are on{' '}
            <Link href={docHref('markets-and-tiers')} className="pub-link">
              markets and risk tiers
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="listings" title="Listing transactions">
        <Prose>
          <p>
            Each market was listed by an on-chain transaction. The listing transaction and block are recorded in the
            deployment manifest and shown here so a reader can check the listing directly on the block explorer.
          </p>
        </Prose>
        <div className="flex flex-col gap-4">
          {MARKETS.map((m) => (
            <div key={m.symbol} className="pub-card flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="pub-h4">
                  {m.symbol}, {m.name}
                </span>
                <span className="pub-small">
                  Listed at block {blockNumber(m.block)}
                </span>
              </div>
              <AddressDisplay value={m.txHash} kind="tx" label="Listing transaction" />
            </div>
          ))}
        </div>
      </Section>

      <Section id="not-established" title="What this page does not establish">
        <Prose>
          <p>
            A parameter table describes how a market behaves, not whether the price it tracks is correct. The reference
            price is produced off chain and signed, and the on-chain signature proves who produced it, not that the
            upstream number was right.
          </p>
          <ul>
            <li>{CANONICAL.testnet}</li>
            <li>
              These parameters are the settings under test on this deployment. They are not a commitment to what any
              future deployment would use.
            </li>
            <li>{CANONICAL.noOwnership}</li>
          </ul>
          <p>
            The costs implied by these fees, with a worked illustration, are on the{' '}
            <Link href="/fees" className="pub-link">
              fees page
            </Link>
            .
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
