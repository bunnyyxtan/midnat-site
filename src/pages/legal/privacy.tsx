import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { Callout, ExternalLink, PrintButton, Prose, Section, TableScroll } from '@/components/public/primitives';
import { HAS_EMAIL_CHANNEL, PRIMARY_CONTACT } from '@/lib/contact';
import { legalBySlug, legalHref } from '@/lib/site-map';
import { CANONICAL, INTELLIGENCE, NETWORK, REFERENCE_ENGINE, utcDate } from '@/lib/protocol-registry';

const DOC = legalBySlug('privacy')!;

export default function Privacy() {
  return (
    <DocumentLayout
      meta={{ title: DOC.title, description: DOC.summary, path: legalHref(DOC.slug), type: 'article' }}
      eyebrow="Legal"
      title={DOC.title}
      standfirst="Every piece of data this project touches, where it lives, why, and for how long. Written from an audit of the code, not from a template."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Legal', href: '/legal' }, { label: DOC.title }]}
      headerMeta={[{ label: 'Updated', value: utcDate(DOC.updated) }]}
      actions={<PrintButton />}
      width="prose"
    >
      <Callout tone="note" title="The short version">
        There is no account, no analytics, no advertising and no tracking. The interface stores a few preferences in
        your browser, the API keeps thin operational logs, and everything you trade is on chain and public forever.
      </Callout>

      <Section id="operator" title="Who is responsible for this notice">
        <Prose>
          <p>{CANONICAL.entity}</p>
          <p>
            That operator decides what this interface collects and why, and is the party a data protection law would
            call the controller. The interface asks you for no name, no email address and no payment detail, so the map
            below is short by construction rather than by policy.
          </p>
        </Prose>
      </Section>

      <Section id="map" title="What is collected, and by what">
        <Prose>
          <p>
            The table below is the whole map. Each row is a real data flow found in the code, not a category kept open
            for future use.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <caption>Data flows in the MIDNAT interface and API.</caption>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Where it lives</th>
                <th scope="col">Why</th>
                <th scope="col">Retention</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Theme preference</td>
                <td>Browser local storage, key midnat-theme</td>
                <td>Remember light or dark</td>
                <td>Until you clear your browser</td>
              </tr>
              <tr>
                <td>Wallet provider id, not your address</td>
                <td>Browser local storage, key midnat.wallet.v3</td>
                <td>Reconnect to the same wallet extension</td>
                <td>Until you disconnect or clear</td>
              </tr>
              <tr>
                <td>Chart preferences, drawings and selected tab</td>
                <td>Browser local storage, in the trading app</td>
                <td>Keep your chart set up between visits</td>
                <td>Until you clear it</td>
              </tr>
              <tr>
                <td>Mobile wallet handoff state</td>
                <td>Browser session storage, in the trading app</td>
                <td>Complete a mobile wallet connection</td>
                <td>Consumed and deleted, short lived</td>
              </tr>
              <tr>
                <td>Fair-use session id</td>
                <td>Browser local storage, key midnat.session.v1, in the trading app</td>
                <td>
                  A random id, generated in your browser, so your fair-use allowance follows you across reloads
                  instead of being pooled with everyone behind the same network address. It is not a login and it
                  carries no personal information
                </td>
                <td>Until you clear it. At the API: only a salted hash, kept with the usage counters</td>
              </tr>
              <tr>
                <td>Wallet address</td>
                <td>
                  Published to the chain by every trade you sign. Sent to the API as a request header while a wallet
                  is connected, where it is salted-hashed into an actor key and never stored as an address
                </td>
                <td>On chain: to hold your position. At the API: to count your fair-use allowance</td>
                <td>On chain: permanent, see below. At the API: only the hash, kept with the usage counters</td>
              </tr>
              <tr>
                <td>Request logs</td>
                <td>Server logs at the API</td>
                <td>Operate and debug the service</td>
                <td>Platform dependent, no policy in code</td>
              </tr>
              <tr>
                <td>Question text sent to the ask endpoint</td>
                <td>Forwarded to the model provider</td>
                <td>Answer the question you asked</td>
                <td>Not logged here, provider retention applies</td>
              </tr>
              <tr>
                <td>Font requests</td>
                <td>Third party font providers</td>
                <td>Render the typeface</td>
                <td>Their own logs</td>
              </tr>
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="browser" title="What the interface stores in your browser">
        <Prose>
          <p>
            The interface keeps a small number of preferences in your browser's local and session storage. It sets no
            cookie at all, on this site or in the trading app, so there is nothing here that follows you between sites
            and no consent banner to dismiss. None of these keys hold your wallet address, a key or a balance.
          </p>
          <p>
            The wallet key stores only which wallet extension you chose, so the interface can offer to reconnect. Your
            live address is read from the wallet each time through the wallet standard, not saved by this site. The full
            list is in{' '}
            <Link href="/legal/cookies" className="pub-link">
              cookies and local storage
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="server" title="Server logs">
        <Prose>
          <p>
            The API logs each request as a request id, the method and the path with the query string removed, and the
            response status. It does not log your IP address, your user agent, the request body, query values or your
            wallet address. Explicit operational logs record market and engine state, model identifiers, timing and
            content hashes, and truncated error text.
          </p>
          <p>
            There is no log retention or deletion policy in the code, so how long logs live is a property of wherever
            the API is deployed, not something this document can promise. It is disclosed as platform dependent because
            that is the honest state.
          </p>
        </Prose>
      </Section>

      <Section id="ai" title="The ask endpoint and the model provider">
        <Prose>
          <p>
            When you ask a question, the text of your question is sent to {INTELLIGENCE.provider}, which runs the model,
            along with the routing context and any position facts computed on the server. Your wallet address is not
            placed in the message sent to the model. MIDNAT does not log the question text or the answer, only content
            hashes, metrics and truncated errors.
          </p>
          <p>
            Once your question reaches {INTELLIGENCE.provider}, what happens to it is governed by that provider, not by
            this project, and their retention applies. The endpoint is rate limited to{' '}
            {INTELLIGENCE.askQuestionsPerMinute} requests per minute for a visitor and{' '}
            {INTELLIGENCE.askConcurrentRequests} concurrent requests.{' '}
            <Link href="/legal/ai-disclosure" className="pub-link">
              The AI disclosure
            </Link>{' '}
            covers the model layer in full.
          </p>
        </Prose>
      </Section>

      <Section id="third-parties" title="Third parties that receive data">
        <Prose>
          <ul>
            <li>
              The model provider, {INTELLIGENCE.provider}, receives the text you send to the ask endpoint and the
              server context that goes with it.
            </li>
            <li>
              The {NETWORK.label} RPC endpoint receives the chain calls the API makes, which include public contract
              addresses and signed oracle reports. It does not receive your question text. Your wallet actions go
              through your own wallet provider, not a MIDNAT server.
            </li>
            <li>
              The price upstream, {REFERENCE_ENGINE.upstream}, receives feed identifiers and query parameters for the
              markets. It does not receive your wallet address, your IP through this project, or any text you type.
            </li>
            <li>
              Font providers receive a normal browser request when a page loads, which exposes standard network
              metadata such as your IP address to them.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section id="not-done" title="What this project does not do">
        <Prose>
          <ul>
            <li>No analytics of any kind, and no analytics SDK in either front end.</li>
            <li>No advertising and no advertising network.</li>
            <li>No tracking pixels and no third party tracking scripts.</li>
            <li>No remote error telemetry: browser errors go to the console only.</li>
            <li>No selling or sharing of data for marketing.</li>
            <li>No profiles, no cross site identifiers and no account system.</li>
          </ul>
        </Prose>
      </Section>

      <Section id="on-chain" title="On-chain data is public and permanent">
        <Callout tone="caution" title="Nothing on chain can be deleted, including by us">
          Anything you send to the contracts is written to a public ledger. Your wallet address, and every deposit,
          position, close, liquidation and claim carried by a transaction you send, are visible to anyone,
          permanently. Opening a position in the MIDNAT app is one of those transactions: your address, the market,
          the side, the size, the collateral and the price it filled at are published to {NETWORK.label} at the moment
          you sign, by you, and no part of this interface can take them back.
        </Callout>
        <Prose>
          <p>
            The contracts emit events that record the trader address with the market, side, size, collateral, prices,
            profit and loss, funding, fees and payouts. A public chain cannot be edited. No one, including the operator
            of this interface, can erase, alter or hide those records, and no privacy request can change that. Treat a
            wallet address you use here as public and linkable to everything it has done.
          </p>
          <p>{CANONICAL.testnet}</p>
        </Prose>
      </Section>

      <Section id="contact" title="Contact and what this notice does not promise">
        <Prose>
          <p>
            There is no data protection officer{!HAS_EMAIL_CHANNEL && ' and no privacy inbox'}. The one channel this
            project publishes is{' '}
            <ExternalLink href={PRIMARY_CONTACT.href}>{PRIMARY_CONTACT.display}</ExternalLink> on {PRIMARY_CONTACT.network}: a request sent
            there reaches an account, not a process, and this notice promises nothing about how quickly it is read or
            whether it can be acted on at all.
          </p>
          <p>
            This notice does not promise deletion of anything written to the chain, because that is impossible. It does
            not promise a retention period for server logs, because none is set in the code. It describes what the code
            does today on a testnet deployment, and it changes when the code does.
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
