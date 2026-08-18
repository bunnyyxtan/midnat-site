import { useRef, type ReactNode } from 'react';
import { PublicPage, type PageWidth } from './PublicPage';
import { TableOfContents } from './TableOfContents';
import { DocumentHeader, type DocumentMetaItem } from './primitives';
import type { PageMeta } from '@/lib/use-page-meta';
import type { ImplementationStatus } from '@/lib/protocol-registry';

/**
 * Standalone public document: contracts, security, legal, brand, about.
 *
 * The contents rail appears from 1280px and only when the document has more
 * than one section, so a two-paragraph page does not grow furniture it does
 * not need. Below that width the document is simply a document.
 */
export function DocumentLayout({
  meta,
  eyebrow,
  title,
  standfirst,
  headerMeta,
  status,
  actions,
  breadcrumbs,
  children,
  after,
  width = 'doc',
  toc = true,
  size = 'default',
  contentClassName = '',
}: {
  meta: PageMeta;
  eyebrow?: string;
  title: string;
  standfirst?: ReactNode;
  headerMeta?: readonly DocumentMetaItem[];
  status?: ImplementationStatus;
  actions?: ReactNode;
  breadcrumbs?: readonly { label: string; href?: string }[];
  children: ReactNode;
  /** Full-width content below the document column: related links, rails. */
  after?: ReactNode;
  width?: PageWidth;
  toc?: boolean;
  size?: 'default' | 'large';
  contentClassName?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <PublicPage meta={meta} width={width} className={toc ? 'pub-has-rail' : ''}>
      <div className={toc ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_13rem] xl:gap-12' : ''}>
        <article className="min-w-0">
          <DocumentHeader
            eyebrow={eyebrow}
            title={title}
            standfirst={standfirst}
            meta={headerMeta}
            status={status}
            actions={actions}
            breadcrumbs={breadcrumbs}
            size={size}
          />
          <div ref={contentRef} className={`mt-12 flex flex-col gap-12 ${contentClassName}`}>
            {children}
          </div>
        </article>

        {toc ? (
          <aside className="hidden xl:block">
            <div className="pub-sticky">
              <TableOfContents contentRef={contentRef} routeKey={meta.path} />
            </div>
          </aside>
        ) : null}
      </div>

      {after ? <div className="mt-16">{after}</div> : null}
    </PublicPage>
  );
}
