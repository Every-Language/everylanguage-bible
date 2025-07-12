import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeDemo } from '../ThemeDemo';
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

describe('ThemeDemo', () => {
  beforeEach(() => {
    mockUseTheme.toggleTheme.mockClear();
  });

  const renderWithTamagui = (component: React.ReactElement) => {
    return render(<TamaguiTestWrapper>{component}</TamaguiTestWrapper>);
  };

  it('renders the theme demo container', () => {
    const { getByTestId } = renderWithTamagui(<ThemeDemo />);

    expect(getByTestId('theme-demo-container')).toBeTruthy();
  });

  it('displays the correct title and subtitle', () => {
    const { getByTestId } = renderWithTamagui(<ThemeDemo />);

    const title = getByTestId('theme-demo-title');
    const subtitle = getByTestId('theme-demo-subtitle');

    expect(title).toBeTruthy();
    expect(subtitle).toBeTruthy();
  });

  it('displays the theme toggle button with correct text for light mode', () => {
    const { getByTestId, getByText } = renderWithTamagui(<ThemeDemo />);

    const toggleButton = getByTestId('theme-toggle-button');
    expect(toggleButton).toBeTruthy();
    expect(getByText('🌙 Dark Mode')).toBeTruthy();
  });

  it('displays the theme toggle button with correct text for dark mode', () => {
    // Mock dark mode
    mockUseTheme.isDark = true;

    const { getByTestId, getByText } = renderWithTamagui(<ThemeDemo />);

    const toggleButton = getByTestId('theme-toggle-button');
    expect(toggleButton).toBeTruthy();
    expect(getByText('☀️ Light Mode')).toBeTruthy();

    // Reset for other tests
    mockUseTheme.isDark = false;
  });

  it('calls toggleTheme when the toggle button is pressed', () => {
    const { getByTestId } = renderWithTamagui(<ThemeDemo />);

    const toggleButton = getByTestId('theme-toggle-button');
    fireEvent.press(toggleButton);

    expect(mockUseTheme.toggleTheme).toHaveBeenCalledTimes(1);
  });

  it('displays the color container with label and indicator', () => {
    const { getByTestId } = renderWithTamagui(<ThemeDemo />);

    const colorContainer = getByTestId('color-container');
    const colorLabel = getByTestId('color-label');
    const colorIndicator = getByTestId('color-indicator');

    expect(colorContainer).toBeTruthy();
    expect(colorLabel).toBeTruthy();
    expect(colorIndicator).toBeTruthy();
  });

  it('applies the correct background color from theme', () => {
    const { getByTestId } = renderWithTamagui(<ThemeDemo />);

    const container = getByTestId('theme-demo-container');
    expect(container.props.style.backgroundColor).toBe('#EBE5D9');
  });

  it('applies the correct primary color to the color indicator', () => {
    const { getByTestId } = renderWithTamagui(<ThemeDemo />);

    const colorIndicator = getByTestId('color-indicator');
    expect(colorIndicator.props.style.backgroundColor).toBe('#264854');
  });
});
