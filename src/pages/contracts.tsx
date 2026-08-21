import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import {
  AddressDisplay,
  Callout,
  KeyValue,
  PrintButton,
  Prose,
  RelatedLinks,
  Section,
  StatusBadge,
  TableScroll,
} from '@/components/public/primitives';
import {
  CANONICAL,
  COLLATERAL,
  CONTRACTS,
  KEY_CONCENTRATION,
  LIMITATIONS,
  NETWORK,
  ROLES,
  SOURCES,
  blockNumber,
} from '@/lib/protocol-registry';

const VERIFICATION_LABEL: Record<string, string> = {
  HASH_PINNED: 'Runtime code hash pinned',
  NOT_VERIFIED: 'Not verified',
};

const explorerLimit = LIMITATIONS.find((l) => l.id === 'explorer-verification')!;
const ownerKeyLimit = LIMITATIONS.find((l) => l.id === 'owner-not-timelocked')!;
const anchorLimit = LIMITATIONS.find((l) => l.id === 'anchor-provenance')!;
const activationLimit = LIMITATIONS.find((l) => l.id === 'activated-testnet')!;

export default function Contracts() {
  return (
    <DocumentLayout
      meta={{
        title: 'Contracts',
        description:
          'The deployed MIDNAT contracts on X Layer Testnet: addresses, roles, custody, compiler settings, verification state and key concentration.',
        path: '/contracts',
      }}
      eyebrow="Trust"
      title="Contracts"
      standfirst="The address book for this deployment. The deployed contracts, one collateral token, the privileged roles, and an honest account of what verification here does and does not mean."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Contracts' }]}
      headerMeta={[
        { label: 'Network', value: `${NETWORK.label}, chain ${NETWORK.chainId}` },
        { label: 'Source', value: SOURCES.manifest },
      ]}
      actions={<PrintButton />}
      width="doc"
      after={
        <RelatedLinks
          title="Related"
          links={[
            { label: 'Verify', href: '/verify', summary: 'Check these contracts yourself, and see what each proof does not prove.' },
            { label: 'Security', href: '/security', summary: 'Key concentration, the missing multisig and what has never been exercised.' },
            { label: 'Deployments', href: '/deployments', summary: 'Every deployment transaction and owner operation on this chain.' },
          ]}
        />
      }
    >
      <Section id="overview" title="What is deployed">
        <Callout tone="note" title="Activated on testnet">
          {activationLimit.detail}
        </Callout>
        <Prose>
          <p>
            MIDNAT is {CONTRACTS.length} contracts on {NETWORK.label}, chain {NETWORK.chainId}. The vault, the insurance
            fund, the review gate and the clearing house were deployed by this run; the clearing house created the review
            gate in its own constructor, and that gate has since approved the launch digest that lifted the launch gate.
            The oracle anchor was reused from an earlier run, so it is handled differently, as its own block below
            explains. Collateral is {COLLATERAL.name}, a token this project did not deploy.
          </p>
          <p>
            These addresses are the authority for the state they hold. What the app records for itself is a separate
            matter, described under{' '}
            <Link href="/docs/getting-started" className="pub-link">
              getting started
            </Link>{' '}
            and in the deployment-scope record the whitepaper publishes.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Network', value: `${NETWORK.label} (${NETWORK.shortLabel})` },
            { key: 'Chain ID', value: `${NETWORK.chainId} (${NETWORK.chainIdHex})` },
            { key: 'Gas currency', value: NETWORK.gasCurrency },
            { key: 'Explorer', value: NETWORK.explorerName },
            { key: 'Contracts', value: `${CONTRACTS.length}` },
            { key: 'Privileged roles', value: `${ROLES.length}` },
          ]}
        />
      </Section>

      {CONTRACTS.map((c) => (
        <Section key={c.key} id={c.key} title={c.name}>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={c.status} />
            <span className="pub-badge pub-badge-neutral">{VERIFICATION_LABEL[c.verification]}</span>
          </div>
          <Prose>
            <p>{c.role}</p>
          </Prose>
          <div className="mt-1">
            <AddressDisplay value={c.address} label="Address" />
          </div>
          <KeyValue
            items={[
              { key: 'Custody', value: c.custody },
              {
                key: 'Deployment block',
                value: c.deploymentBlock === null ? 'Not recorded' : blockNumber(c.deploymentBlock),
              },
              {
                key: 'Deployment transaction',
                value: c.txHash === null ? 'Not recorded' : <AddressDisplay value={c.txHash} kind="tx" />,
              },
              { key: 'Compiler', value: `solc ${c.solc}` },
              { key: 'Pipeline', value: c.pipeline },
              {
                key: 'Source',
                value: (
                  <a className="pub-link" href={c.sourceUrl} target="_blank" rel="noreferrer">
                    View {c.sourcePath}
                  </a>
                ),
              },
              ...(c.runtimeCodeHash
                ? [{ key: 'Runtime code hash', value: <AddressDisplay value={c.runtimeCodeHash} /> }]
                : []),
            ]}
          />
          <Callout tone="caution" title="Verification note">
            {c.verificationNote}
          </Callout>
        </Section>
      ))}

      <Section id="collateral" title="Collateral token">
        <Prose>
          <p>
            Every position, deposit and vault share on this deployment is denominated in {COLLATERAL.name}. It is held at
            a testnet address and, on this deployment, is not a token this project deployed. That does not make it money:{' '}
            {CANONICAL.testnet}
          </p>
        </Prose>
        <div className="mt-1">
          <AddressDisplay value={COLLATERAL.address} label="Address" />
        </div>
        <KeyValue
          items={[
            { key: 'Symbol', value: COLLATERAL.symbol },
            { key: 'Name', value: COLLATERAL.name },
            { key: 'Decimals', value: `${COLLATERAL.decimals}` },
            { key: 'Deployed by MIDNAT', value: COLLATERAL.isMock ? 'Yes, a mock token' : 'No' },
          ]}
        />
      </Section>

      <Section id="roles" title="Privileged roles">
        <Prose>
          <p>
            {ROLES.length} privileged roles can change the state of the protocol. Read the addresses before reading
            anything else on this site, because they decide what the numbers elsewhere are worth. The powers listed are
            the ones the contracts actually grant. Oracle prices are not a single-key role: the anchor accepts a report
            only when a threshold of {KEY_CONCENTRATION.oracleSignerThreshold} of{' '}
            {KEY_CONCENTRATION.oracleSignerCount} signing keys has signed it.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Role</th>
                <th scope="col">Address</th>
                <th scope="col">Powers</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.label}>
                  <td className="pub-td-key">{r.label}</td>
                  <td>
                    <AddressDisplay value={r.address} />
                  </td>
                  <td>
                    <ul className="m-0 pl-4 flex flex-col gap-1">
                      {r.powers.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="concentration" title="Key concentration">
        <Callout tone="caution" title="The owner is a single key">
          <p>{ownerKeyLimit.detail}</p>
        </Callout>
        <Prose>
          <p>
            The roles above resolve to {KEY_CONCENTRATION.distinctAddresses} distinct addresses.
            {KEY_CONCENTRATION.keepersSeparated
              ? ' The risk keeper and the funding keeper are held by keys distinct from the owner, and oracle prices need a threshold of signatures rather than one signer.'
              : ' The owner also holds the keeper roles, so one signer can change risk parameters, halt markets and post funding.'}
          </p>
          <p>
            There is {KEY_CONCENTRATION.multisig ? 'a multisig' : 'no multisig'} and{' '}
            {KEY_CONCENTRATION.timelock ? 'a timelock' : 'no timelock'} on this deployment. The owner is still a single
            externally owned key, so a compromise of it acts immediately, with no second signature and no delay. This
            testnet uses concentrated administrative roles, and the mainnet expansion program distributes governance and
            operations through institutional controls, including a timelocked or multisig owner.
          </p>
        </Prose>
      </Section>

      <Section id="verification" title="What verification means here">
        <Prose>
          <p>
            Every contract here carries the state "runtime code hash pinned". The deployed runtime code hash was recorded
            in the manifest at deploy time, so any later substitution of the code at an address is caught. This is not a
            byte-for-byte rebuild from source: it proves the code has not changed since deploy, not that it matches this
            source tree or that it is correct.
          </p>
          <p>
            A hash pin is not the same as verification on the block explorer. {explorerLimit.detail}
          </p>
          <p>
            The oracle anchor is handled a little differently. {anchorLimit.detail} Its runtime code hash is pinned like
            the rest, and its signer set, threshold and signing domain were checked against the deployment.
          </p>
        </Prose>
        <Prose>
          <p>
            You do not have to take any of this on faith.{' '}
            <Link href="/verify" className="pub-link">
              The verify page
            </Link>{' '}
            gives runnable steps to reproduce the build and read these contracts yourself, and{' '}
            <Link href="/security" className="pub-link">
              the security page
            </Link>{' '}
            sets out the wider posture.
          </p>
        </Prose>
      </Section>

      <Section id="limits" title="What this page does not establish">
        <Prose>
          <p>
            A pinned runtime code hash proves the deployed code has not changed since deploy. It does not prove the code
            matches this source tree, it does not prove the source is correct, and it is not a security audit.{' '}
            {CANONICAL.noAudit}
          </p>
          <p>
            The addresses here are the current deployment. {CANONICAL.testnet} If the contracts are redeployed, every
            address on this page changes and positions held against the old contracts do not carry over.
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
