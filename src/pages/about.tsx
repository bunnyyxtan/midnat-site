import { DocumentLayout } from '@/components/public/DocumentLayout';
import { Callout, ExternalLink, KeyValue, Prose, RelatedLinks, Section, StatusBadge } from '@/components/public/primitives';
import { HAS_EMAIL_CHANNEL, PRIMARY_CONTACT } from '@/lib/contact';
import {
  CANONICAL,
  COLLATERAL,
  CONTRACTS,
  KEY_CONCENTRATION,
  MARKETS,
  NETWORK,
  SOURCES,
} from '@/lib/protocol-registry';

/**
 * What MIDNAT is, why it exists, and how it is built. No invented fact:
 * every claim is a canonical sentence, a registry value, or a description of
 * how the site is actually built. The testnet protocol is complete and
 * evidenced by its deployed contracts; mainnet expansion is described as a
 * staged institutional scale program.
 */

const PRINCIPLES: readonly { title: string; body: string }[] = [
  {
    title: 'Limitations sit next to capabilities',
    body: 'Every page that states what the protocol can do also states where it is still exposed. A page that only says good things about its subject is treated as wrong.',
  },
  {
    title: 'One canonical source for every number',
    body: 'No public page types a protocol number by hand. Addresses, caps, tiers and parameters are all derived from the deployment manifest, so a redeployment updates every surface at once and copy-paste drift is impossible.',
  },
  {
    title: 'Verifiable on chain, not asserted',
    body: 'Where a claim can be checked against the chain or the source, the page shows how to check it and what the check does not prove. A signature authenticates the messenger, not the market.',
  },
  {
    title: 'Evidence-led status and transparent assurance',
    body: 'Every capability carries one status from a fixed vocabulary. Internal review and AI review are described as supporting evidence, not as an external audit, and external review publication is named as the next assurance milestone. Uptime is not published because nothing here measures it.',
  },
];

export default function About() {
  return (
    <DocumentLayout
      meta={{
        title: 'About',
        description:
          'What MIDNAT is, why it exists, the principles it holds itself to, its current state, and how to reach the project.',
        path: '/about',
      }}
      eyebrow="About"
      title="About MIDNAT"
      standfirst="Equity exposure that does not stop when an exchange closes, priced from a reference that keeps working and cleared against a vault. This page states what that is, and what it is not."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'About' }]}
      width="doc"
      after={
        <RelatedLinks
          title="Continue"
          links={[
            { label: 'How MIDNAT works', href: '/docs/how-it-works', summary: 'The whole protocol on one page.' },
            { label: 'Security', href: '/security', summary: 'Key concentration, verification state and disclosure.' },
            { label: 'Contracts', href: '/contracts', summary: 'Deployed addresses, roles and verification state.' },
            { label: 'Brand', href: '/brand', summary: 'The name, the mark, the palette and the voice.' },
          ]}
        />
      }
    >
      <Section id="thesis" title="The thesis">
        <Prose>
          <p>
            A share of a company trades only while its exchange is open. News does not keep those hours, and neither
            does the risk a holder carries overnight and over a weekend. MIDNAT trades stock perpetuals around the clock,
            so a position can be opened, changed or closed when the exchange behind it is dark.
          </p>
          <p>
            Three parts make that possible. A reference engine builds a price for each underlying at any hour, from
            whichever feed is freshest. A clearing house prices, opens and settles the positions opened by calls to it,
            against that reference. A liquidity vault is the counterparty to those positions, so a trader never waits
            for another trader to take the other side.
          </p>
          <p>{CANONICAL.noOwnership}</p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Network', value: `${NETWORK.label}, chain ${NETWORK.chainId}` },
            { key: 'Collateral', value: `${COLLATERAL.name} (${COLLATERAL.symbol})` },
            { key: 'Listed markets', value: `${MARKETS.length}` },
            { key: 'Contracts', value: `${CONTRACTS.length}, all live on testnet` },
          ]}
        />
      </Section>

      <Section id="principles" title="What this project holds itself to">
        <Prose>
          <p>
            These principles are not a mission statement. They are how the site is actually built, and each one is
            enforceable against a page.
          </p>
        </Prose>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="pub-card flex flex-col gap-2">
              <span className="pub-h4">{p.title}</span>
              <p className="pub-body !text-[0.9375rem]">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="state" title="The current state, honestly">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status="LIVE_ON_TESTNET" />
        </div>
        <Prose>
          <p>
            The contracts are deployed on {NETWORK.label} and this deployment is activated: the review gate approved the
            launch digest and launch was enabled on chain, so deposits and new positions are contract-enabled. Whether a
            specific action clears still depends on live chain state, and the live operating mode is read from the
            terminal and the contracts rather than asserted here. That is the extent of the good news, and the rest of
            this section is the qualifications that go with it.
          </p>
          <ul>
            <li>{CANONICAL.testnet}</li>
            <li>
              Every trade is a call to the clearing house, but the price it fills against is produced off chain. The
              reference engine and the report signer are MIDNAT's; the contract enforces that the price it uses is
              recent and that the funding rate it accrues is inside a clamp, not that the number is right.
            </li>
            <li>{CANONICAL.noAudit}</li>
            <li>
              {KEY_CONCENTRATION.ownerAlsoKeeper
                ? 'One key holds the owner, risk keeper and funding keeper roles. There is no multisig and no timelock on this deployment. That is a real centralisation fact, and it is published rather than hidden.'
                : 'Privileged roles are split across separate keys on this deployment.'}
            </li>
            <li>
              Permissionless liquidation is deployed and live on chain. The canonical Foundry suite covers exact long
              and short boundaries, funding-driven liquidation, underwater shortfall absorption, healthy-position
              refusal, stale-oracle refusal and invariants.
            </li>
          </ul>
        </Prose>
        <Callout tone="caution" title="Read these before anything else">
          <p>{CANONICAL.testnet}</p>
          <p>{CANONICAL.noAudit}</p>
        </Callout>
      </Section>

      <Section id="entity" title="Who operates MIDNAT">
        <Prose>
          <p>
            MIDNAT is an independently operated protocol. The testnet protocol is complete and
            evidenced by its deployed contracts, its deployment record and the public documentation on this site: the
            record of the work is the chain, not a claim on this page.
          </p>
          <p>
            Mainnet expansion is a strategic institutional scale program. It spans institutional liquidity depth,
            insurance capitalisation, market-making partnerships, distributed operations, external assurance, production
            monitoring and X Layer distribution. The current testnet release is described in the present tense; the
            scale program is described as staged workstreams rather than dated promises.
          </p>
        </Prose>
        <Callout tone="note" title="Legal standing of the operator">
          <p>{CANONICAL.entity}</p>
        </Callout>
      </Section>

      <Section id="contact" title="How to reach the project">
        <Prose>
          <p>
            Contact today is community-channel based:{' '}
            <ExternalLink href={PRIMARY_CONTACT.href}>{PRIMARY_CONTACT.display}</ExternalLink> on{' '}
            {PRIMARY_CONTACT.network}. There is {!HAS_EMAIL_CHANNEL && 'no email inbox, '}no support desk and no ticket
            queue behind it yet, so response times are not guaranteed. Institutional support and incident-response
            processes are a planned workstream of the mainnet scale program, not a capability offered today.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Chain manifest', value: SOURCES.manifest },
            { key: 'Contract source', value: SOURCES.contracts },
          ]}
        />
      </Section>

      <Section id="limits" title="What this page does not establish">
        <Prose>
          <p>
            This page is a description, not a warranty. It does not establish a company, or a corporate counterparty
            you can hold to anything. {CANONICAL.notAdvice}
          </p>
          <p>
            It also does not establish that the system is safe with real money. Everything here runs on a test network
            whose balances have no monetary value and which can be reset or replaced without notice. The Security page
            records the current evidence and review status. For the operational boundaries and the loss, payout and
            settlement risks that bear on a position or a deposit, read the Security and risk pages rather than this one.
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
