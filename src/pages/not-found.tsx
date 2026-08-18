import { Link } from 'wouter';
import { PublicPage } from '@/components/public/PublicPage';
import { DocsSearch } from '@/components/public/DocsLayout';
import { Eyebrow, Prose } from '@/components/public/primitives';
import { PROTOCOL_PAGES, TRUST_PAGES } from '@/lib/site-map';

/**
 * 404 in the brand's own voice, and useful: a search box and the two shelves
 * people are usually looking for. A dead end that offers only "go home" wastes
 * the one moment a reader has told you exactly what they wanted.
 */
export default function NotFound() {
  return (
    <PublicPage
      width="doc"
      meta={{
        title: 'Page not found',
        description: 'That page does not exist on this site.',
        path: '/404',
        noindex: true,
      }}
    >
      <div className="flex flex-col gap-10 pt-8">
        <div className="flex flex-col gap-4">
          <Eyebrow>Error 404</Eyebrow>
          <h1 className="pub-display-sm">Nothing is listed at this address</h1>
          <Prose>
            <p>
              The page you asked for does not exist here. It may have been renamed, or the link that brought you here may
              have been written against a different version of this site.
            </p>
          </Prose>
        </div>

        <div className="max-w-md">
          <DocsSearch />
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          <Shelf title="Protocol" links={PROTOCOL_PAGES} />
          <Shelf title="Trust" links={TRUST_PAGES} />
        </div>
      </div>
    </PublicPage>
  );
}

function Shelf({ title, links }: { title: string; links: readonly { label: string; href: string; summary?: string }[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Eyebrow>{title}</Eyebrow>
      <ul className="flex flex-col list-none p-0 m-0 border-t border-[color:var(--ln-hairline-soft)]">
        {links.map((link) => (
          <li key={link.href} className="border-b border-[color:var(--ln-hairline-soft)]">
            <Link href={link.href} className="group flex flex-col gap-0.5 py-3 no-underline">
              <span className="text-[0.9375rem] font-medium text-[color:var(--ln-ink)] group-hover:text-[color:var(--ln-accent)] transition-colors">
                {link.label}
              </span>
              {link.summary ? <span className="pub-small">{link.summary}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
