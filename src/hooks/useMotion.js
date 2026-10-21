import { useReducedMotion } from 'framer-motion';

/**
 * Returns animation variants that respect prefers-reduced-motion.
 * When reduced motion is preferred, all animations are instant (no movement).
 */
export const useMotion = () => {
  const shouldReduce = useReducedMotion();

  const fadeIn = {
    initial:   { opacity: shouldReduce ? 1 : 0 },
    animate:   { opacity: 1 },
    transition:{ duration: shouldReduce ? 0 : 0.18, ease: 'easeOut' },
  };

  const fadeSlideUp = {
    initial:   { opacity: shouldReduce ? 1 : 0, y: shouldReduce ? 0 : 8 },
    animate:   { opacity: 1, y: 0 },
    transition:{ duration: shouldReduce ? 0 : 0.2, ease: 'easeOut' },
  };

  const fadeSlideDown = {
    initial:   { opacity: shouldReduce ? 1 : 0, y: shouldReduce ? 0 : -4 },
    animate:   { opacity: 1, y: 0 },
    transition:{ duration: shouldReduce ? 0 : 0.15, ease: 'easeOut' },
  };

  const scaleIn = {
    initial:   { opacity: shouldReduce ? 1 : 0, scale: shouldReduce ? 1 : 0.97 },
    animate:   { opacity: 1, scale: 1 },
    transition:{ duration: shouldReduce ? 0 : 0.15, ease: 'easeOut' },
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: shouldReduce ? 0 : 0.04 } },
  };

  const staggerItem = {
    initial:   { opacity: shouldReduce ? 1 : 0, y: shouldReduce ? 0 : 6 },
    animate:   { opacity: 1, y: 0 },
    transition:{ duration: shouldReduce ? 0 : 0.18, ease: 'easeOut' },
  };

  const springPopover = {
    initial:   {
      opacity: shouldReduce ? 1 : 0,
      scale:   shouldReduce ? 1 : 0.97,
      y:       shouldReduce ? 0 : -4,
    },
    animate:   { opacity: 1, scale: 1, y: 0 },
    exit:      {
      opacity: shouldReduce ? 0 : 0,
      scale:   shouldReduce ? 1 : 0.97,
      y:       shouldReduce ? 0 : -4,
    },
    transition:{
      type:      shouldReduce ? 'tween' : 'spring',
      stiffness: 420,
      damping:   38,
      duration:  shouldReduce ? 0 : undefined,
    },
  };

  const springDrawer = {
    initial:   { x: shouldReduce ? 0 : '-100%' },
    animate:   { x: 0 },
    exit:      { x: shouldReduce ? 0 : '-100%' },
    transition:{
      type:      shouldReduce ? 'tween' : 'spring',
      stiffness: 380,
      damping:   38,
      duration:  shouldReduce ? 0 : undefined,
    },
  };

  return {
    fadeIn,
    fadeSlideUp,
    fadeSlideDown,
    scaleIn,
    staggerContainer,
    staggerItem,
    springPopover,
    springDrawer,
  };
};
