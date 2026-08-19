import { useId, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Prose, Section } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import {
  COLLATERAL,
  FUNDING,
  GLOBALS,
  LEVERAGE_RANGE,
  ORACLE_POLICY,
  REFERENCE_ENGINE,
  bpsToPercent,
  collateralAmount,
} from '@/lib/protocol-registry';

const DOC = docBySlug('glossary')!;

interface Term {
  readonly term: string;
  readonly def: ReactNode;
  /** Lowercase text used for the filter, so ReactNode defs still match. */
  readonly search: string;
}

const TERMS: readonly Term[] = [
  {
    term: 'Anchored price',
    search: 'anchored price on-chain report clearing house',
    def: 'The signed reference price recorded on chain by the oracle anchor. The clearing house reads only the anchor when it prices a trade, never an off-chain source directly.',
  },
  {
    term: 'Base spread',
    search: 'base spread execution band tier fill',
    def: 'A fixed per-tier charge applied against you on every fill, added to the reference price on the side you take. It ranges by tier and is separate from the open and close fees.',
  },
  {
    term: 'Collateral',
    search: `collateral margin usdt0 ${COLLATERAL.symbol} deposit`,
    def: (
      <>
        The asset you post to back a position, held by the clearing house against your account. On this deployment it
        is {COLLATERAL.name} ({COLLATERAL.symbol}), with {COLLATERAL.decimals} decimals.
      </>
    ),
  },
  {
    term: 'Deferred payout',
    search: 'deferred payout unpaid claim vault illiquid shortfall',
    def: (
      <>
        When the vault cannot pay a closing position in full at that moment, the shortfall is recorded as a claim that
        ranks ahead of liquidity provider equity and is paid from later vault cash. It is a liquidity failure, not a
        write-down, and it can remain unpaid.{' '}
        <Link href={docHref('deferred-payouts')} className="pub-link">
          Deferred payouts
        </Link>{' '}
        covers it.
      </>
    ),
  },
  {
    term: 'Entry price',
    search: 'entry price open recorded position',
    def: 'The fill price recorded when a position is opened. Profit and loss is measured against this price for the life of the position.',
  },
  {
    term: 'Equity',
    search: 'equity margin pnl funding maintenance',
    def: 'The current value backing a position: posted margin plus unrealised profit and loss minus accrued funding. A position is liquidatable when its equity reaches or falls below the maintenance margin requirement.',
  },
  {
    term: 'Execution price',
    search: 'execution price fill spread impact reference',
    def: 'The price you actually transact at, built from the reference price, the tier base spread against you, and the impact term for your size. Also called the fill price.',
  },
  {
    term: 'Fill',
    search: 'fill execution filled order',
    def: 'A completed open or close at the execution price. There is no partial fill on this deployment: an order that cannot be filled in full is refused.',
  },
  {
    term: 'Funding',
    search: 'funding rate skew hourly clamp accrual',
    def: (
      <>
        A continuous payment between the two sides of a market that prices the imbalance between long and short open
        interest. It accrues per market and is clamped on chain at {FUNDING.clampPercentPerHour}% per hour in either
        direction.
      </>
    ),
  },
  {
    term: 'Funding index',
    search: 'funding index accrual lazy accumulator',
    def: 'A per-market accumulator of funding over time. Your share is the difference between the current index and the index recorded when you opened, so accrual is measured from the exact point you joined.',
  },
  {
    term: 'Impact',
    search: 'impact price scale cap slippage capacity',
    def: 'A size-dependent charge that makes each additional unit of the crowded side fill worse than the last. It scales with how much of the venue capacity your order consumes on that side and is capped per tier.',
  },
  {
    term: 'Isolated margin',
    search: 'isolated margin per position cross',
    def: 'A margin model where each position carries its own collateral and its own risk. A loss on one position cannot draw on the margin of another. There is no cross margin on this deployment.',
  },
  {
    term: 'Liquidation',
    search: 'liquidation maintenance margin keeper public function',
    def: (
      <>
        The forced close of a position whose equity has reached or fallen below the maintenance margin. It is a public function
        anyone can call.{' '}
        <Link href={docHref('liquidation')} className="pub-link">
          Liquidation
        </Link>{' '}
        describes the test and the payouts.
      </>
    ),
  },
  {
    term: 'Liquidation fee',
    search: 'liquidation fee reward liquidator keeper bounty',
    def: 'A per-tier charge deducted from a liquidated position and settled to the vault. It is not a bounty: on this deployment the account that calls liquidation pays the gas and receives nothing for the call.',
  },
  {
    term: 'Maintenance margin',
    search: 'maintenance margin minimum tier bps',
    def: 'The minimum equity a position must keep, set per tier as a fraction of notional size. Fall below it and the position can be liquidated.',
  },
  {
    term: 'Mark price',
    search: 'mark price valuation reference anchored pnl',
    def: 'The price used to value an open position and its profit and loss between trades. On this deployment it derives from the anchored reference price, not from a separate mark oracle.',
  },
  {
    term: 'Market tier',
    search: 'market tier standard elevated high risk parameter',
    def: (
      <>
        One of three risk bands, Standard, Elevated and High, that sets the full parameter package for a market:
        leverage, maintenance margin, fees, spread, impact and open-interest caps.{' '}
        <Link href={docHref('markets-and-tiers')} className="pub-link">
          Markets and risk tiers
        </Link>{' '}
        lists them.
      </>
    ),
  },
  {
    term: 'Net asset value',
    search: 'net asset value nav vault shares lp',
    def: 'The total value of the vault, used to price shares and to size the open-interest caps. Also written NAV.',
  },
  {
    term: 'Notional size',
    search: 'notional size exposure position value leverage',
    def: (
      <>
        The full market value of a position, not the margin behind it. Leverage is notional size divided by margin.
        The minimum size on this deployment is {collateralAmount(GLOBALS.minSize, 2)}.
      </>
    ),
  },
  {
    term: 'Open interest',
    search: 'open interest oi cap factor exposure',
    def: (
      <>
        The total notional of open positions on a market or side. It is capped globally at
        {' '}{bpsToPercent(GLOBALS.globalOiFactorBps, 0)} of vault net asset value, with smaller caps per market and
        per side.
      </>
    ),
  },
  {
    term: 'Oracle anchor',
    search: 'oracle anchor contract signer signature eip-712',
    def: (
      <>
        The contract that holds the signer registry and the latest signed reference report per market. Its signature
        proves the report came from the MIDNAT signer, not that the upstream number was correct.{' '}
        <Link href={docHref('oracle-anchor')} className="pub-link">
          The oracle anchor
        </Link>{' '}
        goes further.
      </>
    ),
  },
  {
    term: 'Perpetual',
    search: 'perpetual perp synthetic contract no expiry',
    def: 'A contract that tracks a reference price with no expiry date. Holding a MIDNAT perpetual gives you no share, ownership, dividend or vote in the company named by the ticker.',
  },
  {
    term: 'Reference price',
    search: 'reference price pyth hermes engine feed',
    def: (
      <>
        The price a perpetual tracks, built off chain by the reference engine from {REFERENCE_ENGINE.upstream} feeds,
        then signed and posted to the anchor. It exists whether or not the underlying exchange is open.
      </>
    ),
  },
  {
    term: 'Risk keeper',
    search: 'risk keeper role market state suspend halt',
    def: (
      <>
        A privileged role that applies risk-driven market state changes. On this deployment the same key holds owner,
        risk keeper and funding keeper.{' '}
        <Link href="/security" className="pub-link">
          Security
        </Link>{' '}
        documents that concentration.
      </>
    ),
  },
  {
    term: 'Share price',
    search: 'share price vault erc-4626 nav lp',
    def: 'The value of one vault share, equal to net asset value divided by shares outstanding. Liquidity providers deposit collateral and receive shares priced this way.',
  },
  {
    term: 'Signer',
    search: 'signer oracle key eip-712 signature',
    def: 'The key that signs reference reports the anchor accepts as canonical prices. A valid signature authenticates the messenger, not the market.',
  },
  {
    term: 'Skew',
    search: 'skew imbalance long short funding',
    def: 'The imbalance between long and short open interest on a market. The funding rate rises with skew, so the crowded side pays more to hold; a base carry means longs pay a small amount even when the book is balanced.',
  },
  {
    term: 'Stale price',
    search: 'stale price age refuse revert exposure',
    def: (
      <>
        A reference price older than the market allows. If the anchored price exceeds {ORACLE_POLICY.maxPriceAgeSec}
        {' '}seconds, or its confidence band is too wide, the trade reverts and new exposure is refused until a fresh
        price posts.
      </>
    ),
  },
  {
    term: 'Utilisation',
    search: 'utilisation vault capacity open interest nav',
    def: 'The share of vault capacity consumed by open interest. Higher utilisation means less room before an open-interest cap refuses a new position.',
  },
  {
    term: 'Vault',
    search: 'vault erc-4626 counterparty liquidity lp midnatvault',
    def: (
      <>
        The ERC-4626 liquidity vault that is the counterparty to every position the clearing house opens. When you win
        it pays you; when you lose your collateral flows to it, minus fees.{' '}
        <Link href={docHref('vault')} className="pub-link">
          The liquidity vault
        </Link>{' '}
        describes what liquidity providers are exposed to.
      </>
    ),
  },
];

export default function Glossary() {
  const [query, setQuery] = useState('');
  const inputId = useId();

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (q.length === 0) return TERMS;
    return TERMS.filter((t) => `${t.term.toLowerCase()} ${t.search}`.includes(q));
  }, [q]);

  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="One canonical definition for every term the site uses. Where a term carries a parameter, the value is cited from the deployment. If another page defines a term differently, this page wins."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="terms" title="Terms">
        <Prose>
          <p>
            Leverage runs from {LEVERAGE_RANGE.min}x to {LEVERAGE_RANGE.max}x by tier, margin is isolated per position,
            and the vault is the counterparty to every trade. The definitions below explain the mechanics behind those
            facts, in the way they actually work on this deployment.
          </p>
        </Prose>

        <div className="flex flex-col gap-2">
          <label htmlFor={inputId} className="pub-eyebrow">
            Filter terms
          </label>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to narrow the list"
            autoComplete="off"
            className="w-full max-w-sm rounded-lg border border-[color:var(--ln-glass-border)] bg-[var(--ln-glass-bg)] px-3 py-2 text-[0.9375rem] text-[color:var(--ln-ink)] outline-none transition-colors placeholder:text-[color:var(--ln-ink-soft)] focus:border-[color:var(--ln-glass-border-hover)]"
            data-testid="glossary-filter"
          />
          <p className="pub-small" aria-live="polite">
            {filtered.length} of {TERMS.length} terms
          </p>
        </div>

        {filtered.length === 0 ? (
          <Prose>
            <p>Nothing matches that. Clear the filter to see every term.</p>
          </Prose>
        ) : (
          <dl className="pub-glossary grid gap-x-8 gap-y-5 sm:grid-cols-[minmax(9rem,14rem)_minmax(0,1fr)]">
            {filtered.map((t) => (
              <div key={t.term} className="contents">
                <dt id={`term-${t.term.toLowerCase().replace(/\s+/g, '-')}`} className="pub-h4">
                  {t.term}
                </dt>
                <dd className="pub-body !text-[0.9375rem] m-0">{t.def}</dd>
              </div>
            ))}
          </dl>
        )}
      </Section>
    </DocsLayout>
  );
}
