import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronDown, Search } from 'lucide-react';
import { PublicPage } from './PublicPage';
import { TableOfContents } from './TableOfContents';
import { Breadcrumbs, DocumentHeader, PrevNext } from './primitives';
import { DOC_GROUPS, docHref, docNeighbours, docsByGroup, searchSite, type SearchEntry } from '@/lib/site-map';
import type { PageMeta } from '@/lib/use-page-meta';

/**
 * Documentation is a product, not a page (directive section 14): a persistent
 * sidebar, search, a contents rail, breadcrumbs, anchors and a reading order.
 */
export function DocsLayout({
  meta,
  title,
  standfirst,
  slug,
  children,
}: {
  meta: PageMeta;
  title: string;
  standfirst?: ReactNode;
  /** Empty string on the docs index. */
  slug: string;
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { prev, next } = docNeighbours(slug);

  return (
    <PublicPage meta={meta} width="doc">
      <div className="pub-docs-grid">
        <DocsSidebar activeSlug={slug} />

        <article className="min-w-0">
          <DocumentHeader
            eyebrow="Documentation"
            title={title}
            standfirst={standfirst}
            breadcrumbs={
              slug === ''
                ? [{ label: 'MIDNAT', href: '/' }, { label: 'Docs' }]
                : [{ label: 'MIDNAT', href: '/' }, { label: 'Docs', href: '/docs' }, { label: title }]
            }
          />

          <div ref={contentRef} className="mt-12 flex flex-col gap-12">
            {children}
          </div>

          <div className="mt-16 flex flex-col gap-8">
            <hr className="pub-rule-soft" />
            <PrevNext
              prev={prev ? { label: prev.title, href: docHref(prev.slug) } : null}
              next={next ? { label: next.title, href: docHref(next.slug) } : null}
            />
          </div>
        </article>

        <aside className="hidden xl:block">
          <div className="pub-sticky">
            <TableOfContents contentRef={contentRef} routeKey={meta.path} />
          </div>
        </aside>
      </div>
    </PublicPage>
  );
}

/* -------------------------------------------------------------------------
   Sidebar
   ------------------------------------------------------------------------- */

function DocsSidebar({ activeSlug }: { activeSlug: string }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location]);

  return (
    <div className="pub-sidebar pub-no-print lg:pub-sticky">
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="pub-card pub-card-interactive w-full flex items-center justify-between gap-3 !py-3"
          data-testid="docs-sidebar-toggle"
        >
          <span className="pub-eyebrow">Documentation</span>
          <ChevronDown size={15} strokeWidth={2} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className={`${open ? 'block' : 'hidden'} lg:block`}>
        <DocsSearch />
        <nav aria-label="Documentation" className="mt-6">
          <Link
            href="/docs"
            aria-current={activeSlug === '' ? 'page' : undefined}
            className="pub-side-link"
            data-testid="docs-link-overview"
          >
            Overview
          </Link>
          {DOC_GROUPS.map((group) => {
            const docs = docsByGroup(group.id);
            if (docs.length === 0) return null;
            return (
              <div key={group.id} className="pub-side-group">
                <div className="pub-side-title">{group.title}</div>
                {docs.map((doc) => (
                  <Link
                    key={doc.slug}
                    href={docHref(doc.slug)}
                    aria-current={doc.slug === activeSlug ? 'page' : undefined}
                    className="pub-side-link"
                    data-testid={`docs-link-${doc.slug}`}
                  >
                    {doc.title}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Search across every public document
   ------------------------------------------------------------------------- */

export function DocsSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<readonly SearchEntry[]>([]);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setResults(searchSite(query));
  }, [query]);

  /* "/" focuses search the way every documentation site a developer has ever
     used does, but never while they are typing into something else. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="docs-search">
        Search documentation
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-[color:var(--ln-glass-border)] bg-[var(--ln-glass-bg)] px-3 py-2 focus-within:border-[color:var(--ln-glass-border-hover)] transition-colors">
        <Search size={14} strokeWidth={2} className="text-[color:var(--ln-ink-soft)] flex-none" aria-hidden="true" />
        <input
          id="docs-search"
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery('');
              inputRef.current?.blur();
            }
            if (e.key === 'Enter' && results[0]) {
              navigate(results[0].href);
              setQuery('');
            }
          }}
          placeholder="Search"
          autoComplete="off"
          className="w-full bg-transparent border-0 outline-none text-[0.875rem] text-[color:var(--ln-ink)] placeholder:text-[color:var(--ln-ink-soft)]"
          data-testid="docs-search-input"
        />
        <kbd className="pub-mono !text-[0.625rem] px-1.5 py-0.5 rounded border border-[color:var(--ln-hairline)] text-[color:var(--ln-ink-soft)] hidden lg:block">
          /
        </kbd>
      </div>

      {query.trim().length >= 2 ? (
        <div
          className="absolute z-30 mt-2 w-full max-h-[22rem] overflow-y-auto rounded-xl border border-[color:var(--ln-glass-border)] shadow-[var(--ln-glass-drop)] p-1.5"
          style={{
            background: 'var(--ln-glass-bg-strong)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          }}
          data-testid="docs-search-results"
        >
          {results.length === 0 ? (
            <p className="pub-small px-3 py-3">
              Nothing matches that. Search covers page titles, summaries and keywords, not the full body text.
            </p>
          ) : (
            results.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                onClick={() => setQuery('')}
                className="block px-3 py-2.5 rounded-lg no-underline hover:bg-[color-mix(in_srgb,var(--ln-accent)_10%,transparent)] transition-colors"
              >
                <span className="pub-eyebrow block !text-[0.5625rem]">{r.section}</span>
                <span className="text-[0.875rem] font-medium text-[color:var(--ln-ink)]">{r.title}</span>
                {r.summary ? <span className="pub-small block mt-0.5 line-clamp-2">{r.summary}</span> : null}
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Breadcrumb trail helper for docs pages rendered outside DocsLayout. */
export function DocsBreadcrumbs({ title }: { title: string }) {
  return <Breadcrumbs trail={[{ label: 'MIDNAT', href: '/' }, { label: 'Docs', href: '/docs' }, { label: title }]} />;
}
