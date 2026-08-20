import { type ReactNode } from 'react';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { KeyValue, Prose, RelatedLinks, Section, H3 } from '@/components/public/primitives';
import { SeamMark } from '@/components/landing/SeamMark';
import {  } from '@/lib/site-map';

/**
 * The brand page publishes DESIGN.md rather than reinventing it.
 *
 * Every colour swatch reads a live --ln-* token, so it can never drift from
 * the product, and both themes render the same page correctly. The mark is
 * the existing SeamMark component, imported, never redrawn by eye.
 */

const BANNED_WORDS = [
  'seamless',
  'unlock',
  'empower',
  'supercharge',
  'revolutionize',
  'cutting-edge',
  'best-in-class',
  'effortless',
  'game-changing',
  'next-generation',
  'blazing',
  'magic',
];

interface Swatch {
  readonly role: string;
  readonly token: string;
  readonly use: string;
}

const SWATCHES: readonly Swatch[] = [
  { role: 'Atmosphere', token: '--ln-card-bg', use: 'The pale ground under every surface. Never pure white, never cream.' },
  { role: 'Ink', token: '--ln-ink', use: 'Display text, buttons, linework. A near-black green, not black.' },
  { role: 'Structure accent', token: '--ln-accent', use: 'Rims, accent text, hairline hovers. Quiet and load bearing.' },
  { role: 'Life accent', token: '--ln-accent-hot', use: 'The one bright note. Used in slivers, never in fields.' },
];

interface VoiceExample {
  readonly bad: string;
  readonly good: string;
}

const VOICE: readonly VoiceExample[] = [
  {
    bad: 'MIDNAT unlocks seamless 24/7 exposure to the markets you love, empowering traders everywhere.',
    good: 'MIDNAT trades stock perpetuals around the clock. The underlying exchange closes at night; the protocol does not.',
  },
  {
    bad: 'Our revolutionary next-generation vault is the best-in-class way to earn effortless yield.',
    good: 'The vault is the counterparty to every position the clearing house opens. Liquidity providers earn fees and funding, and carry the venue\u2019s directional risk.',
  },
  {
    bad: 'Trade with total confidence: our battle-tested contracts are fully secure and audited to the highest standard.',
    good: 'Security claims are evidence-led: source, test coverage and completed reviews are named only when their evidence is public.',
  },
  {
    bad: 'Zero fees, zero gas, zero friction. Just pure trading, supercharged.',
    good: 'MIDNAT charges no protocol gas fee. X Layer still charges the sender for transactions that move funds, priced in OKB.',
  },
];

/** A colour chip that reads its fill from a live CSS variable, so it cannot drift. */
function ColorChip({ token }: { token: string }) {
  return (
    <div
      aria-hidden="true"
      className="h-16 w-full rounded-lg border border-[color:var(--ln-hairline)]"
      style={{ background: `var(${token})` }}
    />
  );
}

function DoBox({ label, tone, children }: { label: string; tone: 'do' | 'dont'; children: ReactNode }) {
  return (
    <div className="pub-card flex flex-col gap-4">
      <span
        className="pub-mono !text-[0.625rem] uppercase tracking-[0.14em]"
        style={{ color: tone === 'do' ? 'var(--ln-accent)' : 'var(--ln-ink-soft)' }}
      >
        {label}
      </span>
      <div className="flex items-center justify-center rounded-lg border border-[color:var(--ln-hairline-soft)] bg-[var(--ln-card-bg)] py-8">
        {children}
      </div>
    </div>
  );
}

export default function Brand() {
  return (
    <DocumentLayout
      meta={{
        title: 'Brand',
        description:
          'How to write the MIDNAT name, use the mark, read the palette from live tokens, set the type, and write in the brand voice.',
        path: '/brand',
      }}
      eyebrow="Brand"
      title="Brand"
      standfirst="The MIDNAT brand system, published from the design contract it is built on. The palette below reads live product tokens, so what you see is what ships."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Brand' }]}
      width="doc"
      after={
        <RelatedLinks
          title="Related"
          links={[
            { label: 'About MIDNAT', href: '/about', summary: 'What the project is, and what it is not.' },
          ]}
        />
      }
    >
      <Section id="name" title="The name">
        <Prose>
          {/* brand-contract: allow-invalid-name:start */}
          <p>
            The name is MIDNAT, always in uppercase. It is never written Midnat, never MidNat and never Midnight. It is
            one word, no space, no hyphen. In running prose it stays uppercase because it reads as a mark, not a common
            noun.
          </p>
          {/* brand-contract: allow-invalid-name:end */}
          <p>
            MIDNAT is midnight in Danish. The name carries the whole argument: the oldest exchange in the world closed at
            sunset, and these markets do not.
          </p>
        </Prose>
        {/* brand-contract: allow-invalid-name:start */}
        <KeyValue
          items={[
            { key: 'Correct', value: 'MIDNAT' },
            { key: 'Incorrect', value: 'Midnat, MidNat, Midnight, midnat' },
            { key: 'In a sentence', value: 'MIDNAT trades stock perpetuals around the clock.' },
          ]}
        />
        {/* brand-contract: allow-invalid-name:end */}
      </Section>

      <Section id="mark" title="The mark">
        <Prose>
          <p>
            The mark is the seam: a disc with a single dividing curve, the boundary between one side of a market and the
            other. It is rendered here from the same component the product uses. It inherits the ink colour of whatever
            surrounds it, so it is correct in both themes without a second file.
          </p>
        </Prose>
        <div className="pub-card flex flex-wrap items-center gap-x-10 gap-y-6">
          <SeamMark size={72} className="text-[color:var(--ln-ink)]" />
          <div className="flex items-baseline gap-[0.22em] font-bold tracking-tighter uppercase leading-[0.8] text-[color:var(--ln-ink)] text-[3rem]">
            <SeamMark size="0.78em" className="translate-y-[0.1em]" />
            <span>MIDNAT</span>
          </div>
        </div>
        <Prose>
          <p>
            The lockup pairs the mark with the wordmark at the mark{'\u2019'}s baseline. The mark may also stand alone, at small
            sizes and in the footer, where the wordmark is already present.
          </p>
        </Prose>
        <H3 id="mark-clear-space">Clear space and minimum size</H3>
        <Prose>
          <p>
            Keep clear space around the mark equal to the height of the mark itself. Nothing crowds it: no rule, no
            text, no second mark inside that margin. Below 16 pixels the seam curve stops reading, so the mark is not
            used smaller than that. The wordmark is not set below 14 pixels.
          </p>
        </Prose>
        <KeyValue
          items={[
            { key: 'Clear space', value: 'One mark-height on every side' },
            { key: 'Minimum mark size', value: '16 px' },
            { key: 'Minimum wordmark size', value: '14 px' },
            { key: 'Colour', value: 'Ink on light ground, mist on dark ground, always via the ink token' },
          ]}
        />
      </Section>

      <Section id="usage" title="Correct and incorrect usage">
        <Prose>
          <p>
            The examples below are rendered, not described. The correct column uses the ink token on the pale ground.
            The incorrect column shows the two mistakes people make most: recolouring the mark into the life accent, and
            stretching it out of its square.
          </p>
        </Prose>
        <div className="grid gap-4 sm:grid-cols-2">
          <DoBox label="Correct" tone="do">
            <SeamMark size={56} className="text-[color:var(--ln-ink)]" />
          </DoBox>
          <DoBox label="Incorrect: recoloured into the bright accent" tone="dont">
            <SeamMark size={56} className="text-[color:var(--ln-accent-hot)]" />
          </DoBox>
          <DoBox label="Correct" tone="do">
            <div className="flex items-baseline gap-[0.22em] font-bold tracking-tighter uppercase leading-[0.8] text-[color:var(--ln-ink)] text-[2rem]">
              <SeamMark size="0.78em" className="translate-y-[0.1em]" />
              <span>MIDNAT</span>
            </div>
          </DoBox>
          <DoBox label="Incorrect: stretched out of square" tone="dont">
            <div className="scale-x-[1.6] text-[color:var(--ln-ink)]">
              <SeamMark size={56} />
            </div>
          </DoBox>
        </div>
        <Prose>
          <ul>
            <li>Do not recolour the mark. The seam carries no position meaning, so it is never the long-green or short-red of the app.</li>
            <li>Do not distort, rotate or add effects. The mark is one flat fill.</li>
            <li>Do not place the mark on a busy image or a low-contrast field. It needs the ground or clean ink around it.</li>
            <li>Do not lock the mark to any hue outside the one green family.</li>
          </ul>
        </Prose>
      </Section>

      <Section id="palette" title="Palette">
        <Prose>
          <p>
            One hue family, four roles, two accent steps. The premium comes from tonality: every colour is the same
            green at a different luminance. There is no blue, no navy and no foreign hue. Each swatch below reads its
            value from the live product token, so it stays correct in both themes and can never drift from what ships.
          </p>
        </Prose>
        <div className="grid gap-4 sm:grid-cols-2">
          {SWATCHES.map((s) => (
            <div key={s.token} className="pub-card flex flex-col gap-3">
              <ColorChip token={s.token} />
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="pub-h4">{s.role}</span>
                <code className="pub-mono !text-[0.75rem] text-[color:var(--ln-ink-soft)]">var({s.token})</code>
              </div>
              <p className="pub-small">{s.use}</p>
            </div>
          ))}
        </div>
        <Prose>
          <p>
            Colour is only ever set through these tokens. A hex literal on a MIDNAT surface is a defect, because it
            cannot follow the theme and it drifts the first time a token changes. Purple, violet, neon on black and any
            warm cream are outside the system.
          </p>
        </Prose>
      </Section>

      <Section id="type" title="Typeface">
        <Prose>
          <p>
            The typeface is Satoshi. Display headlines are set at weight 700 with tight tracking; body copy is 400 to
            500. Weight 300 is not used for display or body, because thin type reads weak on the pale ground. Mono is
            reserved for small labels, addresses and tabular figures.
          </p>
        </Prose>
        <div className="pub-card flex flex-col gap-6">
          <div>
            <span className="pub-eyebrow">Display, weight 700</span>
            <div className="font-bold tracking-tighter text-[color:var(--ln-ink)] text-[2.5rem] leading-[1.02]">
              Always open
            </div>
          </div>
          <div>
            <span className="pub-eyebrow">Body, weight 400 to 500</span>
            <p className="pub-body">
              Short declarative sentences. Quiet confidence. Explain the mechanics and let the reader draw the
              conclusion.
            </p>
          </div>
          <div>
            <span className="pub-eyebrow">Mono, small labels and figures</span>
            <p className="pub-mono !text-[0.8125rem] uppercase tracking-[0.12em] text-[color:var(--ln-ink-body)]">
              X Layer Testnet
            </p>
          </div>
        </div>
        <KeyValue
          items={[
            { key: 'Family', value: 'Satoshi' },
            { key: 'Weights in use', value: '400, 500, 700' },
            { key: 'Display tracking', value: '-0.03em, tight' },
            { key: 'Retired', value: 'Weight 300, serifs, Inter and Space Grotesk as display' },
          ]}
        />
      </Section>

      <Section id="voice" title="Voice">
        <Prose>
          <p>
            The voice is precise, plain and institutional. Short sentences. No exclamation marks, no rhetorical
            questions as headings, no em dashes or en dashes. Headings are sentence case. The reader is intelligent and
            busy, so the copy explains and does not sell.
          </p>
          <p>Each pair below shows a sentence written the wrong way, then the same claim written in the brand voice.</p>
        </Prose>
        <div className="flex flex-col gap-4">
          {VOICE.map((v) => (
            <div key={v.good} className="pub-card flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="pub-mono !text-[0.625rem] uppercase tracking-[0.14em] text-[color:var(--ln-ink-soft)]">
                  Off brand
                </span>
                <p className="pub-body !text-[0.9375rem] text-[color:var(--ln-ink-soft)] line-through decoration-1">
                  {v.bad}
                </p>
              </div>
              <div className="h-px w-full bg-[color:var(--ln-hairline-soft)]" />
              <div className="flex flex-col gap-1.5">
                <span className="pub-mono !text-[0.625rem] uppercase tracking-[0.14em]" style={{ color: 'var(--ln-accent)' }}>
                  On brand
                </span>
                <p className="pub-body !text-[0.9375rem]">{v.good}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="banned" title="Words the brand does not use">
        <Prose>
          <p>
            These words describe nothing and promise everything, so they are banned from MIDNAT copy. The words
            <span className="italic"> simply </span>
            and
            <span className="italic"> just </span>
            are also banned when they are used to minimise risk.
          </p>
        </Prose>
        <div className="flex flex-wrap gap-2">
          {BANNED_WORDS.map((w) => (
            <span
              key={w}
              className="pub-mono !text-[0.75rem] rounded border border-[color:var(--ln-hairline)] bg-[var(--ln-card-bg)] px-2.5 py-1 text-[color:var(--ln-ink-soft)] line-through decoration-1"
            >
              {w}
            </span>
          ))}
        </div>
      </Section>

      <Section id="assets" title="Where the source of truth lives">
        <Prose>
          <p>
            There is no downloadable brand kit. Publishing static asset files would let them drift from the product,
            which is the one thing this page exists to prevent. The mark on this page is the same component the interface
            renders, and every colour reads a live token.
          </p>
          <p>
            The source of truth for the visual system is the design contract and the token definitions the product
            builds from, never this page and never a screenshot of it. Where the two disagree, the tokens win: this
            page reads them live, so it follows the product rather than leading it.
          </p>
        </Prose>
      </Section>

      <Section id="limits" title="What this page does not settle">
        <Prose>
          <p>
            This page describes a brand for a testnet software project. It is not a trademark claim, and no registration
            is asserted here. The palette and the mark may change as the design contract changes; when they do, this
            page changes with them, because it reads the same tokens the product does rather than a frozen copy.
          </p>
          <p>
            Nothing on this page is a statement about the protocol{'\u2019'}s safety, its status or its economics. For those,
            read the protocol pages, not the brand page.
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
