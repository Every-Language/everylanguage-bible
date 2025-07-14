import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock the providers
jest.mock('@/app/providers', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the stores
jest.mock('@/shared/store', () => ({
  useTheme: () => ({ isDark: false }),
  useCalculatorMode: () => ({ isCalculatorMode: false }),
}));

// Mock the navigation
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

// Mock the safe area provider
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the gesture handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// Mock the status bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock the i18n service
jest.mock('@/shared/services/i18n', () => ({}));

// Mock the onboarding screen
jest.mock('@/features/onboarding/screens/OnBoardingScreen', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock the calculator screen
jest.mock('@/features/calculator/screens/CalculatorScreen', () => ({
  CalculatorScreen: () => null,
}));

// Mock the main navigator
jest.mock('@/app/navigation/MainNavigator', () => ({
  MainNavigator: () => null,
}));

describe('App', () => {
  it('renders without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });
});
