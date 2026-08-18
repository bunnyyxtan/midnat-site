import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, CodeBlock, Prose, Section, StatusBadge, TableScroll } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { INTELLIGENCE } from '@/lib/protocol-registry';

const DOC = docBySlug('api')!;

interface Endpoint {
  method: 'GET';
  path: string;
  returns: string;
  rateLimit: string;
}

/**
 * Read endpoints only, each confirmed by reading the API server source under
 * artifacts/api-server/src/routes. The former position and order endpoints
 * belonged to the retired off-chain book and now answer 410; they are listed
 * separately below rather than quietly dropped.
 */
const READ_ENDPOINTS: readonly Endpoint[] = [
  { method: 'GET', path: '/healthz', returns: 'A single status string. It does not check dependencies.', rateLimit: 'None' },
  { method: 'GET', path: '/markets', returns: 'Every listed market with its live parameters and reference state.', rateLimit: 'None' },
  { method: 'GET', path: '/markets/{symbol}', returns: 'One market by ticker, or 404 if it is not listed.', rateLimit: 'None' },
  { method: 'GET', path: '/candles', returns: 'Oldest-first candles for a symbol and interval.', rateLimit: 'None' },
  { method: 'GET', path: '/market-state', returns: 'The market regime, per-market caps, reference state and next transition.', rateLimit: 'None' },
  { method: 'GET', path: '/reference-health', returns: 'Sentinel level, active findings and per-market quality, confidence and capability.', rateLimit: 'None' },
  { method: 'GET', path: '/execution-preview', returns: 'A deterministic fill quote: reference, mark, estimated execution, spread and impact.', rateLimit: 'None' },
  { method: 'GET', path: '/receipts', returns: 'Reference and execution receipts for one position id.', rateLimit: 'None' },
  { method: 'GET', path: '/oracle/prices', returns: 'The latest signed reference report per market.', rateLimit: 'None' },
  { method: 'GET', path: '/vault', returns: 'Vault statistics, reported as unavailable where there is no figure to source.', rateLimit: 'None' },
  { method: 'GET', path: '/stats', returns: 'Exchange activity: 24 hour volume, trades, open interest and active addresses.', rateLimit: 'None' },
  { method: 'GET', path: '/ai/desk', returns: 'The cached ambient market desk state.', rateLimit: 'None' },
  { method: 'GET', path: '/ai/intelligence-metrics', returns: 'Counters for the intelligence surface: usage, cache and degradation.', rateLimit: 'None' },
  { method: 'GET', path: '/intelligence/changes', returns: 'Deterministic observed transitions for a symbol, newest first.', rateLimit: 'None' },
  { method: 'GET', path: '/anchor/status', returns: 'Anchor contract, signer, signing domain and an explorer link.', rateLimit: 'None' },
];

const HEALTH_RESPONSE = `GET /api/healthz

{
  "status": "ok"
}`;

export default function Api() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="The interface reads everything it shows over a small set of HTTP endpoints. They are public, unversioned and read-only. This page documents the ones confirmed in the server source, and nothing it does not."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="conventions" title="Conventions">
        <div className="flex items-center gap-3">
          <StatusBadge status="IMPLEMENTED" />
        </div>
        <Prose>
          <p>
            Every endpoint is served under the <span className="pub-mono">/api</span> base path and returns JSON. There
            is no authentication: the read endpoints are public and unauthenticated. There is no write API of any kind.
            The position and order endpoints this server used to expose belonged to the retired off-chain book and now
            answer <span className="pub-mono">410</span> with the clearing house address, because opening or closing a
            position is a transaction your wallet sends to that contract, not a request to this server.
          </p>
          <p>
            Responses are not versioned. There is no version segment in the path and no version header, so a response
            shape can change without notice. Treat these endpoints as the interface's own read layer rather than a
            stable contract to build against.
          </p>
        </Prose>
      </Section>

      <Section id="endpoints" title="Read endpoints">
        <Prose>
          <p>
            These are the read endpoints confirmed in the server routes. Query parameters are validated and an invalid
            request is rejected rather than guessed at.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Method</th>
                <th scope="col">Path</th>
                <th scope="col">Returns</th>
                <th scope="col">Rate limit</th>
              </tr>
            </thead>
            <tbody>
              {READ_ENDPOINTS.map((e) => (
                <tr key={e.path}>
                  <td>
                    <span className="pub-mono">{e.method}</span>
                  </td>
                  <td>
                    <span className="pub-mono">{e.path}</span>
                  </td>
                  <td>{e.returns}</td>
                  <td>{e.rateLimit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="rate-limits" title="Rate limits">
        <Prose>
          <p>
            None of the read endpoints above enforce a rate limit in code. The only enforced limits sit on the two
            on-demand intelligence endpoints, which accept a request body and call the model: ask and order
            intelligence each allow at most {INTELLIGENCE.askQuestionsPerMinute} requests per minute for a visitor,{' '}
            {INTELLIGENCE.askQuestionsPerMinuteConnected} with a wallet connected, and{' '}
            {INTELLIGENCE.askConcurrentRequests} in flight at once, returning a 429 when either bound is hit. Those
            endpoints are covered in{' '}
            <Link href={docHref('intelligence')} className="pub-link">
              MIDNAT Intelligence
            </Link>
            . Do not read the absence of a limit on the read endpoints as a promise: it is the current implementation,
            not a guarantee.
          </p>
        </Prose>
      </Section>

      <Section id="shape" title="A representative response">
        <Prose>
          <p>
            The health endpoint is the simplest shape on the surface. It returns a single status string and does not
            check any dependency, so a status page must not read database or indexer health from it.
          </p>
        </Prose>
        <CodeBlock label="Health check">{HEALTH_RESPONSE}</CodeBlock>
      </Section>

      <Section id="limits" title="What this API will not do for you">
        <Prose>
          <ul>
            <li>
              There is no authentication and no write API. Requests to the retired{' '}
              <span className="pub-mono">/positions</span> and <span className="pub-mono">/orders</span> paths answer{' '}
              <span className="pub-mono">410</span> and name the clearing house instead. Nothing here can move
              collateral, open a position or close one: only a transaction signed by the wallet that owns it can.
            </li>
            <li>
              Responses are unversioned and may change shape. Nothing here is a stability guarantee, and there is no
              deprecation window.
            </li>
            <li>
              The read endpoints have no enforced rate limit today, which means no promise that they never will. Build
              as if a limit could appear.
            </li>
            <li>
              There is no machine-readable schema served over HTTP. The endpoints are documented on this page rather
              than at a live specification URL.
            </li>
          </ul>
          <p>
            For what the underlying data means and what its signatures and hashes prove, see{' '}
            <Link href="/verify" className="pub-link">
              verify
            </Link>{' '}
            and{' '}
            <Link href={docHref('oracle-anchor')} className="pub-link">
              the oracle anchor
            </Link>
            .
          </p>
        </Prose>
      </Section>
    </DocsLayout>
  );
}
