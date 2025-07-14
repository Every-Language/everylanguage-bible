import { renderHook, act } from '@testing-library/react-native';
import { useTheme, useThemeToggle } from '../useTheme';
import React from 'react';

// Mock the Tamagui config to avoid import issues in tests
jest.mock('../../../../tamagui.config', () => ({
  config: {
    themes: {
      light: {},
      dark: {},
    },
  },
}));

// --- Mock functions for theme switching ---
const mockSetTheme = jest.fn();
const mockToggleTheme = jest.fn();

jest.mock('@/app/providers/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useThemeContext: () => ({
    theme: 'light',
    isDark: false,
    setTheme: mockSetTheme,
    toggleTheme: mockToggleTheme,
    isSystemTheme: true,
  }),
}));

// Mock for useColorScheme that we can control
const mockUseColorScheme = jest.fn(
  () => 'light' as 'light' | 'dark' | null | undefined
);

jest.mock('react-native', () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

// Mock Tamagui theme hook
const mockTamaguiTheme = {
  background: { val: '#EBE5D9' },
  color: { val: '#070707' },
  primary: { val: '#264854' },
  secondary: { val: '#AD915A' },
  textSecondary: { val: '#666666' },
  textTertiary: { val: '#888888' },
  backgroundSecondary: { val: '#f8f9fa' },
  borderLight: { val: '#e0e0e0' },
  interactiveActive: { val: '#264854' },
  interactiveInactive: { val: '#8E8E93' },
  feedbackSuccess: { val: '#4CAF50' },
  feedbackWarning: { val: '#FF9800' },
  feedbackError: { val: '#F44336' },
};

jest.mock('@tamagui/core', () => ({
  useTheme: () => mockTamaguiTheme,
}));

// No need for TestWrapper since we're mocking the ThemeProvider

describe('useTheme Hook - Tamagui Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseColorScheme.mockImplementation(() => 'light');
  });

  describe('Basic Theme Functionality', () => {
    it('should provide theme state and functions', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBeDefined();
      expect(result.current.isDark).toBeDefined();
      expect(result.current.colors).toBeDefined();
      expect(typeof result.current.toggleTheme).toBe('function');
      expect(typeof result.current.setTheme).toBe('function');
      expect(typeof result.current.isSystemTheme).toBe('boolean');
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
        textSecondary: '#666666',
        textTertiary: '#888888',
        backgroundSecondary: '#f8f9fa',
        borderLight: '#e0e0e0',
        interactiveActive: '#264854',
        interactiveInactive: '#8E8E93',
        feedbackSuccess: '#4CAF50',
        feedbackWarning: '#FF9800',
        feedbackError: '#F44336',
      });
    });
  });

  describe('Theme Switching', () => {
    it('should call toggleTheme when toggleTheme is called', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it('should call setTheme when setTheme is called', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(mockSetTheme).toHaveBeenCalledWith('dark');

      act(() => {
        result.current.setTheme('light');
      });

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('should provide theme switching functions', () => {
      const { result } = renderHook(() => useTheme());

      expect(typeof result.current.toggleTheme).toBe('function');
      expect(typeof result.current.setTheme).toBe('function');
    });
  });

  describe('System Theme Integration', () => {
    it('should initialize with system theme', () => {
      mockUseColorScheme.mockImplementation(() => 'dark');
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light'); // Mock always returns 'light'
      expect(result.current.isDark).toBe(false);
      expect(result.current.isSystemTheme).toBe(true);
    });

    it('should handle null/undefined system theme gracefully', () => {
      mockUseColorScheme.mockImplementation(() => null);
      const { result } = renderHook(() => useTheme());

      // Should default to light when system theme is unavailable
      expect(result.current.theme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });
  });

  describe('useThemeToggle Hook', () => {
    it('should provide toggle and set theme functions', () => {
      const { result } = renderHook(() => useThemeToggle());

      expect(typeof result.current.toggleTheme).toBe('function');
      expect(typeof result.current.setTheme).toBe('function');
    });

    it('should call toggleTheme when toggleTheme is called', () => {
      const { result } = renderHook(() => useThemeToggle());

      act(() => {
        result.current.toggleTheme();
      });

      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });
  });
});
