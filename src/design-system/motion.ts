/**
 * TVPulsar Motion System
 * Centralized motion tokens, durations, curves, and animation helpers.
 * Following Jakub Antalik / transitions.dev and mobile motion guidelines.
 */

export * from '../utils/motionEngine';

export const MOTION = {
  durations: {
    fast: 150,     // micro-interactions: taps, toggles, badges
    medium: 280,   // components: cards, dialogs, dropdowns
    slow: 400,     // page transitions, route changes
    hero: 600,     // hero banners, featured carousels
    delete: 350,   // card delete exit transition
  },
  curves: {
    // Entering elements (deceleration)
    easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
    // Exiting elements (acceleration)
    easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    // Interactive / Bouncy
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    // Shared axis / standard
    standard: 'cubic-bezier(0.2, 0.0, 0, 1)',
    // Delete exit curve (sharp deceleration into collapse)
    deleteExit: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

/**
 * Returns inline CSS styles for tactile button press feedback
 */
export const pressableStyle: React.CSSProperties = {
  transition: `transform ${MOTION.durations.fast}ms ${MOTION.curves.easeOutCubic}, opacity ${MOTION.durations.fast}ms ${MOTION.curves.easeOutCubic}`,
  willChange: 'transform',
};

/**
 * Staggered animation delay calculator (capped at maxDelay to prevent slow feel)
 */
export function getStaggerDelay(index: number, step = 40, maxDelay = 320): number {
  return Math.min(index * step, maxDelay);
}
