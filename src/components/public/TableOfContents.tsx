import { useEffect, useState, type RefObject } from 'react';

interface Heading {
  id: string;
  title: string;
  depth: number;
}

/**
 * Contents rail built from the headings that are actually rendered.
 *
 * Reading the DOM rather than a hand-written list is deliberate: a duplicated
 * outline drifts the moment someone edits a section title, and a contents
 * rail that lies about a document is worse than none.
 */
export function TableOfContents({
  contentRef,
  routeKey,
  title = 'On this page',
}: {
  contentRef: RefObject<HTMLElement | null>;
  /** Changes when the rendered document changes, so the outline is rebuilt. */
  routeKey: string;
  title?: string;
}) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const collect = () => {
      const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-toc]'));
      setHeadings(
        nodes
          .filter((n) => n.id)
          .map((n) => ({
            id: n.id,
            title: n.dataset.tocTitle ?? n.textContent?.replace(/^#/, '').trim() ?? n.id,
            depth: Number(n.dataset.toc ?? '2'),
          })),
      );
    };

    collect();
    /* Content can mount in two passes (data fetches, lazy sections), so watch
       the subtree instead of assuming the first read was complete. */
    const observer = new MutationObserver(collect);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [contentRef, routeKey]);

  useEffect(() => {
    if (headings.length === 0) return;
    const elements = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const onScroll = () => {
      /* The active section is the last heading whose top has passed the
         reading line. Cheaper and far less jumpy than intersection ratios on
         sections of wildly different heights. */
      const line = 140;
      let current = elements[0]!.id;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav className="pub-toc pub-no-print" aria-label={title} data-testid="toc">
      <div className="pub-eyebrow mb-3">{title}</div>
      <ul className="list-none p-0 m-0">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="pub-toc-link"
              data-depth={h.depth}
              data-active={activeId === h.id}
              aria-current={activeId === h.id ? 'true' : undefined}
            >
              {h.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
