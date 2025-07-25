// Media constants extracted from hardcoded values across the codebase
export const Media = {
  images: {
    fallbackEmoji: '📖',
    audioEmoji: '🎵',
    sizes: {
      icon: 32,
      thumbnail: 64,
      medium: 100,
      large: 200,
    },
  },

  audio: {
    defaultDuration: 600,
    durationPerChapter: 30,
    seekOffset: 100,
  },

  aspectRatios: {
    square: 1,
    landscape: 16 / 9,
    portrait: 9 / 16,
  },

  breakpoints: {
    small: 320,
    medium: 768,
    large: 1024,
    extraLarge: 1440,
  },
} as const;
