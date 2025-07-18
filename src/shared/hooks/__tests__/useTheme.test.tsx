import { renderHook } from '@testing-library/react-native';
import { useTheme } from '../useTheme';

// Mock the theme context
const mockThemeContext = {
  theme: 'light' as const,
  isDark: false,
  colors: {
    background: '#EBE5D9',
    textPrimary: '#070707',
    primary: '#264854',
    secondary: '#AD915A',
    textSecondary: '#666666',
    textTertiary: '#888888',
    backgroundSecondary: '#f8f9fa',
    borderLight: '#e0e0e0',
    interactiveActive: '#264854',
    interactiveInactive: '#8E8E93',
    feedbackSuccess: '#4CAF50',
    feedbackWarning: '#FF9800',
    feedbackError: '#F44336',
  },
  setTheme: jest.fn(),
  toggleTheme: jest.fn(),
  isSystemTheme: true,
};

jest.mock('@/app/providers/ThemeProvider', () => ({
  useThemeContext: () => mockThemeContext,
}));

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns theme data from context', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBeDefined();
    expect(result.current.isDark).toBeDefined();
    expect(result.current.colors).toBeDefined();
    expect(typeof result.current.toggleTheme).toBe('function');
    expect(typeof result.current.setTheme).toBe('function');
    expect(result.current.isSystemTheme).toBeDefined();
  });

  it('should start with light theme by default', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('should provide correct light theme colors', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.colors).toEqual({
      background: '#EBE5D9',
      text: '#070707',
      primary: '#264854',
      secondary: '#AD915A',
    });
  });
});
