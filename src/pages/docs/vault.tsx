import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { AddressDisplay, Callout, H3, KeyValue, Prose, Section, StatusBadge } from '@/components/public/primitives';
import { ActivatedTestnetNotice } from '@/components/public/ActivatedTestnetNotice';
import { docBySlug, docHref } from '@/lib/site-map';
import { CANONICAL, COLLATERAL, GLOBALS, LIMITATIONS, bpsToPercent, contractByKey } from '@/lib/protocol-registry';

const DOC = docBySlug('vault')!;
const VAULT = contractByKey('vault');
const DEFERRED = LIMITATIONS.find((l) => l.id === 'deferred-claims')!;

export default function Vault() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="An ERC-4626 vault holds LP deposits and takes the other side of every position the clearing house opens. Shares are priced from net asset value. LP returns come from fees and trader losses; LP losses come from trader profit."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="what" title="What the vault is">
        <ActivatedTestnetNotice />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="pub-h4">{VAULT.name}</span>
          <StatusBadge status={VAULT.status} />
        </div>
        <Prose>
          <p>{VAULT.role}</p>
          <p>
            It is an ERC-4626 vault. A liquidity provider deposits {COLLATERAL.symbol} and receives shares. The shares
            are a claim on a proportion of the vault, not a fixed balance. There is one collateral asset and one share
            class.
          </p>
          <p>
            The contract holds whatever has been deposited to it and is the authority for that balance. A figure such
            as total value locked or share price has to be read back from its settled state, and until MIDNAT indexes
            that state the vault surfaces report unavailable rather than an estimate.
          </p>
        </Prose>
        <div className="pub-card">
          <AddressDisplay value={VAULT.address} label="Vault contract" />
        </div>
      </Section>

      <Section id="shares" title="Deposits and share pricing">
        <Prose>
          <p>
            Share price is net asset value divided by shares outstanding. Net asset value is the vault's assets less
            what it owes, including open trader profit it would have to pay if every position closed now. When you
            deposit, you receive shares at the current price. When you withdraw, you redeem shares at the price at that
            moment. The price is not fixed and it is not a balance that only goes up.
          </p>
          <p>
            Because net asset value moves with the vault's open exposure, the value of a share moves before anyone
            deposits or withdraws. A share is worth more after the vault takes in fees and after traders lose, and worth
            less after traders win against it.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Standard', value: 'ERC-4626 tokenised vault' },
            { key: 'Collateral asset', value: `${COLLATERAL.name} (${COLLATERAL.symbol})` },
            { key: 'Share price', value: 'Net asset value per share outstanding' },
            { key: 'Open interest cap', value: `${bpsToPercent(GLOBALS.globalOiFactorBps, 0)} of net asset value` },
          ]}
        />
      </Section>

      <Section id="counterparty" title="LPs are the counterparty to the whole venue">
        <Prose>
          <p>
            There is no matching between traders. The vault is the counterparty to every position. That makes LPs the
            other side of the aggregate book: if traders are net long, the vault is net short the venue, and the LPs
            carry that directional exposure. LPs do not choose a side. They inherit whatever exposure the sum of open
            positions leaves.
          </p>
          <p>
            Two mechanisms bound how large that exposure can grow. Open interest across the venue is capped at{' '}
            {bpsToPercent(GLOBALS.globalOiFactorBps, 0)} of net asset value, the global OI factor, and each market and
            each side of each market carries its own smaller cap. As utilisation rises toward these limits, new exposure
            on the crowded side is refused rather than filled. The caps are the ceiling on how directional the vault can
            be forced to become.
          </p>
        </Prose>
        <H3 id="utilisation">Utilisation and capacity</H3>
        <Prose>
          <p>
            Utilisation is the share of the vault's capacity that open interest currently consumes. It matters to an LP
            in two directions: higher utilisation means more fees and funding flowing to the vault, and it also means
            more directional risk and less room for the vault to pay a large winning position without deferring it.
            Capacity is finite by design, so a busy venue is both the source of LP return and the source of LP risk.
          </p>
        </Prose>
      </Section>

      <Section id="returns" title="Where returns and losses come from">
        <Prose>
          <p>
            LP return has exactly two sources: the fees the venue charges, open, close and liquidation fees plus the
            vault's share of funding, and the losses traders realise against the vault. There is no external yield, no
            lending and no staking reward feeding the vault. When traders lose, their collateral flows to the vault and
            net asset value rises. When traders win, the vault pays them and net asset value falls.
          </p>
          <p>
            This is the whole model. The vault earns when the venue is active and when its trader base loses on net over
            time, and it loses when its trader base wins on net. Nothing about the structure guarantees which of those
            happens.
          </p>
        </Prose>
      </Section>

      <Section id="risk" title="What an LP is exposed to">
        <div className="flex flex-wrap items-center gap-3">
          <span className="pub-h4">{DEFERRED.title}</span>
        </div>
        <Prose>
          <p>{DEFERRED.detail}</p>
          <ul>
            <li>
              LPs are the counterparty to the venue. If traders win on net, the vault pays them and net asset value
              falls. A deposit can be worth less than it was, in {COLLATERAL.symbol} terms, when you withdraw.
            </li>
            <li>
              There is no promised yield and no APR. Return depends entirely on venue activity and on trader outcomes,
              neither of which is guaranteed and neither of which is shown here as a rate.
            </li>
            <li>
              An insurance fund is deployed as a bounded reserve that can be drawn on before a shortfall reaches LP
              equity. It is a buffer, not a guarantee: it can be empty, and it does not promise to make the vault whole.
            </li>
            <li>
              A payout that neither the vault nor the reserve can fund becomes a claim that ranks ahead of LP equity and
              is paid from later vault cash. It is unsecured and it can remain unpaid. See{' '}
              <Link href={docHref('deferred-payouts')} className="pub-link">
                deferred payouts
              </Link>{' '}
              for exactly how that claim behaves and where it sits relative to your shares.
            </li>
          </ul>
          <p>{CANONICAL.testnet}</p>
          <p>{CANONICAL.notAdvice}</p>
        </Prose>
        <Callout tone="caution" title="No yield is promised and none is printed">
          MIDNAT does not display an APR for the vault and does not imply insurance. Providing liquidity is taking the
          other side of a leveraged venue with capped but real directional exposure, funded only by fees and trader
          losses.
        </Callout>
      </Section>
    </DocsLayout>
  );
}
