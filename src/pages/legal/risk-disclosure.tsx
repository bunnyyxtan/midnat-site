import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { Callout, H3, PrintButton, Prose, Section } from '@/components/public/primitives';
import { legalBySlug, legalHref } from '@/lib/site-map';
import {
  CANONICAL,
  FUNDING,
  LEVERAGE_RANGE,
  LIMITATIONS,
  ORACLE_POLICY,
  utcDate,
} from '@/lib/protocol-registry';

const DOC = legalBySlug('risk-disclosure')!;

const limitation = (id: string) => LIMITATIONS.find((l) => l.id === id)!;

export default function RiskDisclosure() {
  return (
    <DocumentLayout
      meta={{ title: DOC.title, description: DOC.summary, path: legalHref(DOC.slug), type: 'article' }}
      eyebrow="Legal"
      title={DOC.title}
      standfirst="The ways you can lose everything you put in, stated without softening. Read this before you open a position."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Legal', href: '/legal' }, { label: DOC.title }]}
      headerMeta={[{ label: 'Updated', value: utcDate(DOC.updated) }]}
      actions={<PrintButton />}
      width="prose"
    >
      <Callout tone="caution" title="Total loss is a realistic outcome">
        A leveraged position can lose all of the collateral assigned to it. On this deployment those balances are
        testnet values, but the mechanics that cause the loss are real and they are the mechanics you would face with
        real money.
      </Callout>

      <Section id="leverage" title="Leverage and liquidation">
        <Prose>
          <p>
            Leverage ranges from {LEVERAGE_RANGE.min}x to {LEVERAGE_RANGE.max}x depending on the market. The higher the
            leverage, the smaller the move against you that wipes out your margin. A position is liquidatable the moment
            its equity falls below the maintenance margin requirement, and anyone may call the liquidation.
          </p>
          <p>
            Liquidation is not a floor that returns most of your collateral. After the liquidation fee and what is owed,
            the amount left for the trader can be little or nothing. You do not get to choose the moment, and there is
            no margin call warning that pauses the market for you.
          </p>
        </Prose>
      </Section>

      <Section id="gaps" title="Price gaps">
        <Prose>
          <p>
            Prices do not move in a continuous line. The reference price can jump between one update and the next, over
            a weekend, around an earnings release or on news. A gap can carry a position straight through the level you
            expected to be liquidated at, so the loss realised can be larger than a smooth path would have produced.
          </p>
        </Prose>
      </Section>

      <Section id="funding" title="Funding drag">
        <Prose>
          <p>
            Holding a position on the crowded side of a market means paying funding to the other side. The rate is
            clamped at {FUNDING.clampPercentPerHour}% per hour, but it accrues continuously and it does not stop because
            your position is under water. Funding can erode a position that the price alone would have left intact, and
            it counts against your equity in the maintenance margin test.
          </p>
        </Prose>
      </Section>

      <Section id="oracle" title="Oracle staleness and refusal states">
        <Prose>
          <p>
            The clearing house will only act on a price it can defend. If the anchored price is older than{' '}
            {ORACLE_POLICY.maxPriceAgeSec} seconds, or its confidence band is too wide, or the market is in a state that
            does not accept new exposure, the transaction reverts. This is intended behaviour, and it can still leave you
            unable to open, adjust or close a position exactly when you most want to.
          </p>
          <p>{limitation('single-poster').detail}</p>
        </Prose>
      </Section>

      <Section id="vault" title="Vault losses for liquidity providers">
        <Prose>
          <p>
            If you provide liquidity, the vault is the counterparty to every position the clearing house opens. When traders win,
            the vault pays them, and its net asset value falls. A skewed book means the vault carries directional
            exposure it did not choose, and your shares can be worth less than you deposited. There is no insurance fund
            and no guarantee of return.
          </p>
        </Prose>
      </Section>

      <Section id="deferred" title="Deferred payouts that may never pay">
        <Prose>
          <p>{limitation('deferred-claims').detail}</p>
          <p>
            A deferred payout is a claim on later vault cash, not money in hand. It ranks ahead of LP equity, but it is
            unsecured and uninsured, and if the vault never has the cash it can stay unpaid indefinitely. Do not treat a
            winning close as settled until the payout is actually received.
          </p>
        </Prose>
      </Section>

      <Section id="where-recorded" title="Where a position opened in the app is recorded">
        <Prose>
          <p>{CANONICAL.tradingPath}</p>
          <p>
            Judge your exposure as chain exposure. No MIDNAT-side ledger stands between you and the contract: what the
            clearing house records is what you hold, a call it refuses leaves you with nothing but the gas you spent,
            and a call it accepts cannot be recalled by anyone, including the operator of this interface. Every
            contract risk described below is therefore yours in full, and it reaches a position opened in the app
            exactly as it reaches one you send yourself.
          </p>
        </Prose>
      </Section>

      <Section id="contract" title="Smart contract risk">
        <Prose>
          <p>{CANONICAL.noAudit}</p>
          <p>
            A bug in a contract can cause loss that no parameter protects against. The code is public and has been
            reproduced from source, and that lets you check what is deployed, but it does not make the code correct. You
            are exposed to whatever the contracts actually do, not to what any page says they do.
          </p>
        </Prose>
      </Section>

      <Section id="keys" title="Key concentration">
        <Prose>
          <p>{limitation('single-key').detail}</p>
          <p>
            The address that holds these powers can change risk parameters, halt a market and post funding within the
            on-chain clamp. That authority is a risk to your position regardless of intent, and it is concentrated in one
            key. The full picture is on the{' '}
            <Link href="/security" className="pub-link">
              security page
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="untested" title="Mechanics that have never run on this deployment">
        <Prose>
          <H3 id="untested-liquidation">Liquidation has not been executed here</H3>
          <p>{limitation('no-live-liquidation').detail}</p>
          <p>{limitation('no-liquidation-incentive').detail}</p>
          <H3 id="untested-infra">The public RPC can lag</H3>
          <p>{limitation('rpc-consistency').detail}</p>
        </Prose>
      </Section>

      <Section id="scope" title="What the protocol does not do for you">
        <Prose>
          <p>{limitation('out-of-scope').detail}</p>
          <p>{CANONICAL.noOwnership}</p>
          <p>{CANONICAL.notAdvice}</p>
        </Prose>
      </Section>

      <Section id="testnet" title="This is a testnet deployment">
        <Prose>
          <p>{CANONICAL.testnet}</p>
          <p>
            Working correctly on a test network does not establish that any of this is safe with real money. The list
            above is not exhaustive: it is the set of exposures this project can name honestly. Where you are still
            unsure whether you can afford the outcome, the correct assumption is that you can lose everything you assign
            to a position.
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
