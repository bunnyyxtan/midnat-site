import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import {
  AddressDisplay,
  Callout,
  ExternalLink,
  H3,
  KeyValue,
  PrintButton,
  Prose,
  RelatedLinks,
  Section,
  StatusBadge,
  TableScroll,
} from '@/components/public/primitives';
import { docHref } from '@/lib/site-map';
import {
  CANONICAL,
  COLLATERAL,
  CONTRACTS,
  DEPLOYMENT,
  FUNDING,
  GLOBALS,
  KEY_CONCENTRATION,
  LEVERAGE_RANGE,
  LIMITATIONS,
  MARKETS,
  NETWORK,
  ORACLE_POLICY,
  REFERENCE_ENGINE,
  ROLES,
  TIERS,
  bpsToPercent,
  collateralAmount,
  contractByKey,
  utcDate,
} from '@/lib/protocol-registry';

const WHITEPAPER_VERSION = '1.0';

export default function Whitepaper() {
  const vault = contractByKey('vault');
  const clearingHouse = contractByKey('clearingHouse');
  const anchor = contractByKey('oracleAnchor');

  return (
    <DocumentLayout
      meta={{
        title: 'MIDNAT whitepaper',
        description:
          'The canonical design document for MIDNAT, a synthetic equity perpetuals protocol on X Layer Testnet: reference pricing, oracle anchoring, execution, margin, funding, the vault counterparty, deferred payouts, the trust model and the current deployment scope.',
        path: '/whitepaper',
        type: 'article',
      }}
      eyebrow="Design document"
      title="MIDNAT: synthetic equity perpetuals on X Layer Testnet"
      standfirst="A perpetual futures venue for equity underlyings that keeps a reference price while the exchange is closed, prices every trade against a signed on-chain number, and settles against a single vault. This document describes the mechanism, states its trust assumptions, and lists what it does not do."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Whitepaper' }]}
      headerMeta={[
        { label: 'Version', value: WHITEPAPER_VERSION },
        { label: 'Date', value: utcDate(DEPLOYMENT.completedAt) },
        { label: 'Network', value: `${NETWORK.label}, chain ${NETWORK.chainId}` },
      ]}
      status="LIVE_ON_TESTNET"
      actions={<PrintButton />}
      width="doc"
      after={
        <RelatedLinks
          title="Read next"
          links={[
            { label: 'Documentation', href: '/docs', summary: 'The mechanism at reference depth, one page per subject.' },
            { label: 'Contracts', href: '/contracts', summary: 'Addresses, compiler settings and verification state.' },
            { label: 'Risk framework', href: '/risk', summary: 'What is bounded, and what nothing bounds.' },
            { label: 'Verify', href: '/verify', summary: 'Check the claims here yourself, and what each proof omits.' },
          ]}
        />
      }
    >
      <Callout tone="caution" title="Status of this document">
        <p>
          This is a design document for a running testnet deployment, not a specification of a finished product and
          not a promise about a future one. There is no protocol version string on chain, so the version above names
          this document, not the contracts. {CANONICAL.testnet}
        </p>
      </Callout>

      {/* 1 -------------------------------------------------------------- */}
      <Section id="abstract" title="1. Abstract">
        <Prose>
          <p>
            MIDNAT is a synthetic perpetual futures protocol for equity underlyings, deployed on {NETWORK.label}. It
            lets a trader hold leveraged long or short exposure to a listed ticker at any hour, including the hours when
            the underlying exchange is closed, without ever holding the share. A position is a contract that tracks a
            reference price. {CANONICAL.noOwnership}
          </p>
          <p>
            The protocol is {CONTRACTS.length} contracts. A clearing house holds trader collateral and owns the position
            lifecycle, and created a launch review gate in its constructor. A vault holds liquidity-provider capital and
            is the counterparty to every position, with an insurance fund as a bounded reserve beside it. An oracle
            anchor holds the latest signed reference report for each market and is the only price the other contracts
            read. There is
            no order book, no matching engine and no market maker. A trade is a call to the clearing house, priced from
            the anchor, settled against the vault.
          </p>
          <p>
            The design problem this document addresses is narrow and specific: a share stops trading when its exchange
            closes, but the reasons to want exposure do not stop, and a perpetual that inherits the exchange's calendar
            is closed exactly when it is most needed. MIDNAT keeps a reference price alive continuously by selecting
            among several upstream feeds, signs that price, and refuses to trade when it cannot stand behind the number.
            The remainder of this document describes how, and states plainly where a user is still exposed.
          </p>
        </Prose>
      </Section>

      {/* 2 -------------------------------------------------------------- */}
      <Section id="problem" title="2. The problem">
        <Prose>
          <p>
            Equity markets close. A primary listing venue trades for a fixed session, then a shorter pre-market and
            post-market window, then nothing until the next session. Overnight, over a weekend, or across a holiday, the
            share does not print a price at all. The underlying company, however, does not pause: earnings leak, a
            regulator rules, a competitor fails, a currency moves. The information that should move the price keeps
            arriving while the market that would express it is shut.
          </p>
          <p>
            Synthetic exposure is the usual answer, and it comes in two unsatisfying shapes. The first inherits the
            exchange calendar: it tracks a session feed and stops updating when the session ends, so it is a
            weekday-daytime instrument wearing the language of a perpetual. The second updates continuously from a
            single price source and does not say so. It trusts one oracle, presents its output as the market price, and
            leaves the user to discover, usually at the worst moment, that the number came from one place and could be
            wrong or stale without any signal.
          </p>
          <p>
            MIDNAT takes the position that a 24/7 equity perpetual is worth building only if it is honest about where
            its price comes from at three in the morning. That requires two things a naive design omits: an explicit,
            ranked way to choose a price when the primary feed is dark, and an explicit, enforced rule for refusing to
            trade when no acceptable price exists. Both are described below, and both are the reason the protocol will
            sometimes decline to fill an order it could have filled on a worse number.
          </p>
        </Prose>
      </Section>

      {/* 3 -------------------------------------------------------------- */}
      <Section id="goals" title="3. Design goals and non-goals">
        <Prose>
          <p>
            The goals below are the ones the mechanism is built to serve. The non-goals are not oversights: each is a
            capability a reader might reasonably expect, deliberately left out of this deployment, and named so that its
            absence is not mistaken for a defect.
          </p>
        </Prose>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <H3 id="goals-goals" toc={false}>
              Goals
            </H3>
            <Prose>
              <ul>
                <li>A reference price that is defined at every hour, not only during the equity session.</li>
                <li>A price the contracts can trust without trusting an HTTP response, by requiring a signature.</li>
                <li>Refusal over misfilling: no trade on a price the protocol cannot stand behind.</li>
                <li>Bounded, on-chain-enforced risk parameters that a keeper key cannot exceed.</li>
                <li>A single, explicit counterparty, so a trader always knows who pays them.</li>
                <li>An honest failure mode when the vault cannot pay, distinct from writing the debt off.</li>
              </ul>
            </Prose>
          </div>
          <div>
            <H3 id="goals-nongoals" toc={false}>
              Non-goals
            </H3>
            <Prose>
              <ul>
                <li>An order book or a depth ladder. Pricing is a formula, not a book.</li>
                <li>Cross margin. Margin is isolated per position.</li>
                <li>Partial close. A position closes in full or not at all.</li>
                <li>A governance token or a fee switch. An insurance fund is deployed, but it is a bounded reserve, not governance.</li>
                <li>Custody of the underlying share, or any claim on the named company.</li>
                <li>On-chain verification of the upstream feed's authorship.</li>
              </ul>
            </Prose>
          </div>
        </div>
        <Callout tone="limit" title="Scope of the current deployment">
          The current deployment is a complete isolated-margin, full-close venue: the non-goals above are deliberate
          scope choices, not unfinished work. Where one bears on your money it is stated again in section 14 without
          softening, because it changes how a position can be managed today. Order-book depth, cross margin and partial
          close are candidates for the mainnet expansion program, not properties of this release.
        </Callout>
      </Section>

      {/* 4 -------------------------------------------------------------- */}
      <Section id="architecture" title="4. System architecture">
        <Prose>
          <p>
            The protocol is {CONTRACTS.length} contracts on {NETWORK.label}, one collateral asset, and a small set of
            actors. The contracts hold the whole of the on-chain state; the off-chain services produce inputs the
            contracts accept or reject, and never move funds themselves.
          </p>
          <p>{CANONICAL.architecture}</p>
          <p>
            Read in one line, the system runs from a user to the MIDNAT interface, from the interface to the
            deterministic services that price and prepare work, from those services to the contracts on {NETWORK.label}
            , and back out as state this site and the app read. Sections 5 to 11 describe each mechanism from the
            perspective of the deployed contracts. Where the shipped app stops short of them, section 14 says so.
          </p>
        </Prose>

        <TableScroll>
          <table className="pub-table">
            <caption>Deployed contracts</caption>
            <thead>
              <tr>
                <th scope="col">Contract</th>
                <th scope="col">Responsibility</th>
                <th scope="col">Custody</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {CONTRACTS.map((c) => (
                <tr key={c.key}>
                  <td className="pub-td-key">{c.name}</td>
                  <td>{c.role}</td>
                  <td>{c.custody}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>

        <div className="flex flex-col gap-2">
          {CONTRACTS.map((c) => (
            <AddressDisplay key={c.key} value={c.address} label={`${c.name}:`} />
          ))}
        </div>

        <H3 id="architecture-collateral">The collateral asset</H3>
        <Prose>
          <p>
            Trader margin and vault liquidity are both denominated in {COLLATERAL.name} ({COLLATERAL.symbol}), a token
            with {COLLATERAL.decimals} decimals at one canonical address on this chain. Their custody is separate:
            Wallet funds move into the Trading Account, where available balance can be reserved for positions and
            resting orders; liquidity-provider funds are accounted for by the LP Vault. It is not a mock token in this
            deployment. On a test network it is still a testnet value with no monetary worth: {CANONICAL.testnet}
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Collateral', value: `${COLLATERAL.name} (${COLLATERAL.symbol})` },
            { key: 'Decimals', value: `${COLLATERAL.decimals}` },
            { key: 'Address', value: <AddressDisplay value={COLLATERAL.address} /> },
            { key: 'Listed markets', value: `${MARKETS.length}` },
            { key: 'Minimum collateral', value: collateralAmount(GLOBALS.minCollateral, 2) },
            { key: 'Minimum position size', value: collateralAmount(GLOBALS.minSize, 2) },
            { key: 'Gas currency', value: NETWORK.gasCurrency },
          ]}
        />

        <H3 id="architecture-actors">The actors</H3>
        <Prose>
          <p>
            Several privileged roles exist. They are published, not hidden, because on this deployment ownership is
            concentrated in a single key: {KEY_CONCENTRATION.distinctAddresses} distinct addresses hold the roles, the
            keepers are separated from the owner and prices need a threshold of{' '}
            {KEY_CONCENTRATION.oracleSignerThreshold} of {KEY_CONCENTRATION.oracleSignerCount} signers, but the owner is
            still one key with no multisig and no timelock. Section 13 treats this as the first thing a user must trust.
          </p>
          <ul>
            {ROLES.map((r) => (
              <li key={r.label}>
                <strong>{r.label}.</strong> {r.powers.join('. ')}.
              </li>
            ))}
            <li>
              <strong>Traders.</strong> Deposit collateral, open and close positions, and may be liquidated when a
              position reaches or falls below its maintenance margin.
            </li>
            <li>
              <strong>Liquidity providers.</strong> Deposit into the vault, receive shares, and take the other side of
              every position the clearing house opens.
            </li>
            <li>
              <strong>Liquidators.</strong> Anyone. Liquidation is a permissionless call, not a privileged role.
            </li>
          </ul>
        </Prose>
      </Section>

      {/* 5 -------------------------------------------------------------- */}
      <Section id="reference" title="5. The reference price">
        <Prose>
          <p>
            A perpetual needs a reference price whether or not anyone is trading the underlying. MIDNAT produces one off
            chain in a reference engine, then anchors a signed version of it on chain. The engine's job is to answer one
            question continuously: for this ticker, right now, what is the best price we can defend, and how good is it.
          </p>
          <p>
            The engine polls {REFERENCE_ENGINE.upstream} every {REFERENCE_ENGINE.pollIntervalSec} seconds. For each
            market it selects the freshest usable feed by walking a fixed ladder, taking the first source that is fresh
            within {REFERENCE_ENGINE.selectFreshWithinSec} seconds:
          </p>
          <ol>
            {REFERENCE_ENGINE.feedOrder.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>
            The last rung is not a price source, it is a decision to stop pretending. When no feed is fresh, the engine
            holds its last snapshot and degrades the state it reports, so a consumer can tell a live price from a held
            one.
          </p>
        </Prose>

        <H3 id="reference-states">States and quality</H3>
        <Prose>
          <p>
            Every report the engine emits carries a freshness state and a quality tier. The state is a function of the
            age of the underlying data: a report is {REFERENCE_ENGINE.states[0]} while fresh, moves to{' '}
            {REFERENCE_ENGINE.states[1]} after {REFERENCE_ENGINE.agingAfterSec} seconds, and is treated as{' '}
            {REFERENCE_ENGINE.states[3]} after {REFERENCE_ENGINE.staleAfterSec} seconds. The quality tier is a separate
            axis describing how much the engine trusts the reading independent of its age.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Freshness states', value: REFERENCE_ENGINE.states.join(', ') },
            { key: 'Quality tiers', value: REFERENCE_ENGINE.qualityTiers.join(', ') },
            { key: 'Sentinel levels', value: REFERENCE_ENGINE.sentinel.join(', ') },
            { key: 'Market states', value: REFERENCE_ENGINE.marketStates.join(', ') },
            { key: 'Poll interval', value: `${REFERENCE_ENGINE.pollIntervalSec} s` },
            { key: 'Aging threshold', value: `${REFERENCE_ENGINE.agingAfterSec} s` },
            { key: 'Stale threshold', value: `${REFERENCE_ENGINE.staleAfterSec} s` },
          ]}
        />

        <H3 id="reference-transitions">Transitions without gaps</H3>
        <Prose>
          <p>
            When the engine changes source, for example when a session feed goes dark at the close and a 24/7 feed takes
            over, the two feeds rarely agree to the cent. Printing the difference in a single step would create an
            instantaneous gap that liquidates positions on an artefact of the handover rather than a real move. Instead
            the engine enters the {REFERENCE_ENGINE.states[2]} state and walks the price across, moving at most{' '}
            {bpsToPercent(REFERENCE_ENGINE.transitionMaxStepBps, 2)} per tick over at most{' '}
            {REFERENCE_ENGINE.transitionMaxSec} seconds, until the reported price has converged to the new source within{' '}
            {bpsToPercent(REFERENCE_ENGINE.convergenceBps, 2)} for {REFERENCE_ENGINE.convergenceTicks} consecutive ticks.
            A transition is only started when the gap between sources is at least{' '}
            {bpsToPercent(REFERENCE_ENGINE.transitionMinBps, 2)}, so trivial differences are not smoothed at all.
          </p>
        </Prose>
      </Section>

      {/* 6 -------------------------------------------------------------- */}
      <Section id="anchor" title="6. The oracle anchor">
        <Prose>
          <p>
            The reference engine runs off chain, and a contract cannot trust an HTTP response. The oracle anchor closes
            that gap. A signer key signs each report under {ORACLE_POLICY.signingScheme}, binding the price, its
            confidence band, its market and its timestamp to a signature the anchor can verify against a registered
            signer. A poster process writes signed reports to the anchor roughly every {ORACLE_POLICY.posterIntervalSec}{' '}
            seconds. The clearing house and the vault read only the anchor.
          </p>
        </Prose>

        <H3 id="anchor-policy">Age and confidence policy</H3>
        <Prose>
          <p>
            The anchor is not trusted unconditionally by the contracts that read it. On every price-sensitive call the
            clearing house checks the anchored report against two limits and reverts if either fails. If the report is
            older than the market's maximum age, the trade reverts. If the report's confidence band is wider than the
            market allows, the trade reverts. A report timestamped further than {ORACLE_POLICY.futureToleranceSec}{' '}
            seconds in the future is rejected as well, so a clock error cannot be used to backdate a price.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Signing scheme', value: ORACLE_POLICY.signingScheme },
            { key: 'Poster interval', value: `${ORACLE_POLICY.posterIntervalSec} s` },
            { key: 'Maximum price age', value: `${ORACLE_POLICY.maxPriceAgeSec} s` },
            { key: 'Future tolerance', value: `${ORACLE_POLICY.futureToleranceSec} s` },
            { key: 'Signer', value: <AddressDisplay value={ROLES.find((r) => r.label === 'Oracle signer')!.address} /> },
          ]}
        />

        <Callout tone="limit" title="What the signature proves, and what it does not">
          A valid signature proves the anchored price is the one the MIDNAT signer produced and that it has not been
          altered in transit. It does not prove the upstream number was correct, and it is not an on-chain verification
          of the upstream feed's authorship. Signing authenticates the messenger, not the market. A single funded
          process posts these reports; if it stops, prices go stale and the protocol blocks new exposure until they
          recover.
        </Callout>
      </Section>

      {/* Figure 1 ------------------------------------------------------- */}
      <figure className="pub-card flex flex-col gap-5 break-inside-avoid" aria-labelledby="figure-1-caption">
        <div className="pub-eyebrow">Figure 1</div>
        <ol className="flex flex-col gap-0 list-none p-0 m-0">
          {[
            {
              stage: 'Upstream feed',
              body: `${REFERENCE_ENGINE.upstream}, polled every ${REFERENCE_ENGINE.pollIntervalSec} s`,
              note: 'Off chain. Not trusted by any contract.',
            },
            {
              stage: 'Reference engine',
              body: 'Selects the freshest feed on the ladder, assigns a state and a quality tier, walks transitions across',
              note: 'Off chain. Produces the number, decides how good it is.',
            },
            {
              stage: 'Signer',
              body: `Signs the report under ${ORACLE_POLICY.signingScheme}`,
              note: 'Binds price, confidence, market and timestamp to a signature.',
            },
            {
              stage: 'Oracle anchor',
              body: `Verifies the signer and stores the latest report, posted every ~${ORACLE_POLICY.posterIntervalSec} s`,
              note: 'On chain. The only price authority the venue reads.',
            },
            {
              stage: 'Clearing house check',
              body: `Rejects if older than ${ORACLE_POLICY.maxPriceAgeSec} s or confidence wider than the market allows`,
              note: 'On a rejection, the trade reverts here. No fill.',
            },
            {
              stage: 'Fill price',
              body: 'Anchored price, then base spread, then impact term',
              note: 'The price the position actually opens or closes at.',
            },
          ].map((row, i, arr) => (
            <li key={row.stage} className="flex flex-col">
              <div className="flex flex-col gap-1 rounded-lg border border-[color:var(--ln-hairline)] bg-[var(--ln-glass-bg)] px-4 py-3">
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="pub-mono !text-[0.6875rem] uppercase tracking-[0.12em] text-[color:var(--ln-ink-soft)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="pub-h4">{row.stage}</span>
                </span>
                <span className="pub-body !text-[0.9375rem]">{row.body}</span>
                <span className="pub-small">{row.note}</span>
              </div>
              {i < arr.length - 1 ? (
                <span aria-hidden="true" className="my-1 ml-6 block h-4 w-px bg-[color:var(--ln-accent)] opacity-50" />
              ) : null}
            </li>
          ))}
        </ol>
        <figcaption id="figure-1-caption" className="pub-small">
          Figure 1. The price path, from an untrusted upstream feed to a signed on-chain anchor to a checked fill. Every
          stage below the anchor can refuse. A refusal reverts the trade rather than filling on a price the protocol
          cannot defend.
        </figcaption>
      </figure>

      {/* 7 -------------------------------------------------------------- */}
      <Section id="execution" title="7. Execution and pricing">
        <Prose>
          <p>
            There is no order-book depth or counterparty queue. Limit orders can rest in the clearing house and appear
            in Open Orders, but every eventual fill price is a formula applied to the anchored reference price. Two
            terms move that price against the trader. The base spread is a fixed, tier-set charge applied on entry and
            exit. The impact term scales with how much of the venue's capacity on that side the order consumes, so each
            additional unit of the crowded side fills at a worse price than the last. The impact term is bounded by a
            per-market maximum, so it cannot grow without limit.
          </p>
          <p>
            Because both terms work against the trader, a position is underwater against the reference price the moment
            it opens. This is not a fee schedule dressed as pricing: it is the mechanism by which a formula priced venue
            resists being pushed onto one side.
          </p>
        </Prose>

        <H3 id="execution-refusal">Refusal states</H3>
        <Prose>
          <p>
            A call that would open exposure is refused, and reverts, in any of these cases: the anchored price is older
            than {ORACLE_POLICY.maxPriceAgeSec} seconds or its confidence band is too wide; the market is not in an
            operating mode that accepts new exposure; or the order would push open interest past a global, per-market or
            per-side cap. Caps are checked as a whole. A position that would breach a cap is refused, not partially
            filled to the cap, because there is no book to fill against.
          </p>
        </Prose>
      </Section>

      {/* 8 -------------------------------------------------------------- */}
      <Section id="margin" title="8. Margin, leverage and liquidation">
        <Prose>
          <p>
            Margin is isolated per position. Collateral assigned to a position backs that position alone; a loss on one
            cannot be met from the margin of another. Size is notional, not margin: leverage is size divided by the
            collateral assigned to the position, and it must sit inside the tier's maximum. Listed leverage ranges from{' '}
            {LEVERAGE_RANGE.min}x to {LEVERAGE_RANGE.max}x by tier.
          </p>
          <p>
            A position's equity is its margin plus unrealised profit and loss minus accrued funding. When equity falls
            below the tier's maintenance margin, the position may be liquidated. Liquidation is a permissionless call:
            anyone may make it, and the caller is paid no bounty for making it. The tier's liquidation fee is deducted
            from the remaining equity and settled to the vault along with the loss, and whatever equity survives that
            deduction returns to the trader. The absence of a caller reward is a known gap in the keeper economics, not
            a design claim.
          </p>
        </Prose>

        <TableScroll>
          <table className="pub-table">
            <caption>Per-tier parameters</caption>
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">Markets</th>
                <th scope="col" className="pub-td-num">
                  Max leverage
                </th>
                <th scope="col" className="pub-td-num">
                  Maintenance margin
                </th>
                <th scope="col" className="pub-td-num">
                  Base spread
                </th>
                <th scope="col" className="pub-td-num">
                  Max confidence
                </th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => (
                <tr key={t.tier}>
                  <td className="pub-td-key">{t.label}</td>
                  <td>{t.symbols.join(', ')}</td>
                  <td className="pub-td-num">{t.params.maxLeverageX}x</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.maintenanceMarginBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.baseSpreadBps)}</td>
                  <td className="pub-td-num">{bpsToPercent(t.params.maxConfidenceBps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>

        <Callout tone="caution" title="Permissionless liquidation is live">
          The public liquidation function is deployed on chain. The canonical Foundry suite covers exact long and short
          boundaries, funding-driven liquidation, underwater shortfall absorption, healthy-position refusal,
          stale-oracle refusal and invariants. The caller remains unpaid, and at the smallest position size the
          liquidation fee may not cover the gas of the call.
        </Callout>
      </Section>

      {/* 9 -------------------------------------------------------------- */}
      <Section id="funding" title="9. Funding">
        <Prose>
          <p>
            Funding prices the imbalance between the two sides of a market rather than forbidding it. The posted rate is
            a base carry plus a skew term plus a divergence premium, so the crowded side pays more as the book tilts,
            and a balanced book still charges longs the carry rather than nothing. A positive rate means longs pay and
            shorts receive. The counterparty ordering is fixed: {FUNDING.counterparties}.
          </p>
          <p>
            The funding keeper posts a rate. The contract clamps that rate at {FUNDING.clampPercentPerHour}% per hour in
            either direction, and the clamp is enforced on chain, so a keeper key cannot drain a book through the funding
            channel even if it tried. Accrual is {FUNDING.accrual.toLowerCase()}: a per-market index moves only when the
            market is touched, and a position's share is computed from the index value it entered at, so funding accrues
            from the exact point a position joined. Funding is realised into the position when it is closed or
            liquidated, after which the margin returned is net of it.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Direction', value: 'Positive rate: longs pay, shorts receive' },
            { key: 'Counterparties', value: FUNDING.counterparties },
            { key: 'On-chain clamp', value: `${FUNDING.clampPercentPerHour}% per hour, either direction` },
            { key: 'Accrual', value: FUNDING.accrual },
          ]}
        />
      </Section>

      {/* 10 ------------------------------------------------------------- */}
      <Section id="vault" title="10. The vault as counterparty">
        <Prose>
          <p>
            A trader does not trade against another user. The vault is the counterparty to every position the clearing
            house opens.
            When a trader wins, the vault pays; when a trader loses, the collateral flows to the vault, net of fees. The
            vault is an ERC-4626 liquidity vault: liquidity
            providers deposit {COLLATERAL.symbol}, receive shares, and hold a claim on the vault's net asset value.
          </p>
          <p>
            Taking the other side of every position makes the vault a directional book by accident. If the whole venue
            is long, the vault is short the whole venue. Three mechanisms keep that from running away. Open interest is
            capped at {bpsToPercent(GLOBALS.globalOiFactorBps, 0)} of vault net asset value across all markets, with
            smaller per-market and per-side caps beneath it. Funding prices that imbalance: the rate rises with skew, so the
            crowded side pays more to hold.
            And the impact term makes each additional unit of the crowded side fill worse than the last. LP withdrawals
            are themselves capped: a withdrawal cannot drop remaining net asset value below the capital required to back
            open positions, so LP capital can be locked while the book is busy.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Standard', value: 'ERC-4626 tokenised vault' },
            { key: 'Role', value: 'Counterparty of last resort for trader profit' },
            { key: 'Global open-interest cap', value: `${bpsToPercent(GLOBALS.globalOiFactorBps, 0)} of net asset value` },
            { key: 'Per-market and per-side caps', value: 'A share of vault capacity, set by tier' },
            { key: 'Withdrawal limit', value: 'Cannot uncover capital backing open interest' },
          ]}
        />
      </Section>

      {/* 11 ------------------------------------------------------------- */}
      <Section id="deferred" title="11. Deferred payouts and the seniority of claims">
        <Prose>
          <p>
            Positions close in full on this deployment; there is no partial close. Closing settles the position at the
            current fill price, applies accrued funding and the close fee, and returns what is left of the margin. When
            a position is profitable, the vault pays the profit. The interesting case is the one where it cannot pay in
            full at that moment.
          </p>
          <p>
            When the vault has insufficient free cash to pay a winning close, the shortfall is not written down and does
            not vanish. It is recorded as a claim that ranks ahead of LP equity and is paid from later vault cash before
            LPs are made whole. This draws a hard line the design depends on: a vault that cannot pay right now is
            illiquid, not insolvent, and the two are not the same. Illiquidity is a timing failure that the seniority of
            the claim is designed to resolve as cash arrives. Insolvency would mean the claims exceed everything the
            vault will ever hold, and nothing in the protocol promises that cannot happen.
          </p>
        </Prose>
        <Callout tone="limit" title="A deferred payout is an unsecured claim">
          A deferred claim ranks ahead of LP equity, but it is not a guarantee, it is not insured, and it can remain
          unpaid. Seniority decides the order in which cash is applied, not whether enough cash will ever exist. See{' '}
          <Link href={docHref('deferred-payouts')} className="pub-link">
            deferred payouts
          </Link>{' '}
          for the detail.
        </Callout>
      </Section>

      {/* Figure 2 ------------------------------------------------------- */}
      <figure className="pub-card flex flex-col gap-5 break-inside-avoid" aria-labelledby="figure-2-caption">
        <div className="pub-eyebrow">Figure 2</div>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-[color:var(--ln-hairline)] bg-[var(--ln-glass-bg)] px-4 py-3">
            <span className="pub-h4">Winning position closes</span>
            <p className="pub-body !text-[0.9375rem]">
              Settled at the fill price, net of accrued funding and the close fee. The vault owes the profit.
            </p>
          </div>
          <span aria-hidden="true" className="ml-6 block h-4 w-px bg-[color:var(--ln-accent)] opacity-50" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[color:var(--ln-hairline)] bg-[var(--ln-glass-bg)] px-4 py-3">
              <span className="pub-mono !text-[0.6875rem] uppercase tracking-[0.12em] text-[color:var(--ln-accent)]">
                Vault can cover it
              </span>
              <p className="pub-body !text-[0.9375rem]">Profit is paid in cash immediately. The close is complete.</p>
            </div>
            <div className="rounded-lg border border-[color:var(--ln-hairline)] bg-[var(--ln-glass-bg)] px-4 py-3">
              <span className="pub-mono !text-[0.6875rem] uppercase tracking-[0.12em] text-[color:var(--ln-ink-soft)]">
                Vault cannot cover it
              </span>
              <p className="pub-body !text-[0.9375rem]">
                The shortfall becomes a recorded claim. Illiquidity, not a write-down.
              </p>
            </div>
          </div>
          <span aria-hidden="true" className="ml-6 block h-4 w-px bg-[color:var(--ln-accent)] opacity-50" />
          <div className="flex flex-col gap-2">
            <span className="pub-eyebrow">Order in which later vault cash is applied</span>
            {[
              { rank: '1', label: 'Recorded deferred claims', note: 'Senior. Paid before LP equity is restored.' },
              { rank: '2', label: 'LP equity', note: 'Junior. Made whole only after claims are paid.' },
            ].map((r) => (
              <div
                key={r.rank}
                className="flex items-baseline gap-3 rounded-lg border border-[color:var(--ln-hairline)] bg-[var(--ln-glass-bg)] px-4 py-3"
              >
                <span className="pub-mono !text-[0.6875rem] uppercase tracking-[0.12em] text-[color:var(--ln-ink-soft)]">
                  {r.rank}
                </span>
                <span>
                  <span className="pub-h4">{r.label}</span>
                  <span className="pub-small block">{r.note}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <figcaption id="figure-2-caption" className="pub-small">
          Figure 2. The ordering of a payout the vault cannot cover. The shortfall is a senior claim on later vault
          cash, ahead of LP equity. Seniority fixes the order of payment, not the certainty that enough cash will
          arrive: an unpaid claim can stay unpaid.
        </figcaption>
      </figure>

      {/* 12 ------------------------------------------------------------- */}
      <Section id="risk-framework" title="12. Risk framework and bounded parameters">
        <Prose>
          <p>
            A perpetuals venue must contain two failures above all: concentrated directional exposure, and a mispriced
            or stale reference price. The contracts bound each with hard limits, checked on every relevant call. A
            bounded risk is a contained risk, not a removed one.
          </p>
        </Prose>
        <KeyValue
          items={[
            {
              key: 'Open interest',
              value: `Capped at ${bpsToPercent(GLOBALS.globalOiFactorBps, 0)} of net asset value globally, with per-market and per-side caps beneath`,
            },
            {
              key: 'Leverage',
              value: `Capped by tier, ${LEVERAGE_RANGE.min}x to ${LEVERAGE_RANGE.max}x, with a per-tier maintenance margin`,
            },
            {
              key: 'Funding',
              value: `Clamped at ${FUNDING.clampPercentPerHour}% per hour on chain`,
            },
            {
              key: 'Price age and confidence',
              value: `Reverts above ${ORACLE_POLICY.maxPriceAgeSec} s or beyond the market's confidence limit`,
            },
            {
              key: 'Operating modes',
              value: 'Normal, close only and halted, per market and venue-wide',
            },
          ]}
        />
      </Section>

      {/* 13 ------------------------------------------------------------- */}
      <Section id="trust-model" title="13. Trust model">
        <Prose>
          <p>
            This section states, without hedging, what a user of MIDNAT must trust and what they can verify for
            themselves. It is the section a hostile reader should check first. Everything below the line marked
            verifiable can be checked against the chain or the project source; everything above it is an assumption the user
            accepts by using the protocol.
          </p>
        </Prose>

        <H3 id="trust-must">What a user must trust</H3>
        <Prose>
          <ul>
            <li>
              <strong>The owner key.</strong> On this deployment {KEY_CONCENTRATION.distinctAddresses} addresses hold the
              privileged roles, and the keeper roles are keys distinct from the owner. There is{' '}
              {KEY_CONCENTRATION.multisig ? 'a multisig' : 'no multisig'} and{' '}
              {KEY_CONCENTRATION.timelock ? 'a timelock' : 'no timelock'}. The owner is a single externally owned key that
              can change risk parameters, halt markets, reassign the keepers and post funding within the clamp. A user
              trusts it not to act against them, and there is no on-chain delay that would give warning.
            </li>
            <li>
              <strong>The oracle signer set.</strong> Prices the venue treats as canonical are signed by a set of keys,
              and the anchor accepts a report only when a threshold of {KEY_CONCENTRATION.oracleSignerThreshold} of{' '}
              {KEY_CONCENTRATION.oracleSignerCount} keys has signed it. A user trusts that the signer set signs honest
              numbers. The signatures prove authorship, not correctness.
            </li>
            <li>
              <strong>The upstream feed.</strong> The reference engine selects among {REFERENCE_ENGINE.upstream} feeds. A
              user trusts that upstream data is accurate. No contract verifies the upstream feed's authorship on chain.
            </li>
            <li>
              <strong>The posting service.</strong> A currently centralised posting service gathers the signatures and
              posts the signed report on a fixed interval. A user trusts it to keep running. If it stops, prices go
              stale and the protocol pauses new exposure, which is the safe failure. Redundant distributed posting and
              monitored service continuity are workstreams of the mainnet scale program.
            </li>
            <li>
              <strong>Off-chain infrastructure.</strong> The interface, API and reference engine run as an operated
              service. A user trusts them to be available, and no page on this site publishes an uptime figure, because
              nothing in this project measures one yet; production monitoring is part of the mainnet scale program.
            </li>
          </ul>
        </Prose>

        <H3 id="trust-verify">What a user can verify</H3>
        <Prose>
          <ul>
            <li>
              <strong>The deployed code.</strong> Every contract's runtime code hash was pinned in the manifest at deploy
              time, so a user can hash the code at each address and confirm it has not been substituted since deploy. That
              is not a byte-for-byte rebuild from source, which this deployment does not publish, and it is not an audit,
              as section 14 sets out.
            </li>
            <li>
              <strong>The addresses and roles.</strong> Every contract address and every role holder is on chain and on
              the <Link href="/contracts" className="pub-link">contracts page</Link>, readable without trusting this
              document.
            </li>
            <li>
              <strong>The enforced limits.</strong> The open-interest caps, the leverage maxima, the maintenance
              margins, the funding clamp and the price-age and confidence checks are enforced by the contracts, not by
              policy. A user can read them and confirm the code rejects what this document says it rejects.
            </li>
            <li>
              <strong>Every signed report.</strong> The anchor holds the latest signed report per market. A user can
              read the anchored price the venue used and confirm its signatures against the registered signer set.
            </li>
          </ul>
          <p>
            The <Link href="/verify" className="pub-link">verify page</Link> walks each of these checks and states what
            each proof does not prove.
          </p>
        </Prose>

        <Callout tone="limit" title="Independent review status">
          {CANONICAL.noAudit}
        </Callout>
      </Section>

      {/* 14 ------------------------------------------------------------- */}
      <Section id="limitations" title="14. Current deployment scope and assurance boundaries">
        <Prose>
          <p>
            This table records the exact scope of the current X Layer Testnet deployment. Contract-level entries come
            from the deployment record, interface-level entries define the shipped product boundary, and the same
            evidence set is used by the risk framework and mainnet scale program.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <caption>Deployment scope and assurance boundaries</caption>
            <thead>
              <tr>
                <th scope="col">Area</th>
                <th scope="col">Boundary</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              {LIMITATIONS.map((l) => (
                <tr key={l.id}>
                  <td className="pub-td-key">{l.area}</td>
                  <td>{l.title}</td>
                  <td>{l.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      {/* 15 ------------------------------------------------------------- */}
      <Section id="mainnet" title="15. Mainnet scale program">
        <Prose>
          <p>
            The X Layer Testnet protocol is complete. Mainnet expansion is a strategic institutional scale program
            focused on institutional liquidity, insurance capitalisation, market-making depth, distributed operations,
            external assurance, production monitoring and X Layer distribution. The workstreams below are the execution
            framework that the current-state evidence in sections 13 and 14 maps onto; the precise current state stays
            recorded on the Security, Contracts and legal pages.
          </p>
          <ul>
            <li>
              <strong>Institutional governance and distributed operations.</strong> The keeper roles are already
              distinct from the owner; the program moves privileged actions behind a multisig and a timelock and
              distributes operations across institutional controls.
            </li>
            <li>
              <strong>Redundant report posting.</strong> The single-poster testnet deployment fails safely by pausing
              new exposure; the program adds redundant distributed posters and monitored service continuity.
            </li>
            <li>
              <strong>External assurance.</strong> Independent contract review is a supporting evidence stream today,
              and publication of an external security report is the assurance milestone the program delivers. {CANONICAL.noAudit}
            </li>
            <li>
              <strong>Operating entity and custody framework.</strong> A live-money venue is operated through an entity
              that can carry custody obligations and bear liability; the program establishes that framework. {CANONICAL.entity}
            </li>
            <li>
              <strong>Adversarial production-readiness exercises.</strong> Liquidation and the deferred-payout path are
              implemented and tested; the program exercises them against production adversarial conditions before
              real-money operation.
            </li>
          </ul>
        </Prose>
      </Section>

      {/* 16 ------------------------------------------------------------- */}
      <Section id="references" title="16. References">
        <Prose>
          <p>
            The numbers in this document are derived from the deployment manifest and the project source, not restated from
            memory. The primary sources are:
          </p>
          <ul>
            <li>
              The deployed contracts and their verification state, on the{' '}
              <Link href="/contracts" className="pub-link">contracts page</Link> and the{' '}
              <Link href="/deployments" className="pub-link">deployments page</Link>.
            </li>
            <li>
              The mechanism at reference depth, in the{' '}
              <Link href="/docs" className="pub-link">documentation</Link>, in particular{' '}
              <Link href={docHref('reference-engine')} className="pub-link">the reference engine</Link>,{' '}
              <Link href={docHref('oracle-anchor')} className="pub-link">the oracle anchor</Link> and{' '}
              <Link href={docHref('deferred-payouts')} className="pub-link">deferred payouts</Link>.
            </li>
            <li>
              The risks and their bounds, in the{' '}
              <Link href="/risk" className="pub-link">risk framework</Link> and the{' '}
              <Link href="/legal/risk-disclosure" className="pub-link">risk disclosure</Link>.
            </li>
          </ul>
        </Prose>
      </Section>

      {/* Closing -------------------------------------------------------- */}
      <Section id="not-established" title="What this document does not establish">
        <Prose>
          <p>
            This document describes a mechanism and its assumptions. It does not establish that the mechanism is safe
            with real money, and reading it should not be mistaken for that conclusion.
          </p>
          <ul>
            <li>{CANONICAL.noAudit}</li>
            <li>{CANONICAL.testnet}</li>
            <li>{CANONICAL.noOwnership}</li>
            <li>{CANONICAL.notAdvice}</li>
          </ul>
          <p>
            Where a claim here can be checked, check it. Where it rests on trusting a key, a signer or a single process,
            that trust is stated in section 13 and is not removed by anything in this document.
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
