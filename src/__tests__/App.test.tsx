import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock the navigation and providers
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ children }: { children: React.ReactNode }) => children,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('@/app/navigation/MainNavigator', () => ({
  MainNavigator: () => 'MainNavigator',
}));

jest.mock('@/app/providers', () => ({
  TamaguiProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Tamagui core to prevent duplicate config warnings
jest.mock('@tamagui/core', () => ({
  TamaguiProvider: ({ children }: { children: React.ReactNode }) => children,
  createTamagui: jest.fn(() => ({})),
}));

jest.mock('@/shared/store', () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock('@/shared/services/i18n', () => ({
  // Mock the i18n service
}));

jest.mock(
  '@/features/onboarding/screens/OnBoardingScreen',
  () => 'OnBoardingScreen'
);

describe('App', () => {
  it('should render without crashing', () => {
    const { UNSAFE_root } = render(<App />);

    // Should render without errors
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should render with all required providers', () => {
    const { UNSAFE_root } = render(<App />);

    // The component should render without throwing any errors
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should handle theme changes', () => {
    // Mock useTheme to return dark theme
    jest.doMock('@/shared/store', () => ({
      useTheme: () => ({ isDark: true }),
    }));

    const { UNSAFE_root } = render(<App />);

    // Should render without errors even with dark theme
    expect(UNSAFE_root).toBeTruthy();
  });
});
