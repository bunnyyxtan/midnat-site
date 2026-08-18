import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, H3, KeyValue, Prose, Section } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { CANONICAL, LIMITATIONS } from '@/lib/protocol-registry';

const DOC = docBySlug('deferred-payouts')!;
const DEFERRED = LIMITATIONS.find((l) => l.id === 'deferred-claims')!;

export default function DeferredPayouts() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="When the vault cannot pay a closing position in full, the shortfall is recorded as a claim. That claim ranks ahead of LP equity and is paid from later vault cash. It is never a haircut, and it can remain unpaid."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="what-happens" title="What happens when the vault cannot pay in full">
        <Prose>
          <p>
            Closing a profitable position requires the vault to pay the profit. The vault holds finite cash. If, at the
            moment you close, the vault cannot pay the full amount, the part it can pay is paid immediately and the
            remainder is recorded as a deferred claim against the vault. The position still closes. The amount owed does
            not shrink and it is not written down. It becomes a debt the vault records and pays from later cash.
          </p>
          <p>
            This is a liquidity outcome, not a settlement discount. The number you are owed is the number that is
            recorded. What changes is when you receive it, not how much it is.
          </p>
          <p>
            The claim, its place in the queue and its later payment are recorded and enforced by the deployed
            contracts, and the queue can be advanced by anyone. This reaches every close without exception: closing in
            the app is a call to the clearing house, so it can create a claim exactly as a call you send yourself can,
            and the claim it creates is paid from the same queue in the same order.
          </p>
        </Prose>
      </Section>

      <Section id="illiquidity-vs-insolvency" title="Illiquidity is not insolvency">
        <Prose>
          <p>
            These are two different conditions and the distinction is the whole point of this page. Illiquidity is not
            having the cash on hand to pay right now. Insolvency is owing more than the vault is worth. A payout the
            vault cannot fund at the moment is the first, not the second: it becomes a senior deferred claim, never a
            haircut on what you are owed.
          </p>
          <p>
            Solvency is decided by net asset value, not by the cash line. Net asset value is the vault's assets less
            everything it owes, including recorded deferred claims. A vault can be short of cash and still solvent,
            because its net asset value is positive once its claims are counted against its assets. The cash line tells
            you whether a payout is deferred. Net asset value tells you whether the claims can ultimately be met.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Illiquidity', value: 'Not enough cash on hand to pay now; the shortfall is recorded and paid later' },
            { key: 'Insolvency', value: 'Owing more than the vault is worth; measured by net asset value, not by cash' },
            { key: 'A deferred payout is', value: 'A senior claim on later vault cash, at full recorded value' },
            { key: 'A deferred payout is not', value: 'A reduction, a write-down or a haircut on what you are owed' },
          ]}
        />
      </Section>

      <Section id="ordering" title="Where a deferred claim ranks">
        <Prose>
          <p>{DEFERRED.detail}</p>
          <p>
            A deferred claim ranks ahead of LP equity. Later vault cash pays recorded claims before it accrues to
            shareholders. An LP cannot withdraw value that is owed to a claimant ahead of them, because that value is
            already counted against net asset value. The claim sits between the vault's assets and its LPs: senior to
            equity, junior to nothing recorded before it.
          </p>
        </Prose>
        <H3 id="claimant">What a claimant can and cannot do</H3>
        <Prose>
          <p>
            A claimant holds a recorded right to be paid from later vault cash. They cannot force the vault to sell
            assets, cannot seize collateral, and cannot compel any counterparty to fund the claim. There is no
            acceleration, no interest and no collateral backing the claim. Payment happens as the vault takes in cash,
            in the order the deployed vault recorded the claims, and not before.
          </p>
        </Prose>
      </Section>

      <Section id="limits" title="What this does not guarantee">
        <Prose>
          <ul>
            <li>
              A claim can remain unpaid indefinitely. If the vault never takes in enough cash, the claim is never
              satisfied. There is no deadline by which it must be paid.
            </li>
            <li>
              The claim is unsecured. Nothing is pledged against it. It is a record that ranks ahead of LP equity, not a
              secured obligation.
            </li>
            <li>
              The claim is not insured. There is no insurance fund and no external backstop on this deployment. If the
              vault cannot generate the cash, no other party is obligated to.
            </li>
            <li>
              Seniority orders who is paid first from what the vault has. It does not create cash that is not there.
              Ranking ahead of LP equity is worth exactly as much as the vault's future cash flow, and no more.
            </li>
          </ul>
          <p>{CANONICAL.testnet}</p>
          <p>{CANONICAL.notAdvice}</p>
        </Prose>
        <Callout tone="caution" title="Ranking ahead of LP equity is not a guarantee of payment">
          A deferred payout preserves the full amount you are owed and places it ahead of the LPs. It does not promise
          that the amount arrives, or when. Read it as an unsecured, uninsured senior claim that is paid only as the
          vault generates cash. The{' '}
          <Link href={docHref('vault')} className="pub-link">
            liquidity vault
          </Link>{' '}
          page covers where the cash comes from, and the{' '}
          <Link href="/risk" className="pub-link">
            risk framework
          </Link>{' '}
          places this alongside the other ways a position can fail to pay out as expected.
        </Callout>
      </Section>
    </DocsLayout>
  );
}
