import { Reveal } from './Reveal';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { useReducedMotion } from 'framer-motion';

/**
 * Vault ledger. Every line here is checked against what the product can
 * actually do today: the deployment is activated on X Layer Testnet, so LP
 * deposits into the vault are contract-enabled, but whether a specific deposit
 * clears still depends on live chain state. Do not write a yield promise or an
 * APR into this file, and do not imply insurance.
 */
const steps = [
  {
    index: '01',
    label: 'The vault is the counterparty',
    copy: 'Positions are opened against vault capital, not against another trader.',
  },
  {
    index: '02',
    label: 'Fees settle to the vault',
    copy: 'Protocol fees are vault revenue. There is no treasury and no fee switch.',
  },
  {
    index: '03',
    label: 'Activated on testnet',
    copy: 'The vault is activated on X Layer Testnet. LP deposits are contract-enabled and clear subject to live chain state.',
  },
];

export function VaultsTeaser() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="vaults" className="relative z-10 w-full py-24 overflow-hidden scroll-mt-24">

      {/* Background Blooms */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="landing-bloom left-[10vw] top-[10%]" />
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        <Reveal>
          {/* Band: content row on top, step ledger below. Column flow only. */}
          <div
            className="w-full rounded-3xl flex flex-col relative overflow-hidden group border border-[color:var(--ln-glass-border)] shadow-[0_10px_40px_rgba(0,0,0,0.03)]"
            style={{
              background: 'var(--ln-vault-grad)',
            }}
          >
            {/* grain pocket: noise concentrated in the emerald field so the gradient reads filmic */}
            <div
              aria-hidden="true"
              className="landing-grain-pocket inset-0"
              style={{
                maskImage: 'linear-gradient(to right, transparent 30%, black 72%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 30%, black 72%)',
              }}
            />

            {/* Content Row */}
            <div className="relative z-10 w-full flex flex-col md:flex-row">

              {/* Copy Panel - readable measure, never strangled */}
              <div className="w-full md:w-[52%] lg:w-1/2 px-8 py-14 md:px-12 md:py-16 lg:px-16 lg:py-20 flex flex-col justify-center landing-glass-tier-2 landing-glass-flat-panel border-0 border-r border-[color:var(--ln-glass-border)] rounded-none z-20">
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <span className="text-[11px] font-mono uppercase tracking-widest opacity-50 font-medium">MIDNAT Vaults</span>
                  <span
                    data-testid="badge-vaults-status"
                    className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border border-[color:var(--ln-glass-border)] opacity-70"
                  >
                    Activated on testnet
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-bold tracking-tight mb-8 leading-[1.05]">
                  The vault takes<br />the other side
                </h2>

                <p className="text-[1.1rem] opacity-[0.85] font-normal leading-relaxed mb-12 max-w-md">
                  MIDNAT has one counterparty. Traders do not trade against each other, they trade against vault capital, which earns the protocol fees and absorbs the losses. The vault is activated on X Layer Testnet, so LP deposits are contract-enabled and clear subject to live chain state.
                </p>

                <Link href="/docs/vault" data-testid="link-vaults-teaser" className="landing-primary-btn w-fit whitespace-nowrap">
                  How the vault works
                  <ArrowRight size={18} className="landing-primary-btn-arrow" />
                </Link>
              </div>

              {/* Visual Field - orb and rings with real negative space */}
              <div className="w-full md:w-[48%] lg:w-1/2 relative flex items-center justify-center min-h-[360px] md:min-h-[520px] overflow-hidden">

                {/* Slow Light Sweep across the deep green */}
                {!shouldReduceMotion && <div className="landing-light-sweep" />}

                {/* SVG Flow Rings */}
                <svg className="absolute w-[800px] h-[800px] mix-blend-overlay opacity-50 pointer-events-none" viewBox="0 0 800 800">
                  <circle cx="400" cy="400" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" />
                  <circle cx="400" cy="400" r="250" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.8" />
                  <circle cx="400" cy="400" r="350" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />

                  {/* Drawing paths towards center */}
                  <path d="M 0 400 Q 200 400 250 400" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" className={shouldReduceMotion ? '' : 'landing-deposit-path'} />
                  <path d="M 400 0 Q 400 200 400 250" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" className={shouldReduceMotion ? '' : 'landing-deposit-path-2'} />

                  {/* Traveling dots */}
                  {!shouldReduceMotion && (
                    <>
                      <circle cx="400" cy="150" r="4" fill="var(--ln-accent-hot)" className="landing-orbit-dot-1" />
                      <circle cx="400" cy="650" r="3" fill="currentColor" className="landing-orbit-dot-2" />
                    </>
                  )}
                </svg>

                {/* Core orb */}
                <div className="w-32 h-32 rounded-full border border-[color:var(--ln-glass-border)] flex items-center justify-center relative z-10 bg-[var(--ln-glass-bg-flat)] shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                  {/* intentionally theme-independent: the orb core stays a light coin so the denomination reads on the luminous field in both themes */}
                  <div className="w-16 h-16 rounded-full bg-[#F6FAF6] text-[#0A0F1A] flex items-center justify-center shadow-inner">
                    <span className="font-mono text-[11px] font-bold tracking-widest">USD</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Step Ledger - in flow, below the content row */}
            <div className="border-t border-[color:var(--ln-glass-border)] bg-[var(--ln-glass-bg-flat)] z-20 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[color:var(--ln-glass-border)] w-full relative">
              {steps.map((step) => (
                <div key={step.index} className="px-8 py-8 md:px-10 flex flex-col gap-2">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] text-[color:var(--ln-accent-hot)] font-medium">{step.index}</span>
                    <span className="font-mono text-[11px] font-medium uppercase tracking-widest opacity-70">{step.label}</span>
                  </div>
                  <p className="text-[0.95rem] opacity-[0.72] font-normal leading-relaxed">
                    {step.copy}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </Reveal>
      </div>
      <div className="landing-section-divider mt-24" />
    </section>
  );
}
