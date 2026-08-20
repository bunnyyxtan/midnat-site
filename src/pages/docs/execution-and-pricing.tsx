import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, CodeBlock, H3, Prose, Section, TableScroll } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { CANONICAL, ORACLE_POLICY, TIERS, bpsToPercent } from '@/lib/protocol-registry';

const DOC = docBySlug('execution-and-pricing')!;

export default function ExecutionAndPricing() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="A fill price is not quoted from a book. It is built from the anchored reference price, a fixed spread against the taker, and an impact term that scales with the share of capacity the order consumes on that side."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="composition" title="How a fill price is built">
        <Prose>
          <p>
            There is no order book on this venue and no depth ladder to cross. Market orders and executable limit orders
            fill against the clearing house's formula, not another trader's quote. When a fill executes, the clearing
            house builds one price from three inputs and fills the whole order at it. The first input is the anchored
            reference price, the number the oracle anchor holds for that market. The next two move the price against
            you: a base spread and an impact term.
          </p>
          <p>
            One party builds this price: the clearing house, reading the anchored mark at the moment your call
            executes. The app's order ticket shows the same arithmetic beforehand by asking the contract to quote it,
            so the figure you see before signing is the contract's own rather than a second opinion from the reference
            engine. The anchored mark can move between the quote and the transaction, which is what the slippage bound
            the call carries is for: if the price has moved past it, the call reverts instead of filling you worse.
          </p>
        </Prose>
        <CodeBlock label="Fill price">{`fill = reference
       + reference x baseSpread            (against the taker)
       + reference x impact                (against the taker)

impact = min( impactScale x sideShare , impactMax )
sideShare = order size / remaining capacity on that side`}</CodeBlock>
        <Prose>
          <p>
            The base spread is a fixed fraction of the reference price set by the market's tier. It is charged on every
            fill regardless of size, and it always works against the taker: a long pays above reference, a short
            receives below it. The impact term is what makes size expensive. It grows with the fraction of the side's
            remaining capacity the order takes, and it is capped at the tier's impact maximum so a single order cannot
            move the fill price without limit.
          </p>
        </Prose>
      </Section>

      <Section id="parameters" title="Per-tier spread and impact parameters">
        <Prose>
          <p>
            Every listed market sits in one of three risk tiers, and the tier fixes the execution parameters. Deeper,
            more widely covered underlyings carry the tightest band. The most reflexive underlyings carry the widest.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">Markets</th>
                <th scope="col">Base spread</th>
                <th scope="col">Impact scale</th>
                <th scope="col">Impact maximum</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => (
                <tr key={t.tier}>
                  <td className="pub-td-key">{t.label}</td>
                  <td>{t.symbols.join(', ')}</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.baseSpreadBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.impactScaleBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.impactMaxBps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <Prose>
          <p>
            The base spread is applied directly. The impact scale is the multiplier on the side share, so a market with
            a higher scale reaches its impact maximum on a smaller order. The impact maximum is the ceiling on the
            impact term alone, before the base spread is added. The{' '}
            <Link href="/markets" className="pub-link">
              markets page
            </Link>{' '}
            lists the live parameter set for every market individually.
          </p>
        </Prose>
      </Section>

      <Section id="why-impact" title="Why impact exists">
        <Prose>
          <p>
            The vault is the counterparty to every position. When one side of a market fills up, the vault is carrying
            the opposite exposure for the whole venue, and each additional unit on the crowded side makes that position
            larger. Impact prices that. A trader who adds to an already one-sided book pays more than the trader who
            arrived first, because the marginal risk to the vault is higher.
          </p>
          <p>
            Impact scales with the share of remaining side capacity, not with a notional size in dollars, so the same
            order costs more in a market that is already close to its side cap than in an empty one. This is the
            mechanism that lets MIDNAT price an imbalance instead of forbidding it outright, up to the point where the
            caps refuse the order entirely.
          </p>
        </Prose>
      </Section>

      <Section id="refusal" title="When the protocol refuses instead of filling">
        <Prose>
          <p>
            The clearing house reads only the anchored price. Before it builds a fill it checks that the anchor is
            usable. If the anchored price is older than {ORACLE_POLICY.maxPriceAgeSec} seconds, or its confidence band
            is wider than the market permits, the call reverts. The protocol would rather refuse than fill you on a
            number it cannot defend.
          </p>
          <p>
            Refusal is not a failure state to be worked around. A price that is stale or uncertain is one where the
            fill could be far from fair value, and a fill at a bad price cannot be undone once it is written. The{' '}
            <Link href={docHref('oracle-anchor')} className="pub-link">
              oracle anchor
            </Link>{' '}
            page covers the acceptance rules, and the{' '}
            <Link href={docHref('reference-engine')} className="pub-link">
              reference engine
            </Link>{' '}
            page covers how a price becomes stale in the first place.
          </p>
        </Prose>
        <H3 id="preview">Preview is an estimate, not a quote</H3>
        <Prose>
          <p>
            The interface can show an estimated fill before you submit. That estimate is built from the same
            composition, but the anchored price, the side capacity and the market state can all change between the
            preview and the transaction. The price you receive is the one the contract computes at execution, not the
            one the interface showed a moment earlier.
          </p>
        </Prose>
      </Section>

      <Section id="limits" title="What execution does not do">
        <Prose>
          <ul>
            <li>
              There is no order-book depth or queue of other traders' prices. A submitted limit order can rest in the
              clearing house until it is filled, cancelled or expired. While it rests, its required Trading Account
              margin is reserved. At execution the contract recomputes its formula price and fills only at the limit or
              better; otherwise the order stays open.
            </li>
            <li>
              There are no partial fills. An order either fills in full at the computed price or reverts. If a cap would
              be breached the whole order is refused, never trimmed to fit.
            </li>
            <li>
              Impact is bounded by the tier maximum, so it does not protect the vault without limit. Past the side cap
              the order is refused rather than filled at an ever-worse price.
            </li>
            <li>
              A preview is not a commitment. Between preview and execution the anchor can age out or the side can fill,
              and a call that would have filled a moment ago can revert.
            </li>
          </ul>
          <p>{CANONICAL.notAdvice}</p>
        </Prose>
        <Callout tone="caution" title="A refusal near a fast market is the point at which you are most exposed">
          The states that make execution refuse, a stale anchor, a wide confidence band, a full side, tend to cluster
          when the underlying is moving hardest. That is exactly when you may most want to open or close and exactly
          when the protocol is most likely to decline. Treat access to a fill as conditional, never as guaranteed.
        </Callout>
      </Section>
    </DocsLayout>
  );
}
