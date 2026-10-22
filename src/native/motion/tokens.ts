/**
 * Motion tokens for the native JEEPath mobile UI.
 * Strictly adheres to section 4 of docs/tasks/android-native-ui-plan.md.
 * Only transform and opacity animate for silky 60fps performance on Android WebView.
 */

export const motionTokens = {
  duration: {
    fast: 0.15, // 150ms: taps, toggles, chips
    base: 0.25, // 250ms: sheet open, card swap
    slow: 0.40, // 400ms: screen push, reveals
  },
  spring: {
    type: "spring" as const,
    stiffness: 400,
    damping: 32,
    mass: 1,
  },
  easing: {
    enter: [0.2, 0, 0, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
  },
  scalePress: 0.97,
} as const;
