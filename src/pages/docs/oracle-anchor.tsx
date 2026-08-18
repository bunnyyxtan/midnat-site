import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import {
  AddressDisplay,
  Callout,
  CodeBlock,
  H3,
  KeyValue,
  Prose,
  Section,
  StatusBadge,
} from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import {
  CANONICAL,
  LIMITATIONS,
  ORACLE_POLICY,
  ORACLE_RUNTIME_CODE_HASH,
  contractByKey,
} from '@/lib/protocol-registry';

const DOC = docBySlug('oracle-anchor')!;
const ANCHOR = contractByKey('oracleAnchor');
const SINGLE_POSTER = LIMITATIONS.find((l) => l.id === 'single-poster')!;
const ANCHOR_PROVENANCE = LIMITATIONS.find((l) => l.id === 'anchor-provenance')!;

export default function OracleAnchor() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="A contract cannot trust an HTTP response. The oracle anchor is where an off-chain reference price becomes a number the clearing house will accept, and the place where the limits of that trust are exact."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="contract" title="The contract">
        <div className="flex flex-wrap items-center gap-3">
          <span className="pub-h4">{ANCHOR.name}</span>
          <StatusBadge status={ANCHOR.status} />
        </div>
        <Prose>
          <p>{ANCHOR.role}</p>
          <p>
            It holds no funds. It is a signer registry and an on-chain record of the latest signed reference report per
            market. Every trade the clearing house executes reads its price from here and nowhere else.
          </p>
        </Prose>
        <AddressDisplay value={ANCHOR.address} label="Anchor contract" />
        <CodeBlock label="Runtime code hash">{ORACLE_RUNTIME_CODE_HASH}</CodeBlock>
        <Prose>
          <p>
            This contract was reused from an earlier run, so it is pinned by its runtime code hash rather than
            reproduced byte for byte from the project source. The{' '}
            <Link href="/verify" className="pub-link">
              verify page
            </Link>{' '}
            explains what that pin does and does not establish, and the{' '}
            <Link href="/contracts" className="pub-link">
              contracts page
            </Link>{' '}
            carries the full verification note.
          </p>
        </Prose>
      </Section>

      <Section id="signing" title="Signing and posting">
        <H3 id="signing-flow">From an off-chain price to an on-chain report</H3>
        <Prose>
          <p>
            The reference engine produces a price off chain. That price cannot be trusted by a contract on its own,
            because anything can claim to have produced it. So a signer key signs each report under{' '}
            {ORACLE_POLICY.signingScheme}, binding it to the anchor contract and the configured signing domain. The
            signature commits to the exact contents of the report, so any later change to the price, the confidence or
            the timestamp invalidates it.
          </p>
          <p>
            A poster process then writes the signed report to the anchor roughly every {ORACLE_POLICY.posterIntervalSec}{' '}
            seconds. The anchor stores the latest signed report per market. From that point on the report is on chain
            and anyone can read it, recover the signer from the signature and check it. The clearing house does exactly
            that on every trade.
          </p>
          <p>
            The authority splits at the signature. MIDNAT builds and signs the price off chain, the anchor contract
            verifies that signature against the signer it holds and stores the latest report per market, and the
            clearing house reads that stored report when it prices. MIDNAT surfaces fetch the same signed reports from
            the API and check each signature against the signer read from the anchor contract, rather than reading a
            price back out of the anchor.
          </p>
        </Prose>
        <H3 id="signer-role">The signer role</H3>
        <Prose>
          <p>
            The oracle signer is a distinct privileged role. Its only power is to sign reference reports that the anchor
            accepts as canonical prices. It cannot move funds, change risk parameters, halt markets or post funding, and
            those powers cannot sign a price. Keeping the roles separate means a compromised signer can print a bad
            price but cannot also, for example, raise leverage caps to make that price more damaging. The full list of
            roles and the addresses that hold them is on the{' '}
            <Link href="/security" className="pub-link">
              security page
            </Link>
            .
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Signing scheme', value: ORACLE_POLICY.signingScheme },
            { key: 'Poster interval', value: `${ORACLE_POLICY.posterIntervalSec} seconds` },
            { key: 'Maximum accepted price age', value: `${ORACLE_POLICY.maxPriceAgeSec} seconds` },
            { key: 'Future timestamp tolerance', value: `${ORACLE_POLICY.futureToleranceSec} seconds` },
          ]}
        />
      </Section>

      <Section id="checks" title="What the clearing house checks">
        <Prose>
          <p>
            The clearing house does not accept the anchored price unconditionally. On every trade that reads it, it
            applies a set of checks, and a failure reverts the call rather than filling you.
          </p>
          <ul>
            <li>
              <strong>Signature.</strong> The report must carry a valid {ORACLE_POLICY.signingScheme} signature from the
              registered signer under the configured domain. An unsigned or wrongly signed report is not a price.
            </li>
            <li>
              <strong>Age.</strong> If the anchored price is older than {ORACLE_POLICY.maxPriceAgeSec} seconds, it is
              rejected. A price this old must not back new exposure.
            </li>
            <li>
              <strong>Future tolerance.</strong> A report timestamped more than {ORACLE_POLICY.futureToleranceSec}{' '}
              seconds into the future is rejected, because a clock that far ahead is a fault, not a fresh price.
            </li>
            <li>
              <strong>Confidence.</strong> If the report's confidence band is wider than the market allows, the trade
              reverts. Each market carries its own tolerance.
            </li>
          </ul>
          <p>
            When a check fails, the protocol refuses. It does not fall back to a cached number or a guess. A refused
            trade is the system working: it would rather not fill you than fill you on a number it cannot stand behind.
          </p>
        </Prose>
      </Section>

      <Section id="proves" title="What a signature proves, and what it does not">
        <Prose>
          <p>
            This is the section to read twice. A valid anchor signature carries a precise and narrow claim, and it is
            easy to read more into it than it says.
          </p>
        </Prose>
        <Callout tone="note" title="What the signature proves">
          A valid signature proves that the report the anchor holds came from the MIDNAT signer, under the configured
          domain and contract, and that it has not been altered since. You can recover the signer address from the
          signature and check it against the registered signer yourself.
        </Callout>
        <Callout tone="limit" title="What the signature does not prove">
          It does not prove the upstream price was correct. It does not prove the underlying market was liquid at that
          moment. It does not prove the value is fair, or that any trade happened at it anywhere else. Signing
          authenticates the messenger, not the market. A wrong price, correctly signed, is still a valid signature over
          a wrong price.
        </Callout>
        <Prose>
          <p>
            The same distinction runs through the whole trust stack. The{' '}
            <Link href="/verify" className="pub-link">
              verify page
            </Link>{' '}
            sets out, proof by proof, exactly what each one establishes and where it stops.
          </p>
        </Prose>
      </Section>

      <Section id="limits" title="Limitations you should know">
        <Prose>
          <ul>
            <li>
              <strong>{SINGLE_POSTER.title}.</strong> {SINGLE_POSTER.detail}
            </li>
            <li>
              <strong>{ANCHOR_PROVENANCE.title}.</strong> {ANCHOR_PROVENANCE.detail}
            </li>
          </ul>
          <p>
            The single poster is the sharpest of these in practice. If the poster stops, no fresh report reaches the
            anchor, the anchored price ages past {ORACLE_POLICY.maxPriceAgeSec} seconds, and the clearing house blocks
            new exposure until a report arrives again. That is the safe failure, but it is still a single point that can
            take the venue into close-only for reasons that have nothing to do with the market.
          </p>
          <p>{CANONICAL.noAudit}</p>
        </Prose>
      </Section>
    </DocsLayout>
  );
}
