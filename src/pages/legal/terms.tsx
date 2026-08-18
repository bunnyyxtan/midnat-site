import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { Callout, ExternalLink, PrintButton, Prose, Section } from '@/components/public/primitives';
import { PRIMARY_CONTACT } from '@/lib/contact';
import { legalBySlug, legalHref } from '@/lib/site-map';
import { CANONICAL, CONTRACTS, NETWORK, utcDate } from '@/lib/protocol-registry';

const DOC = legalBySlug('terms')!;

export default function Terms() {
  return (
    <DocumentLayout
      meta={{ title: DOC.title, description: DOC.summary, path: legalHref(DOC.slug), type: 'article' }}
      eyebrow="Legal"
      title={DOC.title}
      standfirst="The terms under which you may use this interface. The interface is one way to reach public contracts, it is not the contracts, and it holds nothing of yours."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Legal', href: '/legal' }, { label: DOC.title }]}
      headerMeta={[{ label: 'Updated', value: utcDate(DOC.updated) }]}
      actions={<PrintButton />}
      width="prose"
    >
      <Callout tone="caution" title="The short version">
        {CANONICAL.testnet}
      </Callout>

      <Section id="interface" title="What this is">
        <Prose>
          <p>
            This site is a read and write interface to a set of public smart contracts deployed on {NETWORK.label},
            chain {NETWORK.chainId}. It renders market data, builds transactions and shows you what a contract returned.
            It is software, not a service that acts for you.
          </p>
          <p>
            The contracts are the protocol. This interface is one way to reach them and it is not the only way. The{' '}
            {CONTRACTS.length} deployed contracts are permissionless: anyone can call them directly with their own
            tooling, and nothing on this site is required to do so. Their addresses are on the{' '}
            <Link href="/contracts" className="pub-link">
              contracts page
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="no-custody" title="No account and no custody">
        <Prose>
          <p>
            There is no account here. You do not sign up, you do not log in, and there is no password to lose. You
            interact by connecting a wallet you already control, and that wallet stays in your control the whole time.
          </p>
          <p>
            This site never takes custody of your funds. Collateral sits in the contracts, not with the operator of this
            site, and every transaction that moves value is signed by your wallet and broadcast by you. The operator
            cannot move your funds and cannot sign for you.
          </p>
        </Prose>
      </Section>

      <Section id="eligibility" title="Eligibility and your own responsibility">
        <Prose>
          <p>
            You are responsible for whether you are permitted to use this interface where you are, and for meeting any
            legal, tax and regulatory obligation that applies to you. The operator does not screen users and does not
            assess your circumstances.
          </p>
          <p>
            You are responsible for your wallet, your keys and every transaction you sign. A transaction sent to a
            public chain cannot be recalled. If you sign the wrong thing, no one on this side can reverse it.
          </p>
          <p>{CANONICAL.notAdvice}</p>
        </Prose>
      </Section>

      <Section id="warranty" title="No warranty">
        <Prose>
          <p>
            This interface and the contracts behind it are provided as they are, with no warranty of any kind. There is
            no promise that the interface is available, correct, uninterrupted or fit for any purpose, and no promise
            that the contracts behave as any page describes.
          </p>
          <p>{CANONICAL.noAudit}</p>
        </Prose>
      </Section>

      <Section id="liability" title="Limitation of liability">
        <Prose>
          <p>
            To the extent the law allows, the operator of this interface is not liable for any loss you suffer from
            using it or the contracts, including lost testnet balances, missed actions, failed or stuck transactions,
            stale prices, refused trades, unpaid deferred claims, or the interface being unavailable when you wanted it.
          </p>
          <p>
            This is not a company disclaiming a duty it would otherwise owe you. MIDNAT is not incorporated, so no
            company balance sheet stands behind this interface to bear a liability, and you should not use it as if one
            did. The ways a position can lose everything assigned to it are set out
            in the{' '}
            <Link href="/legal/risk-disclosure" className="pub-link">
              risk disclosure
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="changes" title="Changes to these terms">
        <Prose>
          <p>
            These terms can change. The version in force is the one published here, dated at the top of the page. There
            is no notification list and no email, because there is no account and no email to send to. If you keep using
            the interface after a change, that is the only signal of acceptance that exists.
          </p>
        </Prose>
      </Section>

      <Section id="entity" title="Entity and governing law">
        <Callout tone="caution" title="An individual operator in India, and no company">
          {CANONICAL.entity}
        </Callout>
        <Prose>
          <p>
            These terms name a governing law and stop there. No arbitration venue or court is named, because none has
            been agreed, and printing one that had not been agreed would be worse than saying so. The one channel this
            project publishes, <ExternalLink href={PRIMARY_CONTACT.href}>{PRIMARY_CONTACT.display}</ExternalLink> on{' '}
            {PRIMARY_CONTACT.network}, is an account and not a legal address, so nothing here can be served through it.
          </p>
        </Prose>
      </Section>

      <Section id="limits" title="What these terms do not establish">
        <Prose>
          <p>
            Accepting these terms does not create a contract with a company, because none exists. It does not
            entitle you to support, to a remedy, to compensation for a loss, or to the continued existence of this
            interface or this deployment. It grants you no rights against the operator beyond the ability to stop using
            the interface at any time.
          </p>
          <ul>
            <li>
              <Link href="/legal/testnet" className="pub-link">
                Testnet disclosure
              </Link>
              , what a testnet deployment means for your balances and how long it lasts.
            </li>
            <li>
              <Link href="/legal/risk-disclosure" className="pub-link">
                Risk disclosure
              </Link>
              , the ways a position can lose everything assigned to it.
            </li>
            <li>
              <Link href="/legal/privacy" className="pub-link">
                Privacy notice
              </Link>
              , what this interface stores and sends.
            </li>
          </ul>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
