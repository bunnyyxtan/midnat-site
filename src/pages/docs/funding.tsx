import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, H3, KeyValue, Prose, Section } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { CANONICAL, FUNDING, ROLES } from '@/lib/protocol-registry';

const DOC = docBySlug('funding')!;

const FUNDING_KEEPER = ROLES.find((r) => r.label === 'Funding keeper');

export default function Funding() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="Funding moves value between the two sides of a market so that a skewed book has a price. A keeper posts the rate, the contract clamps it, and the clamp is the protection, not trust in the keeper."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="who-pays" title="Who pays whom">
        <Prose>
          <p>
            A perpetual has no expiry, so nothing forces its price back to the underlying except a periodic transfer
            between the two sides. That transfer is funding. The posted rate is a base carry plus a skew term plus a
            divergence premium, so the crowded direction costs more to hold as the book tilts, and the trader on the
            other side is paid for taking it. The carry is why a balanced book is not free: at zero skew the rate is
            still positive, which means longs pay a small amount and shorts receive it.
          </p>
          <p>
            Funding is charged per market and settles into each position's equity as it accrues. If you hold the paying
            side, funding is deducted from your margin over time. If you hold the receiving side, it is added. It is a
            transfer, not a fee taken by the protocol.
          </p>
        </Prose>
      </Section>

      <Section id="rate" title="How the rate is produced">
        <Prose>
          <p>
            The funding rate is computed off chain from the market's skew and posted on chain by the funding keeper.
            {FUNDING_KEEPER ? ` The keeper holds exactly one power: ${FUNDING_KEEPER.powers[0].toLowerCase()}.` : ''} It
            cannot move collateral, change risk parameters or halt a market. Posting a rate is the whole of what the key
            can do to the funding channel.
          </p>
          <p>
            The formula above runs off chain, in the MIDNAT funding service, over the open interest the clearing house
            itself reports. The deployed clearing house does not run the formula; it accrues whatever rate the keeper
            has posted, clamped as below, and charges a position when that position is next touched. Nothing charges
            funding off chain, because no position exists off chain. Accrual can also be advanced by anyone: the poke
            is a public function, so a market left untouched can still be brought current by a stranger.
          </p>
          <p>
            The keeper posts a rate; it does not post an outcome it controls. Whatever number it submits is passed
            through the contract's clamp before it is applied. A key that is compromised, misconfigured or malicious
            can post a rate at the clamp, and no further.
          </p>
        </Prose>
      </Section>

      <Section id="clamp" title="The on-chain clamp is the protection">
        <Prose>
          <p>
            The clearing house limits how large a funding rate it will accept in either direction. The limit is a fixed
            constant compiled into the contract, not a value the keeper can raise. This is the actual protection on the
            funding channel: not a promise that the keeper behaves, but a bound the keeper cannot exceed.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Clamp, per hour', value: `${FUNDING.clampPercentPerHour}% in either direction` },
            { key: 'Clamp, milli-bps per hour', value: `${FUNDING.clampMilliBpsPerHour} milli-bps` },
            { key: 'Who posts the rate', value: 'Funding keeper' },
            { key: 'Who enforces the clamp', value: 'The clearing house contract' },
            { key: 'Accrual', value: FUNDING.accrual },
            { key: 'Counterparties', value: FUNDING.counterparties },
          ]}
        />
        <Prose>
          <p>
            At {FUNDING.clampPercentPerHour}% per hour the maximum the funding channel can move against a position is
            bounded and known in advance. A keeper key cannot drain a book through funding even if it tried, because the
            contract discards anything past the clamp. The bound is small on purpose: funding is meant to price a skew,
            not to liquidate the crowded side by attrition.
          </p>
        </Prose>
      </Section>

      <Section id="accrual" title="Lazy accrual anchored at the funding index">
        <Prose>
          <p>
            Each market carries a funding index, a running accumulator of funding per unit of size. When you open a
            position, the index value at that moment is written into it. Your accrued funding is the difference between
            the current index and the index you entered at, applied to your size. You are charged for exactly the window
            you were in the market, from the point you joined.
          </p>
          <p>
            Accrual is lazy. The index does not tick on a timer; it advances when the market is next touched, by a
            trade, a close or a liquidation. Between touches, funding is owed but not yet written. The deployed
            clearing house computes and settles it the moment your position is acted on, so what you pay or receive on
            close reflects the full elapsed
            window whether or not anyone interacted with the market in between.
          </p>
        </Prose>
        <H3 id="entry-index">Why the entry index matters</H3>
        <Prose>
          <p>
            Because your share is measured from the index at entry, funding cannot be applied retroactively to a period
            before you held the position, and it cannot be skipped for a period you did hold it. Two traders on the same
            side of the same market pay the same rate but different totals, in proportion to size and to how long each
            was in the market.
          </p>
        </Prose>
      </Section>

      <Section id="limits" title="What funding does not protect against">
        <Prose>
          <ul>
            <li>
              The clamp bounds the rate, not the direction. If you hold the crowded side, funding works against you for
              as long as the skew persists, and it compounds into your margin.
            </li>
            <li>
              The lighter side is paid first and the vault last. In a heavily skewed market there may be little on the
              lighter side to receive the transfer, so the vault absorbs the remainder as the counterparty of last
              resort.
            </li>
            <li>
              A single funding keeper posts the rate. If that key is compromised it can post at the clamp in either
              direction until the key is rotated. The clamp bounds the damage; it does not prevent the misuse.
            </li>
            <li>
              Funding does not stop your position being liquidated. It is deducted from equity, so it can push a
              position across its maintenance margin on its own.
            </li>
          </ul>
          <p>{CANONICAL.notAdvice}</p>
        </Prose>
        <Callout tone="caution" title="The clamp is the guarantee, the keeper is not">
          Read the funding channel as a bounded rate posted by a key you should not trust, enforced by a contract you
          can verify. The{' '}
          <Link href="/security" className="pub-link">
            security page
          </Link>{' '}
          documents that one address currently holds the funding keeper role alongside the owner and risk keeper, with
          no multisig and no timelock on this deployment.
        </Callout>
      </Section>
    </DocsLayout>
  );
}
