import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { PRIMARY_CONTACT } from '@/lib/contact';
import {
  AddressDisplay,
  Callout,
  CodeBlock,
  ExternalLink,
  H3,
  KeyValue,
  PrintButton,
  Prose,
  RelatedLinks,
  Section,
} from '@/components/public/primitives';
import {
  CANONICAL,
  COLLATERAL,
  LIMITATIONS,
  NETWORK,
  SOURCES,
  contractByKey,
} from '@/lib/protocol-registry';

const activation = LIMITATIONS.find((l) => l.id === 'activated-testnet')!;

const vault = contractByKey('vault');
const clearingHouse = contractByKey('clearingHouse');
const oracleAnchor = contractByKey('oracleAnchor');
const rpc = NETWORK.rpcUrl;

const explorerLimit = LIMITATIONS.find((l) => l.id === 'explorer-verification')!;

const anchorReadCmd = `# read the signer set and threshold the anchor accepts prices from
cast call ${oracleAnchor.address} "signerThreshold()(uint256)" --rpc-url ${rpc}
cast call ${oracleAnchor.address} "signerSetHash()(bytes32)" --rpc-url ${rpc}`;

const anchorEthCall = `# read the signing threshold as raw JSON-RPC, no cast required
curl -s -X POST ${rpc} \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["${oracleAnchor.address}","latest"]}'`;

const vaultReadCmd = `# total assets the vault holds, and the price of one share
cast call ${vault.address} "totalAssets()(uint256)" --rpc-url ${rpc}
cast call ${vault.address} "totalSupply()(uint256)" --rpc-url ${rpc}

# shares carry 6 more decimals than the asset, so one full share is 1e12
# convertToAssets(1e12) prices one full share in ${COLLATERAL.symbol} base units
cast call ${vault.address} \\
  "convertToAssets(uint256)(uint256)" 1000000000000 \\
  --rpc-url ${rpc}`;

const marketReadCmd = `# read a market's stored parameters from the clearing house.
# pass the market's symbolKey, printed on /markets, as bytes32.
cast call ${clearingHouse.address} \\
  "getMarket(bytes32)" <SYMBOL_KEY> \\
  --rpc-url ${rpc}

# confirm the collateral immutable is the token you expect
cast call ${clearingHouse.address} "collateral()(address)" --rpc-url ${rpc}`;

const codeHashCmd = `# 1. pull the deployed runtime code for each contract
cast code ${vault.address} --rpc-url ${rpc} > deployed-vault.hex
cast code ${clearingHouse.address} --rpc-url ${rpc} > deployed-ch.hex

# 2. hash it and compare against the runtime code hash pinned in the manifest
#    (src/deployments/1952.json), which was recorded at deploy time.
cast keccak "$(cat deployed-vault.hex)"     # expect ${vault.runtimeCodeHash}
cast keccak "$(cat deployed-ch.hex)"        # expect ${clearingHouse.runtimeCodeHash}

# a matching hash proves the code at the address has not changed since deploy.
# it does NOT prove the code was built from a particular source tree: for that
# you need the sources and a rebuild, which this deployment does not publish.`;

export default function Verify() {
  return (
    <DocumentLayout
      meta={{
        title: 'Verify',
        description:
          'How to check MIDNAT yourself on X Layer Testnet: read the oracle anchor, the vault and a market, rebuild the contracts, and understand what each proof does not prove.',
        path: '/verify',
      }}
      eyebrow="Trust"
      title="Verify it yourself"
      standfirst="Every claim on this site points at a contract you can read. Here is how to read it, with the real addresses and the real RPC, and a plain account of what each check proves and what it cannot."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Verify' }]}
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
            { label: 'Contracts', href: '/contracts', summary: 'The addresses, roles and verification state these checks read.' },
            { label: 'Deployments', href: '/deployments', summary: 'The transactions that put this code on chain.' },
            { label: 'Security', href: '/security', summary: 'Key concentration and what has never been exercised.' },
          ]}
        />
      }
    >
      <Callout tone="note" title="Activated on testnet">
        {activation.detail}
      </Callout>

      <Section id="setup" title="What you need">
        <Prose>
          <p>
            The reads below use{' '}
            <ExternalLink href="https://book.getfoundry.sh/">Foundry</ExternalLink>, whose <code>cast</code> and{' '}
            <code>forge</code> tools talk to the chain and rebuild the contracts. Every read also works as a raw{' '}
            <code>eth_call</code> against the RPC if you would rather not install anything. Nothing here needs a wallet
            or spends gas: these are reads.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'RPC URL', value: <code className="pub-mono">{rpc}</code> },
            { key: 'Chain ID', value: `${NETWORK.chainId} (${NETWORK.chainIdHex})` },
            { key: 'Vault', value: <AddressDisplay value={vault.address} /> },
            { key: 'Clearing house', value: <AddressDisplay value={clearingHouse.address} /> },
            { key: 'Oracle anchor', value: <AddressDisplay value={oracleAnchor.address} /> },
            { key: 'Collateral', value: <AddressDisplay value={COLLATERAL.address} /> },
          ]}
        />
      </Section>

      <Section id="anchor" title="Read the anchored price authority">
        <Prose>
          <p>
            The clearing house prices every trade from the oracle anchor and from nothing else. This is Oracle Anchor V2:
            it holds a set of authorised signing keys and a signing threshold, and it accepts a signed report only when a
            threshold of that set has signed it. Read the threshold and the signer-set hash first, because they are the
            root of every price on the venue.
          </p>
        </Prose>
        <CodeBlock label="Read the anchor signer set with cast">{anchorReadCmd}</CodeBlock>
        <CodeBlock label="Read the anchor code as raw JSON-RPC">{anchorEthCall}</CodeBlock>
        <Prose>
          <p>
            The threshold and signer-set hash returned should match the oracle signer set on the{' '}
            <Link href="/contracts" className="pub-link">
              contracts page
            </Link>
            . If they do not, the anchor is accepting prices under rules this site does not describe, and you should
            trust nothing downstream of it.
          </p>
        </Prose>
      </Section>

      <Section id="vault" title="Read the vault">
        <Prose>
          <p>
            The vault is the counterparty to every position. Its total assets and its share price are public reads.
            Compare them against whatever the interface shows you.
          </p>
        </Prose>
        <CodeBlock label="Vault total assets and share price">{vaultReadCmd}</CodeBlock>
        <Prose>
          <p>
            {COLLATERAL.symbol} has {COLLATERAL.decimals} decimals, so a raw total-assets result of one million base
            units is one {COLLATERAL.symbol}. A share price that drifts below its issue price means the vault has paid
            out more than it took in on net, which is the risk an LP carries.
          </p>
        </Prose>
      </Section>

      <Section id="market" title="Read a market's parameters">
        <Prose>
          <p>
            Every market's leverage cap, maintenance margin, fees, spread and caps are stored on the clearing house and
            read with the market's symbol key. The keys are published on the{' '}
            <Link href="/markets" className="pub-link">
              markets page
            </Link>
            . Read a market and compare it field by field against what this site claims.
          </p>
        </Prose>
        <CodeBlock label="Read a market from the clearing house">{marketReadCmd}</CodeBlock>
      </Section>

      <Section id="codehash" title="Check the runtime code hash">
        <Prose>
          <p>
            The strongest check available from this page is to hash the deployed runtime code and compare it against the
            runtime code hash the manifest pinned at deploy time. A match proves the code at the address has not been
            substituted since deploy. It does not prove the code was built from a particular source tree: that would need
            a byte-for-byte rebuild from source, which this deployment does not publish, so this page does not claim one.
          </p>
          <p>
            One honest caveat about a full source rebuild: every check above is a chain read that needs nothing from us,
            but a rebuild needs the contract sources, and this site publishes no location to obtain them. You can ask for
            them at <ExternalLink href={PRIMARY_CONTACT.href}>{PRIMARY_CONTACT.display}</ExternalLink> on{' '}
            {PRIMARY_CONTACT.network}, which is a request and not a guarantee.
          </p>
        </Prose>
        <CodeBlock label="Hash the deployed code and compare">{codeHashCmd}</CodeBlock>
        <Callout tone="caution" title="A hash pin is not a source rebuild">
          Matching the pinned runtime code hash proves the code at an address has not changed since deploy. It does not
          prove that code corresponds to this source tree, and it does not prove the source is correct. Only a rebuild
          from the sources, with immutables pinned, would establish the first, and only an audit the second.
        </Callout>
        <Prose>
          <p>
            A hash pin is not verification on the block explorer either. {explorerLimit.detail}
          </p>
        </Prose>
      </Section>

      <Section id="not-proven" title="What these checks do not prove">
        <Callout tone="caution" title="Chain proof is not source trust, and it is not an audit">
          <p>
            Reading a contract proves what the contract holds and what the signer signed. It does not reach past the
            chain into whether the numbers going in were right or whether the code is correct.
          </p>
        </Callout>
        <Prose>
          <ul>
            <li>
              <strong>It does not prove the upstream price was right.</strong> A valid anchor signature proves the MIDNAT
              signer produced that number. It says nothing about whether the market price it claims was accurate. Signing
              authenticates the messenger, not the market.
            </li>
            <li>
              <strong>It does not prove the reference engine is honest.</strong> The engine that chooses which feed
              becomes the signed price runs off chain. You can read what it published, but you cannot verify its
              selection from the chain alone.
            </li>
            <li>
              <strong>A pinned code hash does not prove the source.</strong> A matching runtime code hash proves the code
              at an address has not changed since deploy. It does not prove that code was built from this source tree, and
              it does not prove the source is free of bugs.
            </li>
            <li>
              <strong>None of this is an audit.</strong> {CANONICAL.noAudit}
            </li>
          </ul>
          <p>
            A verification page that let chain proof stand in for trust in the upstream source would be dishonest. These
            checks are worth running, and they are not the whole story. {CANONICAL.testnet}
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
