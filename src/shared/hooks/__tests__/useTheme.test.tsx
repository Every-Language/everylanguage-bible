import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

// This import will fail initially - that's the point of TDD!
import { useTheme, ThemeProvider } from '../useTheme';

// Mock only useColorScheme to avoid native module issues
jest.mock('react-native', () => ({
  useColorScheme: jest.fn(),
}));

// Import after mocking
import { useColorScheme } from 'react-native';
const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>;

// Test wrapper component
const ThemeTestWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <ThemeProvider>{children}</ThemeProvider>;

describe('useTheme Hook - TDD Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Theme Functionality', () => {
    it('should provide theme state and toggle function', () => {
      mockUseColorScheme.mockReturnValue('light');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeTestWrapper,
      });

      // Basic API structure
      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('isDark');
      expect(result.current).toHaveProperty('toggleTheme');
      expect(result.current).toHaveProperty('setTheme');
      expect(result.current).toHaveProperty('colors');
    });

    it('should start with light theme by default', () => {
      mockUseColorScheme.mockReturnValue('light');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeTestWrapper,
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    it('should start with dark theme when system prefers dark', () => {
      mockUseColorScheme.mockReturnValue('dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeTestWrapper,
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });
  });

  describe('Theme Switching', () => {
    it('should toggle from light to dark', () => {
      mockUseColorScheme.mockReturnValue('light');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeTestWrapper,
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('should toggle from dark to light', () => {
      mockUseColorScheme.mockReturnValue('dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeTestWrapper,
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    it('should set theme directly', () => {
      mockUseColorScheme.mockReturnValue('light');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeTestWrapper,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });
  });

  describe('Theme Colors', () => {
    it('should provide correct light theme colors', () => {
      mockUseColorScheme.mockReturnValue('light');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeTestWrapper,
      });

      expect(result.current.colors).toEqual({
        background: '#EBE5D9',
        text: '#070707',
        primary: '#264854',
        secondary: '#AD915A',
      });
    });

    it('should provide correct dark theme colors', () => {
      mockUseColorScheme.mockReturnValue('dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeTestWrapper,
      });

      expect(result.current.colors).toEqual({
        background: '#282827',
        text: '#EBE5D9',
        primary: '#92BEC3',
        secondary: '#AD915A',
      });
    });

    it('should update colors when theme changes', () => {
      mockUseColorScheme.mockReturnValue('light');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeTestWrapper,
      });

      expect(result.current.colors.background).toBe('#EBE5D9');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.colors.background).toBe('#282827');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });
});
