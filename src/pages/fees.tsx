import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import {
  Callout,
  Prose,
  RelatedLinks,
  Section,
  TableScroll,
} from '@/components/public/primitives';
import { docHref } from '@/lib/site-map';
import {
  CANONICAL,
  COLLATERAL,
  NETWORK,
  TIERS,
  bpsToPercent,
} from '@/lib/protocol-registry';

/* A single illustrative size, labelled as an illustration. It is arithmetic
   over a chosen number, not a claim about a real position or a market. */
const ILLUSTRATION_SIZE = 1000;

function feeAmount(size: number, bps: number): string {
  return `${((size * bps) / 10_000).toFixed(2)} ${COLLATERAL.symbol}`;
}

export default function Fees() {
  const standard = TIERS.find((t) => t.tier === 'STANDARD') ?? TIERS[0]!;

  return (
    <DocumentLayout
      meta={{
        title: 'Fees',
        description:
          'Every cost of a round trip on MIDNAT, the difference between a fee, a spread and gas, and the costs the protocol does not charge.',
        path: '/fees',
        type: 'article',
      }}
      eyebrow="Protocol"
      title="Fees and costs"
      standfirst="Every cost of a round trip, the costs MIDNAT does not charge, and the difference between a fee that the protocol takes, a spread that is priced into your fill and gas that the network takes."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Fees' }]}
      width="doc"
      after={
        <RelatedLinks
          title="Related"
          links={[
            { label: 'Market specifications', href: '/markets', summary: 'The full parameter set for every market.' },
            {
              label: 'Execution and pricing',
              href: docHref('execution-and-pricing'),
              summary: 'How the spread and impact term build a fill price.',
            },
            { label: 'The liquidity vault', href: docHref('vault'), summary: 'Where the fees go, and how NAV is priced.' },
          ]}
        />
      }
    >
      <Section id="kinds" title="Three kinds of cost">
        <Prose>
          <p>A round trip on MIDNAT carries three distinct costs. They are charged by different parties for different reasons.</p>
          <ul>
            <li>
              <strong>A fee</strong> is charged by the protocol on your notional size and settled to the vault. Open,
              close and liquidation each carry one.
            </li>
            <li>
              <strong>A spread</strong> is not a separate charge. It is priced into the fill: the reference price is
              adjusted against you before your position is written, by a fixed base spread and a size-dependent impact
              term. You never see a line item for it, you see a worse entry or exit price.
            </li>
            <li>
              <strong>Gas</strong> is charged by the network, not by the protocol. {CANONICAL.gas}
            </li>
          </ul>
        </Prose>
      </Section>

      <Section id="recipient" title="Who receives each fee">
        <Prose>
          <p>
            Every protocol fee goes to the vault, in full, at settlement. Fees are LP revenue, not protocol revenue:
            there is no treasury, no fee switch and no recipient address that can be changed or compromised. Fees raise
            vault net asset value rather than accruing to a separate account.
          </p>
          <p>
            The liquidation fee is the same. It is charged only out of a position's positive residual and paid to the
            vault, so a liquidation that would create bad debt charges no fee. Liquidation is a permissionless call, and
            on this deployment the caller is not paid a separate bounty out of the fee.
          </p>
        </Prose>
      </Section>

      <Section id="schedule" title="Fee schedule by tier">
        <Prose>
          <p>
            Fees are identical within a tier and differ across tiers. They are expressed in basis points of notional
            size, where 100 bps is one per cent. The base spread and impact cap are shown alongside, because they are
            the priced-in cost that sits next to the explicit fees.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">Markets</th>
                <th scope="col" className="pub-td-num">Open fee</th>
                <th scope="col" className="pub-td-num">Close fee</th>
                <th scope="col" className="pub-td-num">Liquidation fee</th>
                <th scope="col" className="pub-td-num">Base spread</th>
                <th scope="col" className="pub-td-num">Impact cap</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => (
                <tr key={t.tier}>
                  <td className="pub-td-key">{t.label}</td>
                  <td>{t.symbols.join(', ')}</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.openFeeBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.closeFeeBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.liqFeeBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.baseSpreadBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.impactMaxBps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="illustration" title="A worked round trip">
        <Callout tone="note" title="This is an illustration, not a quote">
          The numbers below are arithmetic over a chosen notional size on the Standard tier. They ignore price movement,
          funding and the priced-in spread, and they are not a prediction of what any real position would cost.
        </Callout>
        <Prose>
          <p>
            Take a {ILLUSTRATION_SIZE} {COLLATERAL.symbol} notional position on a Standard-tier market, opened and then
            closed with no price change. The explicit fees are:
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Leg</th>
                <th scope="col" className="pub-td-num">Rate</th>
                <th scope="col" className="pub-td-num">On {ILLUSTRATION_SIZE} {COLLATERAL.symbol}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pub-td-key">Open fee</td>
                <td className="pub-td-num">{bpsToPercent(standard.params.openFeeBps)}</td>
                <td className="pub-td-num">{feeAmount(ILLUSTRATION_SIZE, standard.params.openFeeBps)}</td>
              </tr>
              <tr>
                <td className="pub-td-key">Close fee</td>
                <td className="pub-td-num">{bpsToPercent(standard.params.closeFeeBps)}</td>
                <td className="pub-td-num">{feeAmount(ILLUSTRATION_SIZE, standard.params.closeFeeBps)}</td>
              </tr>
              <tr>
                <td className="pub-td-key">Round-trip fees</td>
                <td className="pub-td-num">
                  {bpsToPercent(standard.params.openFeeBps + standard.params.closeFeeBps)}
                </td>
                <td className="pub-td-num">
                  {feeAmount(ILLUSTRATION_SIZE, standard.params.openFeeBps + standard.params.closeFeeBps)}
                </td>
              </tr>
            </tbody>
          </table>
        </TableScroll>
        <Prose>
          <p>
            On top of that sits the base spread of {bpsToPercent(standard.params.baseSpreadBps)} against you on each
            fill, plus an impact term that grows with how much market capacity your order consumes, up to the impact cap
            of {bpsToPercent(standard.params.impactMaxBps)}. The{' '}
            <Link href={docHref('execution-and-pricing')} className="pub-link">
              execution and pricing
            </Link>{' '}
            page derives the fill price exactly. Gas is paid separately, in {NETWORK.gasCurrency}, by whoever sends the
            transaction.
          </p>
        </Prose>
      </Section>

      <Section id="not-charged" title="What MIDNAT does not charge">
        <Prose>
          <p>The following costs are confirmed absent in the deployed contracts. Each is stated because the code has no mechanism for it, not as a promise.</p>
          <ul>
            <li>
              <strong>No deposit fee.</strong> Depositing collateral to the clearing house credits the full amount
              received.
            </li>
            <li>
              <strong>No withdrawal fee.</strong> Withdrawing a free balance transfers the full amount.
            </li>
            <li>
              <strong>No vault management fee.</strong> The vault is a standard ERC-4626 vault with no fee on deposit,
              mint, withdraw or redeem.
            </li>
            <li>
              <strong>No performance fee.</strong> The vault takes no share of trader losses or of LP gains. Fees raise
              net asset value for every LP equally.
            </li>
            <li>
              <strong>No protocol gas fee.</strong> {CANONICAL.gas}
            </li>
          </ul>
        </Prose>
      </Section>

      <Section id="not-established" title="What this page does not establish">
        <Prose>
          <p>
            This page states the costs the contracts charge today. It does not promise they will stay where they are:
            the owner can change per-market parameters, and the fee schedule above is the setting under test on this
            deployment.
          </p>
          <ul>
            <li>{CANONICAL.testnet}</li>
            <li>
              A low fee is not a low cost. The spread and impact term can dominate a round trip on a large order or in a
              thin market, and gas can dominate a small one.
            </li>
          </ul>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
