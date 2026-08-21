import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { Callout, KeyValue, PrintButton, Prose, Section } from '@/components/public/primitives';
import { docHref, legalBySlug, legalHref } from '@/lib/site-map';
import { CANONICAL, INTELLIGENCE, utcDate } from '@/lib/protocol-registry';

const DOC = legalBySlug('acceptable-use')!;

export default function AcceptableUse() {
  return (
    <DocumentLayout
      meta={{ title: DOC.title, description: DOC.summary, path: legalHref(DOC.slug), type: 'article' }}
      eyebrow="Legal"
      title={DOC.title}
      standfirst="What you may not do with the MIDNAT interface and the API, and an honest statement of what this document cannot reach."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Legal', href: '/legal' }, { label: DOC.title }]}
      headerMeta={[{ label: 'Updated', value: utcDate(DOC.updated) }]}
      actions={<PrintButton />}
      width="prose"
    >
      <Callout tone="caution" title="What this document governs">
        This policy governs the MIDNAT interface and the API. The contracts on chain are permissionless. This document
        cannot and does not restrict what the chain will accept, and nothing here changes that.
      </Callout>

      <Section id="scope" title="Scope">
        <Prose>
          <p>
            The rules below apply to your use of the hosted interface and the HTTP API that serves it. They set the
            terms under which those services are offered, and using either means you accept them.
          </p>
          <p>
            They do not, and cannot, control the on-chain contracts. Anyone can send a transaction directly to a
            contract without touching the interface. The contracts enforce their own rules in code, and this policy is
            not one of them.
          </p>
        </Prose>
      </Section>

      <Section id="prohibited" title="What you may not do">
        <Prose>
          <p>You may not use the interface or the API to do any of the following.</p>
          <ul>
            <li>
              Attempt to manipulate the reference price or the oracle. That includes any effort to feed, distort or time
              inputs so the anchored price misrepresents the underlying, and any attempt to induce a false price for
              your own gain or another's loss.
            </li>
            <li>
              Mount a denial of service against the API or the price poster. Do not flood, overload or otherwise try to
              stop the services that keep prices fresh and the interface responsive.
            </li>
            <li>
              Scrape in a way that degrades service for others. Automated reading that exceeds the published rate limits
              or that starves other users of capacity is not permitted.
            </li>
            <li>
              Use the interface or the API to evade sanctions or any law that applies to you. You are responsible for
              your own legal position, and MIDNAT is not a route around it.
            </li>
            <li>
              Run automated use that misrepresents the protocol as something it is not. Do not make representations
              beyond the published evidence: MIDNAT is testnet software and is not presented as audited, insured,
              regulated, endorsed, or as a live-money venue. Do not impersonate the project.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section id="rate-limits" title="Rate limits">
        <Prose>
          <p>
            The MIDNAT Intelligence question endpoint enforces the limits below per client address. Reading within them
            is expected. Circumventing them, for example by rotating addresses to defeat the per-address cap, is not.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Questions per minute, per visitor', value: `${INTELLIGENCE.askQuestionsPerMinute}` },
            {
              key: 'Questions per minute, with a wallet connected',
              value: `${INTELLIGENCE.askQuestionsPerMinuteConnected}`,
            },
            {
              key: 'Questions per minute, across one address',
              value: `${INTELLIGENCE.askQuestionsPerMinutePerAddress}`,
            },
            { key: 'Concurrent questions in flight', value: `${INTELLIGENCE.askConcurrentRequests}` },
            {
              key: 'Units per day, with a wallet connected',
              value: `${INTELLIGENCE.askUnitsPerDayConnected}`,
            },
            { key: 'Units per day, per visitor', value: `${INTELLIGENCE.askUnitsPerDayVisitor}` },
            {
              key: 'Units a question costs',
              value: `${INTELLIGENCE.askUnitsPerQuestion}, or ${INTELLIGENCE.askUnitsPerPortfolioQuestion} for a whole-portfolio question`,
            },
          ]}
        />
        <Prose>
          <p>
            The daily allowance refills steadily across {INTELLIGENCE.askUnitsRefillHours} hours and is the limit a
            person is likely to meet. The per-minute ceilings above sit on top of it to stop automation.
          </p>
        </Prose>
        <Prose>
          <p>
            Other read endpoints are offered on best effort and may be rate limited or throttled without notice to keep
            the service available for everyone. Automated clients should back off when the service signals that they
            should.
          </p>
        </Prose>
      </Section>

      <Section id="permissionless" title="The contracts are permissionless">
        <Prose>
          <p>
            MIDNAT deploys open contracts to a public chain. They accept transactions from any address that meets their
            on-chain conditions, whether or not that address ever loaded this interface. That is a property of the
            system, stated here so it is not mistaken for a loophole.
          </p>
          <p>
            The practical consequence: enforcement of this policy is limited to the services MIDNAT operates. MIDNAT can
            decline to serve the interface or the API to a client that breaks these rules. It cannot reverse or block a
            transaction that the contracts have already accepted, and it makes no claim that it can.
          </p>
        </Prose>
      </Section>

      <Section id="limits" title="What this policy does not do">
        <Prose>
          <p>
            This policy does not make the interface or the API guaranteed to be available, and it does not promise
            enforcement in any particular case. {CANONICAL.testnet}
          </p>
          <p>
            It does not restrict the contracts, it does not create a legal relationship beyond the terms of use, and it
            does not remove your own responsibility for the transactions you sign.
          </p>
          <ul>
            <li>
              <Link href="/legal/terms" className="pub-link">
                Terms of use
              </Link>
              , the terms under which you may use the interface.
            </li>
            <li>
              <Link href={docHref('api')} className="pub-link">
                HTTP API
              </Link>
              , the endpoints the interface uses and the limits that apply.
            </li>
          </ul>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
