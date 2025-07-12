import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OptionsPanel } from '../OptionsPanel';
import { TamaguiTestWrapper } from '@/shared/test-utils/tamagui-test-setup';

// Mock the theme store
const mockUseTheme = {
  colors: {
    background: '#EBE5D9',
    text: '#070707',
    primary: '#264854',
    secondary: '#AD915A',
  },
  isDark: false,
  toggleTheme: jest.fn(),
};

jest.mock('@/shared/store', () => ({
  useTheme: () => mockUseTheme,
}));

// Mock the translation hook
const mockUseTranslation = {
  t: (key: string) => {
    const translations: Record<string, string> = {
      'theme.switchToLight': 'Switch to light mode',
      'theme.switchToDark': 'Switch to dark mode',
    };
    return translations[key] || key;
  },
};

jest.mock('@/shared/hooks', () => ({
  useTranslation: () => mockUseTranslation,
}));

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated = {
    ...RN.Animated,
    Value: jest.fn(() => ({
      setValue: jest.fn(),
    })),
    timing: jest.fn(() => ({
      start: jest.fn(),
    })),
    spring: jest.fn(() => ({
      start: jest.fn(),
    })),
    parallel: jest.fn(_animations => ({
      start: jest.fn(),
    })),
  };
  return RN;
});

describe('OptionsPanel', () => {
  const mockOnClose = jest.fn();
  const mockOnThemeToggle = jest.fn();
  const mockPosition = { top: 100, right: 20 };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnThemeToggle.mockClear();
    mockUseTheme.toggleTheme.mockClear();
  });

  const renderWithTamagui = (component: React.ReactElement) => {
    return render(<TamaguiTestWrapper>{component}</TamaguiTestWrapper>);
  };

  it('renders when visible', () => {
    const { getByTestId } = renderWithTamagui(
      <OptionsPanel
        isVisible={true}
        onClose={mockOnClose}
        onThemeToggle={mockOnThemeToggle}
        position={mockPosition}
      />
    );

    expect(getByTestId('options-panel-overlay')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = renderWithTamagui(
      <OptionsPanel
        isVisible={false}
        onClose={mockOnClose}
        onThemeToggle={mockOnThemeToggle}
        position={mockPosition}
      />
    );

    expect(queryByTestId('options-panel-overlay')).toBeNull();
  });

  it('calls onClose when overlay is pressed', () => {
    const { getByTestId } = renderWithTamagui(
      <OptionsPanel
        isVisible={true}
        onClose={mockOnClose}
        onThemeToggle={mockOnThemeToggle}
        position={mockPosition}
      />
    );

    fireEvent.press(getByTestId('options-panel-overlay'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onThemeToggle and onClose when theme option is pressed', () => {
    const { getByTestId } = renderWithTamagui(
      <OptionsPanel
        isVisible={true}
        onClose={mockOnClose}
        onThemeToggle={mockOnThemeToggle}
        position={mockPosition}
      />
    );

    fireEvent.press(getByTestId('options-theme-toggle'));
    expect(mockOnThemeToggle).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders all option buttons', () => {
    const { getByTestId } = renderWithTamagui(
      <OptionsPanel
        isVisible={true}
        onClose={mockOnClose}
        onThemeToggle={mockOnThemeToggle}
        position={mockPosition}
      />
    );

    expect(getByTestId('options-theme-toggle')).toBeTruthy();
    expect(getByTestId('options-profile')).toBeTruthy();
    expect(getByTestId('options-language')).toBeTruthy();
    expect(getByTestId('options-calculator')).toBeTruthy();
    expect(getByTestId('options-settings')).toBeTruthy();
    expect(getByTestId('options-help')).toBeTruthy();
  });

  it('has proper accessibility labels', () => {
    const { getByTestId } = renderWithTamagui(
      <OptionsPanel
        isVisible={true}
        onClose={mockOnClose}
        onThemeToggle={mockOnThemeToggle}
        position={mockPosition}
      />
    );

    const themeButton = getByTestId('options-theme-toggle');
    expect(themeButton.props.accessibilityLabel).toBe('Switch to dark mode');
    expect(themeButton.props.accessibilityRole).toBe('button');

    const profileButton = getByTestId('options-profile');
    expect(profileButton.props.accessibilityLabel).toBe('Profile');
    expect(profileButton.props.accessibilityRole).toBe('button');
  });
});
