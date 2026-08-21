import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, Eyebrow, Prose, Section } from '@/components/public/primitives';
import { DOC_GROUPS, docHref, docsByGroup } from '@/lib/site-map';
import { CANONICAL, LEVERAGE_RANGE, MARKETS, COLLATERAL, NETWORK } from '@/lib/protocol-registry';

export default function DocsIndex() {
  return (
    <DocsLayout
      slug=""
      title="Documentation"
      standfirst={
        <>
          Everything MIDNAT does, written down. The protocol is a synthetic equity perpetuals exchange on{' '}
          {NETWORK.label}: {MARKETS.length} listed markets, one {COLLATERAL.symbol} collateral asset, one vault standing
          as counterparty, and a price that keeps working when the underlying exchange is closed.
        </>
      }
      meta={{
        title: 'Documentation',
        description:
          'Reference documentation for MIDNAT: how the protocol works, how positions and margin behave, how the vault prices risk, and where reference prices come from.',
        path: '/docs',
      }}
    >
      <Callout tone="caution" title="Read this first">
        {CANONICAL.testnet} {CANONICAL.noAudit}
      </Callout>
      <Callout tone="note" title="Four balances, four different jobs">
        Wallet holds {COLLATERAL.symbol} before deposit. Trading Account balance funds new positions and orders. Reserved
        margin is already committed to an open position or resting order. LP Vault deposits are a separate
        liquidity-provider position and never fund your Trading Account.
      </Callout>

      <Section id="paths" title="Three ways in">
        <Prose>
          <p>
            The documentation is written for three readers and it does not pretend they want the same thing. Pick the
            path that matches why you are here.
          </p>
        </Prose>
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          <PathCard
            title="I want to trade"
            href={docHref('getting-started')}
            body={`Start with getting started, then positions and margin. Leverage runs from ${LEVERAGE_RANGE.min}x to ${LEVERAGE_RANGE.max}x depending on the market tier.`}
          />
          <PathCard
            title="I want to provide liquidity"
            href={docHref('vault')}
            body="Read the vault page and then deferred payouts. The second one is the part most LPs are never told about."
          />
          <PathCard
            title="I want to build on it"
            href={docHref('api')}
            body="The HTTP API and the contract interfaces. Addresses and verification state live on the contracts page."
          />
        </ul>
      </Section>

      <Section id="contents" title="Contents">
        <div className="flex flex-col gap-10">
          {DOC_GROUPS.map((group) => {
            const docs = docsByGroup(group.id);
            if (docs.length === 0) return null;
            return (
              <div key={group.id} className="flex flex-col gap-4">
                <Eyebrow>{group.title}</Eyebrow>
                <ul className="flex flex-col gap-0 list-none p-0 m-0 border-t border-[color:var(--ln-hairline-soft)]">
                  {docs.map((doc) => (
                    <li key={doc.slug} className="border-b border-[color:var(--ln-hairline-soft)]">
                      <Link
                        href={docHref(doc.slug)}
                        className="group flex flex-col gap-1 py-4 no-underline"
                        data-testid={`docs-index-${doc.slug}`}
                      >
                        <span className="text-[1.0625rem] font-medium text-[color:var(--ln-ink)] group-hover:text-[color:var(--ln-accent)] transition-colors">
                          {doc.title}
                        </span>
                        <span className="pub-small pub-measure">{doc.summary}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="conventions" title="Conventions used here">
        <Prose>
          <ul>
            <li>
              Every protocol number on this site is read from the deployment manifest that the deploy script wrote, so
              it matches the contracts as deployed. This site is static: if a parameter is changed on chain afterwards,
              the page follows at the next publish, not at the moment of the change. The terminal reads such values
              live from the contract.
            </li>
            <li>
              Claims carry a status label. <strong>Live on testnet</strong> means it is deployed and running.{' '}
              <strong>Implemented</strong> means a tested, production-grade capability is available in the protocol;
              its deployment status is shown separately. <strong>Planned</strong> and <strong>research</strong> mean
              exactly what they say and nothing is built.
            </li>
            <li>
              Terms are defined once, in the <Link href={docHref('glossary')} className="pub-link">glossary</Link>. If a page
              seems to define a term differently, the glossary is correct and the page is a bug.
            </li>
            <li>
              Deployment scope and assurance boundaries are published in full on the{' '}
              <Link href="/security" className="pub-link">security page</Link>, including the ones that are awkward.
            </li>
          </ul>
        </Prose>
      </Section>
    </DocsLayout>
  );
}

function PathCard({ title, href, body }: { title: string; href: string; body: string }) {
  return (
    <li className="contents">
      <Link
        href={href}
        className="pub-card pub-card-interactive no-underline grid gap-x-6 gap-y-1 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline"
      >
        <span className="pub-h4">{title}</span>
        <span className="pub-small">{body}</span>
      </Link>
    </li>
  );
}
