import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OptionsMenu } from '../OptionsMenu';
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
};

jest.mock('@/shared/store', () => ({
  useTheme: () => mockUseTheme,
}));

describe('OptionsMenu', () => {
  const mockOnClose = jest.fn();
  const mockOnThemeToggle = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnThemeToggle.mockClear();
  });

  const renderWithTamagui = (component: React.ReactElement) => {
    return render(<TamaguiTestWrapper>{component}</TamaguiTestWrapper>);
  };

  it('renders when visible', () => {
    const { getByTestId } = renderWithTamagui(
      <OptionsMenu
        isVisible={true}
        onClose={mockOnClose}
        onThemeToggle={mockOnThemeToggle}
      />
    );

    expect(getByTestId('options-menu')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = renderWithTamagui(
      <OptionsMenu
        isVisible={false}
        onClose={mockOnClose}
        onThemeToggle={mockOnThemeToggle}
      />
    );

    expect(queryByTestId('options-menu')).toBeNull();
  });

  it('renders all option cards', () => {
    const { getByTestId } = renderWithTamagui(
      <OptionsMenu
        isVisible={true}
        onClose={mockOnClose}
        onThemeToggle={mockOnThemeToggle}
      />
    );

    // Check that all expected options are present
    expect(getByTestId('options-menu-search')).toBeTruthy();
    expect(getByTestId('options-menu-profile')).toBeTruthy();
    expect(getByTestId('options-menu-language')).toBeTruthy();
    expect(getByTestId('options-menu-calculator')).toBeTruthy();
    expect(getByTestId('options-menu-settings')).toBeTruthy();
    expect(getByTestId('options-menu-help')).toBeTruthy();
  });

  it('calls onThemeToggle and onClose when settings (theme toggle) is pressed', () => {
    const { getByTestId } = renderWithTamagui(
      <OptionsMenu
        isVisible={true}
        onClose={mockOnClose}
        onThemeToggle={mockOnThemeToggle}
      />
    );

    fireEvent.press(getByTestId('options-menu-settings'));
    expect(mockOnThemeToggle).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when an option is pressed', () => {
    const { getByTestId } = renderWithTamagui(
      <OptionsMenu
        isVisible={true}
        onClose={mockOnClose}
        onThemeToggle={mockOnThemeToggle}
      />
    );

    fireEvent.press(getByTestId('options-menu-search'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
