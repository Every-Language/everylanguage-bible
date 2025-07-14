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

    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
    expect(result.current.colors).toEqual(mockThemeContext.colors);
    expect(result.current.setTheme).toBe(mockThemeContext.setTheme);
    expect(result.current.toggleTheme).toBe(mockThemeContext.toggleTheme);
    expect(result.current.isSystemTheme).toBe(true);
  });

  it('provides correct color values', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.colors.background).toBe('#EBE5D9');
    expect(result.current.colors.textPrimary).toBe('#070707');
    expect(result.current.colors.primary).toBe('#264854');
    expect(result.current.colors.secondary).toBe('#AD915A');
  });

  it('provides theme switching functions', () => {
    const { result } = renderHook(() => useTheme());

    expect(typeof result.current.setTheme).toBe('function');
    expect(typeof result.current.toggleTheme).toBe('function');
  });
});
