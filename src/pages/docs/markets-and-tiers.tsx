import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import {
  AddressDisplay,
  Callout,
  Prose,
  Section,
  StatusBadge,
  TableScroll,
} from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import {
  MARKETS,
  TIERS,
  bpsToPercent,
  type MarketParams,
} from '@/lib/protocol-registry';

const DOC = docBySlug('markets-and-tiers')!;

const PARAM_ROWS: readonly {
  readonly label: string;
  readonly explain: string;
  readonly value: (p: MarketParams) => string;
}[] = [
  {
    label: 'Max leverage',
    explain: 'The largest ratio of notional size to margin the market will accept on an open.',
    value: (p) => `${p.maxLeverageX}x`,
  },
  {
    label: 'Maintenance margin',
    explain: 'The minimum equity a position must keep before it can be liquidated.',
    value: (p) => bpsToPercent(p.maintenanceMarginBps),
  },
  {
    label: 'Open fee',
    explain: 'Charged on notional when a position opens.',
    value: (p) => bpsToPercent(p.openFeeBps),
  },
  {
    label: 'Close fee',
    explain: 'Charged on notional when a position closes.',
    value: (p) => bpsToPercent(p.closeFeeBps),
  },
  {
    label: 'Liquidation fee',
    explain: 'Taken from the liquidated position and settled to the vault. The caller is paid nothing.',
    value: (p) => bpsToPercent(p.liqFeeBps),
  },
  {
    label: 'Base spread',
    explain: 'A fixed charge added against you on every fill, separate from fees.',
    value: (p) => bpsToPercent(p.baseSpreadBps),
  },
  {
    label: 'Impact scale',
    explain: 'How steeply the fill price worsens as your order consumes side capacity.',
    value: (p) => bpsToPercent(p.impactScaleBps),
  },
  {
    label: 'Impact cap',
    explain: 'The most the impact term can move your fill price, regardless of size.',
    value: (p) => bpsToPercent(p.impactMaxBps),
  },
  {
    label: 'Market OI factor',
    explain: 'The share of vault net asset value that may back open interest on this market.',
    value: (p) => bpsToPercent(p.marketOiFactorBps, 0),
  },
  {
    label: 'Side OI factor',
    explain: 'The share of the market cap that either side, long or short, may take.',
    value: (p) => bpsToPercent(p.sideOiFactorBps, 0),
  },
  {
    label: 'Max confidence',
    explain: 'The widest price confidence band the market accepts before it refuses a trade.',
    value: (p) => bpsToPercent(p.maxConfidenceBps),
  },
  {
    label: 'Max price age',
    explain: 'How old the anchored price may be before an open is refused.',
    value: (p) => `${p.maxPriceAgeSec}s`,
  },
];

export default function MarketsAndTiers() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="The listed markets and the three risk tiers that set every parameter behind them. Each market inherits one tier, and the tier decides leverage, margin, fees, spread, impact and how much of the vault it may use."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="markets" title="Listed markets">
        <Prose>
          <p>
            {MARKETS.length} markets are listed on this deployment, each a perpetual on a single equity underlying. A
            market's tier fixes its whole parameter package, so two markets in the same tier share the same leverage,
            margin and fees. The fee columns here are for orientation; the full cost of a round trip lives on the{' '}
            <Link href="/fees" className="pub-link">
              fees page
            </Link>
            .
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <caption>Listed markets</caption>
            <thead>
              <tr>
                <th scope="col">Symbol</th>
                <th scope="col">Underlying</th>
                <th scope="col">Tier</th>
                <th scope="col" className="text-right">Max leverage</th>
                <th scope="col" className="text-right">Maintenance</th>
                <th scope="col" className="text-right">Open fee</th>
                <th scope="col" className="text-right">Close fee</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <Prose>
          <p>
            The live parameter set for each market, read against the deployed contract, is on the{' '}
            <Link href="/markets" className="pub-link">
              market specifications page
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="tiers" title="The three risk tiers">
        <Prose>
          <p>
            A tier is a named bundle of risk parameters. The rows below explain what each parameter does in one line,
            so the table is readable by someone who has never traded a perpetual. Values are read from the deployment,
            one representative market per tier.
          </p>
          {TIERS.map((t) => (
            <p key={t.tier}>
              <strong>{t.label}.</strong> {t.description} Markets: {t.symbols.join(', ')}.
            </p>
          ))}
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <caption>Parameter set by tier</caption>
            <thead>
              <tr>
                <th scope="col">Parameter</th>
                <th scope="col">What it does</th>
                {TIERS.map((t) => (
                  <th key={t.tier} scope="col" className="text-right">
                    {t.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PARAM_ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="pub-td-key">{row.label}</td>
                  <td>{row.explain}</td>
                  {TIERS.map((t) => (
                    <td key={t.tier} className="pub-td-num">
                      {row.value(t.params)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <Prose>
          <p>
            The pattern is consistent: a higher tier means less leverage, more maintenance margin, a wider execution
            band and a smaller share of vault capacity. It prices a more reflexive underlying more conservatively
            rather than refusing to list it. The mechanics of the spread and impact terms are on the{' '}
            <Link href={docHref('execution-and-pricing')} className="pub-link">
              execution and pricing
            </Link>{' '}
            page.
          </p>
        </Prose>
      </Section>

      <Section id="listing" title="How a market is listed">
        <Prose>
          <p>
            A market exists once the owner calls the clearing house to list it with a tier and its parameter set. That
            listing is a transaction on chain, so the moment each market went live is a public, checkable record. The
            listing transaction and block for every market are below.
          </p>
        </Prose>
        <div className="flex flex-col gap-4">
          {MARKETS.map((m) => (
            <div key={m.symbol} className="pub-card flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="pub-h4">
                  {m.symbol} listing, block {m.block.toLocaleString('en-US')}
                </span>
                <StatusBadge status="LIVE_ON_TESTNET" />
              </div>
              <AddressDisplay value={m.txHash} kind="tx" label="Listing transaction" />
            </div>
          ))}
        </div>
      </Section>

      <Section id="suspension" title="Suspension, delisting and who holds the keys">
        <Prose>
          <p>
            Listing is not the only owner power over a market. The owner can change a market's risk parameters, set its
            operating mode to close only or halted, and delist it. The risk keeper can apply risk-driven state changes.
            These are real controls with real reach:
          </p>
          <ul>
            <li>
              <strong>Close only.</strong> New exposure is refused; existing positions can still be closed. Used to
              wind a market down without trapping open positions.
            </li>
            <li>
              <strong>Halted.</strong> The market stops accepting opens and closes through normal flow. A halt can
              leave a position you cannot close at the moment you want to.
            </li>
            <li>
              <strong>Parameter changes.</strong> Leverage, margin, fees and caps can move. A change tightens or
              loosens the terms your future opens face.
            </li>
          </ul>
        </Prose>
        <Callout tone="caution" title="One key holds several of these powers">
          On this deployment a single address is owner, risk keeper and funding keeper, with no multisig and no
          timelock. That key can retier, halt or delist a market. This is a real centralisation fact, and the{' '}
          <Link href="/security" className="pub-link">
            security page
          </Link>{' '}
          documents the key concentration in full.
        </Callout>
      </Section>

      <Section id="limits" title="What this does not tell you">
        <Prose>
          <p>
            The tier a market carries is a risk classification set by the owner, not a rating of the underlying company
            and not a statement about how the company will perform. A perpetual on any of these symbols conveys no
            share, ownership, dividend or vote in the named company.
          </p>
          <p>
            The parameters here are current values from the deployment, not guarantees. They can be changed by the
            owner at any time, and a change applies to the terms of your next open. A market can also be halted or
            delisted, which can leave a position you cannot close when you want to. Before you size a position, read{' '}
            <Link href={docHref('positions-and-margin')} className="pub-link">
              positions and margin
            </Link>{' '}
            for how these numbers translate into an open and a close.
          </p>
        </Prose>
      </Section>
    </DocsLayout>
  );
}
