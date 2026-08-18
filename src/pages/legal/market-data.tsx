import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { Callout, PrintButton, Prose, Section, TableScroll } from '@/components/public/primitives';
import { docHref, legalBySlug, legalHref } from '@/lib/site-map';
import { CANONICAL, MARKETS, REFERENCE_ENGINE, utcDate } from '@/lib/protocol-registry';

const DOC = legalBySlug('market-data')!;

export default function MarketDataDisclosure() {
  return (
    <DocumentLayout
      meta={{ title: DOC.title, description: DOC.summary, path: legalHref(DOC.slug), type: 'article' }}
      eyebrow="Legal"
      title={DOC.title}
      standfirst="Where the reference prices on this venue come from, what they are, and the several things they are not."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Legal', href: '/legal' }, { label: DOC.title }]}
      headerMeta={[{ label: 'Updated', value: utcDate(DOC.updated) }]}
      actions={<PrintButton />}
      width="prose"
    >
      <Callout tone="caution" title="The short version">
        A MIDNAT reference price is a value assembled from third party feeds. It is not the exchange's official price,
        it is not a quote you can trade against off this venue, and it is not guaranteed to be accurate or continuous.
      </Callout>

      <Section id="what-it-is" title="What a reference price is">
        <Prose>
          <p>
            Every market on MIDNAT tracks an underlying by its ticker. To price a position the protocol needs one number
            for that underlying at the moment of the trade. That number is a reference value. MIDNAT does not receive it
            from the listing exchange and does not stand in for the listing exchange.
          </p>
          <p>
            The reference engine reads {REFERENCE_ENGINE.upstream} and selects the freshest usable feed for the ticker,
            in this order.
          </p>
          <ol>
            {REFERENCE_ENGINE.feedOrder.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>
            When no feed is fresh, the engine holds the last snapshot and marks the price as degraded rather than
            inventing a new one. The full mechanism, including the freshness thresholds and the states a price can be in,
            is documented on{' '}
            <Link href={docHref('reference-engine')} className="pub-link">
              the reference engine page
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="what-it-is-not" title="What a reference price is not">
        <Prose>
          <p>These distinctions matter, so they are stated plainly rather than assumed.</p>
          <ul>
            <li>
              It is not the exchange's official price. The listing exchange publishes its own official and closing
              prices. MIDNAT does not have them and does not reproduce them.
            </li>
            <li>
              It is not a quote. It is a reference value used to price positions on this venue. It is not an offer to
              buy or sell the underlying, and you cannot execute against it anywhere other than through this protocol.
            </li>
            <li>
              It is not guaranteed accurate. Upstream feeds can be wrong, late, or absent, and a signed report only
              proves that MIDNAT relayed a number, not that the number was correct.
            </li>
            <li>
              It is not continuous. Feeds gap, sessions close, and the reference degrades and can become unavailable.
              When it does, the protocol refuses new exposure rather than filling on a stale number.
            </li>
          </ul>
        </Prose>
        <Callout tone="limit" title="A signature authenticates the messenger, not the market">
          The on-chain anchor holds a signed report for each market. A valid signature proves the price is the one the
          MIDNAT signer produced. It proves nothing about whether the upstream feed was right. Signing authenticates the
          messenger, not the market.
        </Callout>
      </Section>

      <Section id="ownership" title="Who owns the data">
        <Prose>
          <p>
            The underlying market data belongs to its providers. MIDNAT reads from {REFERENCE_ENGINE.upstream} and
            derives values from it. It redistributes only those derived values, and only within this product, to price
            positions and to display the market state. It does not resell the upstream feed, and it does not offer the
            raw data as a separate product.
          </p>
          <p>
            If you need authoritative market data, obtain it from the exchange or from a licensed vendor. The values
            here exist to run this venue, not to be a data source for anything else.
          </p>
        </Prose>
      </Section>

      <Section id="tickers" title="Tickers and company names">
        <Prose>
          <p>
            Each market is labelled with a ticker and a company name so you know which underlying it references. The
            listed references are {MARKETS.map((m) => m.symbol).join(', ')}. These labels are identity, not a claim of
            association.
          </p>
          <p>{CANONICAL.noOwnership}</p>
          <p>
            Naming a ticker or a company does not imply any relationship with, endorsement by, sponsorship from, or
            ownership of the company named. The companies named have not reviewed this product and are not connected to
            it.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Market</th>
                <th scope="col">Reference identifies</th>
              </tr>
            </thead>
            <tbody>
              {MARKETS.map((m) => (
                <tr key={m.symbol}>
                  <td className="pub-mono">{m.symbol}</td>
                  <td>{m.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="limits" title="What this disclosure does not establish">
        <Prose>
          <p>
            This page does not promise that a reference price is correct, timely or available when you want to act.
            {' '}
            {CANONICAL.testnet}
          </p>
          <p>
            It does not grant you any right in the underlying data, and it does not create any relationship between
            MIDNAT and the exchanges or companies named. Where the reference is stale or unavailable, you can be left
            unable to open or close a position, and that is a state you carry, not one this document removes.
          </p>
          <ul>
            <li>
              <Link href={docHref('oracle-anchor')} className="pub-link">
                The oracle anchor
              </Link>
              , what the on-chain signature does and does not prove.
            </li>
            <li>
              <Link href="/legal/risk-disclosure" className="pub-link">
                Risk disclosure
              </Link>
              , the ways a position can lose everything assigned to it.
            </li>
          </ul>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
