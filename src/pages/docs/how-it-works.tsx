import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, H3, KeyValue, Prose, Section, StatusBadge } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import {
  CANONICAL,
  COLLATERAL,
  CONTRACTS,
  FUNDING,
  GLOBALS,
  LEVERAGE_RANGE,
  MARKETS,
  NETWORK,
  ORACLE_POLICY,
  REFERENCE_ENGINE,
  bpsToPercent,
  collateralAmount,
} from '@/lib/protocol-registry';

const DOC = docBySlug('how-it-works')!;

export default function HowItWorks() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="The whole protocol on one page: how a venue that never closes prices an equity whose exchange does. Three contracts, one collateral asset, one price authority, and a vault that takes the other side of every position the clearing house opens."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="shape" title="The shape of it">
        <Prose>
          <p>
            MIDNAT is three contracts on {NETWORK.label}. There is no order book, no matching engine and no market
            maker. A trade is a call to one contract, priced from a number that another contract holds, backed by
            capital that a third contract custodies.
          </p>
          <p>
            This page describes each mechanism from the perspective of the deployed contracts, which is also what the
            app does: the order ticket builds that call and your wallet sends it. What the interface adds around it is
            set out under{' '}
            <Link href={docHref('getting-started')} className="pub-link">
              getting started
            </Link>
            .
          </p>
        </Prose>

        <div className="flex flex-col gap-4">
          {CONTRACTS.map((c) => (
            <div key={c.key} className="pub-card flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="pub-h4">{c.name}</span>
                <StatusBadge status={c.status} />
              </div>
              <p className="pub-body !text-[0.9375rem]">{c.role}</p>
              <p className="pub-small">{c.custody}</p>
            </div>
          ))}
        </div>

        <Prose>
          <p>
            Addresses, compiler settings and verification state for all three are on the{' '}
            <Link href="/contracts" className="pub-link">
              contracts page
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="price" title="Where the price comes from">
        <Prose>
          <p>
            A perpetual needs a reference price whether or not anyone is trading the underlying. MIDNAT builds one off
            chain and then puts a signed version of it on chain, because the contract cannot trust an HTTP response.
          </p>
          <p>
            The reference engine polls {REFERENCE_ENGINE.upstream} every {REFERENCE_ENGINE.pollIntervalSec} seconds and
            selects the freshest usable feed for each market: the equity session feed while the exchange is open, the
            pre-market and post-market feeds around it, and a tokenized 24/7 feed for the same underlying when the
            exchange is closed. When it has to change source, it walks the price across rather than jumping, so a
            handover does not print a gap that liquidates people.
          </p>
          <p>
            A signer key signs each report under {ORACLE_POLICY.signingScheme} and a poster writes it to the anchor
            roughly every {ORACLE_POLICY.posterIntervalSec} seconds. The clearing house reads only the anchor. If the
            anchored price is older than {ORACLE_POLICY.maxPriceAgeSec} seconds, or its confidence band is wider than the
            market allows, the trade reverts. The protocol would rather refuse than fill you on a number it cannot
            defend.
          </p>
        </Prose>
        <Callout tone="limit" title="What the signature proves">
          A valid signature proves the anchored price is the one the MIDNAT signer produced. It does not prove the
          upstream number was correct. Signing authenticates the messenger, not the market.{' '}
          <Link href={docHref('oracle-anchor')} className="pub-link">
            The oracle anchor
          </Link>{' '}
          goes through this in detail.
        </Callout>
      </Section>

      <Section id="counterparty" title="Who is on the other side">
        <Prose>
          <p>
            You are not trading against another user. The vault is the counterparty to every position the clearing
            house opens. When you win, the vault pays you. When you lose, your collateral flows to the vault, minus
            fees.
          </p>
          <p>
            That makes the vault a directional book by accident: if every trader is long, the vault is short the whole
            venue. Three mechanisms keep that from running away. Open interest is capped at{' '}
            {bpsToPercent(GLOBALS.globalOiFactorBps, 0)} of vault net asset value, and each market and each side of each
            market carries its own smaller cap. Funding pays the lighter side of a skewed market, which prices the
            imbalance instead of forbidding it. And the impact term makes each additional unit of the crowded side fill
            at a worse price than the last.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Collateral asset', value: `${COLLATERAL.name} (${COLLATERAL.symbol})` },
            { key: 'Margin model', value: 'Isolated, per position' },
            { key: 'Listed markets', value: `${MARKETS.length}` },
            { key: 'Leverage', value: `${LEVERAGE_RANGE.min}x to ${LEVERAGE_RANGE.max}x by tier` },
            { key: 'Minimum collateral', value: collateralAmount(GLOBALS.minCollateral, 2) },
            { key: 'Minimum position size', value: collateralAmount(GLOBALS.minSize, 2) },
            { key: 'Funding counterparties', value: FUNDING.counterparties },
          ]}
        />
      </Section>

      <Section id="lifecycle" title="What happens when the clearing house opens a position">
        <Prose>
          <ol>
            <li>
              <strong>You deposit {COLLATERAL.symbol}.</strong> Collateral sits in the clearing house against your
              account. It is not pooled with LP capital and it is not the vault's to lend.
            </li>
            <li>
              <strong>You choose a market, a side and a size.</strong> Size is notional, not margin. Your leverage is
              size divided by the collateral you assign to that position, and it must sit inside the tier's maximum.
            </li>
            <li>
              <strong>The contract reads the anchor.</strong> Too old, too uncertain, or the market is not in a state
              that accepts new exposure, and the call reverts here.
            </li>
            <li>
              <strong>The fill price is built.</strong> Reference price, then the tier's base spread against you, then an
              impact term that scales with how much of the venue's capacity your order consumes on that side.
            </li>
            <li>
              <strong>Caps are checked.</strong> Global, per market and per side. A position that would push any of them
              past its limit is refused rather than partially filled.
            </li>
            <li>
              <strong>The position is written.</strong> Entry price, size, margin, and the funding index at that moment,
              so your funding accrues from the exact point you joined.
            </li>
          </ol>
        </Prose>
      </Section>

      <Section id="close" title="Closing, funding and liquidation">
        <H3 id="close-full">Positions close in full</H3>
        <Prose>
          <p>
            There is no partial close on this deployment. Closing settles the position at the current fill price, applies
            accrued funding and the close fee, and returns what is left of your margin. If the position is profitable,
            the vault pays the profit.
          </p>
          <p>
            If the vault cannot pay it in full at that moment, the shortfall does not disappear and it is not written
            down. It is recorded as a claim that ranks ahead of LP equity and is paid from later vault cash. That is a
            liquidity failure, not a solvency one, and{' '}
            <Link href={docHref('deferred-payouts')} className="pub-link">
              deferred payouts
            </Link>{' '}
            explains why the distinction matters and where it can still hurt you.
          </p>
        </Prose>

        <H3 id="close-funding">Funding is continuous and clamped</H3>
        <Prose>
          <p>
            Funding accrues per market from a rate the funding keeper posts. The contract clamps that rate at{' '}
            {FUNDING.clampPercentPerHour}% per hour in either direction, so a keeper key cannot drain a book through the
            funding channel even if it wanted to. Accrual is lazy: the index moves when the market is touched, and your
            share is computed from the index you entered at.
          </p>
        </Prose>

        <H3 id="close-liquidation">Liquidation is a public function</H3>
        <Prose>
          <p>
            A position is liquidatable when its equity, which is margin plus unrealised profit and loss minus accrued
            funding, falls below the tier's maintenance margin requirement. Anyone can call it, and on this deployment
            the caller is paid no bounty for doing so. The tier's liquidation fee is deducted from the remaining equity
            and settled to the vault together with the loss, and whatever equity survives that deduction returns to the
            trader.
          </p>
        </Prose>
        <Callout tone="caution" title="No liquidation has run on this deployment">
          Liquidation is implemented and tested, and it has been checked against the deployed contract with a
          chain-derived fixture. No position has actually been liquidated here. Treat the keeper economics as untested in
          the wild rather than proven.
        </Callout>
      </Section>

      <Section id="not" title="What MIDNAT is not">
        <Prose>
          <ul>
            <li>{CANONICAL.noOwnership}</li>
            <li>{CANONICAL.testnet}</li>
            <li>{CANONICAL.noAudit}</li>
            <li>{CANONICAL.notAdvice}</li>
          </ul>
        </Prose>
      </Section>
    </DocsLayout>
  );
}
