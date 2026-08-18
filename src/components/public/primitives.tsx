import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { Check, Copy, ArrowUpRight, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  STATUS_LABEL,
  FRESHNESS_LABEL,
  explorerAddress,
  explorerTx,
  shortAddress,
  type Freshness,
  type ImplementationStatus,
} from '@/lib/protocol-registry';

/* =========================================================================
   MIDNAT public document primitives.

   Every public page is built from these. They exist so that a table on the
   fees page and a table in the whitepaper are the same object, so that every
   address on the site truncates and copies identically, and so that a claim
   can never be rendered without its status.
   ========================================================================= */

/* -------------------------------------------------------------------------
   Type
   ------------------------------------------------------------------------- */

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`pub-eyebrow ${className}`}>{children}</div>;
}

export function Lead({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`pub-lead pub-measure ${className}`}>{children}</p>;
}

export function Body({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`pub-body pub-measure ${className}`}>{children}</p>;
}

export function Small({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`pub-small ${className}`}>{children}</p>;
}

/** Prose block: sets the reading rhythm for a run of paragraphs and lists. */
export function Prose({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`pub-prose pub-measure ${className}`}>{children}</div>;
}

export function Rule({ soft = false, className = '' }: { soft?: boolean; className?: string }) {
  return <hr className={`${soft ? 'pub-rule-soft' : 'pub-rule'} ${className}`} />;
}

/* -------------------------------------------------------------------------
   Anchored headings. Every section on a public page is addressable.
   ------------------------------------------------------------------------- */

interface HeadingProps {
  id: string;
  children: ReactNode;
  className?: string;
  /** Excluded from the table of contents when false. */
  toc?: boolean;
}

export function H2({ id, children, className = '', toc = true }: HeadingProps) {
  return (
    <h2
      id={id}
      className={`pub-h2 pub-anchor ${className}`}
      data-toc={toc ? '2' : undefined}
      data-toc-title={typeof children === 'string' ? children : undefined}
    >
      <a href={`#${id}`} className="pub-anchor-link" aria-label="Link to this section" tabIndex={-1}>
        #
      </a>
      {children}
    </h2>
  );
}

export function H3({ id, children, className = '', toc = true }: HeadingProps) {
  return (
    <h3
      id={id}
      className={`pub-h3 pub-anchor ${className}`}
      data-toc={toc ? '3' : undefined}
      data-toc-title={typeof children === 'string' ? children : undefined}
    >
      <a href={`#${id}`} className="pub-anchor-link" aria-label="Link to this section" tabIndex={-1}>
        #
      </a>
      {children}
    </h3>
  );
}

export function H4({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h4 className={`pub-h4 ${className}`}>{children}</h4>;
}

/** A titled block of a document: heading plus its content, with the right rhythm. */
export function Section({
  id,
  title,
  children,
  eyebrow,
  className = '',
}: {
  id: string;
  title: string;
  children: ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <section className={`scroll-mt-28 ${className}`} aria-labelledby={id}>
      {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
      <H2 id={id}>{title}</H2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   Status and freshness. A claim without one of these is not allowed on a
   protocol page.
   ------------------------------------------------------------------------- */

const STATUS_TONE: Record<ImplementationStatus, string> = {
  LIVE_ON_TESTNET: 'pub-badge-live',
  IMPLEMENTED: 'pub-badge-neutral',
  PARTIALLY_IMPLEMENTED: 'pub-badge-neutral',
  PLANNED: 'pub-badge-quiet',
  RESEARCH: 'pub-badge-quiet',
  NOT_IMPLEMENTED: 'pub-badge-quiet',
};

export function StatusBadge({ status, className = '' }: { status: ImplementationStatus; className?: string }) {
  return (
    <span className={`pub-badge ${STATUS_TONE[status]} ${className}`} data-testid={`status-${status}`}>
      {status === 'LIVE_ON_TESTNET' ? <span className="pub-badge-dot" aria-hidden="true" /> : null}
      {STATUS_LABEL[status]}
    </span>
  );
}

export function FreshnessBadge({ freshness, note }: { freshness: Freshness; note?: string }) {
  return (
    <span className="pub-badge pub-badge-quiet" title={note}>
      {FRESHNESS_LABEL[freshness]}
    </span>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'live' | 'quiet' }) {
  return <span className={`pub-badge pub-badge-${tone}`}>{children}</span>;
}

/* -------------------------------------------------------------------------
   Callouts
   ------------------------------------------------------------------------- */

export function Callout({
  tone = 'note',
  title,
  children,
  className = '',
}: {
  tone?: 'note' | 'caution' | 'limit';
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const toneClass = tone === 'caution' ? 'pub-callout-caution' : tone === 'limit' ? 'pub-callout-limit' : '';
  return (
    <aside className={`pub-callout ${toneClass} ${className}`} data-testid={`callout-${tone}`}>
      {title ? <div className="pub-callout-title">{title}</div> : null}
      <div className="pub-body !text-[0.9375rem] [&>*+*]:mt-2">{children}</div>
    </aside>
  );
}

/* -------------------------------------------------------------------------
   Copy to clipboard
   ------------------------------------------------------------------------- */

async function writeClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to the legacy path: clipboard API is origin gated */
  }
  try {
    const el = document.createElement('textarea');
    el.value = value;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const onCopy = useCallback(async () => {
    const ok = await writeClipboard(value);
    setState(ok ? 'copied' : 'failed');
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 1800);
  }, [value]);

  return (
    <button type="button" onClick={onCopy} className="pub-copy-btn pub-no-print" aria-label={`${label}: ${value}`}>
      {state === 'copied' ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2} />}
      <span className="pub-mono !text-[0.625rem] uppercase tracking-[0.1em]">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Blocked' : label}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------
   Addresses and transactions (directive section 26)
   ------------------------------------------------------------------------- */

export function AddressDisplay({
  value,
  kind = 'address',
  full = false,
  label,
}: {
  value: string;
  kind?: 'address' | 'tx';
  /** Show the whole value instead of a truncation. Used in printed documents. */
  full?: boolean;
  label?: string;
}) {
  const href = kind === 'tx' ? explorerTx(value) : explorerAddress(value);
  return (
    <span className="inline-flex items-center gap-2 flex-wrap" data-testid={`address-${value.slice(0, 10)}`}>
      {label ? <span className="pub-small">{label}</span> : null}
      <code className="pub-mono px-1.5 py-0.5 rounded border border-[color:var(--ln-hairline-soft)] bg-[var(--ln-glass-bg)] text-[color:var(--ln-ink)]">
        <span className={full ? '' : 'hidden sm:inline'}>{full ? value : shortAddress(value, 10, 8)}</span>
        {full ? null : <span className="sm:hidden">{shortAddress(value, 6, 4)}</span>}
      </code>
      <CopyButton value={value} />
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="pub-copy-btn pub-no-print"
        aria-label={`View ${kind === 'tx' ? 'transaction' : 'address'} ${value} on the block explorer`}
      >
        <ArrowUpRight size={12} strokeWidth={2} />
        <span className="pub-mono !text-[0.625rem] uppercase tracking-[0.1em]">Explorer</span>
      </a>
    </span>
  );
}

/* -------------------------------------------------------------------------
   Tables, key-value lists, code
   ------------------------------------------------------------------------- */

export function TableScroll({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`pub-table-scroll ${className}`} tabIndex={0} role="group">
      {children}
    </div>
  );
}

export function KeyValue({ items }: { items: readonly { key: string; value: ReactNode }[] }) {
  return (
    <dl className="pub-kv">
      {items.map((item) => (
        <div key={item.key} className="contents">
          <dt>{item.key}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <figure className="flex flex-col gap-2">
      {label ? (
        <figcaption className="flex items-center justify-between gap-3">
          <span className="pub-eyebrow">{label}</span>
          <CopyButton value={children} />
        </figcaption>
      ) : null}
      <pre className="pub-code">
        <code>{children}</code>
      </pre>
    </figure>
  );
}

export function Card({
  children,
  className = '',
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article';
}) {
  const Tag = as;
  return <Tag className={`pub-card ${className}`}>{children}</Tag>;
}

/* -------------------------------------------------------------------------
   Links
   ------------------------------------------------------------------------- */

export function ExternalLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={`pub-link inline-flex items-center gap-1 ${className}`}>
      {children}
      <ArrowUpRight size={13} strokeWidth={2} className="opacity-60" aria-hidden="true" />
    </a>
  );
}

/** A deliberate cross-link rail: where to go next, and why (directive section 65). */
export function RelatedLinks({
  title = 'Continue',
  links,
}: {
  title?: string;
  links: readonly { label: string; href: string; summary?: string; external?: boolean }[];
}) {
  if (links.length === 0) return null;
  return (
    <nav className="pub-no-print" aria-label={title}>
      <div className="pub-eyebrow mb-4">{title}</div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => {
          const inner = (
            <>
              <span className="pub-h4 flex items-center gap-1.5">
                {l.label}
                {l.external ? (
                  <ArrowUpRight size={14} strokeWidth={2} className="opacity-55" aria-hidden="true" />
                ) : (
                  <ArrowRight size={14} strokeWidth={2} className="opacity-55" aria-hidden="true" />
                )}
              </span>
              {l.summary ? <span className="pub-small mt-1 block">{l.summary}</span> : null}
            </>
          );
          return (
            <li key={l.href} className="contents">
              {l.external ? (
                <a href={l.href} target="_blank" rel="noreferrer noopener" className="pub-card block no-underline">
                  {inner}
                </a>
              ) : (
                <Link href={l.href} className="pub-card block no-underline">
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Previous and next within an ordered document set. */
export function PrevNext({
  prev,
  next,
}: {
  prev: { label: string; href: string } | null;
  next: { label: string; href: string } | null;
}) {
  if (!prev && !next) return null;
  return (
    <nav className="pub-no-print grid gap-3 sm:grid-cols-2" aria-label="Document navigation">
      {prev ? (
        <Link href={prev.href} className="pub-card no-underline flex items-center gap-3">
          <ArrowLeft size={15} strokeWidth={2} className="opacity-55 flex-none" aria-hidden="true" />
          <span>
            <span className="pub-eyebrow block">Previous</span>
            <span className="pub-h4">{prev.label}</span>
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {next ? (
        <Link href={next.href} className="pub-card no-underline flex items-center justify-end gap-3 text-right">
          <span>
            <span className="pub-eyebrow block">Next</span>
            <span className="pub-h4">{next.label}</span>
          </span>
          <ArrowRight size={15} strokeWidth={2} className="opacity-55 flex-none" aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}

/* -------------------------------------------------------------------------
   Breadcrumbs
   ------------------------------------------------------------------------- */

export function Breadcrumbs({ trail }: { trail: readonly { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="pub-no-print">
      <ol className="flex items-center gap-2 flex-wrap pub-mono !text-[0.6875rem] uppercase tracking-[0.12em] text-[color:var(--ln-ink-soft)]">
        {trail.map((crumb, i) => (
          <li key={`${crumb.label}-${i}`} className="flex items-center gap-2">
            {crumb.href ? (
              <Link href={crumb.href} className="pub-link-quiet">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[color:var(--ln-ink-body)]">{crumb.label}</span>
            )}
            {i < trail.length - 1 ? <span aria-hidden="true" className="opacity-45">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* -------------------------------------------------------------------------
   Document header: the masthead of every public page
   ------------------------------------------------------------------------- */

export interface DocumentMetaItem {
  readonly label: string;
  readonly value: ReactNode;
}

export function DocumentHeader({
  eyebrow,
  title,
  standfirst,
  meta,
  status,
  actions,
  breadcrumbs,
  size = 'default',
}: {
  eyebrow?: string;
  title: string;
  standfirst?: ReactNode;
  meta?: readonly DocumentMetaItem[];
  status?: ImplementationStatus;
  actions?: ReactNode;
  breadcrumbs?: readonly { label: string; href?: string }[];
  size?: 'default' | 'large';
}) {
  const headingId = useId();
  return (
    <header className="flex flex-col gap-6">
      {breadcrumbs ? <Breadcrumbs trail={breadcrumbs} /> : null}
      <div className="flex flex-col gap-4">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 id={headingId} className={size === 'large' ? 'pub-display' : 'pub-display-sm'}>
          {title}
        </h1>
        {standfirst ? <div className="pub-lead pub-measure">{standfirst}</div> : null}
      </div>

      {status || meta?.length || actions ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
          {status ? <StatusBadge status={status} /> : null}
          {meta?.map((m) => (
            <span key={m.label} className="flex items-baseline gap-2">
              <span className="pub-eyebrow">{m.label}</span>
              <span className="pub-mono text-[color:var(--ln-ink-body)]">{m.value}</span>
            </span>
          ))}
          {actions ? <span className="ml-auto flex items-center gap-2 pub-no-print">{actions}</span> : null}
        </div>
      ) : null}
    </header>
  );
}

/** Print action for documents that people actually print or archive. */
export function PrintButton({ label = 'Print or save as PDF' }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="pub-copy-btn" data-testid="print-document">
      <span className="pub-mono !text-[0.625rem] uppercase tracking-[0.1em]">{label}</span>
    </button>
  );
}
