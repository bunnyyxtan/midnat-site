import { useEffect } from 'react';
import { SITE_URL } from './site-map';

/**
 * Per-route document metadata (directive section 71).
 *
 * A single-page app ships one index.html, so every route would otherwise
 * share one title, one description and one canonical link. This hook sets
 * them per page and restores nothing on unmount: the next page sets its own,
 * and a half-restored head is worse than a stale one.
 */
export interface PageMeta {
  /** Page title without the brand suffix. */
  readonly title: string;
  readonly description: string;
  /** Route path, leading slash, no origin. */
  readonly path: string;
  /** Documents get "article"; everything else is a website. */
  readonly type?: 'website' | 'article';
  /** Absolute or root-relative social image. Falls back to the site default. */
  readonly image?: string;
  /** Legal and policy pages should not be indexed as thin duplicates of each other. */
  readonly noindex?: boolean;
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function usePageMeta(meta: PageMeta): void {
  const { title, description, path, type = 'website', image, noindex = false } = meta;

  useEffect(() => {
    const fullTitle = path === '/' ? title : `${title} \u00b7 MIDNAT`;
    const url = `${SITE_URL}${path}`;
    const social = image ?? `${SITE_URL}/og-default.png`;

    document.title = fullTitle;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', type);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:image"]', 'property', 'og:image', social);
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', social);
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, follow' : 'index, follow');
    setLink('canonical', url);
  }, [title, description, path, type, image, noindex]);
}
