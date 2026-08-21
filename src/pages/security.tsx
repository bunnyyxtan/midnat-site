import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { AddressDisplay, Callout, ExternalLink, KeyValue, PrintButton, Prose, Section, StatusBadge, TableScroll } from '@/components/public/primitives';
import { HAS_EMAIL_CHANNEL, PRIMARY_CONTACT } from '@/lib/contact';
import {
  CANONICAL,
  CONTRACTS,
  FUNDING,
  GLOBALS,
  KEY_CONCENTRATION,
  LIMITATIONS,
  ORACLE_POLICY,
  REFERENCE_ENGINE,
  ROLES,
  SECURITY_REVIEW,
  bpsToPercent,
} from '@/lib/protocol-registry';

/** The limitations that bear on security, in the order this page discusses them. */
const SECURITY_LIMITATION_IDS = [
  'activated-testnet',
  'owner-not-timelocked',
  'single-poster',
  'no-live-liquidation',
  'no-liquidation-incentive',
  'deferred-claims',
  'rpc-consistency',
] as const;

const SECURITY_LIMITATIONS = SECURITY_LIMITATION_IDS.map(
  (id) => LIMITATIONS.find((l) => l.id === id)!,
);

export default function Security() {
  return (
    <DocumentLayout
      meta={{
        title: 'Security',
        description:
          'MIDNAT security posture: review status, key concentration, the operational surface, the protections that exist in code, and where a reader is still exposed.',
        path: '/security',
      }}
      eyebrow="Trust"
      title="Security"
      standfirst="Written for a reader who assumes the worst. What has been verified, what is concentrated in a single key, what has never been exercised, and how to report a problem."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Security' }]}
      actions={<PrintButton />}
      width="doc"
    >
      <Callout tone="note" title="Activated on testnet">
        {SECURITY_LIMITATIONS.find((l) => l.id === 'activated-testnet')!.detail}
      </Callout>

      <Callout tone="note" title="Independent external AI review completed">
        {CANONICAL.noAudit}
      </Callout>

      <Section id="audit" title="Independent external AI review">
        <Prose>
          <p>
            The exact frozen testnet release was reviewed by {SECURITY_REVIEW.reviewer} on{' '}
            {SECURITY_REVIEW.completedOn}. The signed-off scope covered {SECURITY_REVIEW.scopeFileCount} files across{' '}
            {SECURITY_REVIEW.sectionCount} independent sections. Every section returned {SECURITY_REVIEW.verdict}, with{' '}
            {SECURITY_REVIEW.findingCount} findings.
          </p>
          <p>The completed review is backed by four checkable evidence layers:</p>
          <ul>
            <li>
              <strong>Exact-scope attestation.</strong> The reviewer attested the same 105-file scope digest recorded
              by the release bundle, so the verdict cannot silently apply to a different tree.
            </li>
            <li>
              <strong>Independent section review.</strong> Contracts, adversarial tests, activation tooling, live
              operations, the protocol client and the workspace build were reviewed separately before one consolidated
              verdict was produced.
            </li>
            <li>
              <strong>A contract test suite.</strong> The behaviour a test asserts is the behaviour someone thought to
              assert. A passing suite shows the cases that were considered, not the cases that were missed.
            </li>
            <li>
              <strong>A pinned runtime code hash.</strong> The deployed runtime code hash of every contract was recorded
              in the manifest at deploy time, so any later substitution of the code at an address is caught. This is not
              a byte-for-byte rebuild from source and proves nothing about whether the code is correct or safe.
            </li>
          </ul>
          <p>
            The sign-off applies to this exact X Layer Testnet scope. It does not authorize mainnet or real-value use
            and it is not presented as a third-party professional audit.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th>Contract</th>
                <th>Status</th>
                <th>Verification</th>
                <th>What was checked</th>
              </tr>
            </thead>
            <tbody>
              {CONTRACTS.map((c) => (
                <tr key={c.key}>
                  <td className="pub-td-key">{c.name}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>{c.verification}</td>
                  <td className="pub-small">{c.verificationNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <Prose>
          <p>
            Addresses, compiler settings and the full verification state for every deployed contract are on the{' '}
            <Link href="/contracts" className="pub-link">
              contracts page
            </Link>
            , and the steps to reproduce them yourself are on the{' '}
            <Link href="/verify" className="pub-link">
              verify page
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="keys" title="Key concentration">
        <Prose>
          <p>
            The keeper roles are held by keys distinct from the owner, and oracle prices need a threshold of{' '}
            {KEY_CONCENTRATION.oracleSignerThreshold} of {KEY_CONCENTRATION.oracleSignerCount} signing keys rather than a
            single signer. What is not distributed is ownership: the owner is a single externally owned key with no
            multisig and no timelock. This is a real centralisation fact, and it is published here rather than hidden.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Distinct role addresses', value: `${KEY_CONCENTRATION.distinctAddresses}` },
            { key: 'Keepers separated from owner', value: KEY_CONCENTRATION.keepersSeparated ? 'Yes' : 'No' },
            {
              key: 'Oracle signing',
              value: `Threshold ${KEY_CONCENTRATION.oracleSignerThreshold} of ${KEY_CONCENTRATION.oracleSignerCount} keys`,
            },
            { key: 'Multisig', value: KEY_CONCENTRATION.multisig ? 'Yes' : 'No' },
            { key: 'Timelock', value: KEY_CONCENTRATION.timelock ? 'Yes' : 'No' },
          ]}
        />
        <div className="flex flex-col gap-4">
          {ROLES.map((role) => (
            <div key={role.label} className="pub-card flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="pub-h4">{role.label}</span>
                <AddressDisplay value={role.address} />
              </div>
              <ul className="pub-body !text-[0.9375rem] list-disc pl-5 [&>li]:mt-1">
                {role.powers.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Callout tone="limit" title="What a compromise of the owner key would allow">
          <p>
            An attacker who controlled the owner key could change global risk caps and per-market parameters, list or
            suspend or delist markets, put a market into close only or halted, and transfer ownership. The keeper roles
            are separate keys now, but a compromised owner can reassign them. The funding rate is bounded by the on-chain
            clamp at {FUNDING.clampPercentPerHour}% per hour, so it cannot be used to drain a book outright, but
            everything else in that list is a live power of the single owner key.
          </p>
          <p>
            The oracle signer set is separate. Because the anchor requires a threshold of{' '}
            {KEY_CONCENTRATION.oracleSignerThreshold} of {KEY_CONCENTRATION.oracleSignerCount} keys, one compromised
            signing key cannot move the accepted price on its own; a threshold of them, colluding, could sign a report
            the anchor accepts, still only within the age and confidence rules the clearing house enforces.
          </p>
        </Callout>
      </Section>

      <Section id="operations" title="The operational surface">
        <Prose>
          <p>
            Several off-chain processes have to keep running for the protocol to behave. Each one has a failure mode,
            and in each case the intended failure is to refuse rather than to guess. That is safer, and it can still
            leave you unable to act when you want to.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>What it does</th>
                <th>What happens if it fails</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pub-td-key">Poster key</td>
                <td>Writes signed reference reports to the anchor, roughly every {ORACLE_POLICY.posterIntervalSec} seconds.</td>
                <td>
                  Anchored prices age past {ORACLE_POLICY.maxPriceAgeSec} seconds and the clearing house reverts new
                  exposure with a stale price. There is no redundant poster.
                </td>
              </tr>
              <tr>
                <td className="pub-td-key">Keeper keys</td>
                <td>Apply risk-driven market state changes and post the clamped funding rate.</td>
                <td>
                  Funding stops advancing and risk-driven state changes are not applied until the keys run again. These
                  are keys distinct from the owner, but the owner can reassign them.
                </td>
              </tr>
              <tr>
                <td className="pub-td-key">RPC endpoint</td>
                <td>The public node the app and the posters read and write through.</td>
                <td>
                  Reads can land on nodes at different heights, so a value can appear to move backwards. If the endpoint
                  is down, the app cannot read state and transactions cannot be sent.
                </td>
              </tr>
              <tr>
                <td className="pub-td-key">Upstream data source</td>
                <td>{REFERENCE_ENGINE.upstream}, polled every {REFERENCE_ENGINE.pollIntervalSec} seconds for each market.</td>
                <td>
                  With no fresh feed the reference engine holds the last snapshot and degrades its state through aging to
                  stale, at which point the protocol blocks new exposure.
                </td>
              </tr>
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="protections" title="Protections that exist in code">
        <Prose>
          <p>
            These are bounded, on-chain checks. They limit specific failures. They are not a guarantee of safety, and
            each one only covers the case it was written for.
          </p>
        </Prose>
        <KeyValue
          items={[
            {
              key: 'Funding clamp',
              value: `The posted funding rate is clamped on chain at ${FUNDING.clampPercentPerHour}% per hour in either direction, so the funding keeper cannot post an arbitrary rate.`,
            },
            {
              key: 'Price age check',
              value: `The clearing house rejects an anchored price older than ${ORACLE_POLICY.maxPriceAgeSec} seconds, and rejects one timestamped more than ${ORACLE_POLICY.futureToleranceSec} seconds in the future.`,
            },
            {
              key: 'Confidence check',
              value: 'A price whose confidence band is wider than the market allows is refused rather than filled.',
            },
            {
              key: 'Open interest caps',
              value: `Open interest is capped at ${bpsToPercent(GLOBALS.globalOiFactorBps, 0)} of vault net asset value globally, with smaller caps per market and per side.`,
            },
            {
              key: 'Isolated margin',
              value: 'Margin is isolated per position, so a loss on one position cannot consume the collateral of another.',
            },
          ]}
        />
      </Section>

      <Section id="limitations" title="Security posture and assurance boundaries">
        <Prose>
          <p>
            These deployment-scope and assurance boundaries are published as part of the security posture, alongside
            the controls, runtime hashes and independent review evidence above.
          </p>
        </Prose>
        <div className="flex flex-col gap-4">
          {SECURITY_LIMITATIONS.map((l) => (
            <div key={l.id} className="pub-card flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="pub-h4">{l.title}</span>
                <span className="pub-eyebrow">{l.area}</span>
              </div>
              <p className="pub-body !text-[0.9375rem]">{l.detail}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="disclosure" title="Responsible disclosure">
        <Prose>
          <p>
            Send a vulnerability report to <ExternalLink href={PRIMARY_CONTACT.href}>{PRIMARY_CONTACT.display}</ExternalLink> on{' '}
            {PRIMARY_CONTACT.network}. This is the current disclosure channel for the testnet program.
            {!HAS_EMAIL_CHANNEL && ' A dedicated security email is not currently published.'}{' '}
            Because {PRIMARY_CONTACT.network} is a public platform, keep the initial report high-level, never include
            secrets or key material, and request a private handoff before sharing exploitable reproduction detail.
          </p>
          <p>
            The current testnet program does not publish a bug bounty or response-time SLA. Assurance status, review
            scope and the control inventory are maintained on this page; material remediation updates are published
            after verification.
          </p>
        </Prose>
      </Section>

      <Section id="not-established" title="Assurance scope">
        <Prose>
          <p>
            This page documents the current assurance model and the exact boundary of its controls. It is not a
            certification or a guarantee; the current scope is:
          </p>
          <ul>
            <li>{CANONICAL.noAudit}</li>
            <li>
              The owner is a single key with no multisig and no timelock, so a compromise of that key is a compromise of
              the protocol's risk controls, including the power to reassign the keeper roles.
            </li>
            <li>
              The protections listed above are bounded checks. They limit named failures and do not cover the failures
              nobody wrote a check for.
            </li>
            <li>
              Off-chain processes can stop. When they do, the intended behaviour is to refuse, which can leave you unable
              to open, close or act on a position.
            </li>
            <li>{CANONICAL.testnet}</li>
          </ul>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
