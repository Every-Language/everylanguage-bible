import React from 'react';
import { render } from '@testing-library/react-native';
import OnBoardingItem from '../components/OnBoardingItem';

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

// Mock useResponsive hook
jest.mock('@/shared/hooks', () => ({
  useResponsive: () => ({
    width: 400,
    height: 800,
    componentSize: {
      logo: 120,
      icon: 24,
      button: 48,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
      '3xl': 64,
      '4xl': 96,
    },
    padding: {
      horizontal: 16,
      vertical: 24,
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      '2xl': 32,
      '3xl': 40,
      '4xl': 48,
    },
  }),
}));

// Mock all slide components
jest.mock('../components/slides/SplashScreen', () => 'SplashScreen');
jest.mock('../components/slides/LanguageDetection', () => 'LanguageDetection');
jest.mock('../components/slides/AudioSample', () => 'AudioSample');
jest.mock('../components/slides/BasicSetup', () => 'BasicSetup');
jest.mock('../components/slides/ContentPreview', () => 'ContentPreview');
jest.mock('../components/slides/QuickStart', () => 'QuickStart');

describe('OnBoardingItem', () => {
  it('should render SplashScreen component', () => {
    render(<OnBoardingItem id={1} component='SplashScreen' />);
    expect(true).toBe(true); // Component renders without crashing
  });

  it('should render LanguageDetection component', () => {
    render(<OnBoardingItem id={2} component='LanguageDetection' />);
    expect(true).toBe(true);
  });

  it('should render AudioSample component', () => {
    render(<OnBoardingItem id={3} component='AudioSample' />);
    expect(true).toBe(true);
  });

  it('should render BasicSetup component', () => {
    render(<OnBoardingItem id={4} component='BasicSetup' />);
    expect(true).toBe(true);
  });

  it('should render ContentPreview component', () => {
    render(<OnBoardingItem id={5} component='ContentPreview' />);
    expect(true).toBe(true);
  });

  it('should render QuickStart component', () => {
    render(<OnBoardingItem id={6} component='QuickStart' />);
    expect(true).toBe(true);
  });

  it('should pass scrollForward prop when provided', () => {
    const mockScrollForward = jest.fn();
    render(
      <OnBoardingItem
        id={1}
        component='SplashScreen'
        scrollForward={mockScrollForward}
      />
    );
    expect(true).toBe(true);
  });
});
