import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { ExternalLink, Prose, Section } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { LEVERAGE_RANGE, NETWORK } from '@/lib/protocol-registry';

const DOC = docBySlug('first-trade')!;

export default function FirstTrade() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="Placing, reading and closing a position, once your wallet is connected and funded. This assumes you have already done the setup; if you have not, start with getting started. Everything the contract can refuse is gathered under when the protocol refuses."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="place" title="Open a position">
        <Prose>
          <p>
            This picks up where{' '}
            <Link href={docHref('getting-started')} className="pub-link">
              getting started
            </Link>{' '}
            left off: a wallet on {NETWORK.label}, holding the collateral a position is margined in.
          </p>
          <p>
            Choose a market, a side and a size. Size is notional, not the margin you post. Your leverage is size
            divided by the collateral you assign to the position, and it must sit inside the tier's maximum, which runs
            from {LEVERAGE_RANGE.min}x to {LEVERAGE_RANGE.max}x depending on the market. The{' '}
            <Link href={docHref('markets-and-tiers')} className="pub-link">
              markets and risk tiers
            </Link>{' '}
            page lists the limit for every market.
          </p>
          <p>
            When you fill in the ticket, the app asks the clearing house what the trade would cost. It quotes the fill
            against the contract's own pricing view and simulates the call, so the execution price, the fees and the
            liquidation price you are shown before you sign are the contract's numbers rather than a second opinion.
            Nothing has been sent at that point, and nothing is recorded anywhere.
          </p>
          <p>
            When you accept, your wallet signs one transaction and sends it to the clearing house. The contract then
            does the work itself: it reads the anchored price and refuses a stale one, builds the fill from the tier's
            base spread and an impact term, checks the open-interest caps, the minimums and the tier's leverage limit,
            enforces the slippage bound the call carries, and writes the position. If any check fails the whole call
            reverts, no position is written and you have spent only gas.{' '}
            <Link href={docHref('positions-and-margin')} className="pub-link">
              Positions and margin
            </Link>{' '}
            describes what is written and why, and{' '}
            <Link href={docHref('refusal-rules')} className="pub-link">
              when the protocol refuses
            </Link>{' '}
            gathers the checks that can turn an open away.
          </p>
        </Prose>
      </Section>

      <Section id="watch" title="Where to watch it">
        <Prose>
          <p>
            Your open positions, margin and unrealised profit and loss are shown in the app portfolio, read from the
            clearing house over your own RPC connection rather than from any ledger MIDNAT keeps. The same positions
            are on the block explorer, under the transaction that opened them.
          </p>
          <p>
            What you can follow on the{' '}
            <ExternalLink href={NETWORK.explorerBase}>{NETWORK.explorerName}</ExternalLink> is the on-chain record: the
            anchored prices this venue prices against, posted continuously, and the deployment and live-fire
            transactions on the contract addresses. Any transaction you send yourself lands there too. The{' '}
            <Link href="/contracts" className="pub-link">
              contracts page
            </Link>{' '}
            lists the addresses those transactions touch.
          </p>
        </Prose>
      </Section>

      <Section id="close" title="Close a position">
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
      </Section>
    </DocsLayout>
  );
}
