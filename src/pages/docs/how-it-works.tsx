import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, Prose, Section } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { CANONICAL, NETWORK } from '@/lib/protocol-registry';

const DOC = docBySlug('how-it-works')!;

/**
 * A map, not a manual. Each mechanism gets one orienting paragraph and a link
 * to the page that owns the detail, in the reading order the protocol has:
 * shape, price, counterparty, lifecycle, then what MIDNAT is not. The focused
 * pages carry the numbers, the callouts and the edge cases.
 */
export default function HowItWorks() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="A map of the whole protocol: a venue that never closes pricing an equity whose exchange does. One paragraph per mechanism, each pointing at the page that carries the detail. Read it top to bottom for the shape of MIDNAT, then follow a link for the depth."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="shape" title="The shape of it">
        <Prose>
          <p>
            MIDNAT is three contracts on {NETWORK.label}. There is no order book, no matching engine and no market
            maker: a trade is a call to one contract, priced from a number a second contract holds, backed by capital a
            third contract custodies. Addresses and verification state for all three are on the{' '}
            <Link href="/contracts" className="pub-link">
              contracts page
            </Link>
            .
          </p>
          <p>
            The listed markets and the three risk tiers that set leverage, spread and margin for each are on{' '}
            <Link href={docHref('markets-and-tiers')} className="pub-link">
              markets and risk tiers
            </Link>
            . How a position is written and held once opened — isolated margin, equity and the maintenance requirement —
            is on{' '}
            <Link href={docHref('positions-and-margin')} className="pub-link">
              positions and margin
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="price" title="Where the price comes from">
        <Prose>
          <p>
            A perpetual needs a reference price whether or not anyone is trading the underlying, so MIDNAT builds one
            off chain and puts a signed version of it on chain. The engine that selects the freshest usable feed for
            each market — and walks the price across rather than jumping when it has to change source, including while
            the exchange is closed — is described on{' '}
            <Link href={docHref('reference-engine')} className="pub-link">
              the reference engine
            </Link>
            .
          </p>
          <p>
            The clearing house reads only the on-chain anchor, and it will refuse a price it cannot defend rather than
            fill you on it. What the signature proves, and what it does not, is on{' '}
            <Link href={docHref('oracle-anchor')} className="pub-link">
              the oracle anchor
            </Link>
            . What changes and what stays the same when the underlying exchange is closed is on{' '}
            <Link href={docHref('market-hours')} className="pub-link">
              market hours
            </Link>
            .
          </p>
        </Prose>
        <Callout tone="limit" title="What the signature proves">
          A valid signature proves the anchored price is the one the MIDNAT signer produced. It does not prove the
          upstream number was correct. Signing authenticates the messenger, not the market.
        </Callout>
      </Section>

      <Section id="counterparty" title="Who is on the other side">
        <Prose>
          <p>
            You are not trading against another user. The vault is the counterparty to every position the clearing
            house opens: when you win, the vault pays you, and when you lose, your collateral flows to the vault. That
            makes the vault a directional book by accident, which is why open interest is capped, funding prices any
            skew, and an impact term makes the crowded side fill worse.
          </p>
          <p>
            The vault itself — an ERC-4626 contract, how its shares are priced, and what LPs are exposed to — is on{' '}
            <Link href={docHref('vault')} className="pub-link">
              the liquidity vault
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="lifecycle" title="Open, close, funding and liquidation">
        <Prose>
          <p>
            On open, the contract reads the anchor, builds a fill from the tier's base spread and an impact term, checks
            the open-interest caps and the tier's leverage limit, and writes the position with the funding index of that
            moment. How that fill price is assembled is on{' '}
            <Link href={docHref('execution-and-pricing')} className="pub-link">
              execution and pricing
            </Link>
            ; the conditions under which the open is refused instead are gathered on{' '}
            <Link href={docHref('refusal-rules')} className="pub-link">
              when the protocol refuses
            </Link>
            .
          </p>
          <p>
            While a position is open, funding accrues per market at a rate the contract clamps, so a keeper key cannot
            drain a book through it; the mechanics are on{' '}
            <Link href={docHref('funding')} className="pub-link">
              funding
            </Link>
            . A position that reaches or falls below its tier's maintenance margin is liquidatable by anyone, with the fee settled
            to the vault; who may call it and what is left for the trader is on{' '}
            <Link href={docHref('liquidation')} className="pub-link">
              liquidation
            </Link>
            .
          </p>
          <p>
            Positions close in full at the current fill price. If the vault cannot pay a winning position in full at
            that moment, the shortfall is recorded as a claim that ranks ahead of LP equity rather than written down —
            a liquidity failure, not a solvency one. Why the distinction matters and where it can still hurt you is on{' '}
            <Link href={docHref('deferred-payouts')} className="pub-link">
              deferred payouts
            </Link>
            .
          </p>
        </Prose>
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
