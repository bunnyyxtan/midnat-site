import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { Callout, KeyValue, PrintButton, Prose, Section } from '@/components/public/primitives';
import { docHref, legalBySlug, legalHref } from '@/lib/site-map';
import { CANONICAL, INTELLIGENCE, utcDate } from '@/lib/protocol-registry';

const DOC = legalBySlug('ai-disclosure')!;

export default function AiDisclosure() {
  return (
    <DocumentLayout
      meta={{ title: DOC.title, description: DOC.summary, path: legalHref(DOC.slug), type: 'article' }}
      eyebrow="Legal"
      title={DOC.title}
      standfirst="What the model layer is, which model answers you, and the limits placed on it. Its output is generated text and it can be wrong."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Legal', href: '/legal' }, { label: DOC.title }]}
      headerMeta={[{ label: 'Updated', value: utcDate(DOC.updated) }]}
      actions={<PrintButton />}
      width="prose"
    >
      <Callout tone="caution" title="Generated text can be wrong">
        MIDNAT Intelligence produces text from a language model. Treat every answer as a draft that can be mistaken,
        out of date or incomplete, and check anything you would act on. {CANONICAL.notAdvice}
      </Callout>

      <Section id="what" title="What the model layer is">
        <Prose>
          <p>
            MIDNAT Intelligence is a language model layer that reads market context and returns written explanations. It
            runs through {INTELLIGENCE.provider} against a named model. It is not a source of truth and it is not part of
            the contracts: the protocol never reads a model output, and no trade depends on one.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Provider', value: INTELLIGENCE.provider },
            { key: 'Default model', value: <code className="pub-mono">{INTELLIGENCE.defaultModel}</code> },
            { key: 'Desk refresh', value: `Every ${INTELLIGENCE.deskRefreshMinutes} minutes` },
            {
              key: 'Ask rate limit',
              value: `${INTELLIGENCE.askRequestsPerMinutePerIp} per minute per IP, ${INTELLIGENCE.askConcurrentRequests} concurrent`,
            },
          ]}
        />
      </Section>

      <Section id="context" title="What the model sees">
        <Prose>
          <p>
            The model does not see your account or your positions unless the request you make includes them. There is no
            account here for it to read. When a request carries position facts, those are computed on the server and
            added to the context for that one answer; your wallet address itself is not placed in the message sent to
            the model.
          </p>
          <p>
            Anything you type into the ask endpoint is sent to {INTELLIGENCE.provider} to produce the answer. What that
            provider does with it is governed by the provider, not by this project. The{' '}
            <Link href="/legal/privacy" className="pub-link">
              privacy notice
            </Link>{' '}
            sets out the data flow.
          </p>
        </Prose>
      </Section>

      <Section id="provenance" title="What the provenance hashes prove">
        <Prose>
          <p>
            Each answer is recorded with a set of provenance fields, including hashes of the inputs, the analysis
            context and the output, along with the model string and the time it was generated. These hashes let you
            confirm that a given answer is the one that was returned for a given input.
          </p>
          <p>
            They prove what was returned, not that it was correct. A hash authenticates the record, it does not
            establish that the text is accurate, current or suitable. A confidently worded and correctly hashed answer
            can still be wrong.
          </p>
        </Prose>
      </Section>

      <Section id="guardrails" title="What the model may never do">
        <Prose>
          <p>
            The model may not give investment advice, make a recommendation, or predict a price. These limits are
            enforced on the server: requests are routed through guardrails that reject or rewrite outputs that cross
            them, before the answer reaches you, rather than relying on the model to police itself.
          </p>
          <p>
            Server side enforcement reduces the chance of a prohibited answer, it does not make it impossible. If you
            ever see the model appear to offer advice or a forecast, that is a defect, not a feature you may rely on.{' '}
            {CANONICAL.notAdvice}
          </p>
        </Prose>
      </Section>

      <Section id="model-changes" title="The model can change">
        <Prose>
          <p>
            The model string can change. The default is{' '}
            <code className="pub-mono">{INTELLIGENCE.defaultModel}</code>, and an operator can override it through the{' '}
            <code className="pub-mono">{INTELLIGENCE.modelOverrideEnv}</code> setting. The recorded model field in the
            provenance for each answer is how you tell which model actually produced it, rather than assuming the
            default.
          </p>
        </Prose>
      </Section>

      <Section id="limits" title="What this layer does not establish">
        <Prose>
          <p>
            An answer from MIDNAT Intelligence is not a statement by the protocol, not a warranty of any outcome, and
            not a substitute for reading the documentation or the contracts yourself. It establishes nothing about the
            markets beyond having been generated at a moment in time.
          </p>
          <p>{CANONICAL.testnet}</p>
          <p>{CANONICAL.noAudit}</p>
          <p>
            The mechanics of the model layer, what it reads and how each answer is hashed, are documented in full at{' '}
            <Link href={docHref('intelligence')} className="pub-link">
              MIDNAT Intelligence
            </Link>
            .
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
