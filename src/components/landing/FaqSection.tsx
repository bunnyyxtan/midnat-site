import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Reveal } from './Reveal';
import { CANONICAL, COLLATERAL, LEVERAGE_RANGE } from '@/lib/protocol-registry';

/*
  FAQ voice rules: quiet, precise, honest. Answer the concern, not the marketing.
  No exclamation marks, no filler, no dashes.

  Every protocol fact here comes from the protocol registry, which reads the deployment
  manifest. Do not type a leverage number, an address or a status into this file by hand:
  the terminal, the docs and this section must never be able to disagree.
*/
const FAQS = [
  {
    q: 'Do I own the stock when I go long?',
    a: 'No. A perpetual is a contract on the price, settled in stablecoin collateral. There are no shares behind it, so no dividends, no voting rights, no ownership. What you get is clean price exposure with leverage, nothing else.',
  },
  {
    q: 'How can a stock trade while the exchange is closed?',
    a: 'The venue closes. The price does not stop mattering. MIDNAT holds a reference around the clock: tokenized equity feeds that trade 24/7 where they exist, the last signed print where they do not, always labeled with its age. Funding pulls the perp toward that anchor, and the terminal always shows which regime you are in: LIVE, AFTER HOURS or WEEKEND.',
  },
  {
    q: 'Can I be liquidated while the real market is closed?',
    a: 'Yes. The mark price follows the oracle anchor at all hours and the liquidation engine never sleeps. If fair value moves hard against an overleveraged position on a Sunday, that position can be closed on a Sunday. Your liquidation price and distance are on the ticket before you confirm.',
  },
  {
    q: 'What happens when the real market reopens?',
    a: 'Cash opens where it opens and the anchor converges with it. That gap is the risk you carry through a close. It is why leverage is capped, why confidence bands widen off-hours, and why the terminal shows SINCE CASH CLOSE, so you always know how far the model sits from the last print.',
  },
  {
    q: 'What asset is used as collateral?',
    a: `${COLLATERAL.symbol}, for everything. Margin, profit and loss and payouts all settle in the same asset, so there is no basket of tokens to manage. The asset is identified by its contract address on X Layer Testnet, ${COLLATERAL.address}, and it is never a different token wearing a similar ticker. The clearing house custodies trader collateral and the vault custodies liquidity provider deposits. Both contracts are deployed and holding balances on testnet today.`,
  },
  {
    q: 'What does a trade cost in gas?',
    a: `${CANONICAL.gas} Deposits, opens, closes and withdrawals are transactions you sign and pay for. Reading the market, watching a position and asking the desk a question are not.`,
  },
  {
    q: 'Is real money at risk right now?',
    a: `${CANONICAL.testnet} Prices follow real reference feeds around the clock and positions, funding and liquidations run the same code paths they would in production, but nothing you hold here has monetary worth.`,
  },
  {
    q: 'Where do the prices come from?',
    a: 'A reference engine selects among upstream feeds, holds a price when the underlying exchange is closed, and labels every value with its age and quality. The chosen value is signed as an EIP-712 report and recorded on chain by the oracle anchor, and the clearing house reads only the anchor. A signature proves the report came from the MIDNAT signer unaltered. It does not prove the upstream price was right.',
  },
  {
    q: 'How much leverage can I take?',
    a: `From ${LEVERAGE_RANGE.min}x to ${LEVERAGE_RANGE.max}x depending on the risk tier of the market, with the higher caps on the calmer names. Margin is isolated per position, so a liquidation takes the collateral behind that position and nothing else. Before you confirm, the ticket shows the estimated entry, the estimated liquidation price and the funding estimate for the next 24 hours.`,
  },
];

function FaqItem({ item, index, open, onToggle }: {
  item: { q: string; a: string };
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className="border-t border-[color:var(--ln-hairline)] last:border-b">
      <button
        type="button"
        id={`faq-question-${index}`}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={open ? `faq-answer-${index}` : undefined}
        data-testid={`faq-question-${index}`}
        className="w-full flex items-center justify-between gap-6 py-6 text-left group"
      >
        <span className="text-[15px] md:text-[17px] font-semibold tracking-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          {item.q}
        </span>
        <Plus
          size={18}
          strokeWidth={2}
          className={`flex-shrink-0 opacity-40 group-hover:opacity-80 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'rotate-45' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`faq-answer-${index}`}
            role="region"
            aria-labelledby={`faq-question-${index}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
            data-testid={`faq-answer-${index}`}
          >
            <p className="pb-7 pr-10 text-[14px] md:text-[15px] leading-relaxed opacity-60 max-w-[62ch]">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faqs" className="relative py-24 md:py-32 px-5 md:px-10 scroll-mt-24">
      <div className="max-w-[880px] mx-auto">
        <Reveal>
          <div className="text-[11px] font-mono uppercase tracking-widest opacity-50 mb-8 font-medium">FAQS</div>
        </Reveal>
        <Reveal delay={0.1}>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-12 md:mb-16">
            Asked before the first trade
          </h3>
        </Reveal>
        <Reveal delay={0.2}>
          <div>
            {FAQS.map((item, i) => (
              <FaqItem
                key={item.q}
                item={item}
                index={i}
                open={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
