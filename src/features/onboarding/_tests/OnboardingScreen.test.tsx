import React from 'react';
import { render } from '@testing-library/react-native';
import OnBoardingScreen from '../screens/OnBoardingScreen';
import { NavigationContainer } from '@react-navigation/native';

// Mock the theme hook
jest.mock('@/shared/store', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      primary: '#007AFF',
      secondary: '#8E8E93',
    },
    isDark: false,
  }),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

// Mock vector icons
jest.mock(
  '@expo/vector-icons/MaterialCommunityIcons',
  () => 'MaterialCommunityIcons'
);

const renderWithProviders = (component: React.ReactElement) => {
  return render(<NavigationContainer>{component}</NavigationContainer>);
};

describe('OnBoardingScreen', () => {
  it('should render without crashing', () => {
    renderWithProviders(<OnBoardingScreen />);
    // Just check that it renders without crashing
    expect(true).toBe(true);
  });
});
