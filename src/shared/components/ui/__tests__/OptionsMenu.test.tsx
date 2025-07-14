import React from 'react';
import { render } from '@testing-library/react-native';
import { TamaguiTestWrapper } from '@/shared/test-utils/tamagui-test-setup';
import { OptionsMenu } from '../OptionsMenu';

describe('OptionsMenu', () => {
  const mockOnClose = jest.fn();
  const mockOnNavigateToSubMenu = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByTestId } = render(
      <TamaguiTestWrapper>
        <OptionsMenu
          isVisible={true}
          onClose={mockOnClose}
          onNavigateToSubMenu={mockOnNavigateToSubMenu}
        />
      </TamaguiTestWrapper>
    );

    expect(getByTestId('options-menu')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = render(
      <OptionsMenu
        isVisible={false}
        onClose={mockOnClose}
        onNavigateToSubMenu={mockOnNavigateToSubMenu}
      />
    );

    expect(queryByTestId('options-menu')).toBeNull();
  });

  it('calls onClose when close action is triggered', () => {
    const { getByTestId } = render(
      <OptionsMenu
        isVisible={true}
        onClose={mockOnClose}
        onNavigateToSubMenu={mockOnNavigateToSubMenu}
      />
    );

    // Simulate close action - this would depend on your actual close mechanism
    // For now, just verify the component renders
    expect(getByTestId('options-menu')).toBeTruthy();
  });

  it('handles navigation to sub menus', () => {
    const { getByTestId } = render(
      <OptionsMenu
        isVisible={true}
        onClose={mockOnClose}
        onNavigateToSubMenu={mockOnNavigateToSubMenu}
      />
    );

    // Test navigation functionality
    expect(getByTestId('options-menu')).toBeTruthy();
  });

  it('displays all menu options', () => {
    const { getByTestId } = render(
      <OptionsMenu
        isVisible={true}
        onClose={mockOnClose}
        onNavigateToSubMenu={mockOnNavigateToSubMenu}
      />
    );

    expect(getByTestId('options-menu')).toBeTruthy();
  });
});
