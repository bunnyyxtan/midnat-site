import { motion, useScroll, useSpring } from 'framer-motion';
import '../components/landing/Landing.css';
import '../components/public/Public.css';
import { LandingNav } from '../components/landing/LandingNav';
import { HeroSection } from '../components/landing/HeroSection';
import { NarrativeSection } from '../components/landing/NarrativeSection';
import { MeridianRail } from '../components/landing/MeridianRail';
import { InfrastructureStrip } from '../components/landing/InfrastructureStrip';
import { VaultsTeaser } from '../components/landing/VaultsTeaser';
import { FaqSection } from '../components/landing/FaqSection';
import { DaybreakCta } from '../components/landing/DaybreakCta';
import { PublicFooter } from '../components/public/PublicFooter';
import { useTheme } from '../components/public/theme';
import { useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';

export default function Home() {
  const { scrollYProgress } = useScroll();
  const smoothScaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const shouldReduceMotion = useReducedMotion();
  /* Scroll-linked feedback is not an autonomous loop: keep the bar under
     reduced motion, only drop the spring smoothing. */
  const scaleX = shouldReduceMotion ? scrollYProgress : smoothScaleX;

  /* Theme is site-wide state: the landing and every document page share one
     provider so a toggle here survives navigation into the docs and back. */
  const { theme, toggleTheme } = useTheme();

  /* SPA hash landing: on a direct /#section load the browser resolves the
     fragment before React has mounted the sections, so honor it once after
     mount. Instant, not smooth: this is a load position, not an animation.
     scrollIntoView respects each section's scroll-mt offset. */
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, []);

  return (
    <div className="landing-container" data-theme={theme}>
      {/* Scroll Progress Hairline */}
      <motion.div
        data-testid="scroll-progress"
        className="fixed top-0 left-0 right-0 h-[1px] bg-[color:var(--ln-accent-hot)] z-[999] origin-left pointer-events-none"
        style={{ scaleX }}
      />
      
      <div className="landing-grain" />
      
      <LandingNav theme={theme} toggleTheme={toggleTheme} />
      <HeroSection />
      <NarrativeSection />
      <MeridianRail />
      <InfrastructureStrip />
      <VaultsTeaser />
      <FaqSection />
      <DaybreakCta />
      <PublicFooter variant="full" />
    </div>
  );
}
