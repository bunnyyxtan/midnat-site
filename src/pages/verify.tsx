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

const vault = contractByKey('vault');
const clearingHouse = contractByKey('clearingHouse');
const oracleAnchor = contractByKey('oracleAnchor');
const rpc = NETWORK.rpcUrl;

const explorerLimit = LIMITATIONS.find((l) => l.id === 'explorer-verification')!;

const anchorReadCmd = `# read the authorised signer the anchor accepts prices from
cast call ${oracleAnchor.address} \\
  "signer()(address)" \\
  --rpc-url ${rpc}`;

const anchorEthCall = `# the same read as raw JSON-RPC, no cast required
curl -s -X POST ${rpc} \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"${oracleAnchor.address}","data":"0x238ac933"},"latest"]}'`;

const vaultReadCmd = `# total assets the vault holds, and the price of one share
cast call ${vault.address} "totalAssets()(uint256)" --rpc-url ${rpc}
cast call ${vault.address} "totalSupply()(uint256)" --rpc-url ${rpc}

# convertToAssets(1e18) prices one full share in ${COLLATERAL.symbol} base units
cast call ${vault.address} \\
  "convertToAssets(uint256)(uint256)" 1000000000000000000 \\
  --rpc-url ${rpc}`;

const marketReadCmd = `# read a market's stored parameters from the clearing house.
# pass the market's symbolKey, printed on /markets, as bytes32.
cast call ${clearingHouse.address} \\
  "getMarket(bytes32)" <SYMBOL_KEY> \\
  --rpc-url ${rpc}

# confirm the collateral immutable is the token you expect
cast call ${clearingHouse.address} "collateral()(address)" --rpc-url ${rpc}`;

const rebuildCmd = `# 1. build the contracts with the pinned profile.
#    the sources live at ${SOURCES.contracts} in the project source tree.
forge build            # solc ${vault.solc}, ${vault.pipeline}, per foundry.toml

# 2. pull the deployed runtime code
cast code ${vault.address} --rpc-url ${rpc} > deployed-vault.hex
cast code ${clearingHouse.address} --rpc-url ${rpc} > deployed-ch.hex

# 3. compare against the locally built runtime, with immutables pinned.
#    a naive diff always differs: immutables (collateral, vault and anchor
#    addresses, scale factors) are baked into runtime code, so mask those
#    byte ranges on both sides before comparing, then check each masked
#    value equals the value it is supposed to be.`;

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
            The clearing house prices every trade from the oracle anchor and from nothing else. The anchor holds one
            authorised signer, and it accepts a signed report only from that key. Read the signer first, because it is
            the root of every price on the venue.
          </p>
        </Prose>
        <CodeBlock label="Read the anchor signer with cast">{anchorReadCmd}</CodeBlock>
        <CodeBlock label="The same read as raw JSON-RPC">{anchorEthCall}</CodeBlock>
        <Prose>
          <p>
            The address returned should match the oracle signer on the{' '}
            <Link href="/contracts" className="pub-link">
              contracts page
            </Link>
            . If it does not, the anchor is accepting prices from a key this site does not describe, and you should trust
            nothing downstream of it.
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

      <Section id="rebuild" title="Rebuild the contracts from source">
        <Prose>
          <p>
            The strongest check available here is to rebuild the contracts and compare the runtime bytecode against the
            deployed code. The vault and the clearing house reproduce byte for byte once immutables are pinned. The
            oracle anchor does not, because it was built with a different compiler configuration, so it is checked by
            runtime code hash and by its live signer instead.
          </p>
          <p>
            One honest caveat about this section: every check above it is a chain read that needs nothing from us, but
            this one needs the contract sources, and this site publishes no location to obtain them. You can ask for
            them at <ExternalLink href={PRIMARY_CONTACT.href}>{PRIMARY_CONTACT.display}</ExternalLink> on{' '}
            {PRIMARY_CONTACT.network}, which is a request and not a guarantee. Until you hold them, read this as the
            procedure the reproduction followed and as a check anyone holding those sources can repeat, not as one you
            can run from this page alone.
          </p>
        </Prose>
        <CodeBlock label="Rebuild and compare">{rebuildCmd}</CodeBlock>
        <Callout tone="caution" title="Pin immutables before you diff">
          Immutable values, the collateral address, the vault and anchor addresses and the scale factors, are baked into
          the runtime code. A naive byte diff against a fresh build will always differ on those ranges. Mask them on both
          sides, compare the rest, then check each masked value equals the value it is supposed to be. Masking without
          the second step would let a contract with the right code and a wrong scale factor pass.
        </Callout>
        <Prose>
          <p>
            This is a local reproduction, not verification on the block explorer. {explorerLimit.detail}
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
              <strong>A reproduced build does not prove the source is correct.</strong> Byte equality proves the deployed
              code is this source tree compiled as claimed. It does not prove the source is free of bugs.
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
