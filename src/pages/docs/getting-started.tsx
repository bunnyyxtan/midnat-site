import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, ExternalLink, KeyValue, Prose, Section } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { PRIMARY_CONTACT } from '@/lib/contact';
import {
  CANONICAL,
  COLLATERAL,
  GLOBALS,
  LEVERAGE_RANGE,
  NETWORK,
  ORACLE_POLICY,
  collateralAmount,
} from '@/lib/protocol-registry';

const DOC = docBySlug('getting-started')!;

const FAUCET_URL = 'https://web3.okx.com/xlayer/faucet';

export default function GettingStarted() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="The ordered path to a first position on this testnet: a wallet, the network, collateral, and the checks that run before an open is accepted. It also says plainly which of that happens in the app and which happens on chain."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="before-you-start" title="Before you start">
        <Prose>
          <p>{CANONICAL.testnet}</p>
          <p>
            Nothing here has monetary worth, so the cost of a mistake is time, not money. The steps below run in order.
            Each one has a reason, and the last section lists the things that will stop you even when your wallet is
            funded and connected.
          </p>
        </Prose>
        <Callout tone="note" title="Gas">
          {CANONICAL.gas}
        </Callout>
      </Section>

      <Section id="two-layers" title="What the app does and what the contracts do">
        <Prose>
          <p>{CANONICAL.architecture}</p>
          <p>{CANONICAL.tradingPath}</p>
          <p>
            There is therefore one path to this venue, and the app is a convenient way to walk it. The transaction the
            order ticket builds is the same call you could assemble yourself against the addresses on the{' '}
            <Link href="/contracts" className="pub-link">
              contracts page
            </Link>
            , so the mechanism pages describe what happens to your position either way. Nothing in the interface can
            approve a trade the contract would refuse, and nothing in it can refuse one you send yourself.
          </p>
        </Prose>
      </Section>

      <Section id="what-you-need" title="What you need">
        <Prose>
          <p>
            All three are required, because trading here is signing transactions and paying for them.
          </p>
          <ol>
            <li>
              <strong>An EVM wallet.</strong> Any wallet that can add a custom network and sign transactions on an
              EVM chain works. MIDNAT does not require a specific brand of wallet.
            </li>
            <li>
              <strong>{NETWORK.gasCurrency} for gas.</strong> Every trade is a transaction, in the app as much as
              from your own tooling, and {NETWORK.label} charges the sender for each one in {NETWORK.gasCurrency}.
              Claim testnet {NETWORK.gasCurrency} from the X Layer faucet, which pays a maximum of 0.2
              {' '}{NETWORK.gasCurrency} per claim.
            </li>
            <li>
              <strong>Testnet {COLLATERAL.symbol}.</strong> Positions written by the clearing house are margined in
              {' '}{COLLATERAL.name} ({COLLATERAL.symbol}), and the collateral you assign to a position moves into the
              clearing house when you open it. Collateral below covers where it comes from.
            </li>
          </ol>
          <p>
            The faucet is run by the chain operator, not by MIDNAT:{' '}
            <ExternalLink href={FAUCET_URL}>web3.okx.com/xlayer/faucet</ExternalLink>.
          </p>
        </Prose>
      </Section>

      <Section id="add-network" title="Add the network">
        <Prose>
          <p>
            Add {NETWORK.label} to your wallet as a custom network with the values below. These come from the
            deployment manifest, so they match the chain the contracts live on.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Network name', value: NETWORK.label },
            { key: 'Chain id', value: `${NETWORK.chainId}` },
            { key: 'Chain id (hex)', value: NETWORK.chainIdHex },
            { key: 'Gas currency', value: NETWORK.gasCurrency },
            {
              key: 'RPC URL',
              value: <code className="pub-mono">{NETWORK.rpcUrl}</code>,
            },
            { key: 'Block explorer', value: <ExternalLink href={NETWORK.explorerBase}>{NETWORK.explorerName}</ExternalLink> },
          ]}
        />
        <Callout tone="caution" title="The public RPC can lag">
          The public RPC is load balanced, so two reads can land on nodes at different block heights. This is a
          property of the chain, not of MIDNAT. If a balance looks stale, wait a moment and read again.
        </Callout>
      </Section>

      <Section id="connect" title="Connect your wallet">
        <Prose>
          <p>
            Open the MIDNAT app and connect your wallet. Connecting reads your address and prompts a network switch to
            {' '}{NETWORK.label} if you are on another chain. It does not move any funds and it does not cost gas.
          </p>
          <p>
            Confirm your wallet reports chain id {NETWORK.chainId} before you go further. The app prompts the switch,
            and a transaction sent to these contracts while your wallet points at another chain will not reach them.
          </p>
        </Prose>
      </Section>

      <Section id="deposit" title="Collateral">
        <Prose>
          <p>
            Collateral is a transfer, not a figure. The clearing house holds it against your account, where it is not
            pooled with liquidity provider capital and not lent out, and the margin behind a position is the
            denominator of its leverage.
          </p>
          <p>
            The order ticket handles the transfer for you when it has to. If the clearing house is not yet approved to
            move your {COLLATERAL.symbol}, it asks your wallet to approve it; if your account there does not already
            hold enough margin, it sends a deposit before the open. Each of those is its own transaction and each
            costs {NETWORK.gasCurrency}, which is why a first trade can ask you to sign more than once.
          </p>
          <p>
            There is no self-service {COLLATERAL.symbol} faucet on this deployment, so this page does not link one,
            and the one channel this project publishes, <ExternalLink href={PRIMARY_CONTACT.href}>{PRIMARY_CONTACT.display}</ExternalLink> on{' '}
            {PRIMARY_CONTACT.network}, is an account rather than a faucet: it hands out no collateral. If the wallet you
            connect does not already hold testnet {COLLATERAL.symbol}, you can read every market and every position
            here, but you cannot open one.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Collateral asset', value: `${COLLATERAL.name} (${COLLATERAL.symbol})` },
            { key: 'Token decimals', value: `${COLLATERAL.decimals}` },
            { key: 'Custody', value: 'MidnatClearingHouse, per account' },
            { key: 'Minimum collateral', value: collateralAmount(GLOBALS.minCollateral, 2) },
            { key: 'Held by MIDNAT', value: 'Nothing. The interface never takes custody' },
          ]}
        />
      </Section>

      <Section id="open" title="Open a position">
        <Prose>
          <p>
            Choose a market, a side and a size. Size is notional, not the margin you post. Your leverage is size
            divided by the collateral you assign to the position, and it must sit inside the tier's maximum, which runs
            from {LEVERAGE_RANGE.min}x to {LEVERAGE_RANGE.max}x depending on the market. The{' '}
            <Link href={docHref('markets-and-tiers')} className="pub-link">
              markets and risk tiers
            </Link>{' '}
            page lists the limit for every market.
          </p>
          <p>
            When you fill in the ticket, the app asks the clearing house what the trade would cost. It quotes the fill
            against the contract's own pricing view and simulates the call, so the execution price, the fees and the
            liquidation price you are shown before you sign are the contract's numbers rather than a second opinion.
            Nothing has been sent at that point, and nothing is recorded anywhere.
          </p>
          <p>
            When you accept, your wallet signs one transaction and sends it to the clearing house. The contract then
            does the work itself: it reads the anchored price and refuses a stale one, builds the fill from the tier's
            base spread and an impact term, checks the open-interest caps, the minimums and the tier's leverage limit,
            enforces the slippage bound the call carries, and writes the position. If any check fails the whole call
            reverts, no position is written and you have spent only gas.{' '}
            <Link href={docHref('positions-and-margin')} className="pub-link">
              Positions and margin
            </Link>{' '}
            describes what is written and why.
          </p>
        </Prose>
      </Section>

      <Section id="watch" title="Where to watch it">
        <Prose>
          <p>
            Your open positions, margin and unrealised profit and loss are shown in the app portfolio, read from the
            clearing house over your own RPC connection rather than from any ledger MIDNAT keeps. The same positions
            are on the block explorer, under the transaction that opened them.
          </p>
          <p>
            What you can follow on the{' '}
            <ExternalLink href={NETWORK.explorerBase}>{NETWORK.explorerName}</ExternalLink> is the on-chain record: the
            anchored prices this venue prices against, posted continuously, and the deployment and live-fire
            transactions on the contract addresses. Any transaction you send yourself lands there too. The{' '}
            <Link href="/contracts" className="pub-link">
              contracts page
            </Link>{' '}
            lists the addresses those transactions touch.
          </p>
        </Prose>
      </Section>

      <Section id="what-can-block-you" title="What can block you">
        <Prose>
          <p>
            A funded, connected wallet is not enough on its own. The clearing house refuses rather than fill you on
            terms it cannot defend, and because the app simulates the call before asking you to sign, most refusals
            reach you as an error in the ticket instead of a failed transaction.
          </p>
          <ul>
            <li>
              <strong>Stale or uncertain price.</strong> If the anchored price is older than
              {' '}{ORACLE_POLICY.maxPriceAgeSec} seconds, or its confidence band is wider than the market allows, the
              open reverts. Ahead of that, the app's risk policy cuts the leverage it will offer, and pauses new
              exposure entirely, as reference quality falls: it can refuse to build a call the contract would still
              have accepted, never the other way round.
            </li>
            <li>
              <strong>A cap refuses your size.</strong> Open interest is capped globally, per market and per side. A
              position that would push any cap past its limit is refused, not partially filled. The ticket reads the
              same capacity from the contract before you sign, and the risk policy can narrow what it offers further
              when reference quality is poor.
            </li>
            <li>
              <strong>A minimum refuses a dust position.</strong> The minimum collateral is
              {' '}{collateralAmount(GLOBALS.minCollateral, 2)} and the minimum size is
              {' '}{collateralAmount(GLOBALS.minSize, 2)}, and anything smaller is rejected. The app does not test
              those two thresholds itself; the simulation it runs before asking you to sign fails, and the ticket
              shows the contract's refusal.
            </li>
            <li>
              <strong>The market is not accepting new exposure.</strong> The owner can set a market to close only or
              halted, and in those modes the call will not go through even when your price is fresh and your size is
              legal. The app also refuses at its own gate, from the market regime and the risk policy it applies, so
              a halted market usually stops you before your wallet opens.
            </li>
            <li>
              <strong>The market is not listed on this deployment.</strong> The clearing house lists a fixed set of
              markets and rejects a call naming anything else. The reference engine can price further symbols, and
              they can appear in market data, but they cannot be traded.
            </li>
          </ul>
        </Prose>
      </Section>
    </DocsLayout>
  );
}
