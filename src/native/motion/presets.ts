import type { Variants, TargetAndTransition } from "framer-motion";
import { motionTokens } from "./tokens";

/**
 * Screen push animation variants:
 * New screen slides from the right 24px + fades in;
 * Previous screen shifts left 8px and dims.
 */
export const screenPushVariants: Variants = {
  initial: {
    x: 24,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: motionTokens.duration.slow,
      ease: motionTokens.easing.enter,
    },
  },
  exit: {
    x: -8,
    opacity: 0.5,
    transition: {
      duration: motionTokens.duration.base,
      ease: motionTokens.easing.exit,
    },
  },
};

/**
 * Screen pop animation variants (reverse of push).
 */
export const screenPopVariants: Variants = {
  initial: {
    x: -8,
    opacity: 0.5,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: motionTokens.duration.slow,
      ease: motionTokens.easing.enter,
    },
  },
  exit: {
    x: 24,
    opacity: 0,
    transition: {
      duration: motionTokens.duration.base,
      ease: motionTokens.easing.exit,
    },
  },
};

/**
 * Tab cross-fade variants (tabs cross-fade only, no slide).
 */
export const tabCrossFadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: motionTokens.duration.fast,
      ease: motionTokens.easing.enter,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: motionTokens.duration.fast,
      ease: motionTokens.easing.exit,
    },
  },
};

/**
 * Bottom sheet animation (spring physics).
 */
export const bottomSheetVariants: Variants = {
  hidden: {
    y: "100%",
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: motionTokens.spring,
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: {
      duration: motionTokens.duration.base,
      ease: motionTokens.easing.exit,
    },
  },
};

/**
 * Standard press feedback (scale 0.97 on press-in, spring back).
 */
export const tapScaleTransition: TargetAndTransition = {
  scale: motionTokens.scalePress,
  transition: {
    type: "spring",
    stiffness: 500,
    damping: 25,
  },
};

/**
 * Staggered container for lists (max 8 children, 30ms stagger).
 */
export function getStaggerContainerVariants(delay = 0.03): Variants {
  return {
    initial: {},
    animate: {
      transition: {
        staggerChildren: delay,
      },
    },
  };
}

export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.base,
      ease: motionTokens.easing.enter,
    },
  },
};
