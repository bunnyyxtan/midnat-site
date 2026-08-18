import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  inView?: boolean;
}

export function Reveal({ 
  children, 
  delay = 0, 
  className = "", 
  inView = true,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  const hidden = { 
    y: shouldReduceMotion ? 0 : 24, 
    filter: shouldReduceMotion ? "blur(0px)" : "blur(8px)" 
  };
  
  const visible = { 
    y: 0, 
    filter: "blur(0px)" 
  };

  const transition = {
    duration: 1.2,
    delay,
    ease: [0.16, 1, 0.3, 1] as const
  };

  if (inView) {
    return (
      <motion.div
        initial={hidden}
        whileInView={visible}
        viewport={{ once: true, margin: "-50px" }}
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={hidden}
      animate={visible}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
