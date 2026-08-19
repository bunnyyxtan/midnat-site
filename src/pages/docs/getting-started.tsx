import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, ExternalLink, KeyValue, Prose, Section } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { PRIMARY_CONTACT } from '@/lib/contact';
import {
  CANONICAL,
  COLLATERAL,
  GLOBALS,
  NETWORK,
  collateralAmount,
} from '@/lib/protocol-registry';

const DOC = docBySlug('getting-started')!;

const FAUCET_URL = 'https://web3.okx.com/xlayer/faucet';

export default function GettingStarted() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="Setup, and only setup: a wallet, the network, collateral, and a first look at the terminal. When your wallet is connected and funded, your first trade is the next page. It also says plainly which of this happens in the app and which happens on chain."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="before-you-start" title="Before you start">
        <Prose>
          <p>{CANONICAL.testnet}</p>
          <p>
            Nothing here has monetary worth, so the cost of a mistake is time, not money. The steps below run in order,
            and each one has a reason. Once they are done,{' '}
            <Link href={docHref('first-trade')} className="pub-link">
              your first trade
            </Link>{' '}
            walks through placing, reading and closing a position, and{' '}
            <Link href={docHref('refusal-rules')} className="pub-link">
              when the protocol refuses
            </Link>{' '}
            lists the things that will stop you even when your wallet is funded and connected.
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

      <Section id="first-look" title="A first look at the terminal">
        <Prose>
          <p>
            With a wallet connected and funded, the terminal shows every listed market, its live parameters and the
            reference price the venue is trading against, all read from the contracts over your own RPC connection
            rather than from any ledger MIDNAT keeps. You can read all of it before you open anything.
          </p>
          <p>
            When you are ready to place one,{' '}
            <Link href={docHref('first-trade')} className="pub-link">
              your first trade
            </Link>{' '}
            takes it from here: choosing a market, reading the preview, signing, and closing again.
          </p>
        </Prose>
      </Section>
    </DocsLayout>
  );
}
