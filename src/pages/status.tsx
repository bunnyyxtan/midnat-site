import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { Callout, KeyValue, Prose, Section, TableScroll } from '@/components/public/primitives';
import { getJson } from '@/lib/api';
import { CANONICAL, MARKETS, NETWORK, ORACLE_POLICY, REFERENCE_ENGINE, utcDateTime } from '@/lib/protocol-registry';

/**
 * Live status page. It reports only what it can observe over the read API and
 * says so plainly when it cannot. The initial state is "checking", a failed
 * request renders an explicit unreachable state with the time of the attempt,
 * and no number is ever shown without its age. There is no uptime figure, no
 * incident history and no service-level claim, because this project measures
 * none of those.
 */

const POLL_INTERVAL_MS = 15_000;
const REQUEST_TIMEOUT_MS = 8_000;

type ProbeState = 'checking' | 'ok' | 'unreachable';

/** Shape we read from /api/reference-health. Only the fields this page renders. */
interface ReferenceMarket {
  symbol: string;
  referenceState: string;
  quality?: { state?: string };
  ageSec: number | null;
}

interface ReferenceHealth {
  provider?: string;
  updatedAt?: number;
  markets?: ReferenceMarket[];
}

interface Snapshot {
  api: ProbeState;
  reference: ReferenceHealth | null;
  referenceState: ProbeState;
  /** Epoch milliseconds of the attempt that produced this snapshot. */
  attemptedAtMs: number | null;
}

const INITIAL: Snapshot = {
  api: 'checking',
  reference: null,
  referenceState: 'checking',
  attemptedAtMs: null,
};

function withTimeout(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return { signal: controller.signal, cancel: () => window.clearTimeout(timer) };
}

/** A number is only shown with its age. Anything else renders as unknown. */
function ageLabel(ageSec: number | null | undefined): string {
  if (typeof ageSec !== 'number' || !Number.isFinite(ageSec)) return 'age unknown';
  if (ageSec < 60) return `${Math.round(ageSec)}s ago`;
  const minutes = Math.floor(ageSec / 60);
  const seconds = Math.round(ageSec % 60);
  return `${minutes}m ${seconds}s ago`;
}

function probeLabel(state: ProbeState): string {
  if (state === 'checking') return 'Checking';
  if (state === 'ok') return 'Responded';
  return 'Unreachable';
}

function probeBadge(state: ProbeState): string {
  if (state === 'ok') return 'pub-badge-live';
  return 'pub-badge-quiet';
}

export default function Status() {
  const [snap, setSnap] = useState<Snapshot>(INITIAL);
  const inFlight = useRef(false);

  const poll = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const attemptedAtMs = Date.now();

    // Health probe.
    let api: ProbeState = 'unreachable';
    {
      const { signal, cancel } = withTimeout();
      try {
        await getJson<{ status: string }>('/healthz', signal);
        api = 'ok';
      } catch {
        api = 'unreachable';
      } finally {
        cancel();
      }
    }

    // Reference engine probe.
    let reference: ReferenceHealth | null = null;
    let referenceState: ProbeState = 'unreachable';
    {
      const { signal, cancel } = withTimeout();
      try {
        reference = await getJson<ReferenceHealth>('/reference-health', signal);
        referenceState = 'ok';
      } catch {
        reference = null;
        referenceState = 'unreachable';
      } finally {
        cancel();
      }
    }

    setSnap({ api, reference, referenceState, attemptedAtMs });
    inFlight.current = false;
  }, []);

  useEffect(() => {
    let timer: number | null = null;

    const start = () => {
      if (timer !== null) return;
      void poll();
      timer = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stop();
      else start();
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [poll]);

  const attempted = snap.attemptedAtMs ? utcDateTime(new Date(snap.attemptedAtMs).toISOString()) : null;
  // The engine tracks more symbols than the venue lists. A status page for MIDNAT reports the
  // markets MIDNAT actually trades, so a symbol that is not listed cannot read as a MIDNAT outage.
  const listedSymbols = new Set(MARKETS.map((m) => m.symbol));
  const allReferenceMarkets = snap.reference?.markets ?? [];
  const referenceMarkets = allReferenceMarkets.filter((m) => listedSymbols.has(m.symbol));
  const unlistedTracked = allReferenceMarkets.length - referenceMarkets.length;
  const anchorAgeSec =
    typeof snap.reference?.updatedAt === 'number' && snap.attemptedAtMs
      ? Math.max(0, Math.floor(snap.attemptedAtMs / 1000) - snap.reference.updatedAt)
      : null;

  return (
    <DocumentLayout
      meta={{
        title: 'Status',
        description:
          'Live reads from the MIDNAT read API. It reports only what it can observe and states plainly when it cannot reach a system. No uptime figure, no incident history, no service-level claim.',
        path: '/status',
      }}
      eyebrow="Trust"
      title="Status"
      standfirst="Live reads taken when you loaded this page and refreshed on an interval. It reports only what it can observe, and when a request fails it says so with the time of the attempt rather than showing a cached value."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Status' }]}
      width="doc"
    >
      <Section id="now" title="Right now">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="flex items-center gap-2">
            <span className={`pub-badge ${probeBadge(snap.api)}`}>
              {snap.api === 'ok' ? <span className="pub-badge-dot" aria-hidden="true" /> : null}
              API {probeLabel(snap.api).toLowerCase()}
            </span>
          </span>
          <span className="pub-small">
            {attempted ? `Last checked ${attempted}` : 'First check in progress'}
          </span>
        </div>
        <Prose>
          {snap.api === 'checking' ? (
            <p>Checking whether the read API responds. No system is reported as healthy until a request has returned.</p>
          ) : snap.api === 'unreachable' ? (
            <p>
              The read API did not respond to the last request{attempted ? ` at ${attempted}` : ''}. Nothing below can
              be confirmed while it is unreachable, and no cached value is shown in its place.
            </p>
          ) : (
            <p>The read API responded to the last request{attempted ? ` at ${attempted}` : ''}.</p>
          )}
        </Prose>
      </Section>

      <Section id="chain" title="Chain the app is pointed at">
        <KeyValue
          items={[
            { key: 'Network', value: NETWORK.label },
            { key: 'Chain ID', value: `${NETWORK.chainId} (${NETWORK.chainIdHex})` },
            { key: 'Gas currency', value: NETWORK.gasCurrency },
          ]}
        />
        <Prose>
          <p>
            This is the network the interface is configured for. It is a fixed configuration value, not a live read, so
            it is shown without an age.
          </p>
        </Prose>
      </Section>

      <Section id="reference" title="Reference engine">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className={`pub-badge ${probeBadge(snap.referenceState)}`}>
            {snap.referenceState === 'ok' ? <span className="pub-badge-dot" aria-hidden="true" /> : null}
            Reference feed {probeLabel(snap.referenceState).toLowerCase()}
          </span>
          {snap.referenceState === 'ok' ? (
            <span className="pub-small">Anchored price {ageLabel(anchorAgeSec)}, policy ceiling {ORACLE_POLICY.maxPriceAgeSec}s</span>
          ) : null}
        </div>

        {snap.referenceState === 'checking' ? (
          <Prose>
            <p>Checking the reference engine. Per-market state appears once the request returns.</p>
          </Prose>
        ) : snap.referenceState === 'unreachable' ? (
          <Prose>
            <p>
              The reference-health endpoint did not respond{attempted ? ` at ${attempted}` : ''}. No per-market state is
              shown, because there is nothing to show that would not be invented.
            </p>
          </Prose>
        ) : referenceMarkets.length === 0 ? (
          <Prose>
            <p>The reference endpoint responded but reported no markets.</p>
          </Prose>
        ) : (
          <TableScroll>
            <table className="pub-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Reference state</th>
                  <th>Quality</th>
                  <th className="pub-td-num">Freshness</th>
                </tr>
              </thead>
              <tbody>
                {referenceMarkets.map((m) => (
                  <tr key={m.symbol}>
                    <td className="pub-td-key">{m.symbol}</td>
                    <td>{m.referenceState}</td>
                    <td>{m.quality?.state ?? 'unknown'}</td>
                    <td className="pub-td-num">{ageLabel(m.ageSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}

        <Prose>
          <p>
            The reference state moves through {REFERENCE_ENGINE.states.join(', ').toLowerCase()} as a feed ages. The
            clearing house rejects an anchored price older than {ORACLE_POLICY.maxPriceAgeSec} seconds, so a market that
            reads stale here is a market where new exposure is refused on chain.{' '}
            {unlistedTracked > 0
              ? `The engine also tracks ${unlistedTracked} ${unlistedTracked === 1 ? 'symbol' : 'symbols'} that this venue does not list, and those are left out of the table above because they are not tradeable here. `
              : ''}
            <Link href="/docs/reference-engine" className="pub-link">
              The reference engine
            </Link>{' '}
            explains the states in full.
          </p>
        </Prose>
      </Section>

      <Section id="scope" title="What this page checks, and what it does not">
        <Prose>
          <p>This page checks three things and refreshes them every {Math.round(POLL_INTERVAL_MS / 1000)} seconds while the tab is visible:</p>
          <ul>
            <li>Whether the read API responded to the most recent request.</li>
            <li>The reference engine state and freshness per market, as the engine reports it.</li>
            <li>The anchored price age against the {ORACLE_POLICY.maxPriceAgeSec} second on-chain ceiling.</li>
          </ul>
          <p>It does not publish, and you should not read into its absence:</p>
          <ul>
            <li>Any uptime percentage. This project does not measure one.</li>
            <li>Any incident history or post-mortem record.</li>
            <li>Any response-time or availability commitment.</li>
            <li>A status for anything not listed above. If it is not measured here, it is not claimed here.</li>
          </ul>
        </Prose>
        <Callout tone="caution" title="A testnet deployment can change under this page">
          {CANONICAL.testnet}
        </Callout>
      </Section>

      <Section id="not-established" title="What a green read does not establish">
        <Prose>
          <p>
            A system that responds now says nothing about the next minute. These are point-in-time reads with no history
            behind them. The absence of an uptime figure is deliberate: none is measured, so none is shown, and no badge
            on this page should be read as a promise that the system will stay up. When a read fails, that failure is the
            honest result, not a display error to refresh past.
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
