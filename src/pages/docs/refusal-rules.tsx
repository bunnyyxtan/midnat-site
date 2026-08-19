import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Prose, Section } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { GLOBALS, ORACLE_POLICY, collateralAmount } from '@/lib/protocol-registry';

const DOC = docBySlug('refusal-rules')!;

export default function RefusalRules() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="Every condition under which the protocol refuses to open a position. A funded, connected wallet is not enough on its own: the clearing house would rather refuse than fill you on terms it cannot defend, and the app simulates the call first, so most refusals reach you as an error in the ticket instead of a failed transaction."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="what-can-block-you" title="What can block you">
        <Prose>
          <p>
            A funded, connected wallet is not enough on its own. The clearing house refuses rather than fill you on
            terms it cannot defend, and because the app simulates the call before asking you to sign, most refusals
            reach you as an error in the ticket instead of a failed transaction.
          </p>
          <ul>
            <li>
              <strong>Stale or uncertain price.</strong> If the anchored price is older than
              {' '}{ORACLE_POLICY.maxPriceAgeSec} seconds, or its confidence band is wider than the market allows, the
              open reverts. Ahead of that, the app's risk policy cuts the leverage it will offer, and pauses new
              exposure entirely, as reference quality falls: it can refuse to build a call the contract would still
              have accepted, never the other way round. How the reference degrades is on{' '}
              <Link href={docHref('reference-engine')} className="pub-link">
                the reference engine
              </Link>
              .
            </li>
            <li>
              <strong>A cap refuses your size.</strong> Open interest is capped globally, per market and per side. A
              position that would push any cap past its limit is refused, not partially filled. The ticket reads the
              same capacity from the contract before you sign, and the risk policy can narrow what it offers further
              when reference quality is poor.
            </li>
            <li>
              <strong>A minimum refuses a dust position.</strong> The minimum collateral is
              {' '}{collateralAmount(GLOBALS.minCollateral, 2)} and the minimum size is
              {' '}{collateralAmount(GLOBALS.minSize, 2)}, and anything smaller is rejected. The app does not test
              those two thresholds itself; the simulation it runs before asking you to sign fails, and the ticket
              shows the contract's refusal.
            </li>
            <li>
              <strong>The market is not accepting new exposure.</strong> The owner can set a market to close only or
              halted, and in those modes the call will not go through even when your price is fresh and your size is
              legal. The app also refuses at its own gate, from the market regime and the risk policy it applies, so
              a halted market usually stops you before your wallet opens. What changes when the underlying exchange is
              closed is on{' '}
              <Link href={docHref('market-hours')} className="pub-link">
                market hours
              </Link>
              .
            </li>
            <li>
              <strong>The market is not listed on this deployment.</strong> The clearing house lists a fixed set of
              markets and rejects a call naming anything else. The reference engine can price further symbols, and
              they can appear in market data, but they cannot be traded.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section id="after-open" title="After the open: margin and payouts">
        <Prose>
          <p>
            Two more refusals live on either side of an open position. While it is open, a position that reaches or falls below its
            tier's maintenance margin is liquidatable, and once it is, closing on your own terms is no longer yours to
            choose; the maintenance test and who may call it are on{' '}
            <Link href={docHref('liquidation')} className="pub-link">
              liquidation
            </Link>
            .
          </p>
          <p>
            When you close in profit, the vault pays you — unless it cannot pay in full at that moment, in which case the
            unpaid part is deferred as a claim rather than refused or written down. Why that is a claim, where it ranks
            and where it can still hurt you is on{' '}
            <Link href={docHref('deferred-payouts')} className="pub-link">
              deferred payouts
            </Link>
            .
          </p>
        </Prose>
      </Section>
    </DocsLayout>
  );
}
