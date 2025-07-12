import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ToggleButtons } from '../ToggleButtons';
import { TamaguiTestWrapper } from '@/shared/test-utils/tamagui-test-setup';

// Mock the theme store
const mockUseTheme = {
  colors: {
    background: '#EBE5D9',
    text: '#070707',
    primary: '#264854',
    secondary: '#AD915A',
  },
};

jest.mock('@/shared/store', () => ({
  useTheme: () => mockUseTheme,
}));

describe('ToggleButtons', () => {
  const mockOnSelect = jest.fn();
  const mockOptions = [
    { key: 'option1', label: 'Option 1' },
    { key: 'option2', label: 'Option 2' },
    { key: 'option3', label: 'Option 3' },
  ];

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  const renderWithTamagui = (component: React.ReactElement) => {
    return render(<TamaguiTestWrapper>{component}</TamaguiTestWrapper>);
  };

  it('renders all toggle options', () => {
    const { getByTestId } = renderWithTamagui(
      <ToggleButtons
        options={mockOptions}
        selectedKey='option1'
        onSelect={mockOnSelect}
        testID='toggle-buttons'
      />
    );

    expect(getByTestId('toggle-buttons')).toBeTruthy();
    expect(getByTestId('toggle-buttons-option1')).toBeTruthy();
    expect(getByTestId('toggle-buttons-option2')).toBeTruthy();
    expect(getByTestId('toggle-buttons-option3')).toBeTruthy();
  });

  it('displays correct labels for options', () => {
    const { getByText } = renderWithTamagui(
      <ToggleButtons
        options={mockOptions}
        selectedKey='option1'
        onSelect={mockOnSelect}
        testID='toggle-buttons'
      />
    );

    expect(getByText('Option 1')).toBeTruthy();
    expect(getByText('Option 2')).toBeTruthy();
    expect(getByText('Option 3')).toBeTruthy();
  });

  it('calls onSelect when an option is pressed', () => {
    const { getByTestId } = renderWithTamagui(
      <ToggleButtons
        options={mockOptions}
        selectedKey='option1'
        onSelect={mockOnSelect}
        testID='toggle-buttons'
      />
    );

    fireEvent.press(getByTestId('toggle-buttons-option2'));
    expect(mockOnSelect).toHaveBeenCalledWith('option2');
  });

  it('applies selected styling to the selected option', () => {
    const { getByTestId } = renderWithTamagui(
      <ToggleButtons
        options={mockOptions}
        selectedKey='option2'
        onSelect={mockOnSelect}
        testID='toggle-buttons'
      />
    );

    const selectedButton = getByTestId('toggle-buttons-option2');
    const unselectedButton = getByTestId('toggle-buttons-option1');

    // Selected button should have primary background
    expect(selectedButton.props.style.backgroundColor).toBe('#264854');
    // Unselected button should have transparent primary background
    expect(unselectedButton.props.style.backgroundColor).toBe('#26485420');
  });

  it('handles disabled options correctly', () => {
    const disabledOptions = [
      { key: 'option1', label: 'Option 1' },
      { key: 'option2', label: 'Option 2', disabled: true },
      { key: 'option3', label: 'Option 3' },
    ];

    const { getByTestId } = renderWithTamagui(
      <ToggleButtons
        options={disabledOptions}
        selectedKey='option1'
        onSelect={mockOnSelect}
        testID='toggle-buttons'
      />
    );

    const disabledButton = getByTestId('toggle-buttons-option2');

    // Should have reduced opacity
    expect(disabledButton.props.style.opacity).toBe(0.5);

    // Should not call onSelect when pressed
    fireEvent.press(disabledButton);
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('respects custom height prop', () => {
    const { getByTestId } = renderWithTamagui(
      <ToggleButtons
        options={mockOptions}
        selectedKey='option1'
        onSelect={mockOnSelect}
        testID='toggle-buttons'
        height={40}
      />
    );

    const button = getByTestId('toggle-buttons-option1');
    expect(button.props.style.height).toBe(40);
  });

  it('handles empty options array', () => {
    const { getByTestId } = renderWithTamagui(
      <ToggleButtons
        options={[]}
        selectedKey=''
        onSelect={mockOnSelect}
        testID='toggle-buttons'
      />
    );

    expect(getByTestId('toggle-buttons')).toBeTruthy();
  });

  it('handles single option', () => {
    const singleOption = [{ key: 'only', label: 'Only Option' }];

    const { getByTestId, getByText } = renderWithTamagui(
      <ToggleButtons
        options={singleOption}
        selectedKey='only'
        onSelect={mockOnSelect}
        testID='toggle-buttons'
      />
    );

    expect(getByTestId('toggle-buttons-only')).toBeTruthy();
    expect(getByText('Only Option')).toBeTruthy();
  });
});
