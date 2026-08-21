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
  TableScroll,
} from '@/components/public/primitives';
import {
  ACTIVATION,
  CANONICAL,
  DEPLOYMENT,
  LAUNCH,
  LIMITATIONS,
  MARKETS,
  NETWORK,
  SOURCES,
  WIRING_TX,
  blockNumber,
  utcDateTime,
} from '@/lib/protocol-registry';

const rpcLimit = LIMITATIONS.find((l) => l.id === 'rpc-consistency')!;

function gasNumber(value: string): string {
  return Number(value).toLocaleString('en-US');
}

export default function Deployments() {
  return (
    <DocumentLayout
      meta={{
        title: 'Deployments',
        description:
          'The chain history of the MIDNAT deployment on X Layer Testnet: the deployment window, every recorded receipt, the market listings and the owner operations.',
        path: '/deployments',
      }}
      eyebrow="Trust"
      title="Deployments"
      standfirst="Every transaction that built this deployment and every owner operation since, read back from the chain and rendered so each hash links to the explorer."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Deployments' }]}
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
            { label: 'Contracts', href: '/contracts', summary: 'Addresses, roles, custody and verification state.' },
            { label: 'Verify', href: '/verify', summary: 'Reproduce these facts yourself against the live chain.' },
            { label: 'Changelog', href: '/changelog', summary: 'Recorded protocol changes, newest first.' },
          ]}
        />
      }
    >
      <Section id="window" title="The deployment window">
        <Prose>
          <p>
            The deployment ran in a single window and the system was wired end to end. The values below were read back
            from the chain after the fact, not copied from the script that wrote them.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Started', value: utcDateTime(DEPLOYMENT.startedAt) },
            { key: 'Completed', value: utcDateTime(DEPLOYMENT.completedAt) },
            { key: 'Deployer', value: <AddressDisplay value={DEPLOYMENT.deployer} /> },
            { key: 'Total gas used', value: `${gasNumber(DEPLOYMENT.totalGasUsed)} (${NETWORK.gasCurrency})` },
            { key: 'System wired', value: DEPLOYMENT.wired ? 'Yes' : 'No' },
          ]}
        />
        {WIRING_TX ? (
          <>
            <Prose>
              <p>
                The vault and the clearing house were bound to each other by a single wiring call. That binding is
                one-shot and the two contracts cannot be repointed after it.
              </p>
            </Prose>
            <div className="mt-1">
              <AddressDisplay value={WIRING_TX.txHash} kind="tx" label={`${WIRING_TX.step}, block ${blockNumber(WIRING_TX.block)}`} />
            </div>
          </>
        ) : null}
      </Section>

      <Section id="receipts" title="Recorded receipts">
        <Prose>
          <p>
            Each row is a transaction the deployment recorded, with its block and the gas it used. A recorded receipt is
            evidence that a transaction with that hash landed in that block. It is not, on its own, evidence of what the
            contract does.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Step</th>
                <th scope="col">Transaction</th>
                <th scope="col" className="pub-td-num">Block</th>
                <th scope="col" className="pub-td-num">Gas used</th>
              </tr>
            </thead>
            <tbody>
              {DEPLOYMENT.receipts.map((r) => (
                <tr key={r.txHash}>
                  <td className="pub-td-key">{r.step}</td>
                  <td>
                    <AddressDisplay value={r.txHash} kind="tx" />
                  </td>
                  <td className="pub-td-num">{blockNumber(r.block)}</td>
                  <td className="pub-td-num">{gasNumber(r.gasUsed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="activation" title="Activation">
        <Prose>
          <p>
            The deployment window above records the venue as it was born: launch disabled, its review gate created but no
            launch digest yet approved. That launch-time evidence is immutable and is not rewritten. The transactions
            below are a separate, later record of the venue being activated on chain: the review gate approved the launch
            digest, the launch authority enabled launch, and the venue transitioned into live operation. Since then,
            deposits and new positions are contract-enabled.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Launch enabled', value: LAUNCH.enabled ? 'Yes' : 'No' },
            { key: 'Launch authority', value: <AddressDisplay value={LAUNCH.authority} /> },
            { key: 'Reviewer', value: <AddressDisplay value={ACTIVATION.reviewer} /> },
            { key: 'Approved launch digest', value: <AddressDisplay value={ACTIVATION.reviewDigest} /> },
            { key: 'Ownership accepted', value: <AddressDisplay value={ACTIVATION.ownershipAcceptanceTx} kind="tx" /> },
            { key: 'Review approval', value: <AddressDisplay value={ACTIVATION.reviewApprovalTx} kind="tx" /> },
            { key: 'Enable launch', value: <AddressDisplay value={ACTIVATION.enableLaunchTx} kind="tx" /> },
            { key: 'First NORMAL transition', value: <AddressDisplay value={ACTIVATION.normalTransitionTx} kind="tx" /> },
          ]}
        />
        <Callout tone="note" title="The NORMAL transition is historical, not the current mode">
          <p>
            The transition transaction records the first move into NORMAL. It is a historical event, not a claim that the
            venue's mode is permanently NORMAL. The live operating mode, normal, close only or halted per market and
            venue-wide, is chain state read from the terminal and the contracts.
          </p>
        </Callout>
      </Section>

      <Section id="markets" title="Market listings">
        <Prose>
          <p>
            Five markets were listed, each by its own transaction. The address column here is the listing transaction,
            not a contract: markets are records inside the clearing house, not separate contracts.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Market</th>
                <th scope="col">Tier</th>
                <th scope="col">Listing transaction</th>
                <th scope="col" className="pub-td-num">Block</th>
              </tr>
            </thead>
            <tbody>
              {MARKETS.map((m) => (
                <tr key={m.symbol}>
                  <td className="pub-td-key">{m.symbol}</td>
                  <td>{m.tier.charAt(0) + m.tier.slice(1).toLowerCase()}</td>
                  <td>
                    <AddressDisplay value={m.txHash} kind="tx" />
                  </td>
                  <td className="pub-td-num">{blockNumber(m.block)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="operations" title="Owner operations">
        <Prose>
          <p>
            Changes made by a privileged role after deployment are recorded here in full, with the state before and
            after and the reason given at the time. This is the audit trail for anything that is not a fresh deployment.
          </p>
        </Prose>
        {DEPLOYMENT.operations.length === 0 ? (
          <Prose>
            <p>No owner operations have been recorded since deployment.</p>
          </Prose>
        ) : (
          <div className="flex flex-col gap-6">
            {DEPLOYMENT.operations.map((op) => (
              <div key={op.txHash} className="pub-card flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="pub-h4">{op.action}</span>
                  <span className="pub-mono !text-[0.6875rem] uppercase tracking-[0.12em] text-[color:var(--ln-ink-soft)]">
                    {utcDateTime(op.at)}
                  </span>
                </div>
                <KeyValue
                  items={[
                    { key: 'By', value: <AddressDisplay value={op.by} /> },
                    { key: 'Transaction', value: <AddressDisplay value={op.txHash} kind="tx" /> },
                    { key: 'Minimum collateral, before', value: `${Number(op.before.minCollateralE6) / 1_000_000}` },
                    { key: 'Minimum collateral, after', value: `${Number(op.after.minCollateralE6) / 1_000_000}` },
                    { key: 'Minimum size, before', value: `${Number(op.before.minSizeE6) / 1_000_000}` },
                    { key: 'Minimum size, after', value: `${Number(op.after.minSizeE6) / 1_000_000}` },
                  ]}
                />
                <Prose>
                  <p className="pub-small">{op.reason}</p>
                </Prose>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section id="limits" title="What you can and cannot conclude">
        <Callout tone="caution" title="A receipt proves a transaction, not a behaviour">
          <p>
            A recorded receipt proves a transaction with that hash was included at that block. It does not prove the
            contract at the other end behaves as this site describes it. For that, read the code and reproduce the build
            on the{' '}
            <Link href="/verify" className="pub-link">
              verify page
            </Link>
            .
          </p>
        </Callout>
        <Prose>
          <p>
            The reads behind this page came from a public RPC. {rpcLimit.detail} If you re-fetch these hashes and one
            read disagrees, retry against the head of the chain before assuming anything is wrong.
          </p>
          <p>
            The addresses and hashes here belong to the current deployment. {CANONICAL.testnet}
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
