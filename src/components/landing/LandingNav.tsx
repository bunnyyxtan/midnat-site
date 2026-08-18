import { Link } from 'wouter';
import { SeamMark } from './SeamMark';
import { appHref } from '@/lib/config';
import { useEffect, useState } from 'react';
import { ArrowRight, Moon, Sun } from 'lucide-react';

export function LandingNav({ theme, toggleTheme }: { theme?: 'light' | 'dark', toggleTheme?: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 pointer-events-none transition-[padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled ? 'pt-3' : 'pt-5 md:pt-7'
      }`}
    >
      {/* Mobile: two rows (wordmark + launch, then pill). md+: 3-zone grid, pill truly centered. */}
      <div className="w-full max-w-[1440px] mx-auto px-5 md:px-10 flex flex-wrap items-center justify-between gap-y-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
        {/* Zones 1 and 3 yield once the page leaves the top: scrolled down, only the
            pill remains. Opacity keeps their layout slot so the pill never jumps. */}
        <Link
          href="/"
          aria-hidden={scrolled}
          tabIndex={scrolled ? -1 : 0}
          className={`flex items-center gap-2.5 text-xl md:text-2xl tracking-wide font-bold transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex-shrink-0 md:justify-self-start ${
            scrolled
              ? 'opacity-0 -translate-y-2 pointer-events-none'
              : 'opacity-90 hover:opacity-100 translate-y-0 pointer-events-auto'
          }`}
          data-testid="nav-logo"
        >
          <SeamMark size={22} className="md:hidden" />
          <SeamMark size={26} className="hidden md:block" />
          MIDNAT
        </Link>

        <div className="order-3 w-full min-w-0 flex justify-center md:order-none md:w-auto md:justify-self-center">
          <div
            data-testid="nav-pill"
            className={`landing-glass-specular pointer-events-auto flex items-center max-w-full whitespace-nowrap rounded-full text-[13px] md:text-[14px] font-medium tracking-wide border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              scrolled
                ? 'gap-3 sm:gap-4 md:gap-7 px-3.5 sm:px-4 md:px-7 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.10)]'
                : 'gap-3 sm:gap-4 md:gap-8 px-4 sm:px-5 md:px-8 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
            }`}
            style={{
              background: scrolled ? 'var(--ln-overlay-bg)' : 'var(--ln-glass-bg)',
              borderColor: 'var(--ln-glass-border)',
              boxShadow: 'inset 0 1px 1px var(--ln-glass-inner-light), inset 0 -1px 1px var(--ln-glass-inner-dark), var(--ln-glass-drop)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
            }}
          >
            {/* Below sm the pill would run wider than a 320px screen, so the two
                longest labels stand down. Both sections stay reachable by scrolling. */}
            <a href="#why" className="max-[359px]:hidden opacity-60 hover:opacity-100 transition-opacity duration-300" data-testid="nav-why">Why 24/7</a>
            <a href="#protocol" className="opacity-60 hover:opacity-100 transition-opacity duration-300" data-testid="nav-protocol">Protocol</a>
            <a href="#vaults" className="opacity-60 hover:opacity-100 transition-opacity duration-300" data-testid="nav-vaults">Vaults</a>
            <a href="#faqs" className="opacity-60 hover:opacity-100 transition-opacity duration-300" data-testid="nav-faqs">FAQs</a>
            <Link href="/docs" className="hidden sm:block opacity-60 hover:opacity-100 transition-opacity duration-300" data-testid="nav-docs">Docs</Link>

            <div className="w-[1px] h-4 bg-[color:var(--ln-hairline-hard)] mx-1 md:mx-2" />

            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              data-testid="nav-theme-toggle"
              className="opacity-60 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
            >
              {theme === 'dark' ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
            </button>
          </div>
        </div>

        <a
          href={appHref()}
          aria-hidden={scrolled}
          tabIndex={scrolled ? -1 : 0}
          className={`landing-primary-btn landing-primary-btn-sm flex-shrink-0 md:justify-self-end ${
            scrolled
              ? 'opacity-0 -translate-y-2 pointer-events-none'
              : 'opacity-100 translate-y-0 pointer-events-auto'
          }`}
          data-testid="nav-launch"
        >
          <span>Launch app</span>
          <ArrowRight size={16} strokeWidth={2.5} className="landing-primary-btn-arrow" />
        </a>
      </div>
    </nav>
  );
}
