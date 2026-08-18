import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, Prose, Section, StatusBadge, TableScroll } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { CANONICAL, REFERENCE_ENGINE } from '@/lib/protocol-registry';

const DOC = docBySlug('market-hours')!;

const STATE_ROWS: readonly { state: string; when: string; feed: string }[] = [
  {
    state: 'LIVE',
    when: 'The US cash session is open.',
    feed: 'The listed-market equity session feed for the ticker, the deepest reference MIDNAT has.',
  },
  {
    state: 'AFTER_HOURS',
    when: 'The cash session is closed but it is a weekday, covering pre-market and post-market hours.',
    feed: 'The pre-market or post-market session feed where one is publishing, otherwise the tokenized 24/7 feed.',
  },
  {
    state: 'WEEKEND',
    when: 'It is Saturday or Sunday in the exchange time zone.',
    feed: 'The tokenized 24/7 feed for the same underlying, where it is fresh.',
  },
  {
    state: 'HALTED',
    when: 'The venue is in close-only mode by owner or risk-keeper action.',
    feed: 'No new exposure is accepted. The reference continues to be served for closing and marking.',
  },
];

export default function MarketHours() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="The underlying exchange keeps hours. MIDNAT does not. This page sets out what changes when the exchange is closed, what stays exactly the same, and the honest cost of trading a stock while its home market sleeps."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="stays-open" title="MIDNAT does not halt at the bell">
        <div className="flex items-center gap-3">
          <StatusBadge status="LIVE_ON_TESTNET" />
        </div>
        <Prose>
          <p>
            A listed stock exchange opens and closes. When it closes, you cannot trade the stock there until it reopens.
            MIDNAT is a perpetual venue: it stays open when the underlying exchange is shut, overnight, at weekends and
            on exchange holidays. That is the point of the product, not an edge case in it. News does not wait for the
            opening bell, and risk keeps no hours, so the venue keeps none either.
          </p>
          <p>
            Staying open has a cost, and this page is mostly about that cost. Trading a stock while its home market is
            closed means pricing it from feeds with thinner backing, which changes how spreads and confidence behave.
          </p>
        </Prose>
      </Section>

      <Section id="states" title="The four market states">
        <Prose>
          <p>
            Every market carries one of four states that describes the underlying session. The state selects which feed
            the reference engine draws from, which in turn drives quality and execution cost.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">State</th>
                <th scope="col">When it applies</th>
                <th scope="col">Which feed serves it</th>
              </tr>
            </thead>
            <tbody>
              {STATE_ROWS.map((row) => (
                <tr key={row.state}>
                  <td>
                    <span className="pub-mono">{row.state}</span>
                  </td>
                  <td>{row.when}</td>
                  <td>{row.feed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <Prose>
          <p>
            The four states are {REFERENCE_ENGINE.marketStates.join(', ')}. How the reference engine chooses a feed
            within each state, and how it degrades when nothing is fresh, is covered in{' '}
            <Link href={docHref('reference-engine')} className="pub-link">
              the reference engine
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="session-clock" title="How the session state is computed">
        <Prose>
          <p>
            MIDNAT does not hardcode opening and closing times. The session state is computed from the exchange time
            zone with daylight saving handled correctly, so a boundary lands at the right wall-clock moment on both
            sides of a daylight saving change rather than drifting by an hour twice a year. Weekends and the Friday close
            are derived the same way.
          </p>
          <p>
            This logic lives in the API server reference engine, at{' '}
            <span className="pub-mono">artifacts/api-server/src/lib/engine.ts</span>, and it is what the market-state
            endpoint reports. Because it is derived from a time zone rather than a table of fixed hours, this page does
            not print clock times: the state, and the moment of the next transition, come from that computation and are
            surfaced live rather than restated here.
          </p>
        </Prose>
      </Section>

      <Section id="what-changes" title="What changes when the exchange is closed">
        <Prose>
          <p>
            The mechanics of a position do not change when the exchange closes. What changes is the price feed
            underneath, and everything that depends on it.
          </p>
          <ul>
            <li>
              <strong>The feed is different.</strong> During a closed session the reference comes from pre-market and
              post-market feeds, or from the tokenized 24/7 feed. The tokenized feed is a real market price for the same
              underlying exposure, but it is a different market than the listed exchange, and it can disagree with where
              the stock last printed and where it will reopen.
            </li>
            <li>
              <strong>Backing is thinner.</strong> Feeds serving a closed session are backed by less activity than the
              open cash session. Confidence bands tend to widen, which lowers the reference quality tier.
            </li>
            <li>
              <strong>Spreads and confidence behave differently.</strong> A wider confidence band reduces the share of
              venue capacity a market may use and increases the spread your order crosses. The same order can cost more
              overnight than it does at midday.
            </li>
            <li>
              <strong>Source handovers happen at the boundaries.</strong> Opening and closing the session switches the
              selected feed. The engine walks the price across a handover rather than jumping, and blocks new exposure
              while a transition gap is open.
            </li>
          </ul>
        </Prose>
        <Callout tone="note" title="What stays the same">
          Isolated margin, the maintenance-margin test, funding accrual, liquidation and the fee schedule are identical
          in every state. A closed exchange does not change the rules of your position. It changes the price the rules
          are applied to.
        </Callout>
      </Section>

      <Section id="limits" title="Where this can hurt you">
        <Prose>
          <ul>
            <li>
              A price built from a closed-session feed can be some distance from where the stock actually reopens. A
              position that looked healthy overnight can be marked very differently at the open, and the move between the
              two is real for funding, marking and liquidation.
            </li>
            <li>
              Overnight liquidity in the underlying is thin, so the reference can move sharply on little activity. Wider
              confidence and higher execution cost are the visible symptoms; a fast move against a leveraged position is
              the consequence.
            </li>
            <li>
              At a session boundary the market may be TRANSITIONING, during which new exposure is blocked. If you were
              planning to open exactly at the open or close, you may have to wait for the handover to converge.
            </li>
            <li>{CANONICAL.noOwnership}</li>
          </ul>
        </Prose>
      </Section>
    </DocsLayout>
  );
}
