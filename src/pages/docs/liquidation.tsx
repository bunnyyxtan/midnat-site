import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, H3, Prose, Section, StatusBadge, TableScroll } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { CANONICAL, LIMITATIONS, ORACLE_POLICY, TIERS, bpsToPercent } from '@/lib/protocol-registry';

const DOC = docBySlug('liquidation')!;

const LIQUIDATION_EVIDENCE = LIMITATIONS.find((l) => l.id === 'no-live-liquidation')!;
const NO_INCENTIVE = LIMITATIONS.find((l) => l.id === 'no-liquidation-incentive')!;

export default function Liquidation() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="A position fails when its equity reaches or falls below the maintenance margin. Anyone may close it, the tier's liquidation fee is taken out of what is left, the vault receives the fee and the loss, and any remaining equity returns to the trader."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="test" title="The maintenance margin test">
        <Prose>
          <p>
            Every position has an equity: the margin assigned to it, plus its unrealised profit and loss at the current
            price, minus accrued funding. Each tier sets a maintenance margin requirement, a floor expressed as a
            fraction of the position's notional. While equity sits above that floor the position stands. When equity
            reaches or falls below it, the position is liquidatable.
          </p>
          <p>
            Maintenance margin is checked against the same anchored price that prices a fill. If the anchor is not
            usable the check cannot run, which is one of the refusal states covered below.
          </p>
        </Prose>
      </Section>

      <Section id="who" title="Who may call it, and what they receive">
        <Prose>
          <p>
            Liquidation is a public function. Anyone can call it against any position that is at or below its maintenance
            margin: there is no privileged liquidator and no keeper allow-list. On this deployment the caller is paid
            nothing for making the call. The tier's liquidation fee is deducted from the position's remaining equity and
            settled to the vault along with the loss, and whatever equity survives that deduction is credited back to the
            trader. The caller pays the gas and receives no bounty, so the only party with an economic reason to
            liquidate today is the vault side of the protocol.
          </p>
          <p>
            That is the clearing house, which re-checks the halt state, requires a fresh anchored mark and reverts
            unless equity is at or below maintenance. MIDNAT runs a keeper against that same public function, so that
            an underwater position is not left to sit: it simulates the call and sends it only when the contract would
            accept it. The keeper holds no role, no allow-list entry and no privilege of any kind, and it is paid
            nothing for the call. If it stops, every other caller can do exactly what it did.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">Markets</th>
                <th scope="col">Maintenance margin</th>
                <th scope="col">Liquidation fee</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => (
                <tr key={t.tier}>
                  <td className="pub-td-key">{t.label}</td>
                  <td>{t.symbols.join(', ')}</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.maintenanceMarginBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.liqFeeBps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <Prose>
          <p>
            The fee is a fraction of the position's notional, so what the vault recovers scales with the size of the
            position being closed. Read it as the vault's compensation for carrying the position to that point, not as
            a bounty: the caller is paid nothing on this deployment, and pays the gas besides. That is why the party
            with a reason to act quickly is the vault side of the protocol, which is the one that eats the loss if
            equity goes negative first.
          </p>
        </Prose>
      </Section>

      <Section id="estimate" title="Estimating the liquidation point">
        <Prose>
          <p>
            You can reason about where a position becomes liquidatable without the protocol promising a specific price.
            A position is liquidatable when its equity, margin plus unrealised profit and loss minus accrued funding,
            reaches the maintenance margin floor for its tier. Higher leverage means a smaller margin against the same
            notional, so the price move needed to reach the floor is smaller. Accrued funding on the paying side eats
            into equity over time and moves the point closer without any price move at all.
          </p>
        </Prose>
        <H3 id="not-a-guarantee">This is an estimate, not a guaranteed price</H3>
        <Prose>
          <p>
            The estimate assumes a continuous price and an immediate call. Neither is guaranteed. The anchored price can
            gap between updates, so the market can be well past your estimate before any on-chain price reflects it. The
            anchor can be stale or its confidence band too wide, in which case the check cannot run and the position
            waits. And the call itself depends on someone choosing to send it. If the anchored price is older than{' '}
            {ORACLE_POLICY.maxPriceAgeSec} seconds or too uncertain, the liquidation reverts along with every other
            call that reads the anchor.
          </p>
          <p>
            The combined effect is that a position can move past the point where you expected it to close, and stay
            open, before anyone liquidates it. Do not treat the liquidation point as a stop that is guaranteed to
            execute at a level.
          </p>
        </Prose>
      </Section>

      <Section id="evidence" title="Liquidation evidence and execution model">
        <div className="flex flex-wrap items-center gap-3">
          <span className="pub-h4">{LIQUIDATION_EVIDENCE.title}</span>
          <StatusBadge status="LIVE_ON_TESTNET" />
        </div>
        <Prose>
          <p>{LIQUIDATION_EVIDENCE.detail}</p>
          <p>
            <strong>{NO_INCENTIVE.title}.</strong> {NO_INCENTIVE.detail}
          </p>
          <ul>
            <li>
              The canonical suite proves the exact long and short boundary, funding-driven liquidation, underwater
              shortfall absorption, liquidator reward accounting, healthy-position refusal and stale-oracle refusal.
            </li>
            <li>
              The call is unpaid at every size. The fee settles to the vault, not to the caller, so the only party
              currently motivated to send the transaction is MIDNAT's own keeper.
            </li>
            <li>
              Gaps, stale prices and refusal states mean a position can move past its estimated liquidation point before
              anyone can or does call the function.
            </li>
            <li>
              If a position's equity goes negative before it is closed, the shortfall is a loss the vault carries. See{' '}
              <Link href={docHref('deferred-payouts')} className="pub-link">
                deferred payouts
              </Link>{' '}
              for how the vault handles a payout it cannot fund.
            </li>
          </ul>
          <p>{CANONICAL.notAdvice}</p>
        </Prose>
        <Callout tone="caution" title="Liquidation is a public function, not a promise to close you at a level">
          The protocol makes liquidation callable by anyone, and pays the caller nothing: the fee settles to the vault.
          It does not promise that a call arrives in time, or that the price it runs at matches your estimate. Size and
          leverage so that a delayed liquidation does not surprise you.
        </Callout>
      </Section>
    </DocsLayout>
  );
}
