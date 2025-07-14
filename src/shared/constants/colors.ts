// Design tokens for colors that will be replaced by Tamagui themes
export const Colors = {
  // Primary colors
  primary: '#007AFF',
  primaryLight: '#E3F2FD',
  primaryDark: '#0056CC',

  // Text colors
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    tertiary: '#888888',
    inverse: '#ffffff',
  },

  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    tertiary: '#f0f0f0',
    overlay: 'rgba(0, 0, 0, 0.1)',
  },

  // Border colors
  border: {
    light: '#e0e0e0',
    medium: '#d0d0d0',
    dark: '#c0c0c0',
  },

  // Testament colors
  testament: {
    oldTestament: '#2c3e50',
    newTestament: '#2c3e50',
  },

  // Interactive states
  interactive: {
    active: '#007AFF',
    inactive: '#8E8E93',
    pressed: 'rgba(0, 122, 255, 0.1)',
    disabled: '#cccccc',
  },

  // Chapter grid
  chapter: {
    background: '#f5f5f5',
    text: '#333333',
    border: '#e0e0e0',
  },

  // Audio player
  audio: {
    background: '#ffffff',
    border: '#e0e0e0',
    shadow: '#000000',
  },

  // Loading and feedback
  feedback: {
    loading: '#007AFF',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  },

  // Accent and glassy colors
  accent1: '#92BEC3', // light blue-green
  accent2: '#AD915A', // gold/brown
  accent3: '#282827', // dark gray (for contrast)
  accent4: '#E3F2FD', // very light blue (for highlights)
  glass1: 'rgba(146, 190, 195, 0.7)', // glassy blue-green
  glass2: 'rgba(38, 72, 84, 0.7)', // glassy dark blue-green
  glass3: 'rgba(237, 229, 217, 0.7)', // glassy cream
} as const;
