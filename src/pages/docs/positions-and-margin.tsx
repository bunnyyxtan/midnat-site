import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, CodeBlock, H3, KeyValue, Prose, Section } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import {
  COLLATERAL,
  FUNDING,
  GLOBALS,
  TIERS,
  bpsToPercent,
  collateralAmount,
} from '@/lib/protocol-registry';

const DOC = docBySlug('positions-and-margin')!;

/** Standard tier, read from the registry, used only in the worked illustration. */
const STANDARD = TIERS.find((t) => t.tier === 'STANDARD') ?? TIERS[0];

export default function PositionsAndMargin() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="Every position carries isolated margin drawn from the Trading Account. This page defines equity and maintenance margin, the exact conditions to open and close, and the ways a position can fail."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="isolated" title="Isolated margin">
        <Prose>
          <p>
            Margin is isolated on this deployment: each position holds the margin assigned from your Trading Account
            and nothing else. A loss on one position cannot draw on another position's margin, your remaining available
            Trading Account balance or tokens still in your Wallet. The most a single position can lose you is the
            margin behind it. There is no cross margin.
          </p>
          <p>
            Notional size is the full market value of the position, not the margin you post. Your leverage is notional
            size divided by that margin, and it must sit inside the tier's maximum. A larger position at the same
            margin is a higher leverage and a closer liquidation.
          </p>
        </Prose>
        <Callout tone="note" title="The funds path">
          Wallet to Trading Account to reserved position or order margin. A resting limit order reserves its required
          amount until it fills, is cancelled or is cleared after expiry. LP Vault liquidity is separate from every
          stage of that trader path.
        </Callout>
      </Section>

      <Section id="equity" title="Equity and maintenance margin">
        <Prose>
          <p>
            A position's equity is what currently backs it: the margin you posted, plus any unrealised profit and
            minus any unrealised loss, minus the funding it has accrued. In words, equity rises with a favourable price
            move and falls with an adverse one, and funding pulls on it continuously.
          </p>
        </Prose>
        <CodeBlock label="Position equity">
{`equity = margin
       + unrealised profit and loss
       - accrued funding`}
        </CodeBlock>
        <Prose>
          <p>
            The maintenance margin is the minimum equity a position must keep, set per tier as a fraction of notional
            size. When equity reaches or falls below it, the position can be liquidated by anyone who calls the public liquidation
            function. Maintenance runs from {bpsToPercent(STANDARD.params.maintenanceMarginBps)} in the Standard tier
            up to the higher requirements of the more reflexive tiers.{' '}
            <Link href={docHref('liquidation')} className="pub-link">
              Liquidation
            </Link>{' '}
            describes the test and the payouts in full.
          </p>
        </Prose>
      </Section>

      <Section id="minimums" title="Minimums and leverage limits">
        <Prose>
          <p>
            Two global minimums and one per-tier ceiling bound every position. A position below either minimum is
            refused, and a position above the tier's leverage limit is refused.
          </p>
          <p>
            These are the clearing house's limits, and they alone decide whether a position exists. The app previews
            them by quoting and simulating the call before you sign, so a trade the contract would refuse usually
            surfaces as an error in the ticket rather than a failed transaction. That preview is a courtesy, not an
            authority: the check that counts runs inside the contract, and a call that breaks a minimum, a cap or the
            tier's leverage limit reverts and writes nothing.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Collateral asset', value: `${COLLATERAL.name} (${COLLATERAL.symbol})` },
            { key: 'Minimum collateral', value: collateralAmount(GLOBALS.minCollateral, 2) },
            { key: 'Minimum size', value: collateralAmount(GLOBALS.minSize, 2) },
            {
              key: 'Leverage by tier',
              value: TIERS.map((t) => `${t.label} ${t.params.maxLeverageX}x`).join(', '),
            },
          ]}
        />
      </Section>

      <Section id="close" title="Closing a position">
        <H3 id="close-full">Positions close in full</H3>
        <Prose>
          <p>
            There is no partial close on this deployment. A close settles the whole position at the current fill price,
            applies accrued funding and the close fee, and returns what is left of your margin. If the position is
            profitable, the vault pays the profit; if the vault cannot pay it in full at that moment, the shortfall is
            recorded as a{' '}
            <Link href={docHref('deferred-payouts')} className="pub-link">
              deferred payout
            </Link>{' '}
            rather than written off. To reduce exposure, you close the position and open a smaller one.
          </p>
        </Prose>
        <H3 id="close-funding">Funding at close</H3>
        <Prose>
          <p>
            Funding accrues continuously while the position is open and is settled at close, not paid out mid-life. The
            index moves when the market is touched, and your share is measured from the index you entered at, so a
            position that sat on the crowded side of a skewed market for a long time closes with more funding drag than
            one that did not. The on-chain clamp caps the rate at {FUNDING.clampPercentPerHour}% per hour in either
            direction. See{' '}
            <Link href={docHref('funding')} className="pub-link">
              funding
            </Link>{' '}
            for who pays whom.
          </p>
        </Prose>
      </Section>

      <Section id="worked-example" title="A worked illustration">
        <Callout tone="note" title="Illustration only">
          The numbers below are round figures chosen to show the arithmetic. They are not a quote, a promise or a
          prediction. Only the tier parameters are real, read from the Standard tier on this deployment.
        </Callout>
        <Prose>
          <p>
            Take a long in a Standard tier market, which allows up to {STANDARD.params.maxLeverageX}x and requires
            {' '}{bpsToPercent(STANDARD.params.maintenanceMarginBps)} maintenance margin. Suppose you post 100
            {' '}{COLLATERAL.symbol} of margin and open 1,000 {COLLATERAL.symbol} of notional. That is 10x leverage,
            inside the tier limit.
          </p>
          <ul>
            <li>
              <strong>At open</strong>, equity equals your margin of 100 {COLLATERAL.symbol}, before fees and spread.
            </li>
            <li>
              <strong>Maintenance</strong> at {bpsToPercent(STANDARD.params.maintenanceMarginBps)} of the 1,000
              {' '}{COLLATERAL.symbol} notional is 10 {COLLATERAL.symbol}. Equity may fall to that level before the
              position is liquidatable.
            </li>
            <li>
              <strong>A 5% adverse move</strong> on 1,000 {COLLATERAL.symbol} of notional is a 50 {COLLATERAL.symbol}
              {' '}unrealised loss, taking equity to about 50 {COLLATERAL.symbol}, still above maintenance.
            </li>
            <li>
              <strong>A 9% adverse move</strong> is a 90 {COLLATERAL.symbol} loss, taking equity near 10
              {' '}{COLLATERAL.symbol}, the maintenance floor, at which point liquidation becomes possible. Accrued
              funding and fees pull equity down further, so the real liquidation point arrives before a clean 9% move.
            </li>
          </ul>
          <p>
            Higher leverage moves the liquidation point closer to the entry price. The same 100 {COLLATERAL.symbol} of
            margin on 2,000 {COLLATERAL.symbol} of notional, at 20x, is liquidatable on roughly half the adverse move.
          </p>
        </Prose>
      </Section>

      <Section id="failure-modes" title="How a position can fail">
        <Prose>
          <p>
            The mechanics above are also the ways a position hurts you. State them plainly.
          </p>
          <ul>
            <li>
              <strong>Adverse price move.</strong> Losses come off equity directly. At the tier's leverage ceiling a
              modest move against you can reach maintenance margin and expose the position to liquidation.
            </li>
            <li>
              <strong>Funding drag.</strong> Holding the crowded side of a skewed market pays funding to the other
              side continuously. Over time that erodes equity even when the price has not moved against you.
            </li>
            <li>
              <strong>Refusal to open or close.</strong> A stale or uncertain price, a full open-interest cap, a size
              below the minimum, or a market set to close only or halted will refuse the transaction. A halt can leave
              a position you cannot close at the moment you want to.
            </li>
            <li>
              <strong>Deferred payout on a win.</strong> A profitable close is only paid in cash the vault can cover at
              that moment. If it cannot, your profit becomes an unsecured claim on later vault cash that can remain
              unpaid.{' '}
              <Link href={docHref('deferred-payouts')} className="pub-link">
                Deferred payouts
              </Link>{' '}
              explains where that can hurt.
            </li>
          </ul>
        </Prose>
      </Section>
    </DocsLayout>
  );
}
