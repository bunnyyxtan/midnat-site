import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, KeyValue, Prose, Section, StatusBadge, TableScroll } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { CANONICAL, REFERENCE_ENGINE } from '@/lib/protocol-registry';

const DOC = docBySlug('reference-engine')!;

/** One row per reference state, in the order the engine walks through them. */
const STATE_ROWS: readonly { state: string; meaning: string; trading: string }[] = [
  {
    state: 'CURRENT',
    meaning: `A fresh feed was selected within ${REFERENCE_ENGINE.selectFreshWithinSec} seconds and the snapshot is younger than ${REFERENCE_ENGINE.agingAfterSec} seconds.`,
    trading: 'Normal. New exposure is accepted subject to the usual caps and confidence checks.',
  },
  {
    state: 'AGING',
    meaning: `The snapshot has passed ${REFERENCE_ENGINE.agingAfterSec} seconds but not yet ${REFERENCE_ENGINE.staleAfterSec} seconds. No fresher feed has arrived.`,
    trading: 'New exposure is still accepted. The age is surfaced so you can see the price is not being refreshed.',
  },
  {
    state: 'TRANSITIONING',
    meaning: 'The engine is moving from one source to another, or recovering from a gap, and is walking the price across rather than jumping.',
    trading: 'New exposure is blocked while a transition gap is open. Closes and cancels remain available.',
  },
  {
    state: 'STALE',
    meaning: `No feed has been fresh for longer than ${REFERENCE_ENGINE.staleAfterSec} seconds. The last snapshot is held and clearly aged.`,
    trading: 'New exposure is blocked. A price this old must not back new risk. You can still close and cancel.',
  },
  {
    state: 'UNAVAILABLE',
    meaning: 'The engine has no snapshot to hold at all for the market.',
    trading: 'New exposure is blocked. There is no reference to price against.',
  },
];

const QUALITY_ROWS: readonly { tier: string; meaning: string }[] = [
  {
    tier: 'HIGH',
    meaning: 'Confidence is tight and no validation signal is flagged. The reference is treated as fully backing.',
  },
  {
    tier: 'MODERATE',
    meaning: 'Confidence has widened or a secondary signal disagrees mildly. The reference is used with a smaller share of capacity.',
  },
  {
    tier: 'LOW',
    meaning: 'Confidence is wide or a validation signal is flagged. Capacity is reduced further and execution costs more.',
  },
  {
    tier: 'UNAVAILABLE',
    meaning: 'Quality cannot be assessed because there is no usable reference.',
  },
];

const SENTINEL_ROWS: readonly { level: string; meaning: string }[] = [
  { level: 'NORMAL', meaning: 'No active finding. Polling, freshness and confidence are all within their bounds.' },
  { level: 'WATCH', meaning: 'A warning-level finding is open, for example a widening confidence band or a source transition in progress.' },
  { level: 'ALERT', meaning: 'A critical finding is open, for example a stalled poller or repeated upstream failures.' },
];

export default function ReferenceEngine() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="A stock has a price during the trading day. A perpetual needs one at three in the morning. This is how MIDNAT produces that number, and how it degrades honestly when no feed is fresh."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="polling" title="Polling and feed selection">
        <div className="flex items-center gap-3">
          <StatusBadge status="LIVE_ON_TESTNET" />
        </div>
        <Prose>
          <p>
            The reference engine polls {REFERENCE_ENGINE.upstream} every {REFERENCE_ENGINE.pollIntervalSec} seconds, with
            a {REFERENCE_ENGINE.fetchTimeoutSec} second timeout on each fetch. For every market it selects the freshest
            feed that is eligible, meaning one that published within the last {REFERENCE_ENGINE.selectFreshWithinSec}{' '}
            seconds. There is no calendar math in the selection: the session feeds do not overlap, so whichever one is
            publishing now selects itself by freshness.
          </p>
          <p>
            The engine runs in the MIDNAT API, not on chain. Its output is what the app displays and what the signer
            publishes to the oracle anchor, and the clearing house prices your fill from the anchored value it reads
            there rather than from the engine itself.
          </p>
          <p>The selection ladder runs top to bottom, and the first eligible feed wins.</p>
          <ol>
            {REFERENCE_ENGINE.feedOrder.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>
            The tokenized 24/7 feed is a real market price for the same underlying exposure, not the listed exchange
            print. It is labelled as such wherever it is used, because the two are not the same thing.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Upstream source', value: REFERENCE_ENGINE.upstream },
            { key: 'Poll interval', value: `${REFERENCE_ENGINE.pollIntervalSec} seconds` },
            { key: 'Fetch timeout', value: `${REFERENCE_ENGINE.fetchTimeoutSec} seconds` },
            { key: 'Selection freshness window', value: `${REFERENCE_ENGINE.selectFreshWithinSec} seconds` },
            { key: 'Aging threshold', value: `${REFERENCE_ENGINE.agingAfterSec} seconds` },
            { key: 'Stale threshold', value: `${REFERENCE_ENGINE.staleAfterSec} seconds` },
          ]}
        />
      </Section>

      <Section id="states" title="The five reference states">
        <Prose>
          <p>
            Every market carries one reference state at all times. The state is what decides whether the market can take
            new exposure, and it is published so you can see it rather than infer it from a stale number.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">State</th>
                <th scope="col">What it means</th>
                <th scope="col">What it means for trading</th>
              </tr>
            </thead>
            <tbody>
              {STATE_ROWS.map((row) => (
                <tr key={row.state}>
                  <td>
                    <span className="pub-mono">{row.state}</span>
                  </td>
                  <td>{row.meaning}</td>
                  <td>{row.trading}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <Prose>
          <p>
            Blocking new exposure while a market is stale, unavailable or mid-transition is deliberate. The protocol
            would rather refuse to open a position than open one against a price it cannot defend. Cancelling a resting
            order stays available in every state, because a cancel needs no price. Closing does need one: it is priced
            from the same anchored mark as an open, so a price the contract will not accept blocks a close as well as an
            open. Read the refusal states as a reason to size positions you can hold through one, not as a promise that
            you can always exit.
          </p>
        </Prose>
      </Section>

      <Section id="quality" title="Quality tiers">
        <Prose>
          <p>
            A state says how fresh the price is. Quality says how much the engine trusts it. Quality is a named tier
            derived from the confidence band and validation signals, never an opaque score. It scales how much of the
            venue capacity a market may use and it feeds into execution cost.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">What it means</th>
              </tr>
            </thead>
            <tbody>
              {QUALITY_ROWS.map((row) => (
                <tr key={row.tier}>
                  <td>
                    <span className="pub-mono">{row.tier}</span>
                  </td>
                  <td>{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="sentinel" title="Sentinel levels">
        <Prose>
          <p>
            Above the per-market state and quality sits a single health level for the reference layer as a whole. The
            sentinel watches for polling stalls, repeated upstream failures, confidence widening, source transitions and
            other findings, and rolls them into one of three levels.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Level</th>
                <th scope="col">What it means</th>
              </tr>
            </thead>
            <tbody>
              {SENTINEL_ROWS.map((row) => (
                <tr key={row.level}>
                  <td>
                    <span className="pub-mono">{row.level}</span>
                  </td>
                  <td>{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="transition" title="Why a handover walks the price">
        <Prose>
          <p>
            When the engine has to change source, from a session feed to the tokenized feed or back, the two feeds
            rarely print the identical number at the same instant. Handing over by jumping straight to the new value
            would print a gap. A gap can move a position through its maintenance margin in a single tick and liquidate
            people for a change in data source, not a change in the market.
          </p>
          <p>
            So the engine does not jump. It marks the market TRANSITIONING and walks the price toward the new source
            over successive polls. Each {REFERENCE_ENGINE.pollIntervalSec} second tick moves the reference by at most{' '}
            {REFERENCE_ENGINE.transitionMaxStepBps} basis points. A transition only starts when the gap to bridge is at
            least {REFERENCE_ENGINE.transitionMinBps} basis points, and a recovery from a longer outage is treated as a
            transition when the gap is at least {REFERENCE_ENGINE.recoveryGapBps} basis points. The walk is considered
            converged once the reference is within {REFERENCE_ENGINE.convergenceBps} basis points of the target for{' '}
            {REFERENCE_ENGINE.convergenceTicks} consecutive ticks, and the whole transition is capped at{' '}
            {REFERENCE_ENGINE.transitionMaxSec} seconds. While a transition gap is open, new exposure is blocked.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Minimum gap to start a transition', value: `${REFERENCE_ENGINE.transitionMinBps} bps` },
            { key: 'Recovery gap threshold', value: `${REFERENCE_ENGINE.recoveryGapBps} bps` },
            { key: 'Maximum step per tick', value: `${REFERENCE_ENGINE.transitionMaxStepBps} bps` },
            { key: 'Convergence band', value: `${REFERENCE_ENGINE.convergenceBps} bps` },
            { key: 'Convergence ticks required', value: `${REFERENCE_ENGINE.convergenceTicks}` },
            { key: 'Maximum transition duration', value: `${REFERENCE_ENGINE.transitionMaxSec} seconds` },
          ]}
        />
        <Callout tone="note" title="The reference is not the anchor">
          The reference engine builds the price off chain. It does not decide what the contract accepts. A signer signs
          the report and the anchor holds it, and the clearing house reads only the anchor.{' '}
          <Link href={docHref('oracle-anchor')} className="pub-link">
            The oracle anchor
          </Link>{' '}
          covers that layer.
        </Callout>
      </Section>

      <Section id="limits" title="What a fresh price cannot tell you">
        <Prose>
          <p>
            The engine can only ever be as good as the feeds beneath it. Everything on this page is machinery for
            selecting, aging and blending upstream data. None of it corrects that data.
          </p>
          <ul>
            <li>
              A CURRENT state and a HIGH quality tier mean the price is fresh and its confidence band is tight. They do
              not mean the price is right. If the upstream feed is wrong, MIDNAT will faithfully serve a wrong price and
              report it as healthy.
            </li>
            <li>
              A signature does not fix upstream quality. Signing proves who produced a report, not that the number in it
              was correct. Data quality is an input problem and no cryptography downstream of it can repair it.
            </li>
            <li>
              The tokenized 24/7 feed is priced by a different market than the listed exchange. Overnight and at
              weekends the number you trade against may not match where the stock reopens. See{' '}
              <Link href={docHref('market-hours')} className="pub-link">
                market hours
              </Link>
              .
            </li>
            <li>{CANONICAL.noOwnership}</li>
          </ul>
        </Prose>
      </Section>
    </DocsLayout>
  );
}
