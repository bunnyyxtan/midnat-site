import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { Callout, ExternalLink, Prose, RelatedLinks, Section } from '@/components/public/primitives';
import { HAS_EMAIL_CHANNEL, PRIMARY_CONTACT } from '@/lib/contact';
import { LEGAL, legalHref } from '@/lib/site-map';
import { CANONICAL, DEPLOYMENT, utcDate } from '@/lib/protocol-registry';

export default function LegalIndex() {
  return (
    <DocumentLayout
      meta={{
        title: 'Legal',
        description:
          'The MIDNAT legal documents: terms of use, privacy notice, risk disclosure, testnet disclosure, AI disclosure, market data, acceptable use, cookies and licences.',
        path: '/legal',
      }}
      eyebrow="Legal"
      title="Legal documents"
      standfirst="Nine documents, each written for this protocol rather than adapted from a template. They are short because the honest version of each one is short."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Legal' }]}
      width="doc"
      after={
        <RelatedLinks
          title="Related"
          links={[
            { label: 'Risk framework', href: '/risk', summary: 'How risk is priced and capped, tier by tier.' },
            { label: 'Security', href: '/security', summary: 'Key concentration, verification state and disclosure.' },
          ]}
        />
      }
    >
      <Section id="entity" title="Entity and governing law">
        <Callout tone="note" title="Legal standing of the operator">
          <p>{CANONICAL.entity}</p>
          <p>
            The practical consequence is worth stating before you read further. Because no company is yet incorporated,
            there is no registered corporate counterparty to contract with and no registered office to serve notice on;
            an operating entity and custody framework is a mainnet expansion workstream. What exists today is a named
            operator, a stated governing law, and the documents below, which are written to be read literally rather
            than skimmed.
          </p>
        </Callout>
        <Prose>
          <p>
            One channel exists: <ExternalLink href={PRIMARY_CONTACT.href}>{PRIMARY_CONTACT.display}</ExternalLink> on{' '}
            {PRIMARY_CONTACT.network}. It is an account, not a legal address. There is{' '}
            {!HAS_EMAIL_CHANNEL && 'no legal inbox, '}no phone number and no registered office, so nothing on this site
            can accept service of process or a formal notice.
          </p>
        </Prose>
      </Section>

      <Section id="documents" title="The documents">
        <ul className="flex flex-col list-none p-0 m-0 border-t border-[color:var(--ln-hairline-soft)]">
          {LEGAL.map((doc) => (
            <li key={doc.slug} className="border-b border-[color:var(--ln-hairline-soft)]">
              <Link href={legalHref(doc.slug)} className="group flex flex-col gap-1 py-4 no-underline" data-testid={`legal-${doc.slug}`}>
                <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-[1.0625rem] font-medium text-[color:var(--ln-ink)] group-hover:text-[color:var(--ln-accent)] transition-colors">
                    {doc.title}
                  </span>
                  <span className="pub-mono !text-[0.6875rem] uppercase tracking-[0.12em] text-[color:var(--ln-ink-soft)]">
                    Updated {utcDate(doc.updated)}
                  </span>
                </span>
                <span className="pub-small pub-measure">{doc.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="reading" title="How to read them">
        <Prose>
          <p>
            These documents describe an unaudited testnet deployment. Two facts sit underneath all of them and are worth
            reading before the rest.
          </p>
          <ul>
            <li>{CANONICAL.testnet}</li>
            <li>{CANONICAL.noAudit}</li>
          </ul>
          <p>
            The current deployment completed {utcDate(DEPLOYMENT.completedAt)}. Its contracts are on chain and readable,
            and the deployment is activated: the review gate approved the launch digest and launch was enabled on chain,
            so deposits and new positions are contract-enabled. These documents describe how the venue behaves, and
            whether a specific action clears still depends on live chain state.
          </p>
          <p>
            Where a document states a technical fact, that fact is taken from the deployment manifest or from the code,
            not from marketing copy. Where it states a limit, the limit is enforced by a contract or it is not claimed.
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
