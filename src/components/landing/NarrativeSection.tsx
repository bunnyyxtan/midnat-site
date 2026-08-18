import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Reveal } from './Reveal';
import etchMeridian from '../../assets/landing/etch-meridian.webp';
import { useMarketRegime } from '@/lib/reference-feed';

export function NarrativeSection() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  
  const [timeState, setTimeState] = useState({
    utc: '',
    tokyoTime: '',
    londonTime: '',
    nyTime: ''
  });

  /**
   * The clocks are the browser's, which is the right authority for what time
   * it is in Tokyo. Whether an exchange is open is not the browser's to decide:
   * this page used to answer it with "weekday, 09:30 to 16:00 local", which is
   * not Tokyo's session, not London's, and blind to holidays. The one session
   * MIDNAT genuinely tracks is the US cash session, and the engine publishes
   * its own regime, so that is the only session badge shown.
   */
  const marketState = useMarketRegime();
  const usSession =
    marketState === null || marketState.regime === 'UNKNOWN'
      ? null
      : marketState.regime === 'LIVE'
        ? 'OPEN'
        : 'CLOSED';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const getFormattedTime = (timeZone: string) => {
        return now.toLocaleTimeString('en-US', { timeZone, hour12: false, hour: '2-digit', minute: '2-digit' });
      };

      setTimeState({
        utc: getFormattedTime('UTC') + ' UTC',
        tokyoTime: getFormattedTime('Asia/Tokyo'),
        londonTime: getFormattedTime('Europe/London'),
        nyTime: getFormattedTime('America/New_York')
      });
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Parallax for Etched Plate
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const yParallax = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  // Scroll Scrubbing for Narrative Lines
  const { scrollYProgress: scrubProgress } = useScroll({ target: textRef, offset: ["start 75%", "center 50%"] });
  const opacity1 = useTransform(scrubProgress, [0, 0.3], [0.2, 1]);
  const opacity2 = useTransform(scrubProgress, [0.3, 0.6], [0.2, 1]);
  const opacity3 = useTransform(scrubProgress, [0.6, 0.9], [0.2, 1]);

  return (
    <section id="why" ref={containerRef} className="relative z-10 w-full pt-24 pb-32 overflow-hidden min-h-[800px] scroll-mt-24">
      
      {/* Background Depth & Blooms */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="landing-bloom left-[-10vw] top-[20%]" />
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        
        {/* Scroll Scrubbed Text - No map behind this */}
        {/* The stagger is a composition: the block is centered as a unit (w-fit mx-auto)
            so the left gap equals the right gap; lines keep their internal indents. */}
        <div ref={textRef} className="mb-32 mt-16 min-h-[300px]">
          <div className="flex flex-col gap-4 md:gap-6 w-fit mx-auto">
          <motion.h2 
            style={shouldReduceMotion ? { opacity: 1 } : { opacity: opacity1 }}
            className="text-4xl md:text-[4.5rem] lg:text-[5.5rem] landing-text-display"
          >
            Traditional markets
          </motion.h2>
          
          <motion.h2 
            style={shouldReduceMotion ? { opacity: 1 } : { opacity: opacity2 }}
            className="text-4xl md:text-[4.5rem] lg:text-[5.5rem] font-medium tracking-tight text-[color:var(--ln-ink-soft)] md:ml-16 lg:ml-32 leading-[1.02]"
          >
            sleep when you do
          </motion.h2>

          <motion.h2 
            style={shouldReduceMotion ? { opacity: 1 } : { opacity: opacity3 }}
            className="text-4xl md:text-[4.5rem] lg:text-[5.5rem] landing-text-display md:ml-24 lg:ml-48"
          >
            Ours never close
          </motion.h2>
          </div>
        </div>

        {/* The case for 24/7: three concrete reasons in the page's ledger DNA */}
        <Reveal delay={0.15}>
          <div
            className="mb-28 grid grid-cols-1 md:grid-cols-3 border-y border-[color:var(--ln-glass-border)] divide-y md:divide-y-0 md:divide-x divide-[color:var(--ln-glass-border)]"
            data-testid="why-reasons"
          >
            <div className="px-6 md:px-10 py-8 flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] text-[color:var(--ln-accent-hot)] font-medium">01</span>
                <span className="font-mono text-[11px] font-medium uppercase tracking-widest opacity-70">News never waits</span>
              </div>
              <p className="text-[0.95rem] opacity-[0.72] leading-relaxed max-w-[38ch]">
                Earnings and headlines land after the bell. Trade the moment, not Monday's open.
              </p>
            </div>
            <div className="px-6 md:px-10 py-8 flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] text-[color:var(--ln-accent-hot)] font-medium">02</span>
                <span className="font-mono text-[11px] font-medium uppercase tracking-widest opacity-70">Risk keeps no hours</span>
              </div>
              <p className="text-[0.95rem] opacity-[0.72] leading-relaxed max-w-[38ch]">
                Positions carry risk through nights and weekends. Now the hedge is always within reach.
              </p>
            </div>
            <div className="px-6 md:px-10 py-8 flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] text-[color:var(--ln-accent-hot)] font-medium">03</span>
                <span className="font-mono text-[11px] font-medium uppercase tracking-widest opacity-70">One global session</span>
              </div>
              <p className="text-[0.95rem] opacity-[0.72] leading-relaxed max-w-[38ch]">
                Tokyo, London, New York. Session times stop mattering when the market never closes.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Meridian Map Zone - Map plate only lives here */}
        <div className="relative py-24 -mx-6 md:-mx-12 px-6 md:px-12 rounded-3xl overflow-hidden">
          {/* Background Etched Meridian */}
          <motion.div 
            className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center"
            style={{ 
              y: shouldReduceMotion ? 0 : yParallax,
              opacity: 'var(--ln-plate-opacity)',
              mixBlendMode: 'var(--ln-plate-blend)' as any,
              filter: 'var(--ln-plate-filter)'
            }}
          >
            <img 
              src={etchMeridian} 
              alt="" 
              className="w-full h-full object-cover max-w-[1440px]"
              style={{ WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)' }}
            />
          </motion.div>

          {/* Argument Statement */}
          <Reveal delay={0.2}>
            <div className="md:ml-24 lg:ml-48 mb-12 relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                One market, every meridian
              </h3>
            </div>
          </Reveal>

          {/* Meridian Chips Row */}
          <Reveal delay={0.3}>
            <div className="md:ml-24 lg:ml-48 relative pt-6 pb-6 z-10">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[color:var(--ln-hairline)] -translate-y-1/2 z-0" />
              
              <div className="flex flex-wrap items-center gap-6 relative z-10">
                
                <div className="bg-[var(--ln-glass-bg-strong)] backdrop-blur-xl border border-[var(--ln-glass-border)] px-5 py-3 flex flex-col gap-1.5 rounded-xl landing-glass-chip">
                  <span className="opacity-60 font-mono text-[10px] uppercase tracking-widest font-semibold">Tokyo</span>
                  <div className="flex items-center gap-2 font-mono text-xs font-medium">
                    <span className="opacity-90">{timeState.tokyoTime || '--:--'}</span>
                    <span className="px-1.5 py-0.5 rounded-sm bg-[color:var(--ln-hairline-soft)] opacity-70">LOCAL</span>
                  </div>
                </div>

                <div className="bg-[var(--ln-glass-bg-strong)] backdrop-blur-xl border border-[var(--ln-glass-border)] px-5 py-3 flex flex-col gap-1.5 rounded-xl landing-glass-chip">
                  <span className="opacity-60 font-mono text-[10px] uppercase tracking-widest font-semibold">London</span>
                  <div className="flex items-center gap-2 font-mono text-xs font-medium">
                    <span className="opacity-90">{timeState.londonTime || '--:--'}</span>
                    <span className="px-1.5 py-0.5 rounded-sm bg-[color:var(--ln-hairline-soft)] opacity-70">LOCAL</span>
                  </div>
                </div>

                <div className="bg-[var(--ln-glass-bg-strong)] backdrop-blur-xl border border-[var(--ln-glass-border)] px-5 py-3 flex flex-col gap-1.5 rounded-xl landing-glass-chip">
                  <span className="opacity-60 font-mono text-[10px] uppercase tracking-widest font-semibold">New York</span>
                  <div
                    className="flex items-center gap-2 font-mono text-xs font-medium"
                    title={marketState?.headline ?? undefined}
                  >
                    <span className="opacity-90">{timeState.nyTime || '--:--'}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-sm ${usSession === 'OPEN' ? 'bg-[color:var(--ln-chip-open-bg)] text-[color:var(--ln-chip-open-text)]' : 'bg-[color:var(--ln-hairline-soft)] opacity-70'}`}
                      data-testid="narrative-us-session"
                    >
                      {usSession === 'OPEN' ? 'CASH OPEN' : usSession === 'CLOSED' ? 'CASH CLOSED' : 'LOCAL'}
                    </span>
                  </div>
                </div>

                <div className="bg-[var(--ln-glass-bg-strong)] backdrop-blur-xl border border-[color:var(--ln-glass-border-hover)] px-5 py-3 flex flex-col gap-1.5 rounded-xl landing-glass-chip-live relative overflow-hidden">
                  <div className="absolute inset-0 bg-[color:var(--ln-accent)] opacity-5 mix-blend-multiply pointer-events-none" />
                  <span className="text-[color:var(--ln-accent-hot)] font-mono text-[10px] uppercase tracking-widest font-semibold relative z-10">MIDNAT</span>
                  <div className="flex items-center gap-2 font-mono text-xs font-medium relative z-10">
                    <span className="opacity-90">{timeState.utc || '--:-- UTC'}</span>
                    <span className="px-2 py-0.5 rounded-sm bg-[color:var(--ln-chip-open-bg)] text-[color:var(--ln-chip-open-text)] font-bold">ALWAYS OPEN</span>
                  </div>
                </div>

              </div>
            </div>
          </Reveal>
        </div>
      </div>
      <div className="landing-section-divider mt-8" />
    </section>
  );
}
