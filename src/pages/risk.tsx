import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import {
  Callout,
  H3,
  KeyValue,
  Prose,
  RelatedLinks,
  Section,
  TableScroll,
} from '@/components/public/primitives';
import { docHref } from '@/lib/site-map';
import {
  CANONICAL,
  FUNDING,
  GLOBALS,
  LEVERAGE_RANGE,
  LIMITATIONS,
  ORACLE_POLICY,
  bpsToPercent,
} from '@/lib/protocol-registry';

export default function Risk() {
  return (
    <DocumentLayout
      meta={{
        title: 'Risk framework',
        description:
          'The risks a trader carries, the risks an LP carries, the risks the protocol carries and how each is bounded, and the residual risks that are bounded by nothing.',
        path: '/risk',
        type: 'article',
      }}
      eyebrow="Protocol"
      title="Risk framework"
      standfirst="What can go wrong for a trader, for a liquidity provider and for the protocol itself, which of those risks the contracts bound and how, and which risks nothing bounds."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Risk' }]}
      width="doc"
      after={
        <RelatedLinks
          title="Related"
          links={[
            {
              label: 'Risk disclosure',
              href: '/legal/risk-disclosure',
              summary: 'The ways you can lose everything you deposit, stated plainly.',
            },
            { label: 'Security', href: '/security', summary: 'Key concentration, verification state and disclosure.' },
            {
              label: 'Deferred payouts',
              href: docHref('deferred-payouts'),
              summary: 'What a winning close is owed when the vault cannot pay in full.',
            },
          ]}
        />
      }
    >
      <Section id="reading" title="How to read this">
        <Callout tone="caution" title="This is a risk statement, not reassurance">
          <p>
            The sections below name risks and then say what, if anything, bounds each one. Where nothing bounds a risk,
            the page says so.
          </p>
          <p>{CANONICAL.testnet}</p>
        </Callout>
      </Section>

      <Section id="trader" title="The risks a trader carries">
        <Prose>
          <ul>
            <li>
              <strong>Total loss of margin.</strong> Margin is isolated per position. When equity falls to the
              maintenance margin, the position may be liquidated and the assigned margin can be lost in full.
            </li>
            <li>
              <strong>Leverage multiplies the move.</strong> At the top of the range, {LEVERAGE_RANGE.max}x, a small
              adverse move in the reference price is enough to reach the maintenance margin.
            </li>
            <li>
              <strong>Execution is against you.</strong> The fill price carries a base spread and an impact term, so a
              position is underwater against the reference price the moment it opens.
            </li>
            <li>
              <strong>Funding accrues while you hold.</strong> The side that is with the crowd pays funding to the
              lighter side. It is charged continuously and settled at close.
            </li>
            <li>
              <strong>Positions close in full.</strong> There is no partial close on this deployment, so you cannot
              trim a position to reduce risk, only close it and reopen smaller.
            </li>
            <li>
              <strong>A winning close can be deferred.</strong> If the vault cannot pay your profit in full at that
              moment, the remainder becomes an unsecured claim, not cash in hand.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section id="lp" title="The risks an LP carries">
        <Prose>
          <ul>
            <li>
              <strong>You are the counterparty.</strong> The vault takes the other side of every position. When traders
              are net right, the vault pays them, and net asset value falls.
            </li>
            <li>
              <strong>Directional exposure.</strong> If the venue is skewed long, the vault is short the venue. Funding
              and the impact term price that imbalance, but they do not remove it.
            </li>
            <li>
              <strong>Deferred claims rank ahead of you.</strong> When the vault cannot pay a winning close, the
              shortfall is recorded as a claim senior to LP equity and paid from later vault cash before LPs.
            </li>
            <li>
              <strong>Withdrawal is capped by open interest.</strong> LP withdrawals cannot drop remaining net asset
              value below the capital required to back open positions, so capital can be locked when the book is busy.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section id="bounded" title="The risks the protocol carries, and how each is bounded">
        <Prose>
          <p>
            Concentrated directional exposure and a mispriced or stale reference price are the two failures a
            perpetuals venue must contain. The contracts bound each of them with hard limits, checked on every relevant
            call.
          </p>
        </Prose>

        <H3 id="bounded-oi">Open interest caps</H3>
        <Prose>
          <p>
            Exposure is limited at three levels. A position that would push any level past its limit is refused rather
            than partially filled.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Global cap', value: `${bpsToPercent(GLOBALS.globalOiFactorBps, 0)} of vault net asset value across all markets` },
            { key: 'Per-market cap', value: 'A share of vault capacity for each market, set by tier' },
            { key: 'Per-side cap', value: 'A share of vault capacity for each side of each market, set by tier' },
          ]}
        />

        <H3 id="bounded-leverage">Leverage and maintenance margin</H3>
        <Prose>
          <p>
            Leverage is capped by tier, from {LEVERAGE_RANGE.min}x to {LEVERAGE_RANGE.max}x. Each market carries a
            maintenance margin: when a position's equity, which is margin plus unrealised profit and loss minus accrued
            funding, falls below it, the position may be liquidated by anyone through a permissionless call.
          </p>
        </Prose>

        <H3 id="bounded-funding">Funding clamp</H3>
        <Prose>
          <p>
            The funding keeper posts a rate, and the contract clamps it at {FUNDING.clampPercentPerHour}% per hour in
            either direction. A keeper key cannot drain a book through the funding channel even if it tried, because the
            clamp is enforced on chain. Accrual is {FUNDING.accrual.toLowerCase()}.
          </p>
        </Prose>

        <H3 id="bounded-price">Price age and confidence limits</H3>
        <Prose>
          <p>
            The clearing house reads only the on-chain anchor. If the anchored price is older than{' '}
            {ORACLE_POLICY.maxPriceAgeSec} seconds, or its confidence band is wider than the market allows, the trade
            reverts. A stale or uncertain price is treated as no valid price, and trading, liquidation and vault share
            flows all refuse on it.
          </p>
        </Prose>

        <H3 id="bounded-modes">Operating modes</H3>
        <Prose>
          <p>
            Each market, and the venue as a whole, has an operating mode. Normal accepts new exposure. Close only blocks
            opens while allowing closes and withdrawals. Halted blocks deposits, opens, closes and liquidations alike, so
            a halt is reported the same way everywhere and never fills at a price it cannot defend.
          </p>
        </Prose>
      </Section>

      <Section id="residual" title="The residual risks nothing bounds">
        <Prose>
          <p>
            The limits above bound the risks the contracts can see. The following are published limitations of this
            deployment. Nothing in the protocol bounds them, and no page on this site claims otherwise.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Area</th>
                <th scope="col">Limitation</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              {LIMITATIONS.map((l) => (
                <tr key={l.id}>
                  <td className="pub-td-key">{l.area}</td>
                  <td>{l.title}</td>
                  <td>{l.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="not-established" title="What this page does not establish">
        <Prose>
          <p>
            A bounded risk is a risk that has been contained, not a risk that has been removed. The caps and clamps
            above have been implemented and tested, and none of that is the same as being proven safe with real money.
          </p>
          <ul>
            <li>{CANONICAL.noAudit}</li>
            <li>
              No position has been liquidated on this deployment. The liquidation path is tested but the keeper
              economics are untested in the wild.
            </li>
            <li>{CANONICAL.notAdvice}</li>
          </ul>
          <p>
            The{' '}
            <Link href="/legal/risk-disclosure" className="pub-link">
              risk disclosure
            </Link>{' '}
            states the ways a position can lose everything, and{' '}
            <Link href={docHref('deferred-payouts')} className="pub-link">
              deferred payouts
            </Link>{' '}
            covers where a winning trader is still exposed after the close.
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
