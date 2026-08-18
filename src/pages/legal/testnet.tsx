import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { Callout, PrintButton, Prose, Section } from '@/components/public/primitives';
import { legalBySlug, legalHref } from '@/lib/site-map';
import { CANONICAL, COLLATERAL, NETWORK, utcDate } from '@/lib/protocol-registry';

const DOC = legalBySlug('testnet')!;

export default function TestnetDisclosure() {
  return (
    <DocumentLayout
      meta={{ title: DOC.title, description: DOC.summary, path: legalHref(DOC.slug), type: 'article' }}
      eyebrow="Legal"
      title={DOC.title}
      standfirst="What a testnet deployment means for your balances, your positions and how long any of this lasts."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Legal', href: '/legal' }, { label: DOC.title }]}
      headerMeta={[{ label: 'Updated', value: utcDate(DOC.updated) }]}
      actions={<PrintButton />}
      width="prose"
    >
      <Callout tone="caution" title="The short version">
        {CANONICAL.testnet}
      </Callout>

      <Section id="network" title="The network">
        <Prose>
          <p>
            MIDNAT is deployed to {NETWORK.label}, chain {NETWORK.chainId}. A test network exists so that software can be
            exercised against real infrastructure without real money moving. Its tokens are distributed by faucets, its
            state can be discarded by the people who operate it, and nothing on it is a claim on anything off it.
          </p>
        </Prose>
      </Section>

      <Section id="where-state-lives" title="Where your state actually lives">
        <Prose>
          <p>{CANONICAL.architecture}</p>
          <p>{CANONICAL.tradingPath}</p>
        </Prose>
      </Section>

      <Section id="value" title="Your balances have no monetary value">
        <Prose>
          <p>
            Collateral on this deployment is {COLLATERAL.name}, held at a testnet address. Whatever it is called and
            however it is displayed, a testnet token is not the mainnet asset it shares a name with. It cannot be
            redeemed, bridged to value, sold, or converted into anything you can spend.
          </p>
          <p>
            The same applies to everything derived from it: position profit and loss, vault shares, deferred payout
            claims and any number the interface prints next to a currency symbol. They are figures in a test system.
          </p>
        </Prose>
      </Section>

      <Section id="lifetime" title="This deployment can be replaced without notice">
        <Prose>
          <p>
            The contracts may be redeployed, the markets may be relisted with different parameters, and the deployment
            may be pointed at new addresses at any time. If that happens, positions and vault shares held against the old
            contracts do not carry over. There is no migration guarantee and no snapshot promise.
          </p>
          <p>
            The network operator can also reset the chain itself. That is outside our control entirely, and no action on
            our side would preserve your state through it.
          </p>
        </Prose>
      </Section>

      <Section id="availability" title="No availability commitment">
        <Prose>
          <p>
            The interface, the API, the price poster and the reference engine are run on best effort. They can stop.
            When the price poster stops, anchored prices go stale and the protocol refuses new exposure, which is the
            intended behaviour and can still leave you unable to act when you want to.
          </p>
          <p>
            Nothing here promises uptime, and no page on this site publishes an uptime figure, because nothing in this
            project measures one.{' '}
            <Link href="/status" className="pub-link">
              The status page
            </Link>{' '}
            shows live reads at the moment you load it and makes no historical claim.
          </p>
        </Prose>
      </Section>

      <Section id="not-a-preview" title="Testnet behaviour is not a mainnet promise">
        <Prose>
          <p>
            Parameters, tiers, fees and limits on this deployment are the settings we are testing with. They are not a
            commitment to what any future deployment would use, and they should not be read as a preview of terms.
          </p>
          <p>
            Equally, working correctly here does not establish that the system is safe with real money.{' '}
            {CANONICAL.noAudit}
          </p>
        </Prose>
      </Section>

      <Section id="related" title="Related documents">
        <Prose>
          <ul>
            <li>
              <Link href="/legal/risk-disclosure" className="pub-link">
                Risk disclosure
              </Link>
              , the ways a position can lose everything assigned to it.
            </li>
            <li>
              <Link href="/legal/terms" className="pub-link">
                Terms of use
              </Link>
              , the terms under which you may use the interface.
            </li>
            <li>
              <Link href="/security" className="pub-link">
                Security
              </Link>
              , what is verified, what is concentrated in one key, and what has never been exercised.
            </li>
          </ul>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
