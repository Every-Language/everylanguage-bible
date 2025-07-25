// Animation constants extracted from hardcoded values across the codebase
export const Animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    extraSlow: 1000,
  },

  timing: {
    spring: {
      damping: 0.8,
      stiffness: 100,
    },
    easing: {
      easeOut: 'ease-out',
      easeIn: 'ease-in',
      easeInOut: 'ease-in-out',
    },
  },

  offsets: {
    swipeThreshold: 50,
    gestureThreshold: 20,
    activeOffset: 10,
    failOffset: 20,
  },

  scales: {
    pressed: 0.98,
    normal: 1.0,
    expanded: 1.02,
  },
} as const;
