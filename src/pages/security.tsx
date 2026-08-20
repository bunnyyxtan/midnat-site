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
  bpsToPercent,
} from '@/lib/protocol-registry';

/** The limitations that bear on security, in the order this page discusses them. */
const SECURITY_LIMITATION_IDS = [
  'single-key',
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
      <Callout tone="caution" title="Review status">
        {CANONICAL.noAudit}
      </Callout>

      <Section id="audit" title="Independent review">
        <Prose>
          <p>{CANONICAL.noAudit}</p>
          <p>What was actually done, stated so it cannot be mistaken for an audit:</p>
          <ul>
            <li>
              <strong>Internal review.</strong> The contracts were read and reasoned about by the people who wrote
              them. That is the weakest form of review there is, because the reviewer and the author share the same
              blind spots.
            </li>
            <li>
              <strong>A contract test suite.</strong> The behaviour a test asserts is the behaviour someone thought to
              assert. A passing suite shows the cases that were considered, not the cases that were missed.
            </li>
            <li>
              <strong>A local rebuild against runtime bytecode.</strong> Two of the three contracts were rebuilt from
              the project source and matched byte for byte against the deployed code. This proves the deployed code is
              that source, compiled as claimed. It proves nothing about whether that code is correct or safe.
            </li>
          </ul>
          <p>
            None of the above is an external audit. Internal review and any AI-assisted review are not an audit. A test
            suite is not an audit. Bytecode reproduction confirms identity, not safety. Treat this deployment as
            unaudited software.
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
            Addresses, compiler settings and the full verification state for all three contracts are on the{' '}
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
            Ownership and the keeper roles are not distributed. On this deployment the same address holds owner, risk
            keeper and funding keeper. A second address is the oracle signer. There is no multisig and no timelock. This
            is a real centralisation fact, and it is published here rather than hidden.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Distinct role addresses', value: `${KEY_CONCENTRATION.distinctAddresses}` },
            { key: 'Owner also risk and funding keeper', value: KEY_CONCENTRATION.ownerAlsoKeeper ? 'Yes' : 'No' },
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
            Because one key holds owner, risk keeper and funding keeper, an attacker who controlled that key could
            change global risk caps and per-market parameters, list or suspend or delist markets, put a market into
            close only or halted, transfer ownership, and post the funding rate. The funding rate is bounded by the
            on-chain clamp at {FUNDING.clampPercentPerHour}% per hour, so it cannot be used to drain a book outright, but
            everything else in that list is a live power of the single key.
          </p>
          <p>
            A compromise of the oracle signer key is separate. It would let the holder sign reference reports that the
            anchor accepts as canonical prices. A signature authenticates the signer, not the market, so a compromised
            signer could move the accepted price within the age and confidence rules the clearing house enforces.
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
                <td className="pub-td-key">Keeper key</td>
                <td>Applies risk-driven market state changes and posts the clamped funding rate.</td>
                <td>
                  Funding stops advancing and risk-driven state changes are not applied until the key runs again. It is
                  the same address as the owner, so its loss is the owner loss above.
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

      <Section id="limitations" title="Security-relevant limitations">
        <Prose>
          <p>
            The published limitations that bear directly on security. Read them as part of the security posture, not as
            footnotes to it.
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
            {PRIMARY_CONTACT.network}. That account is the only channel this project publishes: there is{' '}
            {!HAS_EMAIL_CHANNEL && 'no security email, '}no ticket queue and no coordinated disclosure process behind
            it, and no commitment to a response time. {PRIMARY_CONTACT.network} is a public platform, so send only what you are willing to have read there,
            and keep the detail that would let someone else exploit the issue for a direct message.
          </p>
          <p>
            There is no bug bounty. {CANONICAL.noAudit} No penetration test has been performed, and this project
            publishes no incident history and no response-time commitment because it has not measured one. If a
            control is not described on this page, assume it does not exist.
          </p>
        </Prose>
      </Section>

      <Section id="not-established" title="What this page does not establish">
        <Prose>
          <p>
            A security page describes intent and mechanism. It does not make the software safe. Reading it leaves you
            exposed in ways it cannot remove:
          </p>
          <ul>
            <li>{CANONICAL.noAudit}</li>
            <li>
              A single key holds owner and both keeper roles, with no multisig and no timelock, so a compromise of that
              key is a compromise of the protocol's risk controls.
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
