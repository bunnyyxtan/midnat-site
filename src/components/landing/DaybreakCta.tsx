import { useRef } from 'react';
import { Reveal } from './Reveal';
import { ArrowRight } from 'lucide-react';
import { appHref } from '@/lib/config';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

/* NYSE closes 16:00 America/New_York; the UTC label shifts with DST,
   so derive it instead of hardcoding. */
function nyCloseUtcLabel(): string {
  const now = new Date();
  const utcRef = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const nyRef = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const nyOffsetMin = Math.round((nyRef.getTime() - utcRef.getTime()) / 60000);
  const closeUtcMin = ((16 * 60 - nyOffsetMin) % 1440 + 1440) % 1440;
  const hh = String(Math.floor(closeUtcMin / 60)).padStart(2, '0');
  const mm = String(closeUtcMin % 60).padStart(2, '0');
  return `${hh}:${mm} UTC`;
}

export function DaybreakCta() {
  const shouldReduceMotion = useReducedMotion();
  const textRef = useRef<HTMLDivElement>(null);
  const nyClose = nyCloseUtcLabel();

  // Stagger Text Reveal logic
  const sentence1 = "Night falls";
  const sentence2 = "The exchange stays open";
  const words1 = sentence1.split(" ");
  const words2 = sentence2.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20, filter: shouldReduceMotion ? "blur(0px)" : "blur(8px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
  };

  return (
    <section className="relative w-full pt-32 overflow-hidden flex flex-col min-h-[800px]">
      
      {/* Horizon stage: the sun sits below the line, its glow never leaves */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* faint meridian linework over the page ground */}
        <div className="landing-meridian-lines absolute inset-0 opacity-40 mix-blend-multiply" />
        {/* below-horizon glow bleeding up behind the headline */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[140%] max-w-[1800px] h-[72%]"
          style={{
            background: 'var(--ln-cta-glow)',
            filter: 'blur(60px)',
            animation: shouldReduceMotion ? 'none' : 'landing-glow-breathe 16s ease-in-out infinite alternate',
          }}
        />
        {/* grain pocket: crisp film texture riding the below-horizon glow (never blurred) */}
        <div
          aria-hidden="true"
          className="landing-grain-pocket left-1/2 -translate-x-1/2 bottom-0 w-[140%] max-w-[1800px] h-[72%]"
          style={{
            maskImage: 'radial-gradient(ellipse 55% 85% at 50% 100%, black 0%, black 42%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse 55% 85% at 50% 100%, black 0%, black 42%, transparent 78%)',
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 relative z-10 flex-grow flex flex-col justify-center items-center text-center">
        
        <div ref={textRef} className="max-w-4xl flex flex-col items-center justify-center mb-16">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-8"
          >
            <h2 className="text-5xl md:text-[4.5rem] lg:text-[5.5rem] landing-text-display flex flex-wrap justify-center gap-x-4 md:gap-x-6">
              {words1.map((word, i) => (
                <motion.span key={i} variants={wordVariants} className="inline-block">{word}</motion.span>
              ))}
            </h2>
            <h2 className="text-5xl md:text-[4.5rem] lg:text-[5.5rem] landing-text-display flex flex-wrap justify-center gap-x-4 md:gap-x-6 mt-2">
              {words2.map((word, i) => (
                <motion.span key={i} variants={wordVariants} className="inline-block">{word}</motion.span>
              ))}
            </h2>
          </motion.div>
          
          <Reveal delay={0.4}>
            <p className="text-lg md:text-[1.15rem] landing-text-body mb-12 max-w-lg leading-relaxed mx-auto">
              Leveraged equity exposure that stays open when the exchange does not. Running on X Layer Testnet, in testnet value only.
            </p>
          </Reveal>

          <Reveal delay={0.5}>
            <a
              href={appHref()}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="cta-start-trading"
              className="landing-primary-btn"
            >
              Start trading
              <ArrowRight size={18} className="landing-primary-btn-arrow" />
            </a>
          </Reveal>
        </div>

      </div>

      {/* Mono Caption Row Bottom */}
      <div className="w-full mt-auto relative z-20">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="relative border-t border-[color:var(--ln-glass-border)] bg-[var(--ln-glass-bg-flat)] flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[color:var(--ln-glass-border)] rounded-t-3xl border-x">
            {/* horizon accent: green concentration where the sun sits */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px w-3/5 max-w-[900px] h-px pointer-events-none"
              style={{ background: 'linear-gradient(to right, transparent, var(--ln-sun-rim), transparent)' }}
            />
            <div className="px-8 py-5 w-full md:w-1/3 flex items-center justify-center">
              <span className="font-mono text-[11px] font-medium uppercase tracking-widest opacity-70">NEW YORK CLOSES {nyClose}</span>
            </div>
            <div className="px-8 py-5 w-full md:w-1/3 flex items-center justify-center">
              <span className="font-mono text-[11px] font-medium uppercase tracking-widest opacity-70">TOKYO CLOSES 06:00 UTC</span>
            </div>
            {/* md:rounded-tr-3xl matches the container's rounded-t-3xl so this cell's bed
                follows the curve instead of notching it (container cannot use overflow-hidden:
                it would clip the -translate-y-px horizon accent above). */}
            <div className="px-8 py-5 w-full md:w-1/3 flex items-center justify-center bg-[color:var(--ln-glass-bg)] md:rounded-tr-3xl">
              <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-[color:var(--ln-accent-hot)]">MIDNAT NEVER CLOSES</span>
            </div>
          </div>
        </div>
      </div>
      
    </section>
  );
}
