import { Reveal } from './Reveal';
import { NETWORK } from '@/lib/protocol-registry';

export function InfrastructureStrip() {
  return (
    <section id="protocol" className="relative z-10 w-full pb-16 overflow-hidden scroll-mt-24">
      
      {/* Background Blooms and Lines between cards and spec ledger */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="landing-meridian-lines opacity-60 mix-blend-multiply" />
        <div className="landing-bloom left-[20vw] top-[50%]" />
      </div>
      
      {/* Masked Dot Grid */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="landing-dotgrid opacity-10 h-full" style={{
          maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
          WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)'
        }} />
      </div>
      
      <div className="w-full max-w-[1440px] mx-auto relative z-10 px-6 md:px-12">
        <Reveal>
          <div className="w-full border-y border-[color:var(--ln-glass-border)]">
            <div className="grid grid-cols-2 md:grid-cols-4">
              
              <div className="px-6 md:px-12 py-10 flex flex-col gap-3 border-r border-b md:border-b-0 border-[color:var(--ln-glass-border)] hover:bg-[var(--ln-glass-bg)] hover:backdrop-blur-xl transition-colors duration-300">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">Network</span>
                <span className="font-sans text-[1.1rem] font-bold">{NETWORK.shortLabel}</span>
                <span className="font-sans text-[13px] leading-relaxed opacity-60">
                  {NETWORK.label}, chain {NETWORK.chainId}. Transactions use {NETWORK.gasCurrency} for gas.
                </span>
              </div>
              
              <div className="px-6 md:px-12 py-10 flex flex-col gap-3 md:border-r border-b md:border-b-0 border-[color:var(--ln-glass-border)] hover:bg-[var(--ln-glass-bg)] hover:backdrop-blur-xl transition-colors duration-300">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">Execution</span>
                <span className="font-sans text-[1.1rem] font-bold">Testnet venue</span>
                <span className="font-sans text-[13px] leading-relaxed opacity-60">Opens and closes are transactions your own wallet signs and sends to the clearing house, and the chain records the position.</span>
              </div>
              
              <div className="px-6 md:px-12 py-10 flex flex-col gap-3 border-r border-[color:var(--ln-glass-border)] hover:bg-[var(--ln-glass-bg)] hover:backdrop-blur-xl transition-colors duration-300">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">Settlement</span>
                <span className="font-sans text-[1.1rem] font-bold">USD₮0</span>
                <span className="font-sans text-[13px] leading-relaxed opacity-60">One asset for margin, profit and loss and payouts, in testnet value only.</span>
              </div>
              
              <div className="px-6 md:px-12 py-10 flex flex-col gap-3 hover:bg-[var(--ln-glass-bg)] hover:backdrop-blur-xl transition-colors duration-300">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">Pricing</span>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--ln-accent-hot)] animate-pulse" />
                  <span className="font-sans text-[1.1rem] font-bold">Signed reference</span>
                </div>
                <span className="font-sans text-[13px] leading-relaxed opacity-60">A reference price held through the close, signed and recorded on chain.</span>
              </div>

            </div>
          </div>
        </Reveal>
      </div>
      <div className="landing-section-divider mt-24" />
    </section>
  );
}
