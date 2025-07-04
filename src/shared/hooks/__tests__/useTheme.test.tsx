import { renderHook, act } from '@testing-library/react-native';
import { useTheme, useThemeStore } from '../useTheme';

// Mock for useColorScheme that we can control
const mockUseColorScheme = jest.fn<'light' | 'dark' | null | undefined, []>(
  () => 'light'
);

jest.mock('react-native', () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

describe('useTheme Hook - Zustand Implementation', () => {
  beforeEach(() => {
    // Reset Zustand store before each test
    useThemeStore.getState().reset();
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue('light');
  });

  describe('Basic Theme Functionality', () => {
    it('should provide theme state and functions', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBeDefined();
      expect(result.current.isDark).toBeDefined();
      expect(result.current.colors).toBeDefined();
      expect(typeof result.current.toggleTheme).toBe('function');
      expect(typeof result.current.setTheme).toBe('function');
      expect(typeof result.current.setSystemTheme).toBe('function');
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

  describe('Theme Switching', () => {
    it('should toggle from light to dark', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('should set theme directly', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    it('should update colors when theme changes', () => {
      const { result } = renderHook(() => useTheme());

      const lightColors = result.current.colors;

      act(() => {
        result.current.toggleTheme();
      });

      const darkColors = result.current.colors;

      expect(lightColors).not.toEqual(darkColors);
      expect(darkColors.background).toBe('#282827');
      expect(darkColors.text).toBe('#EBE5D9');
    });
  });

  describe('Automatic System Theme Synchronization', () => {
    it('should initialize with system theme when not manually set', () => {
      mockUseColorScheme.mockReturnValue('dark');
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
      expect(result.current.isManuallySet).toBe(false);
    });

    it('should not override manually set theme', () => {
      const { result } = renderHook(() => useTheme());

      // Manually set theme to dark
      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.isManuallySet).toBe(true);
      expect(result.current.theme).toBe('dark');

      // System changes to light - should not override
      mockUseColorScheme.mockReturnValue('light');

      // Re-render to trigger useEffect
      const { result: result2 } = renderHook(() => useTheme());

      expect(result2.current.theme).toBe('dark'); // Should stay dark
      expect(result2.current.isManuallySet).toBe(true);
    });

    it('should use setSystemTheme for automatic updates', () => {
      // Directly test the store method
      act(() => {
        useThemeStore.getState().setSystemTheme('dark');
      });

      // Get the updated state
      const updatedState = useThemeStore.getState();

      expect(updatedState.theme).toBe('dark');
      expect(updatedState.isDark).toBe(true);
      expect(updatedState.isManuallySet).toBe(false); // Should not be marked as manual
    });

    it('should respond to system theme changes when not manually set', () => {
      // Start with light system theme
      mockUseColorScheme.mockReturnValue('light');
      const { result, rerender } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');

      // Change system theme to dark
      mockUseColorScheme.mockReturnValue('dark');
      rerender({});

      expect(result.current.theme).toBe('dark');
      expect(result.current.isManuallySet).toBe(false);
    });

    it('should handle null/undefined system theme gracefully', () => {
      mockUseColorScheme.mockReturnValue(null);
      const { result } = renderHook(() => useTheme());

      // Should default to light when system theme is unavailable
      expect(result.current.theme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });
  });

  describe('Manual Theme Override', () => {
    it('should mark theme as manually set when using toggleTheme', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.isManuallySet).toBe(false);

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.isManuallySet).toBe(true);
    });

    it('should mark theme as manually set when using setTheme', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.isManuallySet).toBe(false);

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.isManuallySet).toBe(true);
    });

    it('should reset manual flag when using reset', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.isManuallySet).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isManuallySet).toBe(false);
      expect(result.current.theme).toBe('light');
    });
  });
});
