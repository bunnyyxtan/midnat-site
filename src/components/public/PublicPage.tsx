import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import '../landing/Landing.css';
import './Public.css';
import { PublicNav } from './PublicNav';
import { PublicFooter } from './PublicFooter';
import { useTheme } from './theme';
import { usePageMeta, type PageMeta } from '@/lib/use-page-meta';

/**
 * The shell every public document page renders inside.
 *
 * It owns the four things a page must never re-implement: the themed ground,
 * the grain, the header and footer, and the scroll position on navigation.
 * Widths are chosen per page because a licence agreement and a market
 * specification table do not want the same measure.
 */
export type PageWidth = 'prose' | 'doc' | 'wide' | 'full';

const WIDTH_CLASS: Record<PageWidth, string> = {
  prose: 'pub-width-prose',
  doc: 'pub-width-doc',
  wide: 'pub-width-wide',
  full: 'pub-width-full',
};

export function PublicPage({
  children,
  width = 'prose',
  meta,
  footer = 'document',
  className = '',
}: {
  children: ReactNode;
  width?: PageWidth;
  meta: PageMeta;
  footer?: 'full' | 'document';
  className?: string;
}) {
  const { theme } = useTheme();
  const [location] = useLocation();
  usePageMeta(meta);

  /* A router that keeps scroll position drops you into the middle of the next
     document. Honour an explicit fragment, otherwise start at the top. */
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="landing-container pub-ground min-h-screen flex flex-col" data-theme={theme}>
      <a href="#main" className="pub-skip pub-no-print">
        Skip to content
      </a>
      <div className="landing-grain" />

      <PublicNav />

      <main
        id="main"
        className={`relative z-10 w-full mx-auto flex-1 px-5 sm:px-8 lg:px-12 pt-28 pb-24 md:pt-32 md:pb-28 ${WIDTH_CLASS[width]} ${className}`}
      >
        {children}
      </main>

      <PublicFooter variant={footer} />
    </div>
  );
}
