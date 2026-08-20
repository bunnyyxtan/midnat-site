import { Link } from 'wouter';
import { DocsLayout } from '@/components/public/DocsLayout';
import { Callout, KeyValue, Prose, Section, StatusBadge, TableScroll } from '@/components/public/primitives';
import { docBySlug, docHref } from '@/lib/site-map';
import { CANONICAL, INTELLIGENCE } from '@/lib/protocol-registry';

const DOC = docBySlug('intelligence')!;

/** One row per provenance field, with what checking it actually lets you do. */
const PROVENANCE_MEANING: Record<string, string> = {
  analysisContextHash: 'Hash of the analysis context the model was given. Lets you check that two answers were produced against the same context, or that a context has not changed under you.',
  inputsHash: 'Hash of the exact inputs assembled for the answer. Proves what the model was shown, so an answer cannot later be attributed to inputs it never saw.',
  outputHash: 'Hash of the exact output text. Proves what was said, so a quoted answer can be matched against the one that was actually generated.',
  model: 'The model string that produced the answer. Tells you which model spoke, and lets you see when an operator override changed it.',
  generatedAt: 'The timestamp the answer was generated. Lets you judge how old it is against the data it read.',
  policyVersion: 'The version of the answering policy in force. Lets you tell whether a rule change sits between two answers.',
  riskEngineVersion: 'The version of the deterministic risk engine whose numbers the answer may repeat.',
  guidancePolicyVersion: 'The version of the guidance policy that constrains what the model may and may not say.',
};

export default function Intelligence() {
  return (
    <DocsLayout
      slug={DOC.slug}
      title={DOC.title}
      standfirst="A language model sits over the protocol and explains it in words. This page sets out what it reads, what it may say, what it may never say, and why a hash proves what was said rather than that it was right."
      meta={{ title: DOC.title, description: DOC.summary, path: docHref(DOC.slug), type: 'article' }}
    >
      <Section id="model" title="The model layer">
        <div className="flex items-center gap-3">
          <StatusBadge status="IMPLEMENTED" />
        </div>
        <Prose>
          <p>
            MIDNAT Intelligence is a language model layer that reads protocol state and reference data and describes it
            in plain language. It runs through {INTELLIGENCE.provider}. The default model is{' '}
            <span className="pub-mono">{INTELLIGENCE.defaultModel}</span>, and an operator can override it through the{' '}
            <span className="pub-mono">{INTELLIGENCE.modelOverrideEnv}</span> environment variable, so the exact model
            answering you can change. The provenance record attached to every answer names the model that produced it,
            so you never have to guess which one spoke.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Provider', value: INTELLIGENCE.provider },
            { key: 'Default model', value: <span className="pub-mono">{INTELLIGENCE.defaultModel}</span> },
            { key: 'Model override variable', value: <span className="pub-mono">{INTELLIGENCE.modelOverrideEnv}</span> },
            { key: 'Desk refresh interval', value: `${INTELLIGENCE.deskRefreshMinutes} minutes` },
            {
              key: 'Ask rate limit',
              value: `${INTELLIGENCE.askQuestionsPerMinute} questions per minute, ${INTELLIGENCE.askQuestionsPerMinuteConnected} with a wallet connected`,
            },
            {
              key: 'Shared address ceiling',
              value: `${INTELLIGENCE.askQuestionsPerMinutePerAddress} questions per minute across one address`,
            },
            { key: 'Ask concurrency', value: `${INTELLIGENCE.askConcurrentRequests} in flight at once` },
            {
              key: 'Daily allowance',
              value: `${INTELLIGENCE.askUnitsPerDayConnected} units with a wallet connected, ${INTELLIGENCE.askUnitsPerDayVisitor} without`,
            },
            {
              key: 'What a question costs',
              value: `${INTELLIGENCE.askUnitsPerQuestion} unit, or ${INTELLIGENCE.askUnitsPerPortfolioQuestion} for a whole-portfolio question`,
            },
          ]}
        />
        <Prose>
          <p>
            The per-minute ceilings are there to stop scripts, not people. The allowance that a working trader can
            actually reach is the daily one: {INTELLIGENCE.askUnitsPerDayConnected} units with a wallet connected and{' '}
            {INTELLIGENCE.askUnitsPerDayVisitor} without, refilling steadily across{' '}
            {INTELLIGENCE.askUnitsRefillHours} hours rather than resetting at a fixed hour. A question about a market,
            an order or a position costs one unit. A question about the whole portfolio costs two, because the server
            assembles and sends more. Answers the deterministic engine produces on its own draw no units at all.
          </p>
          <p>
            Model capacity for the day is finite for MIDNAT as well. When it runs out, Intelligence degrades to the
            deterministic copy described above for everyone, rather than queueing anyone behind it. You are told when an
            allowance is what shortened an answer.
          </p>
        </Prose>
      </Section>

      <Section id="reads" title="What the model reads">
        <Prose>
          <p>
            The model does not fetch anything itself. The server assembles a fact pack for it: protocol state and
            reference data, already computed by the deterministic engine. That includes the reference state and quality,
            the sentinel level, the market regime, caps and effective leverage, and, for order and position questions,
            the geometry, costs and risk of the specific position in view.
          </p>
          <p>
            The ambient market desk refreshes on a baseline interval of {INTELLIGENCE.deskRefreshMinutes} minutes, with
            event-driven refreshes in between, so it is a recent read rather than a per-second live one. Order and ask
            answers are generated on demand against a snapshot of the context at that moment.
          </p>
        </Prose>
      </Section>

      <Section id="says" title="What it may say and what it may never say">
        <Prose>
          <p>
            The model writes interpretation, not numbers. Every number in an answer comes from the deterministic fact
            pack; the model is only allowed to repeat those, never to compute or invent its own. Scenario rows and
            leverage comparisons are calculated deterministically by the server, not by the model.
          </p>
          <ul>
            <li>
              <strong>It may</strong> explain a mechanism, describe the current state in words, walk through a
              server-computed scenario, and lay out the structure and sensitivity of an order you are looking at.
            </li>
            <li>
              <strong>It may never</strong> predict a price, give advice or a recommendation, or state a number that is
              not in the fact pack. Requests for advice and unsupported queries are refused. If the model is unavailable
              or its output fails validation, the server returns deterministic copy of the same shape rather than a
              guess.
            </li>
          </ul>
        </Prose>
        <Callout tone="caution" title="A language model can be wrong">
          Even inside these guardrails, the model can misread the state, phrase something misleadingly or draw a wrong
          conclusion from correct numbers. The guardrails constrain what it is allowed to output. They do not make its
          interpretation correct. Read what it says as one reading of the data, not as fact.
        </Callout>
      </Section>

      <Section id="provenance" title="The provenance record">
        <Prose>
          <p>
            Every answer carries a provenance record. It exists so a reader can check the origin and integrity of an
            answer rather than take it on trust. Each field lets you verify a specific thing.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">What it lets you check</th>
              </tr>
            </thead>
            <tbody>
              {INTELLIGENCE.provenanceFields.map((field) => (
                <tr key={field}>
                  <td>
                    <span className="pub-mono">{field}</span>
                  </td>
                  <td>{PROVENANCE_MEANING[field] ?? 'A versioned provenance field attached to the answer.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <Callout tone="limit" title="A hash proves what was said, not that it was right">
          Hashing the inputs and the output proves that a given answer was produced from given inputs and has not been
          altered since. It says nothing about whether the answer was correct, whether its reading of the data was
          sound, or whether acting on it would have been wise. Integrity is not accuracy.
        </Callout>
      </Section>

      <Section id="limits" title="What this layer is not">
        <Prose>
          <ul>
            <li>{CANONICAL.notAdvice}</li>
            <li>
              Nothing the model produces executes anything. An order draft is text you can choose to act on, never a
              trade placed on your behalf.
            </li>
            <li>
              The ambient desk is a recent read, not a live one, and a question can only be answered about a position or
              portfolio when an address is provided. Rate limits apply: at most{' '}
              {INTELLIGENCE.askQuestionsPerMinute} questions per minute for a visitor,{' '}
              {INTELLIGENCE.askQuestionsPerMinuteConnected} with a wallet connected, and{' '}
              {INTELLIGENCE.askConcurrentRequests} in flight at once.
            </li>
          </ul>
          <p>
            The{' '}
            <Link href="/legal/ai-disclosure" className="pub-link">
              AI disclosure
            </Link>{' '}
            states in full what this layer does, which model answers you and the limits placed on it.
          </p>
        </Prose>
      </Section>
    </DocsLayout>
  );
}
