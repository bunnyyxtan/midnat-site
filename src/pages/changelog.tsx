import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { AddressDisplay, KeyValue, Prose, Section, TableScroll } from '@/components/public/primitives';
import {
  DEPLOYMENT,
  MARKETS,
  WIRING_TX,
  bpsToPercent,
  utcDate,
  utcDateTime,
} from '@/lib/protocol-registry';

/**
 * The on-chain record of a single testnet deployment, built from the
 * deployment manifest: the deployment run itself, the wiring call, the market
 * listings and any owner operation recorded since. It invents no product
 * releases, no version numbers and no dates that are not in the project source.
 */

const E6 = 1_000_000;
const collateralE6 = (v: string): string => `${(Number(v) / E6).toFixed(6)}`;

/** Human label for a deployment receipt step. */
function stepLabel(step: string): string {
  if (step === 'wireClearingHouse') return 'Wire clearing house to vault';
  if (step === 'setGlobalRiskParams') return 'Set global risk parameters';
  if (step.startsWith('deploy ')) return `Deploy ${step.slice('deploy '.length)}`;
  if (step.startsWith('listMarket ')) return `List market ${step.slice('listMarket '.length)}`;
  return step;
}

/** The deployment run is one dated event: receipts carry no per-item time. */
const deploymentDate = utcDate(DEPLOYMENT.completedAt);

/** Owner operations recorded after the run, newest first. */
const operations = [...DEPLOYMENT.operations].sort(
  (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
);

export default function Changelog() {
  return (
    <DocumentLayout
      meta={{
        title: 'Changelog',
        description:
          'The on-chain record of the MIDNAT testnet deployment: the deployment run, the wiring call, the market listings and any owner operation recorded since. Built from the deployment manifest.',
        path: '/changelog',
      }}
      eyebrow="Trust"
      title="Changelog"
      standfirst="The on-chain record of a single testnet deployment, newest first. This is not a product release log. Every entry is a transaction recorded in the deployment manifest, and every hash links to the block explorer."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Changelog' }]}
      width="doc"
    >
      <Section id="scope" title="What this record is">
        <Prose>
          <p>
            This page is built from the deployment manifest, not from a list of announcements. It records the
            transactions that created and configured this deployment, plus any owner operation recorded against it
            since. There are no feature releases and no version numbers here, because this is the history of a testnet
            deployment rather than a shipped product.
          </p>
          <p>
            The run started {utcDateTime(DEPLOYMENT.startedAt)} and completed {utcDateTime(DEPLOYMENT.completedAt)}. The
            deployer address and per-transaction gas are on the{' '}
            <Link href="/deployments" className="pub-link">
              deployments page
            </Link>
            .
          </p>
        </Prose>
      </Section>

      {operations.length > 0
        ? operations.map((op) => (
            <Section
              key={op.txHash}
              id={`op-${op.txHash.slice(2, 10)}`}
              title={`${utcDate(op.at)}: ${op.action}`}
            >
              <Prose>
                <p>
                  Owner operation applied at {utcDateTime(op.at)}, sent by an owner-held key. The recorded before and
                  after values for this operation:
                </p>
              </Prose>
              <TableScroll>
                <table className="pub-table">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th className="pub-td-num">Before</th>
                      <th className="pub-td-num">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="pub-td-key">Global OI factor</td>
                      <td className="pub-td-num">{bpsToPercent(op.before.globalOiFactorBps, 0)}</td>
                      <td className="pub-td-num">{bpsToPercent(op.after.globalOiFactorBps, 0)}</td>
                    </tr>
                    <tr>
                      <td className="pub-td-key">Minimum collateral</td>
                      <td className="pub-td-num">{collateralE6(op.before.minCollateralE6)}</td>
                      <td className="pub-td-num">{collateralE6(op.after.minCollateralE6)}</td>
                    </tr>
                    <tr>
                      <td className="pub-td-key">Minimum size</td>
                      <td className="pub-td-num">{collateralE6(op.before.minSizeE6)}</td>
                      <td className="pub-td-num">{collateralE6(op.after.minSizeE6)}</td>
                    </tr>
                  </tbody>
                </table>
              </TableScroll>
              <KeyValue
                items={[
                  { key: 'Sender', value: <AddressDisplay value={op.by} /> },
                  { key: 'Transaction', value: <AddressDisplay value={op.txHash} kind="tx" /> },
                ]}
              />
            </Section>
          ))
        : null}

      <Section id={`deploy-${deploymentDate}`} title={`${deploymentDate}: initial deployment`}>
        <Prose>
          <p>
            The contracts were deployed and configured in a single run. The wiring call bound the clearing house to the
            vault, and the five markets were listed in turn.
          </p>
        </Prose>

        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th>Step</th>
                <th className="pub-td-num">Block</th>
                <th>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {DEPLOYMENT.receipts.map((r) => (
                <tr key={r.txHash}>
                  <td className="pub-td-key">
                    {stepLabel(r.step)}
                    {r.step === 'wireClearingHouse' && WIRING_TX ? (
                      <span className="pub-small block">Clearing house wired to vault.</span>
                    ) : null}
                  </td>
                  <td className="pub-td-num">{r.block}</td>
                  <td>
                    <AddressDisplay value={r.txHash} kind="tx" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>

        <Prose>
          <p>The market listing transactions, for reference against the market specifications:</p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Tier</th>
                <th className="pub-td-num">Block</th>
                <th>Listing transaction</th>
              </tr>
            </thead>
            <tbody>
              {MARKETS.map((m) => (
                <tr key={m.symbol}>
                  <td className="pub-td-key">{m.symbol}</td>
                  <td>{m.tier.charAt(0) + m.tier.slice(1).toLowerCase()}</td>
                  <td className="pub-td-num">{m.block}</td>
                  <td>
                    <AddressDisplay value={m.txHash} kind="tx" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="not-covered" title="What this record does not cover">
        <Prose>
          <p>
            The on-chain record is narrow by design. It captures transactions, and nothing else. It leaves out:
          </p>
          <ul>
            <li>
              Interface changes. Updates to this site and to the trading app are not recorded on chain and do not appear
              here.
            </li>
            <li>
              Off-chain configuration. Poster cadence, reference engine settings and API changes leave no transaction to
              record.
            </li>
            <li>
              A version history. There is no protocol version string on chain, so this page does not print one.
            </li>
          </ul>
          <p>
            A redeployment would produce entirely new contract addresses and a new set of transactions. Nothing here
            carries over to a future deployment, and the history above describes this deployment alone.
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
