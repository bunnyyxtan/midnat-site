import { useRef } from 'react';
import { Link } from 'wouter';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { SeamMark } from '../landing/SeamMark';
import etchExchange from '../../assets/landing/etch-exchange.webp';
import { footerGroups, FOOTER_META_LINKS } from '@/lib/site-map';
import { CONTACT_CHANNELS } from '@/lib/contact';
import { NETWORK, DEPLOYMENT, utcDate } from '@/lib/protocol-registry';

/**
 * The one footer, used by every public page including the landing.
 *
 * It is the deep navigation layer of the site: everything the site holds is
 * reachable from here, grouped by what a reader is trying to do. Two sizes,
 * one design. `full` keeps the landing's tall engraved close; `document`
 * gives a reader who has just finished 3,000 words a shorter tail.
 *
 * The status line states what the deployment IS. It never states uptime,
 * because nothing in this project measures uptime.
 */
export function PublicFooter({ variant = 'document' }: { variant?: 'full' | 'document' }) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const full = variant === 'full';

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end end'] });
  const yParallax = useTransform(scrollYProgress, [0, 1], ['-8%', '2%']);

  const groups = footerGroups();

  return (
    <footer
      id="footer"
      ref={containerRef}
      className={`pub-footer relative w-full overflow-hidden border-t border-[color:var(--ln-glass-border)] flex flex-col justify-end ${
        full ? 'pt-[120px] pb-12 min-h-[600px]' : 'pt-20 pb-10'
      }`}
    >
      {/* Engraved exchange floor: the brand's own motif, never a stock photograph. */}
      <motion.div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-0 flex items-end justify-center h-full w-full"
        style={{
          y: shouldReduceMotion ? 0 : yParallax,
          opacity: full ? 'var(--ln-plate-opacity)' : 'calc(var(--ln-plate-opacity) * 0.55)',
          mixBlendMode: 'var(--ln-plate-blend)' as never,
          filter: 'var(--ln-plate-filter)',
        }}
      >
        <img
          src={etchExchange}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover max-w-[1440px]"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 100%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 100%)',
          }}
        />
      </motion.div>

      {/* Legibility scrim: the plate's brightest passage sits exactly where the
          closing small print does. The page's own ground rises over the etching
          so 11px mono has something to sit on. */}
      <div className="pub-footer-scrim absolute inset-0 pointer-events-none z-[1]" aria-hidden="true" />

      <div className="w-full max-w-[90rem] mx-auto px-5 sm:px-8 lg:px-12 relative z-10">
        {/* Identity and navigation are two blocks with one gutter between them,
            not twelve grid tracks: a 12-column grid spent more than half this
            container on phantom gutters, which starved the identity track and
            pushed the wordmark into the first nav column. */}
        <div
          className={`flex flex-col lg:flex-row lg:items-start gap-y-14 lg:gap-x-16 xl:gap-x-24 ${
            full ? 'mb-24' : 'mb-14'
          }`}
        >
          {/* Identity */}
          <div className="pub-footer-identity w-full lg:w-[30%] xl:w-[32%] lg:shrink-0">
            <Link href="/" className="no-underline text-[color:var(--ln-ink)]" data-testid="footer-home">
              <div
                className={`flex items-baseline gap-[0.22em] font-bold tracking-tighter uppercase leading-[0.8] mb-6 ${
                  full ? 'pub-footer-wordmark' : 'pub-footer-wordmark-sm'
                }`}
              >
                {/* Mark bottom sits on the text baseline; translate-y compensates the
                    negative half-leading of leading-[0.8]. */}
                <SeamMark size="0.78em" className="translate-y-[0.1em]" />
                <span>MIDNAT</span>
              </div>
            </Link>
            <p className="pub-body max-w-xs">The perpetuals exchange that never sleeps.</p>

            {/* Contact renders the channel list rather than a fixed row per
                network, so a channel the project does not have cannot leave an
                empty slot behind, and adding one later needs no layout change. */}
            <div className="mt-6 flex flex-col gap-2" data-testid="footer-contact">
              <span className="pub-eyebrow">Contact</span>
              {CONTACT_CHANNELS.map((channel) => (
                /* The link's text is the handle and nothing else, so its
                   accessible name is the bare handle; the network sits outside
                   the anchor as the quiet half of the line. Spelling the handle
                   here, even in a comment, is what lib/contact.ts is for. */
                <p key={channel.id} className="m-0 text-[0.9375rem] leading-snug">
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-medium text-[color:var(--ln-ink-body)] no-underline hover:text-[color:var(--ln-accent)] transition-colors break-words"
                    data-testid={`footer-contact-${channel.id}`}
                  >
                    {channel.display}
                  </a>
                  <span className="text-[color:var(--ln-ink-soft)]"> on {channel.network}</span>
                </p>
              ))}
            </div>
          </div>

          {/* Deep navigation */}
          <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {groups.map((group) => (
              <div key={group.title} className="flex flex-col gap-5">
                <span className="pub-eyebrow">{group.title}</span>
                <ul className="flex flex-col gap-3.5 list-none p-0 m-0">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.href}`}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[0.9375rem] font-medium text-[color:var(--ln-ink-body)] no-underline hover:text-[color:var(--ln-accent)] transition-colors"
                          data-testid={`footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-[0.9375rem] font-medium text-[color:var(--ln-ink-body)] no-underline hover:text-[color:var(--ln-accent)] transition-colors"
                          data-testid={`footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-[color:var(--ln-glass-border)] mb-6" />

        {/* Small print rail */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6">
          {FOOTER_META_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                className="pub-footer-rail pub-mono !text-[0.6875rem] uppercase tracking-[0.12em] no-underline hover:text-[color:var(--ln-accent)] transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="pub-footer-rail pub-mono !text-[0.6875rem] uppercase tracking-[0.12em] no-underline hover:text-[color:var(--ln-accent)] transition-colors"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <span className="pub-footer-rail flex items-center gap-2.5 pub-mono !text-[0.6875rem] uppercase tracking-[0.12em]">
            <SeamMark size={14} />
            {new Date().getFullYear()} MIDNAT Protocol
          </span>

          {/* Keep global chrome operational. Detailed disclosures belong on /security. */}
          <Link
            href="/status"
            className="pub-footer-rail pub-mono !text-[0.6875rem] uppercase tracking-[0.12em] no-underline hover:text-[color:var(--ln-accent)] transition-colors"
            data-testid="footer-status-line"
          >
            {NETWORK.label} · chain {NETWORK.chainId} · test collateral · contracts deployed{' '}
            {utcDate(DEPLOYMENT.completedAt)}
          </Link>

          <span className="flex items-center gap-3" data-testid="footer-xlayer-brand">
            {/* X Layer mark: a decorative branding tile, deliberately not interactive. */}
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[color:var(--ln-glass-border)] text-[color:var(--ln-ink)]"
            >
              <svg viewBox="0 0 96 74" width="16" fill="currentColor" aria-hidden="true" focusable="false">
                <rect x="0" y="0" width="24" height="24" rx="4" />
                <rect x="50" y="0" width="24" height="24" rx="4" />
                <rect x="25" y="25" width="24" height="24" rx="4" />
                <rect x="0" y="50" width="24" height="24" rx="4" />
                <rect x="50" y="50" width="24" height="24" rx="4" />
                <rect x="78" y="0" width="8" height="24" rx="3" />
                <rect x="90" y="0" width="6" height="24" rx="2.5" />
                <rect x="78" y="50" width="8" height="24" rx="3" />
                <rect x="90" y="50" width="6" height="24" rx="2.5" />
              </svg>
            </span>
            <span className="pub-footer-rail pub-mono !text-[0.6875rem] uppercase tracking-[0.12em]">
              Built on X Layer
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
