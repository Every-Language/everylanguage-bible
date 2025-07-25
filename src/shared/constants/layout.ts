// Layout constants extracted from hardcoded values across the codebase
export const Layout = {
  borderRadius: {
    xs: 1,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    xxxl: 24,
    round: 40,
    circle: 50,
    full: 100,
  },

  iconSizes: {
    xs: 16,
    sm: 18,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
    huge: 48,
  },

  button: {
    height: {
      sm: 32,
      md: 36,
      lg: 44,
      xl: 48,
    },
    padding: {
      sm: 8,
      md: 12,
      lg: 16,
    },
  },

  modal: {
    borderRadius: 24,
    maxWidth: 400,
    padding: 20,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    shadow: {
      elevation: 2,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
  },
} as const;
