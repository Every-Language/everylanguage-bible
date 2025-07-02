// Dimension constants that will be replaced by Tamagui theme spacing
export const Dimensions = {
  // Spacing scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 48,
  },

  // Border radius
  radius: {
    none: 0,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    full: 9999,
  },

  // Component sizes
  component: {
    chapterTile: {
      width: 60,
      height: 60,
    },
    bookImage: {
      width: 60,
      height: 60,
    },
    miniPlayerImage: {
      width: 80,
      height: 80,
    },
    controlButton: {
      width: 44,
      height: 44,
    },
    primaryControlButton: {
      width: 56,
      height: 56,
    },
    tabIcon: {
      size: 20,
    },
  },

  // Shadows
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },

  // Layout
  layout: {
    tabBarHeight: 83,
    miniPlayerHeight: 210, // Final height for modern player
    booksPerRow: 3,
    chaptersPerRow: 5,
  },
} as const;
