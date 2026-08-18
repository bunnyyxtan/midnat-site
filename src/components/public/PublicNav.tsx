import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import { SeamMark } from '../landing/SeamMark';
import { appHref } from '@/lib/config';
import { useTheme } from './theme';
import { HEADER_LINKS, TRUST_PAGES, LEGAL, legalHref } from '@/lib/site-map';

/**
 * Header for every public page that is not the landing.
 *
 * The landing keeps its floating pill: that nav is a piece of the landing's
 * choreography and belongs to it. A document needs something else, a quiet
 * rail that holds its position while you read 4,000 words and never competes
 * with the page title. Same materials, different job.
 */
export function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* A route change must never leave the sheet open behind the new page. */
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const isActive = (href: string) => location === href || location.startsWith(`${href}/`);

  return (
    <header
      className="pub-nav pub-no-print fixed top-0 left-0 right-0 z-50 transition-[background,border-color,backdrop-filter] duration-300"
      style={{
        background: scrolled ? 'var(--ln-overlay-bg)' : 'transparent',
        borderBottom: `1px solid ${scrolled ? 'var(--ln-hairline)' : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(28px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(28px)' : 'none',
      }}
    >
      <div className="w-full max-w-[90rem] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[1.0625rem] font-bold tracking-wide shrink-0 text-[color:var(--ln-ink)] no-underline"
          data-testid="pub-nav-home"
        >
          <SeamMark size={20} />
          MIDNAT
        </Link>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-6 text-[0.875rem] font-medium">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className="no-underline transition-colors duration-200"
              style={{
                color: isActive(link.href) ? 'var(--ln-ink)' : 'var(--ln-ink-soft)',
              }}
              data-testid={`pub-nav-${link.label.toLowerCase()}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[color:var(--ln-ink-soft)] hover:text-[color:var(--ln-ink)] transition-colors"
            data-testid="pub-theme-toggle"
          >
            {theme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          </button>

          {/* The wrapper carries the responsive visibility, never the button itself:
              .landing-primary-btn is unlayered CSS and its display beats Tailwind's
              layered `hidden` utility, so `hidden` on the anchor does nothing. */}
          <span className="hidden sm:block">
            <a href={appHref()} className="landing-primary-btn landing-primary-btn-sm" data-testid="pub-nav-launch">
              <span>Launch app</span>
              <ArrowRight size={15} strokeWidth={2.5} className="landing-primary-btn-arrow" />
            </a>
          </span>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-[color:var(--ln-ink)]"
            data-testid="pub-nav-menu"
          >
            {menuOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          className="md:hidden border-t border-[color:var(--ln-hairline)] max-h-[calc(100vh-4rem)] overflow-y-auto"
          style={{
            background: 'var(--ln-overlay-bg)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
          }}
          data-testid="pub-nav-sheet"
        >
          <div className="px-5 py-6 flex flex-col gap-7">
            <MenuGroup title="Protocol" links={HEADER_LINKS} />
            <MenuGroup title="Trust" links={TRUST_PAGES.map((p) => ({ label: p.label, href: p.href }))} />
            <MenuGroup
              title="Legal"
              links={[{ label: 'Legal hub', href: '/legal' }, ...LEGAL.slice(0, 4).map((l) => ({ label: l.title, href: legalHref(l.slug) }))]}
            />
            <a href={appHref()} className="landing-primary-btn w-full justify-center">
              <span>Launch app</span>
              <ArrowRight size={16} strokeWidth={2.5} className="landing-primary-btn-arrow" />
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function MenuGroup({ title, links }: { title: string; links: readonly { label: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="pub-eyebrow">{title}</span>
      <div className="flex flex-col gap-2.5">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-[0.9375rem] font-medium text-[color:var(--ln-ink-body)] no-underline">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
