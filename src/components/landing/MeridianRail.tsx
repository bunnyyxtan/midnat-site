import { Reveal } from './Reveal';
import { useReducedMotion } from 'framer-motion';

export function MeridianRail() {
  const shouldReduceMotion = useReducedMotion();
  
  const cells = [
    {
      label: "01",
      title: "On-chain execution",
      // "No protocol gas fee" on its own reads as "trading here is free". The
      // canonical wording carries both halves, so this card does too.
      desc: "A trade is a call to one contract, priced from the signed anchor. No order book to queue behind, and no protocol fee on top of the gas X Layer charges the sender in OKB.",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" className="landing-draw-path" />
        </svg>
      )
    },
    {
      label: "02",
      title: "Single-asset margin",
      desc: "One asset for every market, USD₮0, never a basket. Margin is isolated per position.",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <circle cx="12" cy="12" r="10" className="landing-draw-path" />
          <path d="M12 8v8M8 12h8" className="landing-draw-path" style={{ animationDelay: '0.4s' }} />
        </svg>
      )
    },
    {
      label: "03",
      title: "Signed reference price",
      desc: "A reference price held through the close, signed and recorded on chain, with its age carried beside it.",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" className="landing-draw-path" />
        </svg>
      )
    }
  ];

  return (
    <section className="relative z-10 w-full pt-16 pb-16 overflow-hidden">
      
      {/* Background Blooms */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="landing-bloom right-[-10vw] top-[30%]" style={{ animationDelay: '-5s' }} />
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cells.map((cell, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="landing-card-light p-8 md:p-10 flex flex-col justify-between min-h-[360px] h-full group">
                
                {/* Ghost Numeral */}
                <div className="landing-card-numeral">{cell.label}</div>
                
                {/* Internal faint bloom */}
                <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(60,165,110,0.08)_0%,transparent_70%)] pointer-events-none z-0" />

                {/* Single numbering source: the ghost numeral. No small mono index here (owner, Aug 15). */}
                <div className="flex items-start justify-end w-full relative z-10">
                  {/* Tier 1 Glass Tile for Icon */}
                  <div className={`landing-glass-tier-1 w-12 h-12 rounded-xl flex items-center justify-center opacity-70 group-hover:text-[color:var(--ln-accent-hot)] group-hover:opacity-100 transition-all duration-500 is-visible group-hover:border-[color:var(--ln-glass-border-hover)] ${shouldReduceMotion ? '' : 'landing-draw-container'}`}>
                    {cell.svg}
                  </div>
                </div>
                
                <div className="relative z-10 mt-12 flex-grow">
                  <h3 className="text-[1.6rem] font-bold tracking-tight mb-4">{cell.title}</h3>
                  <p className="text-[1.05rem] font-normal leading-relaxed max-w-[280px] text-[color:var(--ln-ink-body)]">
                    {cell.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="landing-section-divider mt-16" />
    </section>
  );
}
