import { Reveal } from './Reveal';
import { ArrowRight } from 'lucide-react';
import { appHref } from '@/lib/config';
import { useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { axisTicks, feedGeometry, useReferenceFeed } from '@/lib/reference-feed';

/** The reference is only described as live while the feed says it is current. */
function freshnessLabel(state: string, ageSec: number | null): string {
  if (state === 'UNAVAILABLE') return 'No reading';
  // The last read failed, so the age stopped advancing. Say that, rather than
  // repeating a number that is no longer being measured.
  if (state === 'UNKNOWN') return 'Age unknown';
  if (ageSec === null) return state.toLowerCase();
  if (ageSec < 60) return `${Math.round(ageSec)}s ago`;
  if (ageSec < 3600) return `${Math.round(ageSec / 60)}m ago`;
  return `${Math.round(ageSec / 3600)}h ago`;
}

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  // Every number in the card below is read from the API. When it cannot be
  // read the card says so: there is no generated curve to fall back on.
  const { status, feed } = useReferenceFeed();
  const oracle = useMemo(() => (feed ? feedGeometry(feed.points) : null), [feed]);
  const ticks = useMemo(() => (feed ? axisTicks(feed.points) : []), [feed]);
  const isCurrent = feed?.referenceState === 'CURRENT';

  return (
    <main className="relative z-10 w-full flex flex-col items-center pt-44 md:pt-52 pb-20">
      {/* Background Horizon System */}
      <div className="landing-horizon-system">
        <div className="landing-meridian-lines opacity-60 mix-blend-multiply" />
        <div className="landing-dotgrid" />
      </div>

      {/* Midnight Sun Dial: the sun that never sets, carrying the 24-hour clock. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[48px] md:top-[40px] -translate-x-1/2 w-[540px] md:w-[720px] pointer-events-none z-0 [mask-image:linear-gradient(to_bottom,black_52%,transparent_90%)]"
      >
        {/* grain pocket: film texture inside the sun disc only */}
        <div
          aria-hidden="true"
          className="landing-grain-pocket inset-0 rounded-full"
          style={{
            maskImage: 'radial-gradient(circle at 50% 50%, black 0%, black 50%, transparent 76%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 0%, black 50%, transparent 76%)',
          }}
        />
        <svg viewBox="0 0 640 640" className="w-full h-auto overflow-visible">
          <defs>
            <radialGradient id="landing-dial-disc" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--ln-dial-disc)" stopOpacity="0.20" />
              <stop offset="55%" stopColor="var(--ln-dial-disc)" stopOpacity="0.10" />
              <stop offset="100%" stopColor="var(--ln-dial-disc)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sun disc */}
          <circle cx="320" cy="320" r="300" fill="url(#landing-dial-disc)" />

          {/* Crisp rim */}
          <circle cx="320" cy="320" r="300" fill="none" stroke="var(--ln-sun-rim)" strokeWidth="1" />

          {/* Halo rings, breathing */}
          <circle cx="320" cy="320" r="252" fill="none" stroke="var(--ln-ink)" strokeOpacity="0.07" strokeWidth="1" className={shouldReduceMotion ? '' : 'landing-dial-ring-breathe'} />
          <circle cx="320" cy="320" r="204" fill="none" stroke="var(--ln-ink)" strokeOpacity="0.07" strokeWidth="1" className={shouldReduceMotion ? '' : 'landing-dial-ring-breathe-2'} />

          {/* Slow rotating minute track */}
          <circle cx="320" cy="320" r="276" fill="none" stroke="var(--ln-accent)" strokeOpacity="0.16" strokeWidth="1" strokeDasharray="2 10" className={shouldReduceMotion ? '' : 'landing-dial-rotate'} />

          {/* 24 hour ticks, cardinals in green */}
          {Array.from({ length: 24 }, (_, i) => {
            const a = ((i * 15 - 90) * Math.PI) / 180;
            const cardinal = i % 6 === 0;
            const r1 = cardinal ? 282 : 290;
            return (
              <line
                key={i}
                x1={320 + r1 * Math.cos(a)}
                y1={320 + r1 * Math.sin(a)}
                x2={320 + 300 * Math.cos(a)}
                y2={320 + 300 * Math.sin(a)}
                stroke={cardinal ? 'var(--ln-dial-cardinal)' : 'var(--ln-dial-tick)'}
                strokeWidth={cardinal ? 1.5 : 1}
              />
            );
          })}

          {/* Midnight at the crown */}
          <text x="320" y="46" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="11" letterSpacing="3" fill="var(--ln-ink)" opacity="0.38">00:00</text>
        </svg>
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col items-center text-center gap-10 z-10 relative">
        <Reveal inView={false}>
          <h1 className="text-5xl md:text-[5.5rem] landing-text-display leading-[1.02] text-[color:var(--ln-ink)]">
            Stock perpetuals<br />
            Always open
          </h1>
        </Reveal>
        
        <Reveal delay={0.1} inView={false}>
          <p className="text-lg md:text-[1.15rem] landing-text-body max-w-2xl leading-relaxed">
            Leveraged long and short exposure to listed equities, around the clock on X Layer, priced from a signed reference the chain can check. No closing bell.
          </p>
        </Reveal>
        
        <Reveal delay={0.2} inView={false} className="pt-4">
          <a
            href={appHref()}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="hero-start-trading"
            className="landing-primary-btn"
          >
            Open the app
            <ArrowRight size={18} className="landing-primary-btn-arrow" />
          </a>
        </Reveal>
      </div>

      <Reveal delay={0.3} inView={false} className="w-full max-w-[1200px] mx-auto px-6 md:px-12 mt-16 md:mt-24 z-10 relative">
        <div className="landing-glass-tier-2 w-full p-8 flex flex-col justify-between group min-h-[300px]">
          
          <div className="flex justify-between items-start gap-4 text-[10px] md:text-xs font-mono font-medium tracking-widest uppercase">
            <span className="opacity-60" data-testid="hero-feed-symbol">
              {feed ? `${feed.symbol} signed reference` : 'Signed reference'}
            </span>
            <span
              className="tabular-nums tracking-tighter flex items-center gap-2 opacity-60"
              data-testid="hero-feed-freshness"
            >
              {status === 'loading' && 'Reading feed'}
              {status === 'unavailable' && 'Feed unreachable'}
              {feed && (
                <>
                  <span
                    className={`w-1.5 h-1.5 rounded-full bg-[color:var(--ln-ink)] opacity-70 ${
                      isCurrent && !shouldReduceMotion ? 'animate-pulse' : ''
                    }`}
                  />
                  {freshnessLabel(feed.referenceState, feed.referenceAgeSec)}
                </>
              )}
            </span>
          </div>

          {feed && (
            <div className="flex items-baseline gap-3 mt-4">
              <span
                className="text-2xl md:text-3xl font-mono tabular-nums text-[color:var(--ln-ink)]"
                data-testid="hero-feed-price"
              >
                {feed.price.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              {feed.change24h !== null && (
                <span className="text-[10px] md:text-xs font-mono tabular-nums uppercase tracking-widest opacity-60">
                  {feed.change24h >= 0 ? '+' : '−'}
                  {Math.abs(feed.change24h).toFixed(2)}% 24h
                </span>
              )}
            </div>
          )}
          
          <div className="w-full h-[200px] relative flex items-end overflow-visible mt-8">
            {!oracle && (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] md:text-xs font-mono uppercase tracking-widest opacity-40 text-center px-6">
                {status === 'loading'
                  ? 'Reading the reference feed'
                  : 'The reference feed is not answering right now. Nothing is drawn here that was not read from it.'}
              </div>
            )}
            {oracle && (
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="landing-chart-fill-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--ln-chart-fill-top)" stopOpacity="var(--ln-chart-fill-top-opacity)" />
                  <stop offset="100%" stopColor="var(--ln-chart-fill-bottom)" stopOpacity="var(--ln-chart-fill-bottom-opacity)" />
                </linearGradient>
                <linearGradient id="landing-chart-stroke-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--ln-chart-stroke-stop1)" stopOpacity="var(--ln-chart-stroke-opacity1)" />
                  <stop offset="60%" stopColor="var(--ln-chart-stroke-stop2)" stopOpacity="var(--ln-chart-stroke-opacity2)" />
                  <stop offset="100%" stopColor="var(--ln-chart-stroke-stop3)" stopOpacity="1" />
                </linearGradient>
                <filter id="landing-glow" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                </filter>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="10" x2="100" y2="10" stroke="var(--ln-chart-grid)" strokeWidth="0.1" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="var(--ln-chart-grid)" strokeWidth="0.1" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="var(--ln-chart-grid)" strokeWidth="0.1" />
              
              {/* NOW vertical line: rides the real current UTC position */}
              <line x1={oracle.headX} y1="0" x2={oracle.headX} y2="40" stroke="var(--ln-chart-dash)" strokeWidth="0.1" strokeDasharray="1 1" />
              
                <g className={shouldReduceMotion ? '' : 'landing-chart-fill'}>
                {/* Blurred Underglow Path */}
                <path 
                  d={oracle.line}
                  fill="none" 
                  stroke="var(--ln-accent-hot)" 
                  strokeWidth="0.5" 
                  opacity="0.25"
                  strokeLinejoin="round"
                  filter="url(#landing-glow)"
                />
                
                {/* Area Fill: only under the elapsed part of the day */}
                <path 
                  d={oracle.fill}
                  fill="url(#landing-chart-fill-grad)" 
                />
                
                {/* Main Stroke */}
                <path 
                  d={oracle.line}
                  fill="none" 
                  stroke="url(#landing-chart-stroke-grad)" 
                  strokeWidth="0.4" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

              </g>

              {/* Live head riding the real NOW. Life = glow + pulse, never wandering. */}
              <g transform={`translate(${oracle.headX}, ${oracle.headY})`}>
                <ellipse rx="0.9" ry="1.8" fill="var(--ln-accent-hot)" opacity="0.55" filter="url(#landing-glow)" />
                <ellipse rx="0.45" ry="0.9" fill="var(--ln-accent-hot)" />
                {/* intentionally theme-independent: the near-white core reads as the glow's hot center on both grounds */}
                <ellipse rx="0.22" ry="0.45" fill="#F6FAF6" />
                {!shouldReduceMotion && (
                  <>
                    <ellipse rx="0.6" ry="1.2" fill="none" stroke="var(--ln-accent-hot)" strokeWidth="0.25" className="landing-pulse-ring" />
                    <ellipse rx="0.6" ry="1.2" fill="none" stroke="var(--ln-accent-hot)" strokeWidth="0.25" className="landing-pulse-ring-2" />
                  </>
                )}
              </g>
            </svg>
            )}
            {oracle && (
              <div className="absolute top-1 -translate-x-1/2 font-mono text-[8px] opacity-40" style={{ left: `${oracle.headX}%` }}>NOW</div>
            )}
          </div>

          {/* The axis is the window actually plotted, measured from the first
              and last close on screen. It has no session break because the
              reference does not stop at the closing bell. */}
          {ticks.length > 0 && (
            <div className="pt-4 border-t border-[color:var(--ln-glass-border)] mt-2 flex justify-between items-center opacity-50 font-mono text-[9px] md:text-[10px] uppercase tracking-widest w-full">
              {ticks.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </main>
  );
}
